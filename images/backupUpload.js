import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execFileAsync = promisify(execFile);

const DEFAULT_UPLOAD_URL = 'https://www.jingcc.cc/api/guides/upload';
const DEFAULT_UPLOAD_FIELD_NAME = 'file';
let envLoaded = false;

function loadEnvFile(envPath) {
  if (envLoaded || !fs.existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const equalsIndex = line.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value.replace(/\\n/g, '\n');
  }

  envLoaded = true;
}

function sanitizeArchiveName(name) {
  const sanitized = String(name || 'backup')
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-');

  return sanitized || 'backup';
}

function normalizeForMarkdownMatch(value) {
  return String(value || '').replace(/\\/g, '/');
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function parseBoolean(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function shouldSkipUpload(options = {}) {
  if (typeof options.skipUpload === 'boolean') {
    return options.skipUpload;
  }

  return parseBoolean(process.env.GUIDE_UPLOAD_DRY_RUN || '');
}

function escapePowerShellString(value) {
  return value.replace(/'/g, '\'\'');
}

function collectImagePaths(mdContent) {
  const imageRegex = /!\[.*?\]\((?:<(.+?)>|([^)]+))\)/g;
  const images = new Set();
  const coverMatch = mdContent.match(/<!--\s*cover:\s*(.+?)\s*-->/);

  if (coverMatch) {
    images.add(coverMatch[1].trim());
  }

  let match;
  while ((match = imageRegex.exec(mdContent)) !== null) {
    images.add((match[1] || match[2]).trim());
  }

  return Array.from(images).filter(Boolean);
}

function resolveArchiveEntry(sourceDir, mdDir, imagePath) {
  if (isRemoteUrl(imagePath)) {
    return { skipReason: 'remote' };
  }

  const sourcePath = path.isAbsolute(imagePath)
    ? path.normalize(imagePath)
    : path.resolve(mdDir, imagePath);

  if (!fs.existsSync(sourcePath)) {
    return { skipReason: 'missing', sourcePath };
  }

  const relativePath = path.relative(sourceDir, sourcePath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return { skipReason: 'external', sourcePath };
  }

  return {
    sourcePath,
    archivePath: relativePath,
  };
}

async function createArchive(entries, archiveBaseName, archiveRootDir) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tft-guide-backup-'));
  const stagingDir = path.join(tempRoot, 'payload');
  const archiveName = `${sanitizeArchiveName(archiveBaseName)}.zip`;
  const archivePath = path.join(archiveRootDir, archiveName);

  fs.mkdirSync(stagingDir, { recursive: true });

  for (const entry of entries) {
    const targetPath = path.join(stagingDir, entry.archivePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(entry.sourcePath, targetPath);
  }

  const powerShellScript = [
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    `$sourceDir = '${escapePowerShellString(stagingDir)}'`,
    `$archivePath = '${escapePowerShellString(archivePath)}'`,
    'if (Test-Path $archivePath) { Remove-Item $archivePath -Force }',
    '[System.IO.Compression.ZipFile]::CreateFromDirectory($sourceDir, $archivePath, [System.IO.Compression.CompressionLevel]::Optimal, $false)',
  ].join('; ');

  await execFileAsync('powershell.exe', ['-NoProfile', '-Command', powerShellScript]);

  return {
    tempRoot,
    archiveName,
    archivePath,
  };
}

function makeArchiveImagePath(archiveBaseName, archivePath) {
  const normalizedArchivePath = String(archivePath || '').replace(/\\/g, '/');
  const parsedPath = path.posix.parse(normalizedArchivePath);
  const baseName = sanitizeArchiveName(archiveBaseName);
  const uniqueName = `${baseName}__${parsedPath.base}`;

  return parsedPath.dir ? `${parsedPath.dir}/${uniqueName}` : uniqueName;
}

function rewriteMarkdownReferences(mdContent, imageReferenceMap) {
  let nextContent = mdContent;

  for (const [originalRef, nextRef] of imageReferenceMap.entries()) {
    const escapedOriginal = originalRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    nextContent = nextContent.replace(
      new RegExp(`(<!--\\s*cover:\\s*)${escapedOriginal}(\\s*-->)`, 'g'),
      `$1${nextRef}$2`
    );
    nextContent = nextContent.replace(
      new RegExp(`(\\]\\(<)${escapedOriginal}(>\\))`, 'g'),
      `$1${nextRef}$2`
    );
    nextContent = nextContent.replace(
      new RegExp(`(\\]\\()${escapedOriginal}(\\))`, 'g'),
      `$1${nextRef}$2`
    );
  }

  return nextContent;
}

function buildUploadHeaders(options = {}) {
  const headers = {};

  if (options.cookie || process.env.GUIDE_UPLOAD_COOKIE) {
    headers.Cookie = options.cookie || process.env.GUIDE_UPLOAD_COOKIE;
  }

  if (options.token || process.env.GUIDE_UPLOAD_TOKEN) {
    headers.Authorization = `Bearer ${options.token || process.env.GUIDE_UPLOAD_TOKEN}`;
  }

  const authHeader = options.authHeader || process.env.GUIDE_UPLOAD_AUTH_HEADER;
  const authValue = options.authValue || process.env.GUIDE_UPLOAD_AUTH_VALUE;
  if (authHeader && authValue) {
    headers[authHeader] = authValue;
  }

  return headers;
}

function parseResponseBody(text) {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function uploadArchive(archivePath, archiveName, options = {}) {
  const uploadUrl = options.uploadUrl || process.env.GUIDE_UPLOAD_URL || DEFAULT_UPLOAD_URL;
  const uploadFieldName =
    options.uploadFieldName ||
    process.env.GUIDE_UPLOAD_FIELD_NAME ||
    DEFAULT_UPLOAD_FIELD_NAME;

  const archiveBuffer = await fs.promises.readFile(archivePath);
  const formData = new FormData();
  formData.append(
    uploadFieldName,
    new Blob([archiveBuffer], { type: 'application/zip' }),
    archiveName
  );

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: buildUploadHeaders(options),
    body: formData,
  });

  const responseText = await response.text();
  const responseBody = parseResponseBody(responseText);

  if (!response.ok) {
    const detail = typeof responseBody === 'string'
      ? responseBody
      : JSON.stringify(responseBody);
    throw new Error(`Upload failed (${response.status}): ${detail}`);
  }

  return {
    status: response.status,
    body: responseBody,
  };
}

