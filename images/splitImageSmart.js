import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置项（基于宽度 900px）
const SPLIT_CONFIG = {
  aspectRatio: 3 / 4,     // 目标 3:4 比例
  idealHeight: 1200,      // 理想高度（3:4比例，900 × 4/3 = 1200）
  minHeight: 667,         // 最小切片高度（允许最后一片缩小，原800px → 667px）
  maxHeight: 1200,        // 最大切片高度（严格限制，不能超过，原1440px → 1200px）
  scanRange: 100,         // 扫描范围：在理想切割点前后167px内寻找最佳位置（原200px → 167px）
  textThreshold: 20,      // 文字检测阈值：像素方差大于此值认为是文字区域
  firstSliceExact: true,  // 第一张图片是否必须是精确的3:4尺寸（1200px）
  allSlicesExact: true,   // 所有图片是否都填充到3:4尺寸（1200px）
  cutMargin: 4,           // 切割边距：在找到空白区域后向下偏移4px，避免切到文字边缘（原5px → 4px）
};

/**
 * 读取图片信息
 */
async function getImageInfo(imagePath) {
  const metadata = await sharp(imagePath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
  };
}

/**
 * 分析图片的一行像素，判断是否包含文字
 * @returns {number} 方差值，值越大说明内容越复杂（可能是文字）
 */
function analyzeRow(imageData, row, width, channels = 3) {
  const rowStart = row * width * channels;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let x = 0; x < width; x++) {
    const pixelIndex = rowStart + x * channels;
    // 计算灰度值
    const gray = (imageData[pixelIndex] + imageData[pixelIndex + 1] + imageData[pixelIndex + 2]) / 3;
    sum += gray;
    sumSq += gray * gray;
    count++;
  }

  const mean = sum / count;
  const variance = (sumSq / count) - (mean * mean);
  return variance;
}

/**
 * 在指定区域寻找最佳切割位置（避开文字）
 */
async function findBestCutPoint(imagePath, idealY, minY, maxY, width, height) {
  // 确保范围有效
  minY = Math.max(SPLIT_CONFIG.minHeight, minY);
  maxY = Math.min(height, maxY);

  if (minY >= maxY) {
    return idealY;
  }

  // 提取搜索区域
  const scanHeight = maxY - minY;

  try {
    const region = await sharp(imagePath)
      .extract({
        left: 0,
        top: Math.floor(minY),
        width: Math.floor(width),
        height: Math.floor(scanHeight),
      })
      .raw()
      .toBuffer();

    // 分析每一行，找到方差最小的行（最可能是空白区域）
    let bestY = idealY;
    let minVariance = Infinity;

    console.log(`    扫描范围: ${minY}~${maxY}px (${scanHeight}行)`);

    for (let y = 0; y < scanHeight; y++) {
      const actualY = minY + y;
      const variance = analyzeRow(region, y, width, 3);

      // 如果方差很小，说明这一行比较均匀（可能是空白或背景）
      if (variance < minVariance && variance < SPLIT_CONFIG.textThreshold) {
        minVariance = variance;
        bestY = actualY;
      }
    }

    // 如果找到了好的切割点，向下偏移边距避免切到文字
    if (minVariance < SPLIT_CONFIG.textThreshold) {
      const adjustedY = Math.min(maxY, bestY + SPLIT_CONFIG.cutMargin);
      console.log(`    ✓ 找到空白区域: ${bestY}px (方差: ${minVariance.toFixed(2)})`);
      if (adjustedY !== bestY) {
        console.log(`    ↓ 向下调整 ${adjustedY - bestY}px 边距: ${adjustedY}px`);
      }
      return adjustedY;
    }

    // 如果没找到理想的空白区域，选择方差最小的位置，同样留边距
    const adjustedY = Math.min(maxY, bestY + SPLIT_CONFIG.cutMargin);
    console.log(`    ! 未找到明显空白，使用最小方差位置: ${bestY}px (方差: ${minVariance.toFixed(2)})`);
    if (adjustedY !== bestY) {
      console.log(`    ↓ 向下调整 ${adjustedY - bestY}px 边距: ${adjustedY}px`);
    }
    return adjustedY;

  } catch (error) {
    console.log(`    ! 扫描出错，使用理想位置: ${idealY}px`);
    return idealY;
  }
}

