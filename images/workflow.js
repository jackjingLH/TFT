import { convertMdToImage } from './mdToImage.js';
import { smartSplitImage } from './splitImageSmart.js';
import { backupComposition as uploadBackupComposition } from './backupUpload.js';
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
 * 完整工作流：MD → 长图 → 分割 → 备份
 * @param {string} mdFilePath - Markdown文件路径
 * @param {Object} options - 可选配置
 * @param {boolean} options.skipBackup - 是否跳过备份步骤
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

  // 2. 读取 MD 文件并提取备份文件夹名
  let backupName = null;
  try {
    const mdContent = fs.readFileSync(mdAbsPath, 'utf-8');
    const backupMatch = mdContent.match(/<!--\s*backup:\s*(.+?)\s*-->/);
    if (backupMatch) {
      backupName = backupMatch[1].trim();
      console.log(`💾 检测到备份配置: ${backupName}\n`);
    } else {
      console.warn(`⚠️  未找到备份配置，请在 MD 文件顶部添加: <!-- backup: 英文名称 -->\n`);
    }
  } catch (error) {
    console.warn(`⚠️  读取 MD 文件失败: ${error.message}\n`);
  }

  // 3. 创建输出目录（长图和分割图在同一文件夹）
  const outputDir = WORKFLOW_CONFIG.outputRoot;
  const shouldRunBackup = Boolean(backupName) && !options.skipBackup;

  // 确保目录存在
  fs.mkdirSync(outputDir, { recursive: true });

  // 4. 清空输出目录（删除上一次的图片文件）
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
    // 5. 步骤1: 生成完整长图
    console.log('----------------------------------------');
    console.log(`📸 步骤 1/${shouldRunBackup ? '3' : '2'}: 生成完整长图`);
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

    // 6. 步骤2: 智能分割图片
    if (WORKFLOW_CONFIG.autoSplit) {
      console.log('----------------------------------------');
      console.log(`✂️  步骤 2/${shouldRunBackup ? '3' : '2'}: 智能分割图片`);
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

    // 7. 保存元数据
    const metadataPath = path.join(outputDir, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(result, null, 2), 'utf-8');

    // 8. 完成总结
    console.log('\n========================================');
    console.log('🎉 工作流执行完成！');
    console.log('========================================\n');
    console.log('📊 生成统计:');
    console.log(`   • 完整长图: 1 张`);
    console.log(`   • 分割图片: ${result.splitImages.length} 张`);
    console.log(`   • 输出目录: ${outputDir}\n`);

    // 9. 步骤3: 备份阵容（如果检测到备份配置）
    if (shouldRunBackup) {
      console.log('----------------------------------------');
      console.log('💾 步骤 3/3: 备份阵容');
      console.log('----------------------------------------\n');

      try {
        const backupResult = await uploadBackupComposition(backupName, {
          ...options,
          mdFilePath: mdAbsPath,
        });
        result.backup = backupResult;
      } catch (error) {
        console.error(`❌ 备份失败:`, error.message);
        console.warn('⚠️  工作流已完成，但备份失败。你可以稍后手动执行备份。\n');
        result.backup = { success: false, error: error.message };
      }
    }

    return result;

  } catch (error) {
    console.error('\n❌ 工作流执行失败:', error.message);
    throw error;
  }
}

// 命令行入口
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.log(`
使用方法:
  node workflow.js <MD文件路径>

参数说明:
  <MD文件路径>  - 必需，Markdown文件路径

备份配置:
  在 MD 文件顶部添加备份配置（自动备份到博客项目）:
  <!-- backup: 英文名称 -->

示例:
  # 生成图片并自动备份（需要在目标 MD 中配置 backup 字段）
  node workflow.js "../TFT.md"

  # MD 文件示例
  <!-- tags: 推荐新手, 冷门阵容 -->
  <!-- cover: path/to/cover.png -->
  <!-- backup: ekko-chogath -->
  # 阵容标题
    `);
    process.exit(1);
  }

  runWorkflow(args[0]).catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
}

export { runWorkflow, uploadBackupComposition as backupComposition };