async function backupComposition(compositionName, options = {}) {
  const sourceDir = path.join(__dirname, '..');
  loadEnvFile(path.join(sourceDir, '.env'));
  const archiveBaseName = sanitizeArchiveName(compositionName);

  const mdFilePath = path.resolve(options.mdFilePath || path.join(sourceDir, 'TFT.md'));
  const mdDir = path.dirname(mdFilePath);

  console.log('\n========================================');
  console.log('Starting backup upload');
  console.log('========================================\n');

  if (!fs.existsSync(mdFilePath)) {
    throw new Error(`Markdown file not found: ${mdFilePath}`);
  }

  const mdContent = fs.readFileSync(mdFilePath, 'utf-8');
  const imagePaths = collectImagePaths(mdContent);
  const archiveEntries = [];
  const includedImages = [];
  const warnings = [];
  const imageReferenceMap = new Map();

  for (const imagePath of imagePaths) {
    const resolved = resolveArchiveEntry(sourceDir, mdDir, imagePath);

    if (resolved.skipReason === 'remote') {
      warnings.push(`Skip remote image: ${imagePath}`);
      continue;
    }

    if (resolved.skipReason === 'missing') {
      warnings.push(`Missing image: ${imagePath}`);
      continue;
    }

    if (resolved.skipReason === 'external') {
      warnings.push(`Skip external image outside repo: ${imagePath}`);
      continue;
    }

    const archiveImagePath = makeArchiveImagePath(archiveBaseName, resolved.archivePath);
    archiveEntries.push({
      ...resolved,
      archivePath: archiveImagePath,
    });
    includedImages.push(archiveImagePath);
    imageReferenceMap.set(
      normalizeForMarkdownMatch(imagePath),
      normalizeForMarkdownMatch(archiveImagePath)
    );
  }

  const archivedMdContent = rewriteMarkdownReferences(mdContent, imageReferenceMap);
  const archivedMdPath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'tft-guide-backup-md-')),
    'TFT.md'
  );
  fs.writeFileSync(archivedMdPath, archivedMdContent, 'utf-8');
  archiveEntries.unshift({
    sourcePath: archivedMdPath,
    archivePath: 'TFT.md',
  });

  console.log(`Archive name: ${archiveBaseName}.zip`);
  console.log(`Markdown source: ${mdFilePath}`);
  console.log(`Files: ${archiveEntries.length}`);
  console.log(`Images: ${includedImages.length}`);

  if (warnings.length > 0) {
    warnings.forEach(warning => console.warn(`Warning: ${warning}`));
  }

  const archive = await createArchive(archiveEntries, compositionName, sourceDir);
  try {
    if (shouldSkipUpload(options)) {
      console.log(`Dry run enabled, archive kept at: ${archive.archivePath}\n`);
      return {
        success: true,
        dryRun: true,
        archiveName: archive.archiveName,
        archivePath: archive.archivePath,
        files: {
          md: 'TFT.md',
          images: includedImages,
        },
        warnings,
      };
    }

    const uploadResult = await uploadArchive(archive.archivePath, archive.archiveName, options);

    console.log('Upload completed.\n');

    return {
      success: true,
      archiveName: archive.archiveName,
      uploaded: true,
      files: {
        md: 'TFT.md',
        images: includedImages,
      },
      warnings,
      upload: uploadResult,
    };
  } catch (error) {
    throw new Error(`${error.message}. Archive kept at: ${archive.archivePath}`);
  } finally {
    fs.rmSync(path.dirname(archivedMdPath), { recursive: true, force: true });
    fs.rmSync(archive.tempRoot, { recursive: true, force: true });
  }
}

export { backupComposition };
