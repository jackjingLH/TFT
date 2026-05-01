const KNOWN_SECTIONS = [
  'Tips',
  'Snax',
  'Stage 2',
  'Stage 3',
  'Stage 4',
  'Stage 5',
  'Alt Builds',
  'Augments',
  'Augment Priority',
  'Early Comp',
  'Item Priority',
  'Max Cap',
  'Positioning',
  'Carousel Priority',
  'Economy',
  'How to Play',
];

const IGNORE_EXACT = new Set([
  'Open in Builder',
  'Show names',
  'Hide names',
  'Copy link',
  'Share',
  'Guide',
  'Comp',
  'Comps',
  'Tierlist',
]);

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function isMeaningfulLine(line) {
  if (!line) {
    return false;
  }

  if (IGNORE_EXACT.has(line)) {
    return false;
  }

  if (/^(S|A|B|C|D) Tier$/i.test(line)) {
    return false;
  }

  if (/^(Updated|Last updated)\b/i.test(line)) {
    return false;
  }

  return true;
}

export function extractTextLinesFromHtml(html) {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ');

  const blockSeparated = withoutScripts
    .replace(/<\/(h1|h2|h3|h4|h5|h6|p|li|div|section|article|button|span)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');

  const plainText = decodeHtmlEntities(blockSeparated.replace(/<[^>]+>/g, ' '));

  const lines = plainText
    .split('\n')
    .map((line) => normalizeWhitespace(line))
    .filter((line) => isMeaningfulLine(line));

  return Array.from(new Set(lines));
}

function slugFromUrl(url) {
  return url.split('/').filter(Boolean).pop() || '';
}

function cleanSectionLines(lines) {
  return lines.filter((line) => {
    if (!line) {
      return false;
    }

    if (IGNORE_EXACT.has(line)) {
      return false;
    }

    if (/^(Playstyle|Difficulty|Meta Snapshot):/i.test(line)) {
      return false;
    }

    return true;
  });
}

function collectSection(lines, startIndex) {
  const collected = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (KNOWN_SECTIONS.includes(line) || /^Stage\s+\d+$/i.test(line)) {
      break;
    }
    collected.push(line);
  }

  return cleanSectionLines(collected);
}

function extractMetaContent(html, name) {
  const match = html.match(new RegExp(`<meta[^>]+${name}="description"[^>]+content="([^"]*)"`, 'i'));
  if (match) {
    return decodeHtmlEntities(match[1]).trim();
  }
  return '';
}

function extractLdJsonHeadline(html) {
  const match = html.match(/"headline":"([^"]+)"/i);
  if (match) {
    return decodeHtmlEntities(match[1]).trim();
  }
  return '';
}

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((part) => part.trim())
      .filter((part) => part.length >= 3)
  );
}

function overlapScore(left, right) {
  const leftTokens = tokenize(left || '');
  const rightTokens = tokenize(right || '');
  let score = 0;

  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      score += 1;
    }
  });

  return score;
}

function unescapeQuoted(value) {
  return decodeHtmlEntities(
    value
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
  ).trim();
}

