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
 * 完整工作流：MD → 长图 → 分割 → 备份
 * @param {string} mdFilePath - Markdown文件路径
 * @param {Object} options - 可选配置
 * @param {string} options.targetRoot - 备份目标根目录
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
    console.log(`📸 步骤 1/${backupName ? '3' : '2'}: 生成完整长图`);
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
      console.log(`✂️  步骤 2/${backupName ? '3' : '2'}: 智能分割图片`);
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
    if (backupName) {
      console.log('----------------------------------------');
      console.log('💾 步骤 3/3: 备份阵容');
      console.log('----------------------------------------\n');

      try {
        const backupResult = await backupComposition(backupName, {
          targetRoot: options.targetRoot,
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
  node workflow.js <MD文件路径>           # 生成图片并自动备份
  node workflow.js <文件1> <文件2> ...    # 批量处理（不支持备份）

参数说明:
  <MD文件路径>  - 必需，Markdown文件路径

备份配置:
  在 MD 文件顶部添加备份配置（自动备份到博客项目）:
  <!-- backup: 英文名称 -->

示例:
  # 生成图片并自动备份（需要在 TFT.md 中配置 backup 字段）
  node workflow.js "../TFT.md"

  # MD 文件示例
  <!-- tags: 推荐新手, 冷门阵容 -->
  <!-- cover: path/to/cover.png -->
  <!-- backup: ekko-chogath -->
  # 阵容标题
    `);
    process.exit(1);
  }

  // 批量或单个处理
  if (args.length === 1) {
    // 单个文件处理，从文件读取备份名称
    runWorkflow(args[0]).catch(error => {
      console.error('执行失败:', error);
      process.exit(1);
    });
  } else {
    // 批量处理（暂不支持备份）
    runBatchWorkflow(args).catch(error => {
      console.error('批量执行失败:', error);
      process.exit(1);
    });
  }
}

/**
 * 备份阵容到博客项目
 * @param {string} compositionName - 阵容的英文名称（用作文件夹名）
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 备份结果信息
 */
async function backupComposition(compositionName, options = {}) {
  console.log('\n========================================');
  console.log('💾 开始备份阵容');
  console.log('========================================\n');

  const sourceDir = path.join(__dirname, '..');
  const targetRoot = options.targetRoot || 'D:/code/TEXTCODE/tftblog-nextjs/public/guides';
  const targetDir = path.join(targetRoot, compositionName);

  console.log(`📁 源目录: ${sourceDir}`);
  console.log(`📁 目标目录: ${targetDir}\n`);

  try {
    // 1. 读取 TFT.md 文件
    const tftMdPath = path.join(sourceDir, 'TFT.md');
    if (!fs.existsSync(tftMdPath)) {
      throw new Error('TFT.md 文件不存在');
    }

    const mdContent = fs.readFileSync(tftMdPath, 'utf-8');
    console.log('✅ 读取 TFT.md 成功\n');

    // 2. 提取 cover 封面图
    const coverMatch = mdContent.match(/<!--\s*cover:\s*(.+?)\s*-->/);
    const coverImage = coverMatch ? coverMatch[1].trim() : null;

    // 3. 提取所有 Markdown 图片引用
    // 匹配两种格式: ![...](...) 和 ![...](<...>)
    const imageRegex = /!\[.*?\]\((?:<(.+?)>|([^)]+))\)/g;
    const images = new Set(); // 使用 Set 避免重复
    let match;

    // 添加封面图
    if (coverImage) {
      images.add(coverImage);
    }

    // 提取 Markdown 图片
    while ((match = imageRegex.exec(mdContent)) !== null) {
      // match[1] 是尖括号包裹的路径，match[2] 是普通路径
      const imagePath = (match[1] || match[2]).trim();
      images.add(imagePath);
    }

    const imageList = Array.from(images);
    console.log(`🖼️  找到 ${imageList.length} 个图片引用:`);
    if (coverImage) {
      console.log(`   • ${coverImage} (封面图)`);
    }
    imageList.filter(img => img !== coverImage).forEach(img => console.log(`   • ${img}`));
    console.log('');

    // 4. 创建目标目录
    fs.mkdirSync(targetDir, { recursive: true });
    console.log(`✅ 创建目标目录: ${targetDir}\n`);

    // 5. 拷贝 TFT.md
    const targetMdPath = path.join(targetDir, 'TFT.md');
    fs.copyFileSync(tftMdPath, targetMdPath);
    console.log(`✅ 拷贝 TFT.md → ${targetMdPath}\n`);

    // 6. 拷贝所有引用的图片
    console.log('📸 开始拷贝图片...');
    const copiedImages = [];

    for (const imagePath of imageList) {
      // 判断是绝对路径还是相对路径
      const sourceImagePath = path.isAbsolute(imagePath)
        ? imagePath
        : path.join(sourceDir, imagePath);

      const imageFileName = path.basename(imagePath);
      const targetImagePath = path.join(targetDir, imageFileName);

      if (fs.existsSync(sourceImagePath)) {
        fs.copyFileSync(sourceImagePath, targetImagePath);
        const label = imagePath === coverImage ? `${imageFileName} (封面图)` : imageFileName;
        console.log(`   ✅ ${label}`);
        copiedImages.push(imageFileName);
      } else {
        console.warn(`   ⚠️  图片不存在: ${imagePath}`);
      }
    }
    console.log('');

    // 7. 拷贝 output 文件夹
    const sourceOutputDir = path.join(sourceDir, 'output');
    const targetOutputDir = path.join(targetDir, 'output');

    if (fs.existsSync(sourceOutputDir)) {
      console.log('📦 开始拷贝 output 文件夹...');

      // 创建目标 output 文件夹
      fs.mkdirSync(targetOutputDir, { recursive: true });

      // 拷贝所有文件
      const outputFiles = fs.readdirSync(sourceOutputDir);
      outputFiles.forEach(file => {
        const sourceFile = path.join(sourceOutputDir, file);
        const targetFile = path.join(targetOutputDir, file);

        if (fs.statSync(sourceFile).isFile()) {
          fs.copyFileSync(sourceFile, targetFile);
          console.log(`   ✅ ${file}`);
        }
      });
      console.log('');
    } else {
      console.warn('⚠️  output 文件夹不存在，跳过拷贝\n');
    }

    // 8. 完成总结
    console.log('========================================');
    console.log('🎉 备份完成！');
    console.log('========================================\n');
    console.log('📊 备份统计:');
    console.log(`   • TFT.md: 1 个`);
    console.log(`   • 图片: ${copiedImages.length} 个`);
    console.log(`   • output 文件: ${fs.existsSync(targetOutputDir) ? fs.readdirSync(targetOutputDir).length : 0} 个`);
    console.log(`   • 目标位置: ${targetDir}\n`);

    return {
      success: true,
      targetDir,
      files: {
        md: 'TFT.md',
        images: copiedImages,
        outputDir: fs.existsSync(targetOutputDir),
      },
    };

  } catch (error) {
    console.error('\n❌ 备份失败:', error.message);
    throw error;
  }
}

export { runWorkflow, runBatchWorkflow, backupComposition };
