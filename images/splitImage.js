import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置项
const SPLIT_CONFIG = {
  aspectRatio: 3 / 4,  // 3:4 比例
  overlap: 100,        // 重叠区域（避免切断文字）
};

/**
 * 读取图片并获取基本信息
 */
async function getImageInfo(imagePath) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

/**
 * 计算切割点（带重叠区域）
 */
function calculateCutPoints(width, height) {
  const sliceHeight = Math.floor(width / (3 / 4)); // 3:4比例的高度
  const cutPoints = [];

  let currentY = 0;
  let partNumber = 1;

  while (currentY < height) {
    const endY = Math.min(currentY + sliceHeight, height);
    const actualHeight = endY - currentY;

    cutPoints.push({
      part: partNumber,
      start: currentY,
      end: endY,
      height: actualHeight,
    });

    // 如果还有剩余内容，下一片从重叠区域开始
    if (endY < height) {
      currentY = endY - SPLIT_CONFIG.overlap;
    } else {
      break;
    }

    partNumber++;
  }

  return cutPoints;
}

/**
 * 根据切割点分割图片
 */
async function splitImageByPoints(imagePath, cutPoints, outputDir, baseFilename) {
  const outputPaths = [];

  for (let i = 0; i < cutPoints.length; i++) {
    const point = cutPoints[i];

    // 生成输出文件名
    const outputFilename = `${baseFilename}_part${point.part}_of_${cutPoints.length}.png`;
    const outputPath = path.join(outputDir, outputFilename);

    // 裁切并保存
    await sharp(imagePath)
      .extract({
        left: 0,
        top: point.start,
        width: await (await sharp(imagePath).metadata()).width,
        height: point.height,
      })
      .toFile(outputPath);

    outputPaths.push(outputPath);

    const ratio = ((point.height / (await (await sharp(imagePath).metadata()).width)) * 4 / 3).toFixed(2);
    console.log(`  ✓ 分片 ${point.part}/${cutPoints.length}: ${point.start}~${point.end}px (高度${point.height}px, 比例≈${ratio}:1)`);
  }

  return outputPaths;
}

/**
 * 主函数：智能分割长图
 */
async function smartSplitImage(imagePath, outputDir = null) {
  try {
    console.log(`\n开始分割图片: ${imagePath}`);

    // 如果未指定输出目录，使用原图片所在目录的 split 子目录
    if (!outputDir) {
      const originalDir = path.dirname(imagePath);
      outputDir = path.join(originalDir, 'split');
    }

    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 获取图片信息
    const imageInfo = await getImageInfo(imagePath);
    console.log(`图片尺寸: ${imageInfo.width} x ${imageInfo.height}`);

    // 计算3:4比例的单片高度
    const sliceHeight = Math.floor(imageInfo.width / (3 / 4));
    console.log(`3:4比例单片高度: ${sliceHeight}px`);

    // 计算切割点
    const cutPoints = calculateCutPoints(imageInfo.width, imageInfo.height);
    console.log(`\n将分割成: ${cutPoints.length} 片`);
    console.log(`切割点（含${SPLIT_CONFIG.overlap}px重叠区域，避免切断文字）:`);
    cutPoints.forEach((point) => {
      console.log(`  片段 ${point.part}: ${point.start}px ~ ${point.end}px (${point.height}px)`);
    });

    // 执行分割
    console.log(`\n开始分割图片...`);
    const baseFilename = path.basename(imagePath, path.extname(imagePath));
    const outputPaths = await splitImageByPoints(imagePath, cutPoints, outputDir, baseFilename);

    console.log(`\n✓ 分割完成！`);
    console.log(`原始长图: ${imagePath}`);
    console.log(`分割后图片: ${outputPaths.length} 个文件`);
    console.log(`保存位置: ${outputDir}\n`);

    // 列出生成的文件
    console.log(`生成的文件:`);
    outputPaths.forEach((filePath, index) => {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  ${index + 1}. ${path.basename(filePath)} (${sizeKB} KB)`);
    });

    return {
      originalPath: imagePath,
      splitPaths: outputPaths,
      totalSlices: outputPaths.length,
      outputDir: outputDir,
    };

  } catch (error) {
    console.error('分割失败:', error);
    throw error;
  }
}

// 命令行使用
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('使用方法:');
  console.log('  node splitImage.js <图片路径> [输出目录]');
  console.log('');
  console.log('示例:');
  console.log('  node splitImage.js ./output.png');
  console.log('  node splitImage.js ./output.png ./my_split');
  console.log('');
  console.log('功能:');
  console.log('  - 自动将长图按3:4比例分割');
  console.log('  - 分片之间有重叠区域，避免切断文字');
  console.log('  - 保留原始长图不变');
  console.log('  - 默认输出到原图目录的 split 子目录');
  process.exit(1);
}

const imagePath = args[0];
const outputDir = args[1];

if (!fs.existsSync(imagePath)) {
  console.error(`错误: 文件不存在 - ${imagePath}`);
  process.exit(1);
}

smartSplitImage(imagePath, outputDir)
  .then(() => {
    console.log('\n完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('发生错误:', error);
    process.exit(1);
  });

export { smartSplitImage };
