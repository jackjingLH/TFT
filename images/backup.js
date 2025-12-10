import { backupComposition } from './workflow.js';

/**
 * 备份脚本 - 将完成的阵容备份到博客项目
 * 使用方法: node backup.js <英文阵容名称>
 * 示例: node backup.js ekko-chogath
 */

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
使用方法:
  node backup.js <英文阵容名称>

示例:
  node backup.js ekko-chogath
  node backup.js duelists-set15

说明:
  • 英文阵容名称将用作文件夹名
  • 备份内容包括: TFT.md、引用的图片、output 文件夹
  • 目标位置: D:\\code\\TEXTCODE\\tftblog-nextjs\\public\\guides\\<英文阵容名称>
  `);
  process.exit(1);
}

const compositionName = args[0];

console.log(`📦 准备备份阵容: ${compositionName}`);

backupComposition(compositionName)
  .then(result => {
    console.log('✅ 备份成功完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 备份失败:', error.message);
    process.exit(1);
  });