function parseCandidateBlock(block) {
  const titleMatch = block.match(/title:"([^"]+)"/);
  const tipsMatch = block.match(/tips:\[([\s\S]*?)\],title:"/);

  if (!titleMatch || !tipsMatch) {
    return null;
  }

  const compSlugMatch = block.match(/compSlug:"([^"]*)"/);
  const augmentsTipMatch = block.match(/augmentsTip:"([\s\S]*?)",carousel:/);
  const augmentTypesMatch = block.match(/augmentTypes:\[([^\]]*)\]/);
  const styleMatch = block.match(/style:"([^"]+)"/);
  const tierMatch = block.match(/tier:"([^"]+)"/);
  const difficultyMatch = block.match(/difficulty:"([^"]+)"/);

  const stageTips = {};
  const tipPattern = /stage:"([^"]+)",tip:"([\s\S]*?)"/g;
  let tipMatch;
  while ((tipMatch = tipPattern.exec(tipsMatch[1])) !== null) {
    stageTips[tipMatch[1]] = unescapeQuoted(tipMatch[2]);
  }

  const augmentTypes = augmentTypesMatch
    ? augmentTypesMatch[1]
        .split(',')
        .map((part) => part.replace(/"/g, '').trim())
        .filter(Boolean)
    : [];

  return {
    title: unescapeQuoted(titleMatch[1]),
    compSlug: compSlugMatch ? unescapeQuoted(compSlugMatch[1]) : '',
    augmentsTip: augmentsTipMatch ? unescapeQuoted(augmentsTipMatch[1]) : '',
    augmentTypes,
    stageTips,
    style: styleMatch ? unescapeQuoted(styleMatch[1]) : '',
    tier: tierMatch ? unescapeQuoted(tierMatch[1]) : '',
    difficulty: difficultyMatch ? unescapeQuoted(difficultyMatch[1]) : '',
  };
}

export function extractStructuredGuide(html, url) {
  const pageTitle = extractLdJsonHeadline(html);
  const metaDescription = extractMetaContent(html, 'name') || extractMetaContent(html, 'property');
  const slug = slugFromUrl(url);
  const candidateStarts = [...html.matchAll(/\{altBuilds:/g)].map((match) => match.index);

  const candidates = [];
  for (let index = 0; index < candidateStarts.length; index += 1) {
    const start = candidateStarts[index];
    const end = index + 1 < candidateStarts.length ? candidateStarts[index + 1] : html.length;
    const block = html.slice(start, end);
    const candidate = parseCandidateBlock(block);
    if (candidate) {
      const stageBlob = Object.values(candidate.stageTips).join(' ');
      candidate.score =
        overlapScore(pageTitle, candidate.title) * 3 +
        overlapScore(metaDescription, candidate.augmentsTip) * 2 +
        overlapScore(metaDescription, stageBlob) +
        overlapScore(slug.replace(/-/g, ' '), `${candidate.compSlug} ${candidate.title}`) * 2;
      candidates.push(candidate);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => right.score - left.score);
  const best = candidates[0];
  const guide = {
    url,
    compSlug: best.compSlug || slug,
    compName: pageTitle || best.title || slug,
    timestamp: new Date().toISOString(),
    tabs: {},
    stages: {},
    sections: {},
    availableSections: [],
    source: 'structured-data',
  };

  if (metaDescription) {
    guide.tabs.tips = metaDescription;
  } else if (best.augmentsTip) {
    guide.tabs.tips = best.augmentsTip;
  }

  Object.entries(best.stageTips).forEach(([stage, tip]) => {
    const normalized = stage.match(/^Stage\s+(\d+)$/i);
    if (normalized) {
      guide.stages[`stage${normalized[1]}`] = tip;
    }
  });

  if (best.augmentsTip) {
    guide.sections.Augments = best.augmentsTip;
    guide.availableSections.push('Augments');
  }

  if (best.augmentTypes.length > 0) {
    guide.sections['Augment Priority'] = best.augmentTypes.join('\n');
    guide.availableSections.push('Augment Priority');
  }

  if (best.style || best.difficulty || best.tier) {
    guide.sections.Overview = [best.style, best.difficulty, best.tier].filter(Boolean).join(' | ');
    guide.availableSections.push('Overview');
  }

  if (best.title && pageTitle && best.title !== pageTitle) {
    guide.sections['Variant Title'] = best.title;
    guide.availableSections.push('Variant Title');
  }

  return guide;
}

export function extractGuideFromText(lines, url) {
  const normalizedLines = lines.map((line) => normalizeWhitespace(line)).filter(Boolean);
  const guide = {
    url,
    compSlug: slugFromUrl(url),
    compName: normalizedLines[0] || slugFromUrl(url),
    timestamp: new Date().toISOString(),
    tabs: {},
    stages: {},
    sections: {},
    availableSections: [],
  };

  for (let index = 0; index < normalizedLines.length; index += 1) {
    const line = normalizedLines[index];

    if (line === 'Tips') {
      const content = collectSection(normalizedLines, index).join('\n');
      if (content) {
        guide.tabs.tips = content;
      }
      continue;
    }

    if (line === 'Snax') {
      const content = collectSection(normalizedLines, index).join('\n');
      if (content) {
        guide.tabs.snax = content;
      }
      continue;
    }

    const stageMatch = line.match(/^Stage\s+(\d+)$/i);
    if (stageMatch) {
      const stageKey = `stage${stageMatch[1]}`;
      const content = collectSection(normalizedLines, index).join('\n');
      if (content) {
        guide.stages[stageKey] = content;
      }
      continue;
    }

    if (KNOWN_SECTIONS.includes(line) && !['Tips', 'Snax'].includes(line) && !/^Stage\s+\d+$/i.test(line)) {
      const content = collectSection(normalizedLines, index).join('\n');
      guide.sections[line] = content;
      guide.availableSections.push(line);
    }
  }

  return guide;
}

export function guideToTftText(guide) {
  const lines = [];

  if (guide.compName) {
    lines.push(guide.compName);
    lines.push('');
  }

  if (guide.tabs?.tips) {
    lines.push(`Tips: ${guide.tabs.tips}`);
  }

  if (guide.tabs?.snax) {
    lines.push(`Snax: ${guide.tabs.snax}`);
  }

  Object.entries(guide.stages || {}).forEach(([key, content]) => {
    const stageTitle = key.replace(/^stage/i, 'Stage ');
    lines.push(`${stageTitle}: ${content}`);
  });

  Object.entries(guide.sections || {}).forEach(([title, content]) => {
    lines.push(`${title}: ${content}`.trimEnd());
  });

  return lines.join('\n\n').trim() + '\n';
}
