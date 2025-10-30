import { runWorkflow } from './workflow.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mdPath = path.join(__dirname, '..', 'TFT.md');

console.log('开始测试工作流...');
console.log('MD文件路径:', mdPath);

runWorkflow(mdPath)
  .then(result => {
    console.log('\n✅ 工作流执行成功！');
    console.log('结果:', JSON.stringify(result, null, 2));
  })
  .catch(error => {
    console.error('\n❌ 工作流执行失败！');
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    process.exit(1);
  });
