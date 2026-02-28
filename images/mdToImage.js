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
  body {
    margin: 0;
    padding: 0;
    font-family: ${CONFIG.fontFamily};
    font-size: ${CONFIG.fontSize};
    line-height: ${CONFIG.lineHeight};

    /* Cyberpunk 深蓝背景，与网页端一致 */
    background: linear-gradient(135deg, #0F0F23 0%, #111827 50%, #0F0F23 100%);
    color: #d4d4d4;
    position: relative;
  }

  /* 顶部紫→玫红装饰线（对应网页端阅读进度条） */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #7C3AED 0%, #A78BFA 50%, #F43F5E 100%);
    z-index: 10;
  }

  /* 一级标题容器 */
  .h1-container {
    margin: 0;
    padding: 92px 33px 92px 33px;
    position: relative;

    ${h1BackgroundImagePath ? `
    background-image:
      linear-gradient(135deg,
        rgba(0, 0, 0, 0.85) 0%,
        rgba(15, 15, 35, 0.75) 50%,
        rgba(0, 0, 0, 0.8) 100%
      ),
      radial-gradient(circle at 20% 50%, rgba(124, 58, 237, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(167, 139, 250, 0.08) 0%, transparent 50%),
      url('${h1BackgroundImagePath}');
    background-size: cover, cover, cover, cover;
    background-position: center, center, center, center;
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.3);
    ` : `
    /* 无背景图时：深紫色调渐变 */
    background: linear-gradient(135deg,
      rgba(124, 58, 237, 0.08) 0%,
      rgba(15, 15, 35, 0.95) 40%,
      rgba(15, 15, 35, 0.95) 60%,
      rgba(124, 58, 237, 0.05) 100%
    );
    `}

    /* 标题区域底部分割线 - 紫色 */
    border-bottom: 2px solid rgba(124, 58, 237, 0.3);
  }

  /* 标签容器 */
  .tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 17px;
    margin: 0 0 16px 0;
    align-items: center;
  }

  /* 单个标签 - 玫红色系（与网页端一致） */
  .tag {
    display: inline-block;
    font-size: 32px;
    font-weight: 600;
    line-height: 1.2;
    color: #ffffff;
    background: linear-gradient(135deg,
      rgba(244, 63, 94, 0.85) 0%,
      rgba(225, 29, 72, 0.85) 100%
    );
    padding: 2px 15px;
    border-radius: 16px;
    border: 1px solid rgba(244, 63, 94, 0.6);
    letter-spacing: 1px;
    box-shadow: 0 3px 10px rgba(244, 63, 94, 0.3);
    vertical-align: middle;
  }

  /* 一级标题 */
  h1 {
    font-size: 108px;
    font-weight: 900;
    margin: 0;
    padding: 0;
    color: #ffffff;
    text-align: left;
    letter-spacing: 2px;
    line-height: 1.3;
    text-shadow: 0 0 30px rgba(167, 139, 250, 0.2);
    background: none;
  }

  /* 二级标题 - 霓虹紫（与网页端完全一致） */
  h2 {
    font-size: 37px;
    font-weight: bold;
    margin: 23px 0 13px 0;
    padding: 8px 33px 8px 29px;
    color: #A78BFA;
    background: linear-gradient(90deg, rgba(124, 58, 237, 0.08) 0%, transparent 100%);
    border-left: 4px solid #7C3AED;
    border-top: 1px solid rgba(124, 58, 237, 0.1);
    border-bottom: 1px solid rgba(124, 58, 237, 0.1);
    box-shadow: -4px 0 12px rgba(124, 58, 237, 0.2);
    position: relative;
  }

  /* 三级标题 */
  h3 {
    font-size: 30px;
    font-weight: bold;
    margin: 20px 0 12px 0;
    padding: 4px 33px 4px 30px;
    color: #A78BFA;
    background: linear-gradient(90deg, rgba(124, 58, 237, 0.05) 0%, transparent 60%);
    border-left: 3px solid #6D28D9;
  }

  /* 段落 */
  p {
    margin: 13px 0;
    padding: 0 33px;
    color: #d4d4d4;
  }

  /* 列表 */
  ul, ol {
    margin: 13px 0;
    padding-left: 63px;
    padding-right: 33px;
    color: #d4d4d4;
  }

  li {
    margin: 12px 0;
    line-height: 2.1;
  }

  /* 行内代码 - 玫粉色文字 + 深紫背景 */
  code {
    background: rgba(30, 27, 75, 0.9);
    color: #F9A8D4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    border: 1px solid rgba(124, 58, 237, 0.3);
  }

  /* 代码块 - 顶部紫色边框 + neon 阴影 */
  pre {
    background: rgba(15, 15, 35, 0.95);
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    border-top: 2px solid #7C3AED;
    border-left: 1px solid rgba(124, 58, 237, 0.3);
    border-right: 1px solid rgba(124, 58, 237, 0.3);
    border-bottom: 1px solid rgba(124, 58, 237, 0.3);
    box-shadow: 0 -2px 12px rgba(124, 58, 237, 0.2);
  }

  pre code {
    background: transparent;
    padding: 0;
    color: #d4d4d4;
    border: none;
  }

  /* 引用块 - 紫色边框 + 半透明紫色背景 */
  blockquote {
    border-left: 4px solid #7C3AED;
    margin: 15px 33px;
    padding: 10px 10px 10px 20px;
    color: #C4B5FD;
    background: rgba(124, 58, 237, 0.08);
    border-radius: 4px;
    font-style: italic;
  }

  /* 粗体 - 浅紫色 */
  strong {
    color: #C4B5FD;
    font-weight: bold;
  }

  /* 斜体 - 玫粉色 */
  em {
    color: #F9A8D4;
    font-style: italic;
  }

  /* 链接 - 紫色 */
  a {
    color: #A78BFA;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* 图片 */
  img {
    max-width: calc(100% - 66px);
    height: auto;
    display: block;
    margin: 21px 33px;
    border-radius: 8px;
  }

  /* Emoji 支持 */
  .emoji {
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
  }

  /* 表格 - 深蓝背景 + 紫色边框 */
  table {
    width: calc(100% - 66px);
    margin: 21px 33px;
    border-collapse: collapse;
    background: rgba(22, 33, 62, 0.9);
    border: 1px solid rgba(55, 48, 163, 0.5);
    border-radius: 12px;
    overflow: hidden;
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.3),
      0 0 16px rgba(124, 58, 237, 0.1);
  }

  thead {
    background: rgba(30, 27, 75, 0.95);
    border-bottom: 2px solid #7C3AED;
  }

  th {
    padding: 13px 17px;
    text-align: left;
    font-weight: bold;
    color: #A78BFA;
    border-bottom: 2px solid #7C3AED;
    font-size: 25px;
  }

  td {
    padding: 12px 17px;
    color: #d4d4d4;
    border-bottom: 1px solid rgba(55, 48, 163, 0.3);
    font-size: 23px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background-color: rgba(124, 58, 237, 0.05);
  }

  /* 表格内的代码 */
  table code {
    font-size: 22px;
  }

  /* 封面图 */
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
