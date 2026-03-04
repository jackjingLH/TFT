/**
 * TFTimes 攻略抓取脚本
 * 用于抓取 tftimes.info 网站的攻略内容
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
 * 抓取 TFTimes 攻略
 */
async function fetchTFTimesGuide(url) {
  console.log('\n========================================');
  console.log('🎯 抓取 TFTimes 攻略');
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

    // 设置用户代理
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ 浏览器启动成功\n');

    // 2. 访问页面
    console.log('📡 正在访问页面...');

    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout
    });

    console.log(`📡 HTTP状态码: ${response.status()}`);

    if (response.status() === 404) {
      throw new Error('页面不存在 (404)');
    }

    console.log('✅ 页面加载成功\n');

    // 等待内容渲染
    console.log('⏳ 等待内容渲染...');
    await delay(5000);

    // 3. 提取页面内容
    console.log('📖 提取攻略内容...');

    const content = await page.evaluate(() => {
      const result = {
        title: '',
        sections: []
      };

      // 提取标题
      const titleElement = document.querySelector('h1');
      if (titleElement) {
        result.title = titleElement.textContent.trim();
      }

      // 提取所有文本内容
      // 尝试找到主要内容区域
      const mainContent = document.querySelector('article') ||
                          document.querySelector('main') ||
                          document.querySelector('.post-content') ||
                          document.querySelector('.content') ||
                          document.body;

      if (mainContent) {
        // 提取所有段落和标题
        const elements = mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote');

        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && text.length > 0) {
            const tagName = el.tagName.toLowerCase();

            if (tagName.startsWith('h')) {
              // 标题
              result.sections.push({
                type: 'heading',
                level: parseInt(tagName.charAt(1)),
                text: text
              });
            } else if (tagName === 'p') {
              // 段落
              result.sections.push({
                type: 'paragraph',
                text: text
              });
            } else if (tagName === 'ul' || tagName === 'ol') {
              // 列表
              const items = Array.from(el.querySelectorAll('li')).map(li => li.textContent.trim());
              result.sections.push({
                type: 'list',
                items: items
              });
            } else if (tagName === 'pre') {
              // 代码块
              result.sections.push({
                type: 'code',
                text: text
              });
            } else if (tagName === 'blockquote') {
              // 引用
              result.sections.push({
                type: 'quote',
                text: text
              });
            }
          }
        });
      }

      return result;
    });

    console.log(`  ✓ 标题: ${content.title}`);
    console.log(`  ✓ 找到 ${content.sections.length} 个内容块\n`);

    // 4. 生成纯文本格式
    const textLines = [];

    // 添加标题
    if (content.title) {
      textLines.push(content.title);
      textLines.push('');
    }

    // 添加各个部分
    content.sections.forEach(section => {
      if (section.type === 'heading') {
        textLines.push('');
        textLines.push('#'.repeat(section.level) + ' ' + section.text);
      } else if (section.type === 'paragraph') {
        textLines.push(section.text);
      } else if (section.type === 'list') {
        section.items.forEach(item => {
          textLines.push('- ' + item);
        });
      } else if (section.type === 'code') {
        textLines.push('```');
        textLines.push(section.text);
        textLines.push('```');
      } else if (section.type === 'quote') {
        textLines.push('> ' + section.text);
      }
      textLines.push('');
    });

    const fullText = textLines.join('\n');

    // 5. 保存到 TFT.txt
    const outputPath = path.join(__dirname, '..', 'TFT.txt');
    fs.writeFileSync(outputPath, fullText, 'utf-8');

    // 6. 保存JSON数据
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const postId = url.split('/').pop();
    const jsonPath = path.join(dataDir, `tftimes_${postId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(content, null, 2), 'utf-8');

    console.log('========================================');
    console.log('📊 抓取结果');
    console.log('========================================\n');
    console.log(`标题: ${content.title}`);
    console.log(`内容块数: ${content.sections.length}`);
    console.log(`总字符数: ${fullText.length}\\n`);
    console.log(`💾 JSON已保存到: ${jsonPath}`);
    console.log(`💾 TXT已保存到: ${outputPath}\\n`);
    console.log('✅ 抓取完成！\\n');

    return { content, fullText };

  } catch (error) {
    console.error('\\n❌ 抓取失败:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 命令行执行
if (import.meta.url === `file:///${process.argv[1].replace(/\\\\/g, '/')}`) {
  const url = process.argv[2];

  if (!url) {
    console.error('\\n❌ 错误: 缺少URL参数\\n');
    console.log('使用方法:');
    console.log('  node scraper/fetchTFTimesGuide.js <URL>\\n');
    console.log('示例:');
    console.log('  node scraper/fetchTFTimesGuide.js https://tftimes.info/posts/xxx\\n');
    process.exit(1);
  }

  fetchTFTimesGuide(url)
    .catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

export { fetchTFTimesGuide };
