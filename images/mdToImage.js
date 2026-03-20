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

  // 背景颜色 - 深空蓝黑
  backgroundColor: '#0B0E1A',

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

// 生成CSS样式的函数（支持动态背景图路径）
function generateCSS(h1BackgroundImagePath = '') {
  return `
  /* ── 字体导入 ─────────────────────────────────────────────
     Russo One:    粗犷有力，适合游戏标题
     Chakra Petch: 技术感强，兼具可读性，适合游戏攻略正文
  ─────────────────────────────────────────────────────────── */
  @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:ital,wght@0,400;0,600;0,700;1,400&family=Russo+One&display=swap');

  /* ── 调色板 ──────────────────────────────────────────────
     背景:     #0B0E1A  深空蓝黑
     面板:     #111827  石板深面板
     正文:     #CBD5E1  银蓝白（比纯白更护眼）
     副文字:   #64748B  石板灰
     金色:     #F59E0B  TFT金币主题
     浅金:     #FBBF24
     紫色:     #8B5CF6  次强调（数据/特殊词条）
     浅紫:     #A78BFA
     玫红:     #F43F5E  标签/警示
     蓝色:     #60A5FA  链接/代码
     边框:     rgba(255,255,255,0.06)
  ─────────────────────────────────────────────────────────── */

  /* 确保背景网格覆盖整个截图区域 */
  html {
    background-color: #0B0E1A;
    /* 折中点阵：2px点 + 0.08不透明度 + 26px间距 = 微妙但可见 */
    background-image: radial-gradient(circle, rgba(255,255,255,0.08) 2px, transparent 2px);
    background-size: 26px 26px;
    background-attachment: fixed;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: ${CONFIG.fontFamily};
    font-size: ${CONFIG.fontSize};
    line-height: ${CONFIG.lineHeight};
    /* 深空背景 + 点阵纹理（dot 1.5px / 28px 间距） */
    background: transparent;
    color: #CBD5E1;
    position: relative;
  }

  /* 顶部装饰线: 金 → 紫 → 玫红 */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #F59E0B 0%, #8B5CF6 55%, #F43F5E 100%);
    z-index: 10;
  }

  /* ── 一级标题容器 ─────────────────────────────────────── */
  .h1-container {
    margin: 0;
    padding: 80px 48px 72px 48px;
    position: relative;

    ${h1BackgroundImagePath ? `
    background-image:
      linear-gradient(160deg,
        rgba(11, 14, 26, 0.90) 0%,
        rgba(11, 14, 26, 0.76) 40%,
        rgba(11, 14, 26, 0.86) 100%
      ),
      url('${h1BackgroundImagePath}');
    background-size: cover, cover;
    background-position: center, center;
    background-repeat: no-repeat, no-repeat;
    ` : `
    background: linear-gradient(160deg,
      rgba(139, 92, 246, 0.08) 0%,
      rgba(11, 14, 26, 1) 40%,
      rgba(245, 158, 11, 0.05) 100%
    );
    `}

    border-bottom: 1px solid rgba(245, 158, 11, 0.18);
  }

  /* ── 标签 ─────────────────────────────────────────────── */
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin: 0 0 24px 0;
    align-items: center;
  }

  .tag {
    display: inline-block;
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 20px;
    font-weight: 900;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #fff;
    background: linear-gradient(135deg,
      rgba(244, 63, 94, 0.85) 0%,
      rgba(220, 38, 38, 0.85) 100%
    );
    padding: 4px 16px;
    border-radius: 4px;
    border: 1px solid rgba(244, 63, 94, 0.35);
    box-shadow: 0 2px 10px rgba(244, 63, 94, 0.2);
  }

  /* ── 一级标题 ─────────────────────────────────────────── */
  h1 {
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 108px;
    font-weight: 900;
    margin: 0;
    padding: 0;
    color: #FFFFFF;
    text-align: left;
    letter-spacing: -0.5px;
    line-height: 1.2;
    text-shadow:
      0 2px 24px rgba(245, 158, 11, 0.18),
      0 0 60px rgba(139, 92, 246, 0.08);
  }

  /* ── 二级标题 — 章节分隔（TODO: human 实现视觉效果） ─── */
  /* TODO(human): 实现 h2 的视觉样式 —— 请看 Learn by Doing */
  h2 {
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 36px;
    font-weight: 900;
    margin: 32px 0 16px 0;
    padding: 14px 40px 14px 20px;
    color: #FBBF24;
    background: linear-gradient(90deg,
      rgba(245, 158, 11, 0.10) 0%,
      rgba(245, 158, 11, 0.03) 60%,
      transparent 100%
    );
    border-left: 4px solid #F59E0B;
    border-radius: 0 6px 6px 0;
    position: relative;
  }

  /* ── 三级标题 — 菱形 marker ──────────────────────────── */
  h3 {
    font-family: '"Chakra Petch"', ${CONFIG.fontFamily};
    font-size: 29px;
    font-weight: 700;
    margin: 20px 0 10px 0;
    padding: 4px 40px 4px 48px;
    color: #CBD5E1;
    position: relative;
  }

  /* 菱形 marker */
  h3::before {
    content: '◆';
    position: absolute;
    left: 26px;
    color: rgba(245, 158, 11, 0.5);
    font-size: 13px;
    top: 50%;
    transform: translateY(-50%);
  }

  /* ── 段落 ─────────────────────────────────────────────── */
  p {
    margin: 12px 0;
    padding: 0 40px;
    color: #CBD5E1;
  }

  /* ── 列表 ─────────────────────────────────────────────── */
  ul, ol {
    margin: 12px 0;
    padding-left: 72px;
    padding-right: 40px;
    color: #CBD5E1;
  }

  li {
    margin: 10px 0;
    line-height: 1.9;
  }

  /* ── ul — 金色菱形 marker（inline-block 垂直居中） ───── */
  ul {
    list-style: none;
  }

  ul li::before {
    content: '◆';
    display: inline-block;
    width: 36px;
    margin-left: -44px;
    color: #F59E0B;
    font-size: 20px;
    text-align: center;
    vertical-align: middle;
  }

  /* 嵌套 ul — 空心菱形，视觉减弱表达层级 */
  ul ul li::before {
    content: '◇';
    color: rgba(245, 158, 11, 0.5);
    font-size: 16px;
  }

  /* ── ol — 金色圆形数字徽章（inline-block 垂直居中） ─── */
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
    background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
    color: #0B0E1A;
    font-family: 'Russo One', ${CONFIG.fontFamily};
    font-size: 18px;
    font-weight: 900;
    text-align: center;
    line-height: 36px;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
    vertical-align: middle;
  }

  /* ── 粗体 — 金色（TFT 强调词、英雄名、技能名） ────────── */
  strong {
    color: #FBBF24;
    font-weight: 700;
  }

  /* ── 下划线 — 紫色波浪线（保持原文字颜色，与金色加粗形成对比） ─── */
  u {
    color: inherit;  /* 保持原文字颜色 #CBD5E1 */
    font-weight: 600;  /* 略微加粗以突出 */
    text-decoration: underline wavy;
    text-decoration-color: #8B5CF6;  /* 紫色下划线，符合TFT主题 */
    text-underline-offset: 5px;
    text-decoration-thickness: 2px;
  }

  /* ── 斜体 — 紫色（特殊词条、buff 名、说明文字） ──────── */
  em {
    color: #A78BFA;
    font-style: italic;
  }

  /* ── 行内代码 ─────────────────────────────────────────── */
  code {
    background: rgba(30, 41, 59, 0.8);
    color: #7DD3FC;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.85em;
    border: 1px solid rgba(125, 211, 252, 0.15);
  }

  /* ── 代码块 — 顶部紫色线 ────────────────────────────── */
  pre {
    background: #0D1117;
    margin: 16px 40px;
    padding: 20px 24px;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-top: 2px solid #8B5CF6;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }

  pre code {
    background: transparent;
    padding: 0;
    color: #E2E8F0;
    border: none;
    font-size: ${CONFIG.fontSize};
  }

  /* ── 引用块 — TFT风格提示卡（顶部紫色边框，避免与h2左边框重复） ──────────── */
  blockquote {
    margin: 20px 40px;
    padding: 28px 32px 28px 80px;
    position: relative;
    background: linear-gradient(135deg,
      rgba(139, 92, 246, 0.10) 0%,
      rgba(245, 158, 11, 0.06) 100%
    );
    /* 顶部紫色粗边框 + 全边框 + 圆角 */
    border: 1px solid rgba(139, 92, 246, 0.30);
    border-top: 3px solid #8B5CF6;
    border-radius: 10px;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.15);
  }

  /* 左侧紫色灯泡图标 */
  blockquote::before {
    content: '💡';
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 36px;
    filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.6));
  }

  blockquote p {
    margin: 0;
    padding: 0;
    color: #E2E8F0;
    font-style: normal;
    font-weight: 500;
  }

  /* ── 链接 ─────────────────────────────────────────────── */
  a {
    color: #60A5FA;
    text-decoration: none;
    border-bottom: 1px solid rgba(96, 165, 250, 0.25);
  }

  /* ── 分割线 ───────────────────────────────────────────── */
  hr {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    margin: 24px 40px;
  }

  /* ── 图片 ─────────────────────────────────────────────── */
  img {
    max-width: calc(100% - 80px);
    height: auto;
    display: block;
    margin: 20px 40px;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
  }

  /* Emoji 支持 */
  .emoji {
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
  }

  /* ── 表格 — 紫色表头（与金色 h2 形成层级区分） ──────── */
  table {
    width: calc(100% - 80px);
    margin: 20px 40px;
    border-collapse: collapse;
    background: #111827;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  thead {
    background: rgba(139, 92, 246, 0.12);
    border-bottom: 2px solid rgba(139, 92, 246, 0.45);
  }

  th {
    padding: 14px 18px;
    text-align: left;
    font-weight: 700;
    font-family: 'Russo One', ${CONFIG.fontFamily};
    color: #A78BFA;
    font-size: 24px;
    letter-spacing: 0.5px;
    border-bottom: 2px solid rgba(139, 92, 246, 0.45);
  }

  td {
    padding: 12px 18px;
    color: #CBD5E1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 23px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.025);
  }

  table code {
    font-size: 21px;
  }

  /* ── 封面图 ───────────────────────────────────────────── */
  .cover-image {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 28px 0 0 0;
    border-radius: 10px;
    padding: 0;
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

export { convertMdToImage, CONFIG };
