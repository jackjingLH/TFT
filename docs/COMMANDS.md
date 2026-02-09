# 项目脚本命令速查表

> 快速查找和执行项目中的各类命令

---

## 📦 NPM 脚本命令

### 主项目 (根目录)
```bash
# 测试脚本
npm test
```

### Scraper 子项目 (./scraper)
```bash
# 抓取TFT阵容数据
cd scraper && npm run fetch

# 测试抓取功能
cd scraper && npm test
```

---

## 🤖 Claude 技能命令

在与 Claude 对话时直接使用以下命令:

### 翻译工作流
```bash
# 1. 翻译攻略(TFT.txt → TFT.md，自动清空旧内容)
/translate-guide

# 2. 验证翻译质量
/validate-terms

# 注: /prepare-translate 仅在需要单独清空文件时使用
```

### 文本规范化
```bash
# 规范化游戏术语(修正语音识别错误)
/normalize
```

### 协议学习
```bash
# 从用户修正中学习并更新翻译规则
/feedback-learning
```

---

## 🔧 Node 直接执行脚本

### 网页抓取脚本
```bash
# 抓取 TFT Academy 攻略(纯文本)
node scraper/fetchTftAcademyGuide.js

# 抓取 TFTips 攻略
node scraper/fetchTftipsGuide.js

# 旧版抓取脚本(已归档)
node archive/fetchComps.js
```

---

## 📋 常用工作流

### 完整翻译流程
```bash
# Step 1: 使用爬虫获取原文
node scraper/fetchTftAcademyGuide.js

# Step 2: 执行翻译(会自动清空旧内容)
/translate-guide

# Step 3: 验证翻译质量
/validate-terms

# Step 4: (可选)学习用户修正
/feedback-learning
```

### 术语规范化流程
```bash
# 如果原文是语音识别结果,先执行规范化
/normalize

# 然后再执行翻译
/translate-guide
```

---

## 📁 相关目录结构

```
.
├── scraper/              # 网页抓取工具
│   ├── fetchTftAcademyGuide.js
│   ├── fetchTftipsGuide.js
│   └── config.js
├── archive/              # 归档脚本
│   └── fetchComps.js
├── docs/                 # 文档和术语库
│   ├── terms/           # 术语对照表
│   └── protocols/       # 处理协议
├── TFT.txt              # 原文
└── TFT.md               # 翻译后文件
```

---

## 🔗 相关文档

- **翻译规则**: `docs/TFT_Guide_Translation_Rules.md`
- **质量检查**: `docs/quality/TFT_Quality_Control_Checklist.md`
- **处理协议**: `docs/protocols/translation-protocol.md`
- **术语库**:
  - 日译中: `docs/terms/jp_to_zh.csv`
  - 英译中: `docs/terms/en_to_zh.csv`
  - 中文规范: `docs/terms/zh_terms.csv`

---

## 💡 快速提示

- 所有 Claude 技能命令都以 `/` 开头
- 爬虫脚本输出到 `scraper/data/` 目录
- 翻译输入: `TFT.txt` | 翻译输出: `TFT.md`
- 需要修改爬虫配置可编辑 `scraper/config.js`
