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
  width: 900,            // 宽度（像素）
  // height: 自动根据内容调整

  // 背景颜色 - VSCode 深色主题
  backgroundColor: '#1e1e1e',  // VSCode 深色背景

  // 一级标题背景图设置
  h1BackgroundImage: './bg.png',
  // 可选的背景图URL：
  // - 游戏类: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200'
  // - 科技感: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200'
  // - 战斗场景: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1200'
  // - 纯色留空: ''  （使用渐变背景）

  // 字体配置 - 移动端超大字体优化
  fontFamily: 'Microsoft YaHei, Arial, sans-serif',  // 微软雅黑
  fontSize: '32px',      // 超大字体，移动端非常清晰
  lineHeight: '2.1',     // 超大行距（保持不变）

  // 内边距 - 移动端优化
  padding: '0px',        // 去掉body内边距，让标题区域可以满宽

  // 输出格式
  imageFormat: 'png',  // 'png' 或 'jpeg'
  imageQuality: 100,   // JPEG质量 (1-100)
};

// 生成CSS样式的函数（支持动态背景图路径）
function generateCSS(h1BackgroundImagePath = '') {
  return `
  /* ── 调色板 ──────────────────────────────────────
     背景:   #0D1117 (深碳黑)
     正文:   #C9D1D9 (暖灰白)
     强调色: #F59E0B (琥珀金) ← TFT 金币主题色
     次强调: #FCD34D (浅金)
     代码:   #7DD3FC (天蓝)
     标签:   #F43F5E (玫红)
  ─────────────────────────────────────────────── */

  body {
    margin: 0;
    padding: 0;
    font-family: ${CONFIG.fontFamily};
    font-size: ${CONFIG.fontSize};
    line-height: ${CONFIG.lineHeight};
    background: #0D1117;
    color: #C9D1D9;
    position: relative;
  }

  /* 顶部金→玫红装饰线 */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #F59E0B 0%, #FCD34D 50%, #F43F5E 100%);
    z-index: 10;
  }

  /* ── 一级标题容器 ─────────────────────────────── */
  .h1-container {
    margin: 0;
    padding: 88px 40px 80px 40px;
    position: relative;

    ${h1BackgroundImagePath ? `
    background-image:
      linear-gradient(160deg,
        rgba(0, 0, 0, 0.82) 0%,
        rgba(13, 17, 23, 0.72) 50%,
        rgba(0, 0, 0, 0.78) 100%
      ),
      radial-gradient(circle at 15% 50%, rgba(245, 158, 11, 0.12) 0%, transparent 55%),
      radial-gradient(circle at 85% 20%, rgba(252, 211, 77, 0.06) 0%, transparent 50%),
      url('${h1BackgroundImagePath}');
    background-size: cover, cover, cover, cover;
    background-position: center, center, center, center;
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
    box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4);
    ` : `
    background: linear-gradient(160deg,
      rgba(245, 158, 11, 0.06) 0%,
      rgba(13, 17, 23, 0.98) 35%,
      rgba(13, 17, 23, 0.98) 65%,
      rgba(245, 158, 11, 0.04) 100%
    );
    `}

    border-bottom: 1px solid rgba(245, 158, 11, 0.25);
  }

  /* ── 标签 ─────────────────────────────────────── */
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin: 0 0 20px 0;
    align-items: center;
  }

  .tag {
    display: inline-block;
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    color: #ffffff;
    background: linear-gradient(135deg,
      rgba(244, 63, 94, 0.9) 0%,
      rgba(220, 38, 38, 0.9) 100%
    );
    padding: 3px 18px;
    border-radius: 20px;
    border: 1px solid rgba(244, 63, 94, 0.5);
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(244, 63, 94, 0.25);
    vertical-align: middle;
  }

  /* ── 一级标题 ─────────────────────────────────── */
  h1 {
    font-size: 100px;
    font-weight: 900;
    margin: 0;
    padding: 0;
    color: #FFFFFF;
    text-align: left;
    letter-spacing: 1px;
    line-height: 1.25;
    /* 金色微光，比紫色柔和得多 */
    text-shadow: 0 2px 20px rgba(245, 158, 11, 0.15);
    background: none;
  }

  /* ── 二级标题 — 琥珀金左边框 ────────────── */
  h2 {
    font-size: 38px;
    font-weight: 800;
    margin: 28px 0 14px 0;
    padding: 10px 40px 10px 32px;
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

  /* ── 三级标题 — 浅金，层级明确 ─────────────────── */
  h3 {
    font-size: 31px;
    font-weight: 700;
    margin: 22px 0 12px 0;
    padding: 5px 40px 5px 36px;
    color: #D4A017;
    background: linear-gradient(90deg,
      rgba(245, 158, 11, 0.06) 0%,
      transparent 70%
    );
    border-left: 3px solid rgba(245, 158, 11, 0.5);
    border-radius: 0 4px 4px 0;
  }

  /* ── 段落 ─────────────────────────────────────── */
  p {
    margin: 14px 0;
    padding: 0 40px;
    color: #C9D1D9;
  }

  /* ── 列表 ─────────────────────────────────────── */
  ul, ol {
    margin: 14px 0;
    padding-left: 70px;
    padding-right: 40px;
    color: #C9D1D9;
  }

  li {
    margin: 11px 0;
    line-height: 2.0;
  }

  /* 列表标记用金色 */
  ul li::marker {
    color: #F59E0B;
  }
  ol li::marker {
    color: #F59E0B;
    font-weight: 700;
  }

  /* ── 粗体 — 近白，不再用颜色干扰阅读 ───────────── */
  strong {
    color: #F1F5F9;
    font-weight: 700;
  }

  /* ── 斜体 — 淡金，轻柔区分 ─────────────────────── */
  em {
    color: #FDE68A;
    font-style: italic;
  }

  /* ── 行内代码 — 天蓝色，视觉区分清晰 ──────────── */
  code {
    background: rgba(14, 116, 144, 0.18);
    color: #7DD3FC;
    padding: 2px 8px;
    border-radius: 5px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.88em;
    border: 1px solid rgba(125, 211, 252, 0.2);
  }

  /* ── 代码块 — 顶部金色线 ────────────────────────── */
  pre {
    background: #161B22;
    margin: 16px 40px;
    padding: 20px 24px;
    border-radius: 10px;
    overflow-x: auto;
    border: 1px solid rgba(48, 54, 61, 0.8);
    border-top: 2px solid #F59E0B;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }

  pre code {
    background: transparent;
    padding: 0;
    color: #C9D1D9;
    border: none;
    font-size: ${CONFIG.fontSize};
  }

  /* ── 引用块 — 金色左线 + 低饱和背景 ────────────── */
  /* ── 引用块 — 无边线，斜体灰色正文 ─────────────── */
  blockquote {
    margin: 18px 40px;
    padding: 10px 24px;
    color: #808080;
    background: none;
    font-style: italic;
  }

  /* ── 链接 — 柔和蓝，避免与金色强调混淆 ─────────── */
  a {
    color: #60A5FA;
    text-decoration: none;
    border-bottom: 1px solid rgba(96, 165, 250, 0.3);
  }

  /* ── 分割线 ────────────────────────────────────── */
  hr {
    border: none;
    border-top: 1px solid rgba(245, 158, 11, 0.2);
    margin: 28px 40px;
  }

  /* ── 图片 ────────────────────────────────────── */
  img {
    max-width: calc(100% - 80px);
    height: auto;
    display: block;
    margin: 22px 40px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }

  /* Emoji 支持 */
  .emoji {
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
  }

  /* ── 表格 — 深碳背景 + 金色表头 ─────────────────── */
  table {
    width: calc(100% - 80px);
    margin: 22px 40px;
    border-collapse: collapse;
    background: #161B22;
    border: 1px solid rgba(48, 54, 61, 0.9);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  }

  thead {
    background: rgba(245, 158, 11, 0.10);
    border-bottom: 2px solid #F59E0B;
  }

  th {
    padding: 14px 20px;
    text-align: left;
    font-weight: 700;
    color: #FBBF24;
    border-bottom: 2px solid #F59E0B;
    font-size: 26px;
    letter-spacing: 0.5px;
  }

  td {
    padding: 13px 20px;
    color: #C9D1D9;
    border-bottom: 1px solid rgba(48, 54, 61, 0.7);
    font-size: 24px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
  }

  /* 表格内的代码 */
  table code {
    font-size: 22px;
  }

  /* ── 封面图 ──────────────────────────────────── */
  .cover-image {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 33px 0 0 0;
    border-radius: 12px;
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

    // 添加封面图片（如果存在）
    if (coverImagePath) {
      // 处理封面图片路径
      let coverImageUrl = coverImagePath;
      if (!coverImagePath.startsWith('http://') && !coverImagePath.startsWith('https://')) {
        // 相对路径，转换为绝对路径
        const coverImageAbsPath = path.resolve(mdDir, coverImagePath);
        coverImageUrl = `file:///${coverImageAbsPath.replace(/\\/g, '/')}`;
        console.log(`封面图路径: ${coverImageUrl}`);
      }
      h1ContainerContent += `<img class="cover-image" src="${coverImageUrl}" alt="封面图">`;
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

    // 设置视口宽度（1倍像素，实际宽度1080px）
    await page.setViewport({
      width: CONFIG.width,
      height: 800,  // 初始高度，实际高度会根据内容调整
      deviceScaleFactor: 1  // 1倍分辨率（原2倍）
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
      deviceScaleFactor: 1  // 1倍分辨率
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
