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

    /* 简化背景设计：纯净渐变 + 微妙纹理 */
    background:
      /* 单层纹理：细微的点状图案 */
      radial-gradient(circle at 2px 2px, rgba(255,255,255,0.02) 1px, transparent 1px),

      /* 底层渐变：主色调渐变 */
      linear-gradient(135deg,
        #1a1f2e 0%,    /* 深蓝灰 */
        #1e2535 30%,   /* 中蓝灰 */
        #1f1f2e 60%,   /* 带紫色调的深灰 */
        #1a1f28 90%,   /* 青灰色 */
        #181825 100%   /* 深灰蓝 */
      ),

      /* 基础背景色 */
      #1e1e1e;

    /* 背景图案尺寸设置 */
    background-size:
      30px 30px,    /* 点状图案尺寸，更稀疏 */
      100% 100%,    /* 渐变覆盖整个区域 */
      100% 100%;    /* 基础色覆盖整个区域 */

    background-attachment: fixed;
    color: #d4d4d4;  /* VSCode 文本颜色 */

    /* 添加微妙的边框装饰 */
    position: relative;
  }

  /* 页面顶部和底部的装饰线条 */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(78, 201, 176, 0.3) 20%,
      rgba(78, 201, 176, 0.8) 50%,
      rgba(78, 201, 176, 0.3) 80%,
      transparent 100%
    );
    z-index: 10;
  }

  body::after {
    content: '';
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(86, 156, 214, 0.3) 15%,
      rgba(86, 156, 214, 0.6) 50%,
      rgba(86, 156, 214, 0.3) 85%,
      transparent 100%
    );
    z-index: 10;
  }

  /* 一级标题容器 - 用于包裹副标题和主标题 */
  .h1-container {
    margin: 0;
    padding: 92px 33px 92px 33px;  /* 上下边距：92px（原110px），左右：33px（原40px）*/

    /* 增强的背景设计 */
    position: relative;

    /* 使用图片作为背景（如果配置了的话）*/
    ${h1BackgroundImagePath ? `
    background-image:
      /* 增强的渐变遮罩（加深处理） */
      linear-gradient(135deg,
        rgba(0, 0, 0, 0.85) 0%,
        rgba(0, 0, 0, 0.75) 50%,
        rgba(0, 0, 0, 0.8) 100%
      ),
      /* 装饰性纹理层 */
      radial-gradient(circle at 20% 50%, rgba(78, 201, 176, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(86, 156, 214, 0.1) 0%, transparent 50%),
      /* 主背景图 */
      url('${h1BackgroundImagePath}');
    background-size: cover, cover, cover, cover;
    background-position: center, center, center, center;
    background-repeat: no-repeat, no-repeat, no-repeat, no-repeat;

    /* 添加微妙的内边框 */
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.3);
    ` : `
    /* 增强的渐变背景（无背景图时使用）*/
    background:
      /* 装饰性光效 */
      radial-gradient(circle at 15% 30%, rgba(78, 201, 176, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 85% 70%, rgba(86, 156, 214, 0.12) 0%, transparent 45%),
      /* 主渐变 */
      linear-gradient(135deg,
        #1a3a52 0%,
        #2d5a6f 30%,
        #1e4d5c 60%,
        #1a3a52 100%
      ),
      /* 底色 */
      #1a3a52;

    /* 添加微妙的纹理 */
    background-image:
      radial-gradient(circle at 15% 30%, rgba(78, 201, 176, 0.15) 0%, transparent 40%),
      radial-gradient(circle at 85% 70%, rgba(86, 156, 214, 0.12) 0%, transparent 45%),
      linear-gradient(135deg, #1a3a52 0%, #2d5a6f 30%, #1e4d5c 60%, #1a3a52 100%),
      #1a3a52;
    background-size: 200% 200%, 180% 180%, 100% 100%, 100% 100%;

    /* 添加微妙的内边框和阴影 */
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3);
    `}

    /* 标题区域底部分割线 */
    border-bottom: 2px solid transparent;
    border-image: linear-gradient(90deg,
      transparent 0%,
      rgba(78, 201, 176, 0.5) 20%,
      rgba(78, 201, 176, 0.8) 50%,
      rgba(78, 201, 176, 0.5) 80%,
      transparent 100%
    ) 1;
  }

  /* 赛季副标题 - 一级标题上方的小字 */
  .season-subtitle {
    font-size: 32px;     /* 与正文相同大小 */
    font-weight: 400;    /* 正常粗细 */
    color: rgba(255, 255, 255, 0.7);  /* 半透明白色 */
    margin: 0 0 13px 0;  /* 下方留13px间距 */
    letter-spacing: 2px; /* 字间距 */
    text-align: left;    /* 左对齐 */
  }

  /* 一级标题 - 封面级别设计（带背景图） */
  h1 {
    font-size: 108px;    /* 大标题字体 */
    font-weight: 900;    /* 特粗体 */
    margin: 0;
    padding: 0;          /* 移除内边距，由容器控制 */
    color: #ffffff;      /* 纯白色，更醒目 */
    text-align: left;    /* 左对齐 */
    letter-spacing: 5px; /* 字间距 */
    line-height: 1.3;    /* 行间距 */
    background: none;    /* 移除背景，由容器控制 */
  }

  /* 二级标题 - 内容区域 */
  h2 {
    font-size: 37px;     /* 超大二级标题（原44px → 37px）*/
    font-weight: bold;
    margin: 23px 0 13px 0;  /* 原28px 0 16px 0 → 23px 0 13px 0 */
    padding: 0 33px;     /* 左右内边距（原40px → 33px）*/
    color: #4ec9b0;

    /* 添加微妙的背景装饰 */
    position: relative;
    background: linear-gradient(90deg,
      rgba(78, 201, 176, 0.05) 0%,
      rgba(78, 201, 176, 0.02) 50%,
      rgba(78, 201, 176, 0.05) 100%
    );

    /* 左侧装饰条 */
    border-left: 4px solid #4ec9b0;
    padding-left: 29px;  /* 调整内边距，保持文字位置 */

    /* 微妙的顶部和底部边框 */
    border-top: 1px solid rgba(78, 201, 176, 0.1);
    border-bottom: 1px solid rgba(78, 201, 176, 0.1);
    padding-top: 8px;
    padding-bottom: 8px;
  }

  /* 三级标题 */
  h3 {
    font-size: 30px;     /* 大三级标题（原36px → 30px）*/
    font-weight: bold;
    margin: 20px 0 12px 0;  /* 原24px 0 14px 0 → 20px 0 12px 0 */
    padding: 0 33px;     /* 原40px → 33px */
    color: #4ec9b0;

    /* 微妙的背景装饰 */
    background: linear-gradient(90deg,
      rgba(86, 156, 214, 0.03) 0%,
      transparent 50%,
      rgba(86, 156, 214, 0.03) 100%
    );

    /* 左侧装饰条（更细一些） */
    border-left: 3px solid #569cd6;
    padding-left: 30px;  /* 调整内边距 */
    padding-top: 4px;
    padding-bottom: 4px;
  }

  /* 段落 - 添加左右内边距 */
  p {
    margin: 13px 0;      /* 原16px 0 → 13px 0 */
    padding: 0 33px;     /* 原40px → 33px */
    color: #d4d4d4;
  }

  /* 列表 - 添加左右内边距 */
  ul, ol {
    margin: 13px 0;      /* 原16px 0 → 13px 0 */
    padding-left: 63px;  /* 左侧缩进 + 内容区域内边距（原75px → 63px）*/
    padding-right: 33px; /* 原40px → 33px */
    color: #d4d4d4;
  }

  li {
    margin: 12px 0;      /* 更大列表项间距（原14px → 12px）*/
    line-height: 2.1;
  }

  code {
    background: linear-gradient(135deg,
      rgba(45, 45, 48, 0.9) 0%,
      rgba(35, 35, 38, 0.9) 100%
    );
    color: #ce9178;  /* VSCode 字符串颜色 */
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;

    /* 微妙的内阴影 */
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);

    /* 细微的边框 */
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  pre {
    background: linear-gradient(135deg,
      rgba(45, 45, 48, 0.95) 0%,
      rgba(35, 35, 38, 0.95) 100%
    );
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid rgba(78, 201, 176, 0.2);

    /* 简化背景：仅保留渐变 */
    background-image:
      linear-gradient(135deg, rgba(45, 45, 48, 0.95) 0%, rgba(35, 35, 38, 0.95) 100%);

    /* 内阴影和外发光 */
    box-shadow:
      inset 0 1px 3px rgba(0, 0, 0, 0.3),
      0 0 8px rgba(78, 201, 176, 0.1);
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
    max-width: calc(100% - 66px);  /* 减去左右内边距（原80px → 66px）*/
    height: auto;
    display: block;
    margin: 21px 33px;    /* 上下间距 + 左右内边距（原25px 40px → 21px 33px）*/
    border-radius: 8px;
  }

  /* Emoji 支持 */
  .emoji {
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
  }

  /* 表格样式 */
  table {
    width: calc(100% - 66px);  /* 减去左右内边距（原80px → 66px）*/
    margin: 21px 33px;     /* 原25px 40px → 21px 33px */
    border-collapse: collapse;

    /* 表格背景：多层渐变 */
    background: linear-gradient(135deg,
      rgba(45, 45, 48, 0.9) 0%,
      rgba(35, 35, 38, 0.9) 100%
    );

    /* 表格边框和阴影 */
    border: 1px solid rgba(78, 201, 176, 0.3);
    border-radius: 12px;
    overflow: hidden;
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.2),
      0 0 16px rgba(78, 201, 176, 0.1);
  }

  thead {
    /* 表头渐变背景 */
    background: linear-gradient(135deg,
      rgba(30, 30, 30, 0.95) 0%,
      rgba(26, 26, 26, 0.95) 100%
    );

    /* 表头装饰 */
    border-bottom: 2px solid #4ec9b0;
    position: relative;
  }

  th {
    padding: 13px 17px;    /* 原16px 20px → 13px 17px */
    text-align: left;
    font-weight: bold;
    color: #4ec9b0;
    border-bottom: 2px solid #007acc;
    font-size: 25px;       /* 原30px → 25px */
  }

  td {
    padding: 12px 17px;    /* 原14px 20px → 12px 17px */
    color: #d4d4d4;
    border-bottom: 1px solid #3c3c3c;
    font-size: 23px;       /* 原28px → 23px */
  }

  tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  /* 表格内的代码 */
  table code {
    font-size: 22px;       /* 原26px → 22px */
  }

  /* 封面图片 - 在h1-container内的封面图 */
  .cover-image {
    max-width: 100%;       /* 占满容器宽度 */
    height: auto;
    display: block;
    margin: 33px 0 0 0;    /* 与标题保持间距 */
    border-radius: 12px;   /* 圆角 */
    padding: 0;            /* 去除内边距 */
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

    // 提取副标题和封面图片（从HTML注释中）
    const subtitleMatch = mdContent.match(/<!--\s*subtitle:\s*(.+?)\s*-->/);
    const coverMatch = mdContent.match(/<!--\s*cover:\s*(.+?)\s*-->/);

    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : null;
    const coverImagePath = coverMatch ? coverMatch[1].trim() : null;

    console.log(`提取的副标题: ${subtitle || '无'}`);
    console.log(`提取的封面图: ${coverImagePath || '无'}`);

    // 从markdown内容中移除这些注释，避免重复渲染
    mdContent = mdContent.replace(/<!--\s*subtitle:\s*.+?\s*-->\s*/g, '');
    mdContent = mdContent.replace(/<!--\s*cover:\s*.+?\s*-->\s*/g, '');

    // 获取Markdown文件所在目录（用于解析相对路径的图片）
    const mdDir = path.dirname(path.resolve(mdFilePath));

    // 将Markdown转换为HTML
    let htmlContent = marked(mdContent);

    // 动态生成h1-container的内容
    let h1ContainerContent = '';

    // 添加副标题（如果存在）
    if (subtitle) {
      h1ContainerContent += `<div class="season-subtitle">${subtitle}</div>`;
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
