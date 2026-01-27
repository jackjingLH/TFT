# 📝 TFT文本规范化处理

## 功能描述
对 @TFT.txt 文件按照 @translation-protocol.md 协议进行术语规范化处理。

## 执行任务

1. 读取 @TFT.txt 原始文本
2. 参考 @docs/zh_terms.csv 术语表
3. 按照 @translation-protocol.md 协议处理：
   - 术语规范化（读音纠错）
   - 羁绊格式统一
   - 口语转书面语
   - 格式优化

4. 生成两个文件：
   - TFT_processed.md（包含纠错记录、原文、规范化文本）
   - TFT.md（仅规范化文本，供手动修正）

## 输出要求
按照协议第6节"输出协议"格式输出到 TFT_processed.md，并同步B部分到 TFT.md

## 相关文档
- @translation-protocol.md - 处理协议
- @docs/zh_terms.csv - 术语表
