/**
 * TFT Academy 攻略抓取脚本（简化版 - 仅文本）
 * 抓取Tips、Snax、Stages和所有章节标题
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  headless: true,
  timeout: 60000,
  outputDir: './data',
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 抓取完整攻略内容
 */
async function fetchGuide(url) {
  console.log('\n========================================');
  console.log('🎯 抓取TFT Academy攻略');
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

    await delay(2000);

    // 3. 提取阵容名称
    const compName = url.split('/').pop();
    console.log(`📌 阵容名称: ${compName}\n`);

    const guide = {
      url: url,
      compName: compName,
      timestamp: new Date().toISOString(),
      tabs: {},
      stages: {},
      availableSections: [],
    };

    // 4. 查找Tips Tab
    const hasTips = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.trim().toLowerCase() === 'tips');
    });

    console.log(`🔍 Tips Tab: ${hasTips ? '✓ 找到' : '✗ 未找到'}`);

    // 5. 抓取Tips内容
    if (hasTips) {
      console.log('📖 抓取Tips内容...');

      const tipsContent = await page.evaluate(() => {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          return metaDesc.getAttribute('content');
        }
        return '';
      });

      guide.tabs.tips = tipsContent;
      console.log(`  ✓ Tips长度: ${tipsContent.length} 字符\n`);
    }

    // 6. 查找Snax Tab
    const hasSnax = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.trim().toLowerCase() === 'snax');
    });

    console.log(`🍎 Snax Tab: ${hasSnax ? '✓ 找到' : '✗ 未找到'}`);

    // 7. 抓取Snax内容
    if (hasSnax) {
      console.log('🍎 抓取Snax内容...');

      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const snaxBtn = buttons.find(btn => btn.textContent.trim().toLowerCase() === 'snax');
        if (snaxBtn) snaxBtn.click();
      });

      await delay(1500);

      const snaxContent = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        for (let elem of allElements) {
          const text = elem.textContent.trim().toLowerCase();
          if (text === 'snax' || text === 'snax:') {
            let next = elem.nextElementSibling;
            let content = [];

            while (next && content.length < 20) {
              const nextText = next.textContent.trim();
              if (next.tagName.match(/^H[1-3]$/)) break;
              if (nextText && nextText.length > 5 && !nextText.includes('Tips')) {
                content.push(nextText);
              }
              next = next.nextElementSibling;
            }

            if (content.length > 0) {
              return content.join('\n\n');
            }
          }
        }
        return '';
      });

      guide.tabs.snax = snaxContent;
      console.log(`  ✓ Snax长度: ${snaxContent.length} 字符\n`);
    }

    // 8. 抓取Stage信息
    console.log('📊 抓取Stage信息...');

    const stages = await page.evaluate(() => {
      const stagesData = {};
      const allElements = Array.from(document.querySelectorAll('*'));

      allElements.forEach(elem => {
        const text = elem.textContent.trim();
        const match = text.match(/^Stage\s*(\d+)(?::(.*))?/i);

        if (match) {
          const stageNum = match[1];
          let next = elem.nextElementSibling;
          let content = [];

          while (next && content.length < 10) {
            const nextText = next.textContent.trim();
            if (next.tagName.match(/^H[1-3]$/) || nextText.match(/^Stage\s*\d+/i)) {
              break;
            }
            if (nextText && nextText.length > 10) {
              content.push(nextText);
            }
            next = next.nextElementSibling;
          }

          if (content.length > 0 || match[2]) {
            stagesData[`stage${stageNum}`] = match[2] ? match[2].trim() : content.join('\n\n');
          }
        }
      });

      return stagesData;
    });

    guide.stages = stages;
    console.log(`  ✓ 找到 ${Object.keys(stages).length} 个Stage\n`);

    // 9. 固定章节标题
    console.log('📑 添加固定章节标题...');

    // 固定的章节标题列表
    const sectionTitles = [
      'Alt Builds',
      'Augments',
      'Augment Priority',
      'Early Comp',
      'Item Priority',
      'Max Cap'
    ];

    guide.availableSections = sectionTitles;
    console.log(`  ✓ 添加 ${sectionTitles.length} 个固定章节标题\n`);

    // 10. 保存JSON数据
    const jsonPath = path.join(__dirname, CONFIG.outputDir, `${compName}_guide.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(guide, null, 2), 'utf-8');
    console.log(`💾 数据已保存: ${jsonPath}\n`);

    // 11. 显示结果
    console.log('========================================');
    console.log('📊 抓取结果');
    console.log('========================================\n');

    console.log(`阵容: ${guide.compName}`);
    console.log(`Tips: ${guide.tabs.tips ? guide.tabs.tips.length + ' 字符' : '无'}`);
    console.log(`Snax: ${guide.tabs.snax ? guide.tabs.snax.length + ' 字符' : '无'}`);
    console.log(`Stages: ${Object.keys(guide.stages).length} 个`);
    console.log(`章节标题: ${guide.availableSections.length} 个\n`);

    console.log('✅ 抓取完成！\n');

    return guide;

  } catch (error) {
    console.error('\n❌ 抓取失败:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 保存为TFT.txt格式
 */
function saveAsTFT(guide) {
  const lines = [];

  // Tips
  if (guide.tabs && guide.tabs.tips) {
    lines.push('tips: ' + guide.tabs.tips);
  }

  // Snax
  if (guide.tabs && guide.tabs.snax) {
    lines.push('Snax: ' + guide.tabs.snax);
  }

  // Stages
  if (guide.stages) {
    Object.entries(guide.stages).forEach(([stageName, content]) => {
      const stageTitle = stageName.replace('stage', 'Stage ');
      lines.push(`${stageTitle}:${content}`);
    });
  }

  // 所有章节标题（空内容）
  if (guide.availableSections && guide.availableSections.length > 0) {
    lines.push('');
    guide.availableSections.forEach(section => {
      lines.push(`${section}:`);
    });
  }

  const content = lines.join('\n');
  const outputPath = path.join(__dirname, '..', 'TFT.txt');

  fs.writeFileSync(outputPath, content, 'utf-8');

  console.log('💾 TFT格式文件已保存:');
  console.log(`   ${outputPath}\n`);

  return outputPath;
}

// 命令行执行
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const url = process.argv[2] || 'https://tftacademy.com/tierlist/comps/set-15-nine-thousand-volts-kennen';

  fetchGuide(url)
    .then(guide => {
      saveAsTFT(guide);
    })
    .catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

export { fetchGuide, saveAsTFT };
