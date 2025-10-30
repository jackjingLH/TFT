import { smartSplitImage } from './splitImageSmart.js';
import path from 'path';

const fullImagePath = 'D:\\game\\code\\convertTFT\\translation\\output\\TFT_full.png';
const outputDir = 'D:\\game\\code\\convertTFT\\translation\\output';
const baseName = 'TFT';

console.log('开始测试分割功能...');
console.log('输入图片:', fullImagePath);
console.log('输出目录:', outputDir);
console.log('基础名称:', baseName);

smartSplitImage(fullImagePath, outputDir, baseName)
  .then(result => {
    console.log('\n✅ 分割成功！');
    console.log('生成了', result.images.length, '张图片:');
    result.images.forEach((img, index) => {
      console.log(`  ${index + 1}. ${path.basename(img.path)} (${img.width}x${img.height})`);
    });
  })
  .catch(error => {
    console.error('\n❌ 分割失败！');
    console.error('错误:', error.message);
    console.error('堆栈:', error.stack);
    process.exit(1);
  });
