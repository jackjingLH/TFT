翻译TFT.txt文件到中文。

## 执行步骤

1. 清空TFT.md文件（避免旧内容残留）
2. 读取TFT.txt原文，自动检测语种
3. 根据语种加载对应的术语库：
   - 日文 → 使用 docs/jp_to_zh.csv
   - 英文 → 使用 docs/en_to_zh.csv
4. 应用翻译规则进行翻译
5. 保存结果到TFT.md
6. 验证专业术语准确性

## 重要提醒

翻译时必须严格遵循 @docs/TFT_Guide_Translation_Rules.md 中的所有规则，确保翻译质量和一致性。
