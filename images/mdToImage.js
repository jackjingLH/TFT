import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置项
const CONFIG = {
  // 图片尺寸
  width: 900,

  // 背景颜色 - 星云深紫
  backgroundColor: '#18121F',

  // 一级标题背景图设置
  h1BackgroundImage: './bg.png',

  // 字体配置 - 游戏专用字体（Russo One + Chakra Petch）
  fontFamily: '"Chakra Petch", "Microsoft YaHei", Arial, sans-serif',
  fontSize: '30px',
  lineHeight: '1.9',

  // 内边距
  padding: '0px',

  // 输出格式
  imageFormat: 'png',
  imageQuality: 100,
};

const THEME = {
  baseBg: '#18121F',
  bodyBg: '#120F1F',
  panel: '#231C39',
  panelRaised: '#2D2550',
  panelEdge: '#4B4996',
  text: '#F4EEFF',
  muted: '#D5CFF3',
  title: '#FFF38A',
  purpleLight: '#A589F2',
  purpleDeep: '#4B4996',
  auroraGreen: '#B1FF91',
  accentPink: '#FF8E8E',
  border: 'rgba(165, 137, 242, 0.34)',
  borderSoft: 'rgba(244, 238, 255, 0.08)',
  glow: 'rgba(165, 137, 242, 0.28)',
  shadow: 'rgba(9, 8, 24, 0.46)',
};

