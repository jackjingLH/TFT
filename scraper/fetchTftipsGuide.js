import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  headless: true,
  timeout: 60000,
  outputDir: './data',
};

/**
 * 抓取 TFTips 攻略
 * @param {string} url - 攻略URL
 */
async function fetchGuide(url) {
  console.log('\n========================================');
  console.log('🎯 抓取 TFTips 攻略');
  console.log('========================================\n');
  console.log(`URL: ${url}\n`);

  let browser;
  try {
    // 启动浏览器
    console.log('🚀 启动浏览器...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // 访问页面
    console.log('📡 正在访问页面...');
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: CONFIG.timeout,
    });
    console.log('✅ 页面加载成功\n');

    // 等待页面加载完成
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 从URL中提取阵容名称
    const compName = url.split('/comps/')[1] || 'unknown';
    console.log(`📌 阵容名称: ${compName}\n`);

    console.log('🔍 开始抓取攻略内容...\n');

    // 抓取所有模块的标题和内容
    const guideData = await page.evaluate(() => {
      const modules = [];

      // 查找所有的 section 元素
      const sections = document.querySelectorAll('section');

      console.log(`找到 ${sections.length} 个 section`);

      sections.forEach((section, index) => {
        // 查找 H2 标题
        const h2 = section.querySelector('h2');

        if (h2) {
          const title = h2.textContent.trim();

          // 获取 H2 之后的所有兄弟节点内容
          let content = '';
          let currentNode = h2.nextElementSibling;

          // 遍历 H2 之后的所有兄弟元素
          while (currentNode) {
            // 如果遇到下一个 H2，停止
            if (currentNode.tagName === 'H2') {
              break;
            }

            // 收集文本内容
            const nodeText = currentNode.textContent.trim();
            if (nodeText) {
              content += nodeText + '\n';
            }

            currentNode = currentNode.nextElementSibling;
          }

          // 如果没有找到兄弟节点内容，尝试在 section 内部查找内容
          if (!content) {
            // 获取 section 下除了 H2 以外的所有文本
            const sectionText = section.textContent.trim();
            const h2Text = h2.textContent.trim();
            content = sectionText.replace(h2Text, '').trim();
          }

          if (title) {
            modules.push({
              title: title,
              content: content.trim(),
            });
          }
        }
      });

      return modules;
    });

    console.log(`\n✅ 找到 ${guideData.length} 个模块:\n`);
    guideData.forEach((module, index) => {
      console.log(`  ${index + 1}. ${module.title}`);
      console.log(`     内容长度: ${module.content.length} 字符`);
      if (module.content.length > 0) {
        console.log(`     预览: ${module.content.substring(0, 100)}...`);
      }
      console.log('');
    });

    await browser.close();

    return {
      compName,
      modules: guideData,
    };

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * 保存为TFT.txt格式
 */
function saveAsTFT(guide) {
  const lines = [];

  // 遍历所有模块，将标题和内容添加到文件中
  guide.modules.forEach(module => {
    // 添加模块标题
    lines.push(`${module.title}:`);

    // 添加模块内容（如果有的话）
    if (module.content) {
      lines.push(module.content);
    }

    // 添加空行分隔
    lines.push('');
  });

  const content = lines.join('\n');
  const outputPath = path.join(__dirname, '..', 'TFT.txt');

  fs.writeFileSync(outputPath, content, 'utf-8');

  console.log('\n========================================');
  console.log('💾 TFT格式文件已保存');
  console.log('========================================\n');
  console.log(`📁 保存位置: ${outputPath}`);
  console.log(`📊 包含模块: ${guide.modules.length} 个\n`);

  guide.modules.forEach((module, index) => {
    console.log(`  ${index + 1}. ${module.title}`);
  });

  console.log('');

  return outputPath;
}

// 命令行执行
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const url = process.argv[2];

  if (!url) {
    console.error('\n❌ 错误: 缺少URL参数\n');
    console.log('使用方法:');
    console.log('  node scraper/fetchTftipsGuide.js <URL>\n');
    console.log('示例:');
    console.log('  node scraper/fetchTftipsGuide.js https://tftips.app/comps/prodigy-yuumi\n');
    process.exit(1);
  }

  console.log(`📍 URL: ${url}\n`);

  fetchGuide(url)
    .then(guide => {
      console.log('✅ 页面分析完成！');

      // 保存为TFT.txt格式
      const outputPath = saveAsTFT(guide);
      console.log(`\n✅ 内容已保存到: ${outputPath}`);
    })
    .catch(error => {
      console.error('❌ 执行失败:', error);
      process.exit(1);
    });
}

export { fetchGuide, saveAsTFT };
