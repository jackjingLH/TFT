/**
 * TFT Academy 爬虫配置文件
 */

export const CONFIG = {
  // 目标网站
  baseUrl: 'https://tftacademy.com',
  tierlistUrl: 'https://tftacademy.com/tierlist/comps',

  // 输出路径
  outputDir: './data',
  rawDataFile: './data/comps_raw.json',
  processedDataFile: './data/comps_processed.json',

  // 抓取设置
  delay: 1000, // 请求间隔（毫秒）
  timeout: 30000, // 请求超时（毫秒）
  retryTimes: 3, // 重试次数

  // 用户代理
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export default CONFIG;