// 生成CSS样式的函数（支持动态背景图路径）
function generateCSS(h1BackgroundImagePath = '') {
  return `
  @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,400&family=Russo+One&display=swap');

  :root {
    --base-bg: ${THEME.baseBg};
    --body-bg: ${THEME.bodyBg};
    --panel: ${THEME.panel};
    --panel-raised: ${THEME.panelRaised};
    --panel-edge: ${THEME.panelEdge};
    --text: ${THEME.text};
    --muted: ${THEME.muted};
    --title: ${THEME.title};
    --purple-light: ${THEME.purpleLight};
    --purple-deep: ${THEME.purpleDeep};
    --aurora-green: ${THEME.auroraGreen};
    --accent-pink: ${THEME.accentPink};
    --border: ${THEME.border};
    --border-soft: ${THEME.borderSoft};
    --glow: ${THEME.glow};
    --shadow: ${THEME.shadow};
  }

  html {
    min-height: 100%;
    background-color: var(--base-bg);
    background-image:
      radial-gradient(circle at top, rgba(139, 92, 246, 0.22) 0%, rgba(139, 92, 246, 0.08) 30%, transparent 60%),
      linear-gradient(180deg, #140B22 0%, #12091F 42%, #100817 100%),
      radial-gradient(circle, rgba(255,255,255,0.08) 2px, transparent 2px);
    background-size: auto, auto, 26px 26px;
    background-repeat: no-repeat, no-repeat, repeat;
    background-attachment: fixed;
  }

  body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    font-family: ${CONFIG.fontFamily};
    font-size: ${CONFIG.fontSize};
    line-height: ${CONFIG.lineHeight};
    background-color: transparent;
    background-image:
      linear-gradient(180deg,
        rgba(167, 139, 250, 0.10) 0%,
        rgba(91, 33, 182, 0.18) 24%,
        rgba(18, 9, 31, 0.10) 62%,
        rgba(18, 9, 31, 0) 100%
      ),
      linear-gradient(180deg,
        rgba(18, 9, 31, 0) 0%,
        rgba(18, 9, 31, 0.24) 76%,
        rgba(16, 8, 23, 0.46) 100%
      );
    background-repeat: no-repeat, no-repeat;
    color: var(--text);
    position: relative;
  }

  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, rgba(255, 142, 142, 0.10) 0%, var(--accent-pink) 18%, var(--purple-light) 46%, var(--aurora-green) 74%, rgba(177, 255, 145, 0.10) 100%);
    box-shadow: 0 0 18px rgba(165, 137, 242, 0.30);
    z-index: 12;
  }

  .h1-container {
    margin: 0;
    padding: 80px 48px 72px 48px;
    position: relative;
    overflow: hidden;

    ${h1BackgroundImagePath ? `
    background-image:
      linear-gradient(160deg,
        rgba(18, 15, 31, 0.76) 0%,
        rgba(24, 18, 31, 0.42) 34%,
        rgba(75, 73, 150, 0.24) 62%,
        rgba(18, 15, 31, 0.72) 100%
      ),
      url('${h1BackgroundImagePath}');
    background-size: cover, cover;
    background-position: center, center 28%;
    background-repeat: no-repeat, no-repeat;
    ` : `
    background:
      radial-gradient(circle at 24% 10%, rgba(165, 137, 242, 0.46), transparent 34%),
      radial-gradient(circle at 82% 20%, rgba(255, 142, 142, 0.18), transparent 26%),
      radial-gradient(circle at 78% 74%, rgba(177, 255, 145, 0.10), transparent 18%),
      linear-gradient(160deg,
        rgba(24, 18, 31, 1) 0%,
        rgba(18, 15, 31, 1) 44%,
        rgba(75, 73, 150, 0.62) 100%
      );
    `}

    border-bottom: 1px solid var(--border);
    box-shadow:
      inset 0 -28px 50px rgba(9, 8, 24, 0.34),
      0 10px 36px rgba(9, 8, 24, 0.22);
  }

  .h1-container::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, rgba(12, 10, 27, 0.32), transparent 36%, transparent 64%, rgba(12, 10, 27, 0.28)),
      radial-gradient(circle at 18% 22%, rgba(165, 137, 242, 0.18), transparent 22%),
      radial-gradient(circle at 86% 30%, rgba(255, 142, 142, 0.16), transparent 14%),
      radial-gradient(circle at 78% 78%, rgba(177, 255, 145, 0.10), transparent 12%);
    pointer-events: none;
  }

  .h1-container::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 14% 16%, rgba(255, 142, 142, 0.92) 0 2px, transparent 3px),
      radial-gradient(circle at 27% 28%, rgba(255, 142, 142, 0.72) 0 3px, transparent 4px),
      radial-gradient(circle at 83% 24%, rgba(177, 255, 145, 0.82) 0 3px, transparent 4px),
      radial-gradient(circle at 90% 18%, rgba(255, 142, 142, 0.72) 0 2px, transparent 3px),
      linear-gradient(90deg, transparent 0%, rgba(165, 137, 242, 0.18) 18%, rgba(255, 142, 142, 0.24) 50%, rgba(177, 255, 145, 0.18) 82%, transparent 100%);
    pointer-events: none;
    opacity: 0.92;
  }

  .h1-container > * {
    position: relative;
    z-index: 1;
  }

  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin: 0 0 26px 0;
    align-items: center;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: #FFE8F6;
    background: linear-gradient(135deg,
      rgba(251, 113, 190, 0.96) 0%,
      rgba(236, 72, 153, 0.94) 52%,
      rgba(219, 39, 119, 0.92) 100%
    );
    padding: 7px 20px 8px;
    border: 1px solid rgba(251, 113, 190, 0.5);
    border-radius: 999px;
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.08) inset,
      0 6px 18px rgba(236, 72, 153, 0.28);
  }

  h1 {
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 106px;
    font-weight: 900;
    margin: 0;
    padding: 0;
    color: var(--title);
    text-align: left;
    letter-spacing: -0.8px;
    line-height: 1.14;
    text-shadow:
      0 2px 0 rgba(20, 18, 55, 0.56),
      0 10px 28px rgba(20, 18, 55, 0.48),
      0 0 26px rgba(165, 137, 242, 0.18);
  }

  h2 {
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 36px;
    font-weight: 900;
    margin: 36px 40px 18px 40px;
    padding: 16px 32px 16px 22px;
    color: var(--text);
    background:
      linear-gradient(180deg, rgba(75, 73, 150, 0.60) 0%, rgba(35, 28, 57, 0.94) 100%);
    border-left: 6px solid var(--purple-light);
    border-top: 1px solid rgba(244, 238, 255, 0.08);
    border-bottom: 1px solid rgba(165, 137, 242, 0.42);
    border-right: 1px solid rgba(165, 137, 242, 0.18);
    border-radius: 0 10px 10px 0;
    position: relative;
    box-shadow:
      inset 0 1px 0 rgba(244, 238, 255, 0.08),
      0 10px 24px rgba(9, 8, 24, 0.24);
  }

  h2::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 52px;
    height: 100%;
    background: linear-gradient(135deg, transparent 0%, rgba(255, 142, 142, 0.20) 100%);
    clip-path: polygon(38% 0, 100% 0, 100% 100%, 0 100%);
  }

  h3 {
    font-family: '"Chakra Petch"', ${CONFIG.fontFamily};
    font-size: 29px;
    font-weight: 700;
    margin: 22px 0 12px 0;
    padding: 4px 40px 4px 48px;
    color: var(--text);
    position: relative;
  }

  h3::before {
    content: '◆';
    position: absolute;
    left: 26px;
    color: rgba(165, 137, 242, 0.72);
    font-size: 13px;
    top: 50%;
    transform: translateY(-50%);
  }

  p {
    margin: 12px 0;
    padding: 0 40px;
    color: var(--text);
  }

  ul, ol {
    margin: 12px 0;
    padding-left: 72px;
    padding-right: 40px;
    color: var(--text);
  }

  li {
    margin: 10px 0;
    line-height: 1.9;
  }

  ul {
    list-style: none;
  }

  ul li::before {
    content: '◆';
    display: inline-block;
    width: 36px;
    margin-left: -44px;
    color: var(--accent-pink);
    font-size: 18px;
    text-align: center;
    vertical-align: middle;
    text-shadow: 0 0 10px rgba(255, 142, 142, 0.18);
  }

  ul ul li::before {
    content: '◇';
    color: rgba(165, 137, 242, 0.56);
    font-size: 15px;
  }

  ol {
    list-style: none;
    counter-reset: ol-counter;
  }

  ol li {
    counter-increment: ol-counter;
  }

  ol li::before {
    content: counter(ol-counter);
    display: inline-block;
    width: 36px;
    height: 36px;
    margin-left: -50px;
    margin-right: 14px;
    background: linear-gradient(180deg, rgba(165, 137, 242, 0.96) 0%, rgba(75, 73, 150, 0.96) 100%);
    color: var(--base-bg);
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 18px;
    font-weight: 900;
    text-align: center;
    line-height: 36px;
    border-radius: 50%;
    box-shadow:
      inset 0 1px 0 rgba(244, 238, 255, 0.28),
      0 4px 12px rgba(9, 8, 24, 0.24);
    vertical-align: middle;
  }

  strong {
    color: var(--aurora-green);
    font-weight: 700;
    text-shadow: 0 0 10px rgba(177, 255, 145, 0.16);
  }

  u {
    color: inherit;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: rgba(165, 137, 242, 0.88);
    text-underline-offset: 5px;
    text-decoration-thickness: 2px;
  }

  em {
    color: var(--accent-pink);
    font-style: italic;
  }

  code {
    background: rgba(35, 28, 57, 0.95);
    color: var(--title);
    padding: 2px 8px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.85em;
    border: 1px solid rgba(165, 137, 242, 0.22);
  }

  pre {
    background: linear-gradient(180deg, rgba(35, 28, 57, 0.98) 0%, rgba(24, 18, 31, 0.98) 100%);
    margin: 16px 40px;
    padding: 20px 24px;
    border-radius: 10px;
    overflow-x: auto;
    border: 1px solid rgba(165, 137, 242, 0.20);
    border-top: 2px solid var(--purple-light);
    box-shadow: 0 8px 24px rgba(9, 8, 24, 0.30);
  }

  pre code {
    background: transparent;
    padding: 0;
    color: var(--text);
    border: none;
    font-size: ${CONFIG.fontSize};
  }

  blockquote {
    margin: 20px 40px;
    padding: 24px 30px 24px 86px;
    position: relative;
    background: linear-gradient(180deg, rgba(53, 43, 86, 0.96) 0%, rgba(28, 23, 52, 0.96) 100%);
    border: 1px solid rgba(165, 137, 242, 0.30);
    border-left: 5px solid var(--accent-pink);
    border-radius: 12px;
    box-shadow:
      inset 0 1px 0 rgba(244, 238, 255, 0.06),
      0 10px 24px rgba(9, 8, 24, 0.24);
  }

  blockquote::before {
    content: '!';
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(180deg, rgba(255, 142, 142, 0.98) 0%, rgba(165, 137, 242, 0.98) 100%);
    color: var(--base-bg);
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 24px;
    line-height: 34px;
    text-align: center;
    box-shadow: 0 0 14px rgba(255, 142, 142, 0.18);
  }

  blockquote p {
    margin: 0;
    padding: 0;
    color: var(--text);
    font-style: normal;
    font-weight: 500;
  }

  a {
    color: var(--purple-light);
    text-decoration: none;
    border-bottom: 1px solid rgba(165, 137, 242, 0.30);
  }

  hr {
    border: none;
    border-top: 1px solid var(--border-soft);
    margin: 24px 40px;
  }

  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 20px 40px;
    border-radius: 10px;
    border: 1px solid rgba(165, 137, 242, 0.16);
    box-shadow: 0 8px 28px rgba(9, 8, 24, 0.38);
  }

  p > img:only-child {
    margin: 20px 0;
  }

  .emoji {
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
  }

  table {
    width: calc(100% - 80px);
    margin: 20px 40px;
    border-collapse: collapse;
    background: linear-gradient(180deg, rgba(31, 24, 52, 0.98) 0%, rgba(24, 18, 31, 0.98) 100%);
    border: 1px solid rgba(165, 137, 242, 0.18);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 22px rgba(9, 8, 24, 0.24);
  }

  thead {
    background: linear-gradient(180deg, rgba(90, 84, 165, 0.92) 0%, rgba(75, 73, 150, 0.98) 100%);
    border-bottom: 2px solid rgba(255, 142, 142, 0.32);
  }

  th {
    padding: 14px 18px;
    text-align: left;
    font-weight: 700;
    font-family: 'Russo One', ${CONFIG.fontFamily};
    color: var(--title);
    font-size: 24px;
    letter-spacing: 0.5px;
    border-bottom: 2px solid rgba(255, 142, 142, 0.24);
  }

  td {
    padding: 12px 18px;
    color: var(--text);
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 23px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tbody tr:nth-child(even) {
    background: rgba(165, 137, 242, 0.05);
  }

  table code {
    font-size: 21px;
  }

  .cover-image {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 28px 0 0 0;
    border-radius: 12px;
    padding: 0;
    border: 1px solid rgba(165, 137, 242, 0.20);
    box-shadow:
      inset 0 1px 0 rgba(244, 238, 255, 0.06),
      0 12px 28px rgba(9, 8, 24, 0.30);
  }
`;
}