/**
 * 智能计算切割点
 */
async function calculateSmartCutPoints(imagePath, width, height) {
  const idealSliceHeight = Math.floor(width / (3 / 4)); // 3:4 比例
  console.log(`\n理想单片高度: ${idealSliceHeight}px`);
  console.log(`允许高度范围: ${SPLIT_CONFIG.minHeight}px ~ ${SPLIT_CONFIG.maxHeight}px\n`);

  const cutPoints = [];
  let currentY = 0;
  let partNumber = 1;

  while (currentY < height) {
    console.log(`分析第 ${partNumber} 片:`);
    console.log(`  起始位置: ${currentY}px`);

    // 计算剩余高度
    const remainingHeight = height - currentY;

    // 如果剩余高度小于等于最大高度，直接切到底
    if (remainingHeight <= SPLIT_CONFIG.maxHeight) {
      cutPoints.push({
        part: partNumber,
        start: currentY,
        end: height,
        height: remainingHeight,
      });
      console.log(`  结束位置: ${height}px (最后一片)`);
      console.log(`  高度: ${remainingHeight}px\n`);
      break;
    }

    // 特殊处理：第一张图片要求精确 3:4 尺寸
    if (partNumber === 1 && SPLIT_CONFIG.firstSliceExact) {
      const exactHeight = SPLIT_CONFIG.idealHeight; // 1200px
      const minSearchY = Math.max(SPLIT_CONFIG.minHeight, exactHeight - SPLIT_CONFIG.scanRange); // 向上搜索
      const maxSearchY = Math.min(height, exactHeight); // 不超过1200px

      console.log(`  [第一张图片] 目标高度: ${exactHeight}px`);
      console.log(`  搜索空白区域: ${minSearchY}~${maxSearchY}px (在理想高度范围内)`);

      // 在1200px范围内搜索最佳空白区域
      const bestEndY = await findBestCutPoint(imagePath, exactHeight, minSearchY, maxSearchY, width, height);

      cutPoints.push({
        part: partNumber,
        start: currentY,
        end: bestEndY,
        height: bestEndY - currentY,
      });

      const heightDiff = exactHeight - (bestEndY - currentY);
      if (heightDiff > 0) {
        console.log(`  结束位置: ${bestEndY}px (将填充 ${heightDiff}px 空白达到 ${exactHeight}px)`);
      } else {
        console.log(`  结束位置: ${bestEndY}px (精确高度)`);
      }
      console.log(`  原始高度: ${bestEndY - currentY}px\n`);

      currentY = bestEndY;
      partNumber++;
      continue;
    }

    // 计算理想结束位置
    const idealEndY = currentY + SPLIT_CONFIG.idealHeight;

    // 定义搜索范围（确保不超过最大高度）
    const minEndY = Math.max(currentY + SPLIT_CONFIG.minHeight, idealEndY - SPLIT_CONFIG.scanRange);
    const maxEndY = Math.min(height, idealEndY + SPLIT_CONFIG.scanRange, currentY + SPLIT_CONFIG.maxHeight);

    // 寻找最佳切割点
    const bestEndY = await findBestCutPoint(imagePath, idealEndY, minEndY, maxEndY, width, height);

    cutPoints.push({
      part: partNumber,
      start: currentY,
      end: bestEndY,
      height: bestEndY - currentY,
    });

    console.log(`  结束位置: ${bestEndY}px`);
    console.log(`  高度: ${bestEndY - currentY}px\n`);

    currentY = bestEndY;
    partNumber++;
  }

  return cutPoints;
}

