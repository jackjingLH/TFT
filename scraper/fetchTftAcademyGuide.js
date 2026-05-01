/**
 * TFT Academy 攻略抓取脚本
 * 适配当前页面结构，直接请求 HTML 并解析正文文本。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { CONFIG as BASE_CONFIG } from './config.js';
import {
  extractGuideFromText,
  extractStructuredGuide,
  extractTextLinesFromHtml,
  guideToTftText,
} from './tftAcademyParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  timeout: 60000,
  outputDir: './data',
};

export async function fetchGuide(url) {
  console.log('\n========================================');
  console.log('🎯 抓取 TFT Academy 攻略');
  console.log('========================================\n');
  console.log(`URL: ${url}\n`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

  const response = await fetch(url, {
    headers: {
      'User-Agent': BASE_CONFIG.userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: BASE_CONFIG.baseUrl,
    },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();

  const lines = extractTextLinesFromHtml(html);
  const guide = extractStructuredGuide(html, url) || extractGuideFromText(lines, url);

  const outputDir = path.join(__dirname, CONFIG.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, `${guide.compSlug || 'guide'}_guide.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(guide, null, 2), 'utf-8');

  console.log(`📌 阵容名称: ${guide.compName}`);
  console.log(`🧭 解析来源: ${guide.source || 'text-fallback'}`);
  console.log(`📝 文本行数: ${lines.length}`);
  console.log(`💡 Tips: ${guide.tabs.tips ? '有' : '无'}`);
  console.log(`🍎 Snax: ${guide.tabs.snax ? '有' : '无'}`);
  console.log(`📊 Stages: ${Object.keys(guide.stages).length} 个`);
  console.log(`📑 Sections: ${guide.availableSections.length} 个`);
  console.log(`💾 JSON 已保存: ${jsonPath}\n`);

  return guide;
}

export function saveAsTFT(guide) {
  const content = guideToTftText(guide);
  const outputPath = path.join(__dirname, '..', 'TFT.txt');

  fs.writeFileSync(outputPath, content, 'utf-8');

  console.log('💾 TFT.txt 已保存:');
  console.log(`   ${outputPath}\n`);

  return outputPath;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const url = process.argv[2];

  if (!url) {
    console.error('\n❌ 错误: 缺少 URL 参数\n');
    console.log('使用方法:');
    console.log('  node scraper/fetchTftAcademyGuide.js <URL>\n');
    process.exit(1);
  }

  fetchGuide(url)
    .then((guide) => {
      saveAsTFT(guide);
    })
    .catch((error) => {
      console.error('\n❌ 抓取失败:', error.message);
      process.exit(1);
    });
}
