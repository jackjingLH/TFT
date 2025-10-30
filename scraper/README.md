# TFT 攻略抓取工具

## 📋 功能说明

从多个TFT攻略网站抓取阵容攻略的文本内容。

### TFT Academy

从 TFT Academy 网站抓取内容，包括：

- ✅ **Tips** - 核心玩法提示
- ✅ **Snax** - 推荐强化果实
- ✅ **Stages** - 各阶段策略（Stage 2/3/4）
- ✅ **章节标题** - 6个固定章节标题

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 抓取攻略

#### TFT Academy 网站

```bash
node fetchTftAcademyGuide.js <攻略URL>
```

**示例：**

```bash
# 使用默认URL
node fetchTftAcademyGuide.js

# 抓取指定阵容
node fetchTftAcademyGuide.js https://tftacademy.com/tierlist/comps/set-15-xxx
```

## 📁 输出文件

执行后会生成：

```
translation/
└── set-15-nine-thousand-volts-kennen.txt   # TFT格式文本

scraper/data/
└── set-15-nine-thousand-volts-kennen_guide.json   # JSON格式数据
```

## 📄 TFT.txt 格式

```
tips: 核心玩法提示内容...

Snax: 推荐强化果实列表...

Stage 2: 第2阶段策略...
Stage 3: 第3阶段策略...
Stage 4: 第4阶段策略...

Alt Builds:
Augments:
Early Comp:
Item Priority:
Max Cap:
Positioning:
...
```

## 🔄 完整工作流

### 1. 抓取攻略

```bash
node fetchTftAcademyGuide.js <URL>
```

**输出：**
- `set-15-xxx.txt` - 用于翻译的文本文件
- `set-15-xxx_guide.json` - 结构化数据

### 2. 翻译文本

按照 `TFT_Guide_Translation_Rules.md` 规则翻译内容

参考 `TFT_items_translate.js` 专业术语对照表

### 3. 生成图片

```bash
cd ../mdToImg
node workflow.js "../translated_guides/xxx.md"
```

**输出：**
- 完整长图
- 适合小红书的分割图片

## 📊 抓取内容说明

### 有内容的章节

- **tips** - 从meta description提取
- **Snax** - 点击Snax tab后提取
- **Stage 2/3/4** - 各阶段的具体策略

### 固定空标题章节

以下章节为固定标题，内容为空（可后续手动补充）：

- Alt Builds（备选阵容）
- Augments（强化符文）
- Augment Priority（符文优先级）
- Early Comp（前期阵容）
- Item Priority（装备优先级）
- Max Cap（最大等级配置）

## 🛠️ 主要文件

```
scraper/
├── fetchTftAcademyGuide.js   # TFT Academy抓取脚本
├── fetchComps.js             # 批量抓取阵容列表
├── config.js                 # 配置文件
├── package.json              # 依赖管理
└── data/                     # 输出目录
```

## ⚙️ 配置

在 `fetchTftAcademyGuide.js` 中可修改：

```javascript
const CONFIG = {
  headless: true,     // 是否显示浏览器
  timeout: 60000,     // 请求超时（毫秒）
  outputDir: './data' // 数据输出目录
};
```

## ⚠️ 注意事项

1. 请遵守网站的使用条款
2. 设置合理的延迟，避免对服务器造成压力
3. 仅用于个人学习和研究用途
