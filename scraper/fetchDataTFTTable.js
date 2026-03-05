/**
 * DataTFT 表格抓取脚本
 * 用于抓取 DataTFT 网站的奖励表格数据
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
 * 抓取 DataTFT 表格数据
 */
async function fetchDataTFTTable(url) {
  console.log('\n========================================');
  console.log('🎯 抓取 DataTFT 表格');
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

    // 等待内容渲染
    console.log('⏳ 等待表格渲染...');
    await delay(5000);

    // 3. 提取表格数据
    console.log('📖 提取表格数据...');

    const tables = await page.evaluate(() => {
      const result = {
        title: document.title,
        tables: []
      };

      // 查找所有表格
      const tableElements = document.querySelectorAll('table');

      tableElements.forEach((table, index) => {
        const tableData = {
          index: index,
          headers: [],
          rows: []
        };

        // 提取表头
        const headerRows = table.querySelectorAll('thead tr, tr:first-child');
        if (headerRows.length > 0) {
          const headerCells = headerRows[0].querySelectorAll('th, td');
          headerCells.forEach(cell => {
            tableData.headers.push(cell.textContent.trim());
          });
        }

        // 提取数据行
        const bodyRows = table.querySelectorAll('tbody tr, tr');
        bodyRows.forEach((row, rowIndex) => {
          // 跳过表头行
          if (rowIndex === 0 && tableData.headers.length > 0) return;

          const cells = row.querySelectorAll('td, th');
          if (cells.length > 0) {
            const rowData = [];
            cells.forEach(cell => {
              rowData.push(cell.textContent.trim());
            });
            tableData.rows.push(rowData);
          }
        });

        if (tableData.headers.length > 0 || tableData.rows.length > 0) {
          result.tables.push(tableData);
        }
      });

      return result;
    });

    console.log(`  ✓ 找到 ${tables.tables.length} 个表格\n`);

    // 4. 生成 Markdown 格式
    const markdownLines = [];

    markdownLines.push(`## 📊 奖励概率表\n`);

    tables.tables.forEach((table, index) => {
      if (table.headers.length === 0 && table.rows.length === 0) return;

      // 表头
      if (table.headers.length > 0) {
        markdownLines.push('| ' + table.headers.join(' | ') + ' |');
        markdownLines.push('| ' + table.headers.map(() => '---').join(' | ') + ' |');
      }

      // 数据行
      table.rows.forEach(row => {
        if (row.length > 0) {
          markdownLines.push('| ' + row.join(' | ') + ' |');
        }
      });

      markdownLines.push(''); // 空行分隔
    });

    const markdown = markdownLines.join('\n');

    // 5. 保存到文件
    const outputPath = path.join(__dirname, '..', 'TFT_table_temp.md');
    fs.writeFileSync(outputPath, markdown, 'utf-8');

    console.log('========================================');
    console.log('📊 抓取结果');
    console.log('========================================\n');
    console.log(`标题: ${tables.title}`);
    console.log(`表格数: ${tables.tables.length}`);
    console.log(`总行数: ${tables.tables.reduce((sum, t) => sum + t.rows.length, 0)}\n`);
    console.log(`💾 Markdown已保存到: ${outputPath}\n`);
    console.log('✅ 抓取完成！\n');

    return { tables, markdown };

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
    console.log('  node scraper/fetchDataTFTTable.js <URL>\n');
    console.log('示例:');
    console.log('  node scraper/fetchDataTFTTable.js https://www.datatft.com/rate#17\n');
    process.exit(1);
  }

  fetchDataTFTTable(url)
    .catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

export { fetchDataTFTTable };