/**
 * 将Markdown文件转换为图片
 * @param {string} mdFilePath - Markdown文件路径
 * @param {string} outputPath - 输出图片路径（可选，默认在mdToImg目录）
 */
async function convertMdToImage(mdFilePath, outputPath) {
  try {
    console.log(`开始转换: ${mdFilePath}`);

    // 读取Markdown文件
    let mdContent = fs.readFileSync(mdFilePath, 'utf-8');

    // 提取标签和封面图片（从HTML注释中）
    const tagsMatch = mdContent.match(/<!--\s*tags:\s*(.+?)\s*-->/);
    const coverMatch = mdContent.match(/<!--\s*cover:\s*(.+?)\s*-->/);

    const tagsString = tagsMatch ? tagsMatch[1].trim() : null;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    const coverImagePath = coverMatch ? coverMatch[1].trim() : null;

    console.log(`提取的标签: ${tags.length > 0 ? tags.join(', ') : '无'}`);
    console.log(`提取的封面图: ${coverImagePath || '无'}`);

    // 从markdown内容中移除这些注释，避免重复渲染
    mdContent = mdContent.replace(/<!--\s*tags:\s*.+?\s*-->\s*/g, '');
    mdContent = mdContent.replace(/<!--\s*cover:\s*.+?\s*-->\s*/g, '');

    // 获取Markdown文件所在目录（用于解析相对路径的图片）
    const mdDir = path.dirname(path.resolve(mdFilePath));

    // 将Markdown转换为HTML
    let htmlContent = marked(mdContent);

    // 动态生成h1-container的内容
    let h1ContainerContent = '';

    // 添加标签容器（如果存在标签）
    if (tags.length > 0) {
      h1ContainerContent += '<div class="tags-container">';
      tags.forEach(tag => {
        h1ContainerContent += `<span class="tag">${tag}</span>`;
      });
      h1ContainerContent += '</div>';
    }

    // 添加主标题（保留原有的h1标签）
    h1ContainerContent += '<h1>$1</h1>';

    // 添加封面图片（如果存在且文件真实存在）
    if (coverImagePath) {
      // 处理封面图片路径
      let coverImageUrl = coverImagePath;
      let shouldAddCover = true;

      if (!coverImagePath.startsWith('http://') && !coverImagePath.startsWith('https://')) {
        // 相对路径，转换为绝对路径
        const coverImageAbsPath = path.resolve(mdDir, coverImagePath);

        // 检查文件是否存在
        if (!fs.existsSync(coverImageAbsPath)) {
          console.log(`⚠️  警告: 封面图片不存在，已忽略: ${coverImagePath}`);
          shouldAddCover = false;
        } else {
          coverImageUrl = `file:///${coverImageAbsPath.replace(/\\/g, '/')}`;
          console.log(`封面图路径: ${coverImageUrl}`);
        }
      }

      // 只在文件存在或为网络URL时添加
      if (shouldAddCover) {
        h1ContainerContent += `<img class="cover-image" src="${coverImageUrl}" alt="封面图">`;
      }
    }

    // 在第一个h1标签外包裹容器，包含副标题和封面图
    htmlContent = htmlContent.replace(
      /<h1>(.*?)<\/h1>/,
      `<div class="h1-container">${h1ContainerContent}</div>`
    );

    // 处理背景图路径
    let h1BgImagePath = '';
    if (CONFIG.h1BackgroundImage) {
      // 如果是相对路径，转换为绝对路径
      if (!CONFIG.h1BackgroundImage.startsWith('http://') &&
          !CONFIG.h1BackgroundImage.startsWith('https://')) {
        const bgImageAbsPath = path.resolve(__dirname, CONFIG.h1BackgroundImage);
        // 转换为 file:// URL
        h1BgImagePath = `file:///${bgImageAbsPath.replace(/\\/g, '/')}`;
        console.log(`背景图路径: ${h1BgImagePath}`);
      } else {
        h1BgImagePath = CONFIG.h1BackgroundImage;
      }
    }

    // 生成CSS样式
    const cssStyle = generateCSS(h1BgImagePath);

    // 创建临时HTML文件（用于加载图片）
    const tempHtmlPath = path.join(mdDir, '__temp_preview__.html');
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${cssStyle}</style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');

    // 如果没有指定输出路径，使用默认路径
    if (!outputPath) {
      const fileName = path.basename(mdFilePath, '.md');
      outputPath = path.join(__dirname, `${fileName}.${CONFIG.imageFormat}`);
    }

    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 启动浏览器
    console.log('启动浏览器...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 设置视口宽度
    await page.setViewport({
      width: CONFIG.width,
      height: 800,
      deviceScaleFactor: 1
    });

    // 使用 goto 加载本地HTML文件，这样图片相对路径就能正确解析
    const fileUrl = `file:///${tempHtmlPath.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0'
    });

    // 获取页面实际高度
    const bodyHeight = await page.evaluate(() => {
      return document.body.scrollHeight;
    });

    // 调整视口高度以匹配内容
    await page.setViewport({
      width: CONFIG.width,
      height: bodyHeight,
      deviceScaleFactor: 1
    });

    // 截图
    console.log('生成图片...');
    const screenshotOptions = {
      path: outputPath,
      fullPage: true,
      type: CONFIG.imageFormat,
    };

    if (CONFIG.imageFormat === 'jpeg') {
      screenshotOptions.quality = CONFIG.imageQuality;
    }

    await page.screenshot(screenshotOptions);

    await browser.close();

    // 清理临时HTML文件
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }

    console.log(`✓ 转换成功！图片已保存到: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('转换失败:', error);

    // 确保清理临时文件
    try {
      const mdDir = path.dirname(path.resolve(mdFilePath));
      const tempHtmlPath = path.join(mdDir, '__temp_preview__.html');
      if (fs.existsSync(tempHtmlPath)) {
        fs.unlinkSync(tempHtmlPath);
      }
    } catch (cleanupError) {
      // 忽略清理错误
    }

    throw error;
  }
}

// 命令行使用 - 仅当直接运行此文件时执行
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法:');
    console.log('  node mdToImage.js <markdown文件路径> [输出图片路径]');
    console.log('');
    console.log('示例:');
    console.log('  node mdToImage.js ../translated_guides/玛尔扎哈水晶玫瑰连败转型攻略.md');
    console.log('  node mdToImage.js input.md output.png');
    process.exit(1);
  }

  const mdFilePath = args[0];
  const outputPath = args[1];

  if (!fs.existsSync(mdFilePath)) {
    console.error(`错误: 文件不存在 - ${mdFilePath}`);
    process.exit(1);
  }

  convertMdToImage(mdFilePath, outputPath)
    .then(() => {
      console.log('完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('发生错误:', error);
      process.exit(1);
    });
}

export { convertMdToImage, CONFIG, generateCSS };
