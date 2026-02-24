/**
 * Notion 页面抓取脚本
 * 专门用于抓取 Notion 公开页面的 TFT 攻略内容
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  headless: true,
  timeout: 90000,
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 抓取 Notion 页面内容
 */
async function fetchNotionPage(url) {
  console.log('\n========================================');
  console.log('🎯 抓取 Notion 页面');
  console.log('========================================\n');
  console.log(`URL: ${url}\n`);

  let browser;

  try {
    // 1. 启动浏览器
    console.log('🚀 启动浏览器...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ 浏览器启动成功\n');

    // 2. 访问页面
    console.log('📡 正在访问页面...');
    await page.goto(url, { waitUntil: 'networkidle0', timeout: CONFIG.timeout });
    console.log('✅ 页面加载成功\n');

    // 等待 Notion 内容渲染
    console.log('⏳ 等待 Notion 内容渲染...');
    await delay(5000);

    // 3. 提取页面内容
    console.log('📖 提取页面内容...');

    const content = await page.evaluate(() => {
      const result = {
        title: '',
        sections: []
      };

      // 获取标题
      const titleElement = document.querySelector('h1');
      if (titleElement) {
        result.title = titleElement.textContent.trim();
      }

      // 获取所有文本内容块
      const contentBlocks = document.querySelectorAll('.notion-page-content [data-block-id]');

      let currentSection = null;

      contentBlocks.forEach(block => {
        const text = block.textContent.trim();
        if (!text) return;

        // 检测是否是标题
        const isHeader = block.querySelector('h1, h2, h3');

        if (isHeader) {
          // 新的章节
          if (currentSection && currentSection.content.length > 0) {
            result.sections.push(currentSection);
          }
          currentSection = {
            title: text,
            content: []
          };
        } else if (currentSection) {
          // 添加到当前章节
          currentSection.content.push(text);
        } else {
          // 如果还没有章节，创建一个默认章节
          currentSection = {
            title: '',
            content: [text]
          };
        }
      });

      // 添加最后一个章节
      if (currentSection && (currentSection.title || currentSection.content.length > 0)) {
        result.sections.push(currentSection);
      }

      return result;
    });

    console.log(`  ✓ 标题: ${content.title}`);
    console.log(`  ✓ 章节数: ${content.sections.length}\n`);

    // 4. 保存为 TFT.txt 格式
    const outputPath = path.join(__dirname, '..', 'TFT.txt');
    const lines = [];

    // 添加标题
    if (content.title) {
      lines.push(`标题: ${content.title}`);
      lines.push('');
    }

    // 添加各个章节
    content.sections.forEach(section => {
      if (section.title) {
        lines.push(`${section.title}:`);
      }
      section.content.forEach(text => {
        lines.push(text);
      });
      lines.push('');
    });

    const fileContent = lines.join('\n');
    fs.writeFileSync(outputPath, fileContent, 'utf-8');

    console.log('========================================');
    console.log('📊 抓取结果');
    console.log('========================================\n');
    console.log(`标题: ${content.title}`);
    console.log(`章节数: ${content.sections.length}`);
    console.log(`总字符数: ${fileContent.length}\n`);
    console.log(`💾 内容已保存到: ${outputPath}\n`);
    console.log('✅ 抓取完成！\n');

    return content;

  } catch (error) {
    console.error('\n❌ 抓取失败:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 命令行执行
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const url = process.argv[2];

  if (!url) {
    console.error('\n❌ 错误: 缺少URL参数\n');
    console.log('使用方法:');
    console.log('  node scraper/fetchNotionPage.js <URL>\n');
    console.log('示例:');
    console.log('  node scraper/fetchNotionPage.js https://notion.site/xxx\n');
    process.exit(1);
  }

  fetchNotionPage(url)
    .catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

export { fetchNotionPage };
