# 📱 MD转移动端图片工具

将 Markdown 文件转换为适合移动端查看的图片，并智能分割为社交媒体友好的 3:4 比例图片。

## 🎯 功能特性

✅ **Markdown 转图片**
- VSCode 深色主题风格（#1e1e1e 背景）
- 支持中文字体（Microsoft YaHei）
- 支持 Emoji 渲染
- 支持嵌入图片（自动加载 MD 中的相对路径图片）
- 移动端优化（大字体：32px正文，100px标题）
- 自定义标题背景图片支持
- 1080px 宽度，1x 像素密度

✅ **智能图片分割**
- 自动分割为 3:4 比例（1080×1440px）
- 智能识别文字边界，避开文字区域
- 优先在空白区域切割
- 最后一片允许缩小（最小 800px）
- 保留完整长图

✅ **统一工作流**
- 一键完成：MD → 长图 → 分割
- 清晰的目录结构
- 批量处理支持
- 生成元数据文件

---

## 📦 安装依赖

```bash
cd translation
npm install puppeteer marked sharp
```

---

## 🚀 使用方法

### 1️⃣ 完整工作流（推荐）

**处理单个文件：**
```bash
cd mdToImg
node workflow.js "../translated_guides/玛尔扎哈水晶玫瑰连败转型攻略.md"
```

**批量处理：**
```bash
node workflow.js "../translated_guides/文件1.md" "../translated_guides/文件2.md"
```

**输出结构：**
```
translation/output/
└─ 攻略名称/
   ├─ full/                 # 完整长图
   │  └─ 攻略名称_full.png
   ├─ split/                # 分割图片
   │  ├─ 攻略名称_part1_of_4.png
   │  ├─ 攻略名称_part2_of_4.png
   │  ├─ 攻略名称_part3_of_4.png
   │  └─ 攻略名称_part4_of_4.png
   └─ metadata.json         # 生成信息
```

---

### 2️⃣ 单独使用各工具

#### MD 转图片
```bash
cd mdToImg
node mdToImage.js "../translated_guides/攻略.md" "./output.png"
```

#### 智能分割图片
```bash
node splitImageSmart.js "./output.png" "./split_output"
```

---

## ⚙️ 配置说明

### mdToImage.js 配置
编辑 [mdToImage.js](mdToImage.js) 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  width: 1080,                        // 图片宽度
  backgroundColor: '#1e1e1e',         // 背景颜色（VSCode深色主题）
  h1BackgroundImage: './bg.png',      // H1标题背景图（可选）
  fontFamily: 'Microsoft YaHei',      // 字体
  fontSize: '32px',                   // 正文字体大小
  lineHeight: '2.1',                  // 行高
  imageFormat: 'png',                 // 输出格式
  imageQuality: 100,                  // 图片质量
};
```

### splitImageSmart.js 配置
编辑 [splitImageSmart.js](splitImageSmart.js) 中的 `SPLIT_CONFIG` 对象：

```javascript
const SPLIT_CONFIG = {
  aspectRatio: 3 / 4,      // 目标比例（3:4）
  idealHeight: 1440,       // 理想高度
  minHeight: 800,          // 最小高度（最后一片可缩小）
  maxHeight: 1440,         // 最大高度（严格限制）
  scanRange: 200,          // 扫描范围（±200px）
  textThreshold: 20,       // 文字检测阈值
};
```

---

## 🎨 自定义标题背景

1. 将背景图片命名为 `bg.png` 放在 `mdToImg/` 目录
2. 背景会自动应用到 H1 标题
3. 标题会添加深色渐变遮罩，确保文字清晰可读

**标题样式特点：**
- 100px 超大字号
- 200px 顶部间距（适合裁切为封面）
- 支持本地图片背景
- 多重文字阴影，增强可读性

---

## 📊 示例输出

### 长图示例
```
图片尺寸: 1080 x 7202
生成位置: output/玛尔扎哈水晶玫瑰连败转型攻略/full/
文件大小: 1.7 MB
```

### 分割示例
```
分割方案: 6 片