/**
 * 从图片顶部提取背景颜色（避开文字区域）
 * @param {number} sampleOffset - 向内偏移量，跳过边缘文字区域
 */
async function extractTopColor(imagePath, extractTop, width, sampleOffset = 50) {
  try {
    // 从顶部向内偏移，避开紧邻的文字
    const sampleTop = extractTop + sampleOffset;
    const sampleHeight = 50; // 采样50行，获取更稳定的平均值

    const region = await sharp(imagePath)
      .extract({
        left: 0,
        top: Math.floor(sampleTop),
        width: Math.floor(width),
        height: sampleHeight,
      })
      .raw()
      .toBuffer();

    // 收集所有像素的灰度值和颜色，用于过滤文字像素
    const pixels = [];
    for (let i = 0; i < region.length; i += 3) {
      const r = region[i];
      const g = region[i + 1];
      const b = region[i + 2];
      const gray = (r + g + b) / 3;
      pixels.push({ r, g, b, gray });
    }

    // 按灰度值排序，取中间60%的像素（排除极亮的文字和极暗的异常点）
    pixels.sort((a, b) => a.gray - b.gray);
    const startIdx = Math.floor(pixels.length * 0.2);
    const endIdx = Math.floor(pixels.length * 0.8);
    const backgroundPixels = pixels.slice(startIdx, endIdx);

    // 计算背景像素的平均颜色
    let r = 0, g = 0, b = 0;
    for (const pixel of backgroundPixels) {
      r += pixel.r;
      g += pixel.g;
      b += pixel.b;
    }

    return {
      r: Math.round(r / backgroundPixels.length),
      g: Math.round(g / backgroundPixels.length),
      b: Math.round(b / backgroundPixels.length),
      alpha: 1
    };
  } catch (error) {
    console.log(`  ! 无法提取顶部颜色，使用默认值`);
    return { r: 30, g: 30, b: 30, alpha: 1 };
  }
}

/**
 * 从图片底部提取背景颜色（避开文字区域）
 * @param {number} sampleOffset - 向内偏移量，跳过边缘文字区域
 */
async function extractBottomColor(imagePath, extractTop, extractHeight, width, sampleOffset = 50) {
  try {
    // 从底部向内偏移，避开紧邻的文字
    const sampleHeight = 50; // 采样50行
    const sampleTop = extractTop + extractHeight - sampleOffset - sampleHeight;

    const region = await sharp(imagePath)
      .extract({
        left: 0,
        top: Math.floor(sampleTop),
        width: Math.floor(width),
        height: sampleHeight,
      })
      .raw()
      .toBuffer();

    // 收集所有像素的灰度值和颜色，用于过滤文字像素
    const pixels = [];
    for (let i = 0; i < region.length; i += 3) {
      const r = region[i];
      const g = region[i + 1];
      const b = region[i + 2];
      const gray = (r + g + b) / 3;
      pixels.push({ r, g, b, gray });
    }

    // 按灰度值排序，取中间60%的像素（排除极亮的文字和极暗的异常点）
    pixels.sort((a, b) => a.gray - b.gray);
    const startIdx = Math.floor(pixels.length * 0.2);
    const endIdx = Math.floor(pixels.length * 0.8);
    const backgroundPixels = pixels.slice(startIdx, endIdx);

    // 计算背景像素的平均颜色
    let r = 0, g = 0, b = 0;
    for (const pixel of backgroundPixels) {
      r += pixel.r;
      g += pixel.g;
      b += pixel.b;
    }

    return {
      r: Math.round(r / backgroundPixels.length),
      g: Math.round(g / backgroundPixels.length),
      b: Math.round(b / backgroundPixels.length),
      alpha: 1
    };
  } catch (error) {
    console.log(`  ! 无法提取底部颜色，使用默认值`);
    return { r: 30, g: 30, b: 30, alpha: 1 };
  }
}

