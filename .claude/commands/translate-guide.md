翻译TFT.txt文件到中文。

## 执行步骤

### 阶段一：翻译

1. 清空TFT.md文件（避免旧内容残留）
2. 读取TFT.txt原文，自动检测语种
3. 根据语种加载对应的术语库：
   - 日文 → 使用 docs/terms/jp_to_zh.csv
   - 英文 → 使用 docs/terms/en_to_zh.csv
4. 应用翻译规则进行翻译
5. 保存结果到TFT.md

翻译时必须严格遵循 @docs/guides/TFT_Guide_Translation_Rules.md 中的所有规则。

---

### 阶段二：质量验证

严格按照 @docs/quality/TFT_Quality_Control_Checklist.md 检测清单对 TFT.md 进行检查，输出检查报告到对话框（不生成文件），包括：
- ✅ 通过的项目
- ❌ 失败的项目及具体问题

如有格式或术语问题，直接修正 TFT.md 后继续。

