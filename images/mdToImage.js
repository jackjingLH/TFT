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
  width: 1080,           // 宽度（像素）
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
  fontSize: '32px',      // 超大字体，移动端非常清晰（原 28px）
  lineHeight: '2.1',     // 超大行距（原 2.0）

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
    background-color: ${CONFIG.backgroundColor};
    color: #d4d4d4;  /* VSCode 文本颜色 */
  }

  /* 一级标题容器 - 用于包裹副标题和主标题 */
  .h1-container {
    margin: 0;
    padding: 110px 40px 110px 40px;  /* 上下边距：110px */

    /* 使用图片作为背景（如果配置了的话）*/
    ${h1BackgroundImagePath ? `
    background-image:
      linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.5)),  /* 深色遮罩，确保文字可读 */
      url('${h1BackgroundImagePath}');  /* 背景图 */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    ` : `
    /* 渐变背景（无背景图时使用）*/
    background: linear-gradient(135deg, #1a3a52 0%, #2d5a6f 50%, #1e4d5c 100%);
    `}

    /* 如果图片加载失败，使用渐变背景作为后备 */
    background-color: #1a3a52;
  }

  /* 赛季副标题 - 一级标题上方的小字 */
  .season-subtitle {
    font-size: 36px;     /* 小字体 */
    font-weight: 400;    /* 正常粗细 */
    color: rgba(255, 255, 255, 0.7);  /* 半透明白色 */
    margin: 0 0 20px 0;  /* 下方留20px间距 */
    letter-spacing: 4px; /* 字间距 */
    text-align: left;    /* 左对齐 */
  }

  /* 一级标题 - 封面级别设计（带背景图） */
  h1 {
    font-size: 130px;    /* 更大的标题字体 */
    font-weight: 900;    /* 特粗体 */
    margin: 0;
    padding: 0;          /* 移除内边距，由容器控制 */
    color: #ffffff;      /* 纯白色，更醒目 */
    text-align: left;    /* 左对齐 */
    letter-spacing: 6px; /* 超大字间距 */
    line-height: 1.3;    /* 缩小行间距 */
    background: none;    /* 移除背景，由容器控制 */
  }

  /* 二级标题 - 内容区域 */
  h2 {
    font-size: 44px;     /* 超大二级标题（原 38px）*/
    font-weight: bold;
    margin: 28px 0 16px 0;
    padding: 0 40px;     /* 左右内边距 */
    color: #4ec9b0;
  }

  /* 三级标题 */
  h3 {
    font-size: 36px;     /* 大三级标题（原 32px）*/
    font-weight: bold;
    margin: 24px 0 14px 0;
    padding: 0 40px;
    color: #4ec9b0;
  }

  /* 段落 - 添加左右内边距 */
  p {
    margin: 16px 0;
    padding: 0 40px;
    color: #d4d4d4;
  }

  /* 列表 - 添加左右内边距 */
  ul, ol {
    margin: 16px 0;
    padding-left: 75px;  /* 左侧缩进 + 内容区域内边距 */
    padding-right: 40px;
    color: #d4d4d4;
  }

  li {
    margin: 14px 0;      /* 更大列表项间距 */
    line-height: 2.1;
  }

  code {
    background-color: #2d2d30;  /* VSCode 代码背景 */
    color: #ce9178;  /* VSCode 字符串颜色 */
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }

  pre {
    background-color: #2d2d30;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
    border: 1px solid #3c3c3c;
  }

  pre code {
    background-color: transparent;
    padding: 0;
    color: #d4d4d4;
  }

  blockquote {
    border-left: 4px solid #007acc;  /* VSCode 蓝色强调色 */
    margin: 15px 0;
    padding-left: 20px;
    color: #9cdcfe;  /* VSCode 注释颜色 */
    background-color: rgba(0, 122, 204, 0.1);
    padding: 10px 10px 10px 20px;
    border-radius: 3px;
  }

  strong {
    color: #569cd6;  /* VSCode 关键字蓝色 */
    font-weight: bold;
  }

  em {
    color: #dcdcaa;  /* VSCode 黄色 */
    font-style: italic;
  }

  a {
    color: #3794ff;  /* VSCode 链接颜色 */
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* 图片样式 - 限制最大宽度，防止图片撑开容器 */
  img {
    max-width: calc(100% - 80px);  /* 减去左右内边距 */
    height: auto;
    display: block;
    margin: 25px 40px;    /* 上下间距 + 左右内边距 */
    border-radius: 8px;
  }

  /* Emoji 支持 */
  .emoji {
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
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
    const mdContent = fs.readFileSync(mdFilePath, 'utf-8');

    // 获取Markdown文件所在目录（用于解析相对路径的图片）
    const mdDir = path.dirname(path.resolve(mdFilePath));

    // 将Markdown转换为HTML
    let htmlContent = marked(mdContent);

    // 在第一个h1标签外包裹容器（不添加副标题）
    htmlContent = htmlContent.replace(
      /<h1>(.*?)<\/h1>/,
      '<div class="h1-container"><h1>$1</h1></div>'
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
