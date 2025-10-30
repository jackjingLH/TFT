import { convertMdToImage } from './mdToImage.js';
import { smartSplitImage } from './splitImageSmart.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 统一工作流配置
 */
const WORKFLOW_CONFIG = {
  // 输出目录（长图和分割图在同一文件夹）
  outputRoot: path.join(__dirname, '../output'),

  // 是否保留完整长图
  keepFullImage: true,

  // 是否自动分割
  autoSplit: true,
};

/**
 * 清空输出目录
 * @param {string} outputDir - 输出目录路径
 */
function clearOutputDirectory(outputDir) {
  try {
    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);

      // 删除所有文件（包括图片和元数据）
      files.forEach(file => {
        const filePath = path.join(outputDir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile()) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  已删除: ${file}`);
        } else if (stat.isDirectory()) {
          // 递归删除子目录
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`🗑️  已删除目录: ${file}`);
        }
      });

      console.log(`✅ 输出目录已清空: ${outputDir}\n`);
    }
  } catch (error) {
    console.warn(`⚠️  清空输出目录时出现警告: ${error.message}`);
  }
}

/**
 * 完整工作流：MD → 长图 → 分割
 * @param {string} mdFilePath - Markdown文件路径
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 生成结果信息
 */
async function runWorkflow(mdFilePath, options = {}) {
  console.log('\n========================================');
  console.log('🚀 开始执行完整工作流');
  console.log('========================================\n');

  // 1. 解析输入文件信息
  const mdAbsPath = path.resolve(mdFilePath);
  const mdFileName = path.basename(mdAbsPath, '.md');
  const mdDir = path.dirname(mdAbsPath);

  console.log(`📄 输入文件: ${mdFileName}.md`);
  console.log(`📁 文件目录: ${mdDir}\n`);

  // 2. 创建输出目录（长图和分割图在同一文件夹）
  const outputDir = WORKFLOW_CONFIG.outputRoot;

  // 确保目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  // 3. 清空输出目录（删除上一次的图片文件）
  console.log('🧹 清理上一次的输出文件...');
  clearOutputDirectory(outputDir);

  console.log('📁 输出目录: output/（长图和分割图在同一文件夹）\n');

  const result = {
    mdFile: mdAbsPath,
    outputDir: outputDir,
    fullImage: null,
    splitImages: [],
    timestamp: new Date().toISOString(),
  };

  try {
    // 4. 步骤1: 生成完整长图
    console.log('----------------------------------------');
    console.log('📸 步骤 1/2: 生成完整长图');
    console.log('----------------------------------------\n');

    const fullImagePath = path.join(outputDir, 'TFT_full.png');

    try {
      await convertMdToImage(mdAbsPath, fullImagePath);
      result.fullImage = fullImagePath;
      console.log(`\n✅ 长图生成成功: ${path.basename(fullImagePath)}`);
      console.log(`   位置: ${fullImagePath}\n`);
    } catch (error) {
      console.error(`❌ 长图生成失败:`, error.message);
      throw error;
    }

    // 5. 步骤2: 智能分割图片
    if (WORKFLOW_CONFIG.autoSplit) {
      console.log('----------------------------------------');
      console.log('✂️  步骤 2/2: 智能分割图片');
      console.log('----------------------------------------\n');

      try {
        const splitResult = await smartSplitImage(fullImagePath, outputDir, 'TFT');
        result.splitImages = splitResult.images;

        console.log(`\n✅ 图片分割完成: ${splitResult.images.length} 片`);
        splitResult.images.forEach((img, index) => {
          console.log(`   ${index + 1}. ${path.basename(img.path)} (${img.width}x${img.height})`);
        });
      } catch (error) {
        console.error(`❌ 图片分割失败:`, error.message);
        console.error('错误堆栈:', error.stack);
        throw error;
      }
    }

    // 6. 保存元数据
    const metadataPath = path.join(outputDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2), 'utf-8');

    // 7. 完成总结
    console.log('\n========================================');
    console.log('🎉 工作流执行完成！');
    console.log('========================================\n');
    console.log('📊 生成统计:');
    console.log(`   • 完整长图: 1 张`);
    console.log(`   • 分割图片: ${result.splitImages.length} 张`);
    console.log(`   • 输出目录: ${outputDir}\n`);

    return result;

  } catch (error) {
    console.error('\n❌ 工作流执行失败:', error.message);
    throw error;
  }
}

/**
 * 批量处理多个MD文件
 * @param {string[]} mdFiles - MD文件路径数组
 */
async function runBatchWorkflow(mdFiles) {
  console.log('\n========================================');
  console.log('🔄 批量处理模式');
  console.log(`共 ${mdFiles.length} 个文件`);
  console.log('========================================\n');

  // 清空输出目录（删除上一次的图片文件）
  console.log('🧹 清理上一次的输出文件...');
  const outputDir = WORKFLOW_CONFIG.outputRoot;
  fs.mkdirSync(outputDir, { recursive: true });
  clearOutputDirectory(outputDir);

  const results = [];

  for (let i = 0; i < mdFiles.length; i++) {
    console.log(`\n[${i + 1}/${mdFiles.length}] 处理中...`);
    try {
      const result = await runWorkflow(mdFiles[i]);
      results.push({ success: true, file: mdFiles[i], result });
    } catch (error) {
      results.push({ success: false, file: mdFiles[i], error: error.message });
      console.error(`❌ 处理失败: ${mdFiles[i]}`);
    }
  }

  // 批量处理总结
  console.log('\n========================================');
  console.log('📊 批量处理完成');
  console.log('========================================\n');

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`❌ 失败: ${failCount} 个\n`);

  if (failCount > 0) {
    console.log('失败文件:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${path.basename(r.file)}: ${r.error}`);
    });
  }

  return results;
}

// 命令行入口
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node workflow.js <MD文件路径>           # 处理单个文件
  node workflow.js <文件1> <文件2> ...    # 批量处理

示例:
  node workflow.js "../translated_guides/玛尔扎哈水晶玫瑰连败转型攻略.md"
  node workflow.js "../translated_guides/**/*.md"
    `);
    process.exit(1);
  }

  // 批量或单个处理
  if (args.length === 1) {
    runWorkflow(args[0]).catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
  } else {
    runBatchWorkflow(args).catch(error => {
      console.error('批量执行失败:', error);
      process.exit(1);
    });
  }
}

export { runWorkflow, runBatchWorkflow };