第1片: 0 ~ 1325px (1325px, 3:4.3) ✓ 找到空白区域 (方差: 0.00)
第2片: 1325 ~ 2565px (1240px, 3:4.6) ✓ 找到空白区域 (方差: 1.69)
第3片: 2565 ~ 3974px (1409px, 3:4.1) ✓ 找到空白区域 (方差: 0.90)
第4片: 3974 ~ 5413px (1439px, 3:4.0) ✓ 找到空白区域 (方差: 1.51)
第5片: 5413 ~ 6852px (1439px, 3:4.0) ✓ 找到空白区域 (方差: 1.92)
第6片: 6852 ~ 7202px (350px, 3:16.5) ✓ 最后一片允许缩小

生成文件:
  1. part1_of_6.png (535.5 KB)
  2. part2_of_6.png (388.4 KB)
  3. part3_of_6.png (471.2 KB)
  4. part4_of_6.png (379.0 KB)
  5. part5_of_6.png (343.5 KB)
  6. part6_of_6.png (54.4 KB)
```

---

## 🔧 技术栈

- **Puppeteer**: 无头浏览器渲染 HTML/CSS
- **marked**: Markdown 解析器
- **sharp**: 高性能图片处理库
- **Node.js ES Modules**: 使用 import/export 语法

---

## 📝 工作流程

```
MD文件 → mdToImage.js → 完整长图 → splitImageSmart.js → 3:4比例图片×N
```

**详细步骤：**

1. **读取 MD 文件**：解析 Markdown 语法
2. **转换为 HTML**：应用 VSCode 深色主题样式
3. **渲染为图片**：使用 Puppeteer 截图（支持本地图片）
4. **像素分析**：逐行扫描，计算像素方差
5. **智能切割**：在空白区域（低方差）切割
6. **保存图片**：输出完整长图 + 分割图片

---

## 🎯 适用场景

- 📱 移动端阅读优化
- 📸 社交媒体分享（微信、微博、小红书）
- 🎮 游戏攻略图文教程
- 📊 长文内容可视化

---

## 🐛 常见问题

### Q: 为什么标题背景图片不显示？
**A:** 确保 `bg.png` 在 `mdToImg/` 目录，且文件格式正确。工具会自动转换为 `file:///` 绝对路径。

### Q: 分割时可能切到文字怎么办？
**A:** 工具使用像素方差分析，自动检测文字边界。如果找不到理想空白区域，会选择方差最小的位置，尽量减少对文字的影响。

### Q: 最后一片图片太小了？
**A:** 最后一片允许缩小至 800px，这是为了避免内容被截断。可以调整 `SPLIT_CONFIG.minHeight` 参数。

### Q: 遇到 Segmentation fault？
**A:** 这是 Puppeteer/Chromium 的已知问题，通常重新运行即可。建议处理大文件时增加系统内存。

### Q: MD 中的图片没有显示？
**A:** 确保图片路径是相对于 MD 文件的相对路径，工具会自动解析并加载。

---

## 📂 文件说明

| 文件 | 说明 |
|------|------|
| [workflow.js](workflow.js) | 统一工作流脚本（推荐使用） |
| [mdToImage.js](mdToImage.js) | MD 转图片核心功能 |
| [splitImageSmart.js](splitImageSmart.js) | 智能图片分割 |
| [splitImage.js](splitImage.js) | 简单分割（已废弃） |
| [bg.png](bg.png) | H1 标题背景图（可选） |
| [README.md](README.md) | 本文档 |

---

## 📄 VSCode 主题配色

当前使用 **VSCode Dark+ 主题**：

| 元素 | 颜色 | 说明 |
|------|------|------|
| 背景 | `#1e1e1e` | 深蓝灰色 |
| 正文 | `#d4d4d4` | 浅灰色 |
| H1/H2 | `#4ec9b0` | 青色 |
| H3/H4 | `#569cd6` | 蓝色 |
| 代码块 | `#2d2d30` | 深灰背景 |
| 链接 | `#3794ff` | 亮蓝色 |

---

## 📄 License

MIT

---

## 🙏 致谢

- [Puppeteer](https://pptr.dev/)
- [marked](https://marked.js.org/)
- [sharp](https://sharp.pixelplumbing.com/)
