/**
 * TFT Academy 阵容抓取脚本
 * 目标: https://tftacademy.com/tierlist/comps
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CONFIG from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 延迟函数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 抓取阵容列表页面
 */
async function fetchTierlist() {
  console.log('\n========================================');
  console.log('🚀 开始抓取 TFT Academy 阵容列表');
  console.log('========================================\n');
  console.log(`目标网址: ${CONFIG.tierlistUrl}`);

  try {
    const response = await axios.get(CONFIG.tierlistUrl, {
      headers: {
        'User-Agent': CONFIG.userAgent,
      },
      timeout: CONFIG.timeout,
    });

    console.log('✅ 页面抓取成功\n');
    return response.data;
  } catch (error) {
    console.error('❌ 页面抓取失败:', error.message);
    throw error;
  }
}

/**
 * 解析阵容列表
 */
function parseCompsList(html) {
  console.log('📊 开始解析阵容数据...\n');

  const $ = cheerio.load(html);
  const comps = [];

  // 查找所有包含 /tierlist/comps/ 的链接
  $('a[href*="/tierlist/comps/"]').each((index, element) => {
    const $link = $(element);
    const href = $link.attr('href');

    if (href && href.includes('/tierlist/comps/')) {
      // 提取阵容名称（URL路径）
      const match = href.match(/\/tierlist\/comps\/(.+?)(?:\/|$)/);
      if (match && match[1]) {
        const compName = match[1];

        // 避免重复
        if (!comps.find(c => c.name === compName)) {
          const comp = {
            id: comps.length + 1,
            name: compName,
            url: href.startsWith('http') ? href : CONFIG.baseUrl + href,
          };
          comps.push(comp);
        }
      }
    }
  });

  console.log(`✅ 解析完成，共找到 ${comps.length} 个阵容\n`);
  return comps;
}

/**
 * 抓取单个阵容详情 - 提取tips内容
 */
async function fetchCompDetail(compUrl, compName) {
  console.log(`  [${compName}] 抓取中...`);

  try {
    await delay(CONFIG.delay);

    const response = await axios.get(compUrl, {
      headers: {
        'User-Agent': CONFIG.userAgent,
      },
      timeout: CONFIG.timeout,
    });

    const $ = cheerio.load(response.data);

    // 查找标题是 "tips" 的内容
    let tipsContent = '';

    // 方法1: 查找包含 "tips" 文本的标题元素
    $('h1, h2, h3, h4, h5, h6, .title, .heading').each((i, elem) => {
      const $heading = $(elem);
      const headingText = $heading.text().toLowerCase().trim();

      if (headingText === 'tips' || headingText.includes('tips')) {
        // 获取该标题后的内容
        let $next = $heading.next();
        let content = [];

        // 收集标题后的内容，直到遇到下一个标题
        while ($next.length > 0 && !$next.is('h1, h2, h3, h4, h5, h6, .title, .heading')) {
          const text = $next.text().trim();
          if (text) {
            content.push(text);
          }
          $next = $next.next();
        }

        if (content.length > 0) {
          tipsContent = content.join('\n');
        }
      }
    });

    // 方法2: 如果方法1没找到，尝试查找 data-tips 或 class包含tips的元素
    if (!tipsContent) {
      const $tipsElement = $('[data-section="tips"], .tips-section, .tips-content, #tips');
      if ($tipsElement.length > 0) {
        tipsContent = $tipsElement.text().trim();
      }
    }

    const detail = {
      name: compName,
      url: compUrl,
      tips: tipsContent || '未找到tips内容',
    };

    console.log(`  ✓ 完成 - Tips长度: ${tipsContent.length} 字符`);
    return detail;
  } catch (error) {
    console.error(`  ✗ 失败: ${error.message}`);
    return {
      name: compName,
      url: compUrl,
      tips: null,
      error: error.message,
    };
  }
}

/**
 * 保存数据到文件
 */
function saveData(data, filename) {
  const outputPath = path.join(__dirname, filename);
  const dir = path.dirname(outputPath);

  // 确保目录存在
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 数据已保存到: ${outputPath}\n`);
}

/**
 * 主函数
 */
async function main() {
  try {
    // 1. 抓取列表页
    const html = await fetchTierlist();

    // 2. 解析阵容列表
    const comps = parseCompsList(html);

    // 3. 保存阵容列表
    saveData(comps, CONFIG.rawDataFile);

    // 4. 抓取每个阵容的tips内容
    console.log('========================================');
    console.log('📖 开始抓取阵容Tips内容');
    console.log('========================================\n');
    console.log(`共需抓取 ${comps.length} 个阵容的详情页...\n`);

    const results = [];

    for (let i = 0; i < comps.length; i++) {
      const comp = comps[i];
      console.log(`[${i + 1}/${comps.length}]`);

      if (comp.url) {
        const detail = await fetchCompDetail(comp.url, comp.name);
        results.push(detail);
      }
    }

    // 5. 保存完整数据
    saveData(results, CONFIG.processedDataFile);

    console.log('\n========================================');
    console.log('🎉 抓取完成！');
    console.log('========================================\n');
    console.log(`共抓取 ${comps.length} 个阵容`);
    console.log(`成功获取tips: ${results.filter(r => r.tips && r.tips !== '未找到tips内容').length} 个`);
    console.log(`\n数据保存位置:`);
    console.log(`  - 阵容列表: ${CONFIG.rawDataFile}`);
    console.log(`  - 完整数据: ${CONFIG.processedDataFile}\n`);

    return comps;
  } catch (error) {
    console.error('\n❌ 抓取过程出错:', error);
    throw error;
  }
}

// 执行
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}

export { fetchTierlist, parseCompsList, fetchCompDetail, main };