/**
 * 根据切割点分割图片
 */
async function splitImageByPoints(imagePath, cutPoints, outputDir, baseFilename) {
  const outputPaths = [];
  const metadata = await sharp(imagePath).metadata();

  for (let i = 0; i < cutPoints.length; i++) {
    const point = cutPoints[i];

    // 生成输出文件名
    const outputFilename = `${baseFilename}_part${point.part}_of_${cutPoints.length}.png`;
    const outputPath = path.join(outputDir, outputFilename);

    // 裁切图片
    let imageBuffer = await sharp(imagePath)
      .extract({
        left: 0,
        top: point.start,
        width: metadata.width,
        height: point.height,
      })
      .toBuffer();

    // 判断是否需要填充：第一张图片 或 所有图片（根据配置）
    const shouldPad = (i === 0 && SPLIT_CONFIG.firstSliceExact) || SPLIT_CONFIG.allSlicesExact;
    const isLastSlice = (i === cutPoints.length - 1);

    // 填充到3:4尺寸（包括最后一片）
    if (shouldPad && point.height < SPLIT_CONFIG.idealHeight) {
      const paddingHeight = SPLIT_CONFIG.idealHeight - point.height;

      // 最后一张图片：顶部对齐，只在底部填充
      // 其他图片：上下居中填充
      if (isLastSlice) {
        console.log(`  [填充] 第${point.part}张图片（最后一张）高度 ${point.height}px < ${SPLIT_CONFIG.idealHeight}px，底部填充 ${paddingHeight}px`);

        // 只从底部提取颜色
        const bottomColor = await extractBottomColor(imagePath, point.start, point.height, metadata.width);
        console.log(`  [颜色融合] 底部: RGB(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`);

        // 创建底部填充区域
        const bottomPaddingBuffer = await sharp({
          create: {
            width: metadata.width,
            height: paddingHeight,
            channels: 4,
            background: bottomColor
          }
        }).png().toBuffer();

        // 使用 composite 将原图和底部padding拼接
        imageBuffer = await sharp({
          create: {
            width: metadata.width,
            height: SPLIT_CONFIG.idealHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        })
        .composite([
          { input: imageBuffer, top: 0, left: 0 },
          { input: bottomPaddingBuffer, top: point.height, left: 0 }
        ])
        .png()
        .toBuffer();

      } else {
        // 非最后一张：上下居中填充
        const topPadding = Math.floor(paddingHeight / 2);
        const bottomPadding = paddingHeight - topPadding;

        console.log(`  [填充] 第${point.part}张图片高度 ${point.height}px < ${SPLIT_CONFIG.idealHeight}px，上下居中填充 ${paddingHeight}px (上:${topPadding}px, 下:${bottomPadding}px)`);

        // 从当前切片顶部和底部提取平均颜色，实现自然融合
        const topColor = await extractTopColor(imagePath, point.start, metadata.width);
        const bottomColor = await extractBottomColor(imagePath, point.start, point.height, metadata.width);

        console.log(`  [颜色融合] 顶部: RGB(${topColor.r}, ${topColor.g}, ${topColor.b}) | 底部: RGB(${bottomColor.r}, ${bottomColor.g}, ${bottomColor.b})`);

        // 创建顶部填充区域
        const topPaddingBuffer = await sharp({
          create: {
            width: metadata.width,
            height: topPadding,
            channels: 4,
            background: topColor
          }
        }).png().toBuffer();

        // 创建底部填充区域
        const bottomPaddingBuffer = await sharp({
          create: {
            width: metadata.width,
            height: bottomPadding,
            channels: 4,
            background: bottomColor
          }
        }).png().toBuffer();

        // 使用 composite 将顶部padding、原图、底部padding拼接成完整图片
        imageBuffer = await sharp({
          create: {
            width: metadata.width,
            height: SPLIT_CONFIG.idealHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        })
        .composite([
          { input: topPaddingBuffer, top: 0, left: 0 },
          { input: imageBuffer, top: topPadding, left: 0 },
          { input: bottomPaddingBuffer, top: topPadding + point.height, left: 0 }
        ])
        .png()
        .toBuffer();
      }
    }

    // 保存最终图片
    await sharp(imageBuffer).toFile(outputPath);

    outputPaths.push(outputPath);

    // 计算最终高度（考虑填充）
    const finalHeight = (shouldPad && point.height < SPLIT_CONFIG.idealHeight)
      ? SPLIT_CONFIG.idealHeight
      : point.height;
    const ratio = ((finalHeight / metadata.width) / (4 / 3)).toFixed(2);
    console.log(`✓ 分片 ${point.part}/${cutPoints.length}: ${point.start}~${point.end}px (${finalHeight}px, 比例系数: ${ratio})`);
  }

  return outputPaths;
}

/**
 * 主函数：智能分割长图
 * @param {string} imagePath - 要分割的图片路径
 * @param {string|null} outputDir - 输出目录（可选）
 * @param {string|null} baseFilename - 输出文件名前缀（可选）
 */
async function smartSplitImage(imagePath, outputDir = null, baseFilename = null) {
  try {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`开始智能分割图片: ${path.basename(imagePath)}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

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

    // 智能计算切割点
    const cutPoints = await calculateSmartCutPoints(imagePath, imageInfo.width, imageInfo.height);

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`分割方案: ${cutPoints.length} 片\n`);

    cutPoints.forEach((point, index) => {
      const ratio = (point.height / imageInfo.width * 3 / 4).toFixed(3);
      console.log(`  第${point.part}片: ${point.start} ~ ${point.end}px (${point.height}px, 3:${(4/ratio).toFixed(1)})`);
    });

    // 执行分割
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`开始分割...\n`);

    // 如果未指定文件名前缀，从图片路径提取
    if (!baseFilename) {
      baseFilename = path.basename(imagePath, path.extname(imagePath));
    }

    const outputPaths = await splitImageByPoints(imagePath, cutPoints, outputDir, baseFilename);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✓ 分割完成！`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`原始长图: ${imagePath}`);
    console.log(`分割后图片: ${outputPaths.length} 个文件`);
    console.log(`保存位置: ${outputDir}\n`);

    // 列出生成的文件
    console.log(`生成的文件:`);
    const images = [];
    for (let i = 0; i < outputPaths.length; i++) {
      const stats = fs.statSync(outputPaths[i]);
      const sizeKB = (stats.size / 1024).toFixed(1);
      const imgMeta = await getImageInfo(outputPaths[i]);
      console.log(`  ${i + 1}. ${path.basename(outputPaths[i])} (${sizeKB} KB)`);

      images.push({
        path: outputPaths[i],
        filename: path.basename(outputPaths[i]),
        width: imgMeta.width,
        height: imgMeta.height,
        sizeKB: parseFloat(sizeKB),
      });
    }

    return {
      originalPath: imagePath,
      splitPaths: outputPaths,
      images: images,
      totalSlices: outputPaths.length,
      outputDir: outputDir,
    };

  } catch (error) {
    console.error('分割失败:', error);
    throw error;
  }
}

// 命令行使用
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`){
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('智能图片分割工具 - 自动识别文字边界\n');
    console.log('使用方法:');
    console.log('  node splitImage.js <图片路径> [输出目录]\n');
    console.log('示例:');
    console.log('  node splitImage.js ./output.png');
    console.log('  node splitImage.js ./output.png ./my_split\n');
    console.log('功能:');
    console.log('  - 自动按3:4比例分割长图（宽900px × 高1200px）');
    console.log('  - 智能识别文字边界，避开文字区域');
    console.log('  - 允许高度在 667-1200px 范围内浮动');
    console.log('  - 优先在空白区域切割');
    console.log('  - 保留原始长图不变');
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
}

export { smartSplitImage };
