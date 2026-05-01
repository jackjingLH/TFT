# Image Style Tuning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 调整图片生成与切图补边的局部样式，让标签更突出、长图尾部保持紫色延展，并让补色更贴近切片真实边缘。

**Architecture:** 方案分成两块。第一块只修改 `images/mdToImage.js` 里的主题变量和 CSS 生成逻辑，维持当前赛博紫主题但优化标签和页面根背景。第二块只修改 `images/splitImageSmart.js` 里的边缘取色函数，把大范围均值改成窄条边缘采样，然后用现有 `images/workflow.js` 做端到端回归验证。

**Tech Stack:** Node.js ESM, Puppeteer, Sharp, Markdown-to-image pipeline

---

### Task 1: 调整 `mdToImage.js` 的标签样式和长图背景

**Files:**
- Modify: `images/mdToImage.js`
- Verify: `output/TFT_full.png`

- [ ] **Step 1: 先记录当前样式基线**

Run:

```powershell
node .\images\workflow.js .\TFT.md
```

Expected:

- 命令退出码为 `0`
- 生成 `output/TFT_full.png`
- 可以肉眼确认当前标签与标题背景接近、长图尾部偏黑的现状

- [ ] **Step 2: 修改主题颜色，给标签单独的粉色视觉层**

在 `images/mdToImage.js` 的 `THEME` 对象里，保留整体紫色主题，只新增或调整标签相关的粉色高亮色。例如：

```js
const THEME = {
  baseBg: '#1B1330',
  bodyBg: '#161024',
  panel: '#231C39',
  panelRaised: '#2D2550',
  panelEdge: '#4B4996',
  text: '#F4EEFF',
  muted: '#D5CFF3',
  title: '#FFF38A',
  purpleLight: '#A589F2',
  purpleDeep: '#4B4996',
  auroraGreen: '#B1FF91',
  accentPink: '#FF8E8E',
  tagPinkTop: '#FF9CCB',
  tagPinkBottom: '#F062A6',
  border: 'rgba(165, 137, 242, 0.34)',
  borderSoft: 'rgba(244, 238, 255, 0.08)',
  glow: 'rgba(165, 137, 242, 0.28)',
  shadow: 'rgba(9, 8, 24, 0.46)',
};
```

- [ ] **Step 3: 修改 `generateCSS()` 里的根背景渐变**

把 `html` 的背景从“较快落入近黑色”调整成“更长的紫色纵向渐变”。实现时只改背景层，不改结构。例如：

```css
html {
  background-color: var(--base-bg);
  background-image:
    radial-gradient(circle at 20% 2%, rgba(165, 137, 242, 0.48) 0%, rgba(98, 78, 180, 0.28) 30%, transparent 58%),
    radial-gradient(circle at 82% 14%, rgba(255, 142, 142, 0.16) 0%, transparent 28%),
    radial-gradient(circle at 78% 72%, rgba(177, 255, 145, 0.10) 0%, transparent 18%),
    linear-gradient(180deg, #23163E 0%, #1A1331 38%, #151024 72%, #130E20 100%);
  background-attachment: fixed;
}
```

- [ ] **Step 4: 修改 `.tag` 样式，不再复用标题同系深紫块**

在 `generateCSS()` 中只调整 `.tag` 相关样式，让标签成为偏粉的高亮胶囊块。例如：

```css
.tag {
  display: inline-block;
  font-family: 'Russo One', ${CONFIG.fontFamily};
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 1px;
  color: #2A1330;
  background: linear-gradient(180deg, var(--tag-pink-top) 0%, var(--tag-pink-bottom) 100%);
  padding: 8px 18px;
  border: 1px solid rgba(255, 214, 235, 0.50);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.30),
    0 8px 20px rgba(240, 98, 166, 0.22);
}
```

同时在 `:root` 里补上：

```css
--tag-pink-top: ${THEME.tagPinkTop};
--tag-pink-bottom: ${THEME.tagPinkBottom};
```

- [ ] **Step 5: 运行工作流，确认样式改动已生效**

Run:

```powershell
node .\images\workflow.js .\TFT.md
```

Expected:

- 命令退出码为 `0`
- `output/TFT_full.png` 成功更新
- 标签比原来更亮、更大，并与标题背景明显区分
- 长图底部仍是紫色延展，不出现大块黑底

### Task 2: 收紧 `splitImageSmart.js` 的顶部和底部补色采样

**Files:**
- Modify: `images/splitImageSmart.js`
- Verify: `output/TFT_part*_of_*.png`

- [ ] **Step 1: 提取共享的边缘采样函数**

在 `images/splitImageSmart.js` 里新增一个只负责“从切片边缘窄条取平均色”的辅助函数，避免 `extractTopColor()` 和 `extractBottomColor()` 重复实现。目标接口：

```js
async function extractEdgeColor(imagePath, { left = 0, top, width, height }) {
  const region = await sharp(imagePath)
    .extract({
      left: Math.floor(left),
      top: Math.floor(top),
      width: Math.floor(width),
      height: Math.floor(height),
    })
    .raw()
    .toBuffer();

  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = region.length / 3;

  for (let i = 0; i < region.length; i += 3) {
    r += region[i];
    g += region[i + 1];
    b += region[i + 2];
  }

  return {
    r: Math.round(r / pixels),
    g: Math.round(g / pixels),
    b: Math.round(b / pixels),
    alpha: 1,
  };
}
```

- [ ] **Step 2: 改写顶部补色逻辑，只取顶部贴边 1 到 2 像素**

把当前 `extractTopColor()` 里“向内偏移 50px，再取 50 行，再做中段筛选”的逻辑删掉，改成直接取切片顶部向内的极窄区域。例如：

```js
async function extractTopColor(imagePath, extractTop, width) {
  try {
    return await extractEdgeColor(imagePath, {
      top: extractTop,
      left: 0,
      width,
      height: 2,
    });
  } catch (error) {
    console.log(`  ! 无法提取顶部颜色，使用默认值`);
    return { r: 30, g: 30, b: 30, alpha: 1 };
  }
}
```

- [ ] **Step 3: 改写底部补色逻辑，只取底部贴边 1 到 2 像素**

把当前 `extractBottomColor()` 里“向上偏移 50px，再取 50 行”的逻辑删掉，改成直接取切片底边向上的极窄区域，并保证 `top` 不越界。例如：

```js
async function extractBottomColor(imagePath, extractTop, extractHeight, width) {
  try {
    const sampleHeight = Math.min(2, extractHeight);
    const sampleTop = extractTop + extractHeight - sampleHeight;

    return await extractEdgeColor(imagePath, {
      top: sampleTop,
      left: 0,
      width,
      height: sampleHeight,
    });
  } catch (error) {
    console.log(`  ! 无法提取底部颜色，使用默认值`);
    return { r: 30, g: 30, b: 30, alpha: 1 };
  }
}
```

- [ ] **Step 4: 运行工作流，确认切图补色更贴边**

Run:

```powershell
node .\images\workflow.js .\TFT.md
```

Expected:

- 命令退出码为 `0`
- 分割图重新生成
- 控制台能正常走完切片和填充流程
- 被补高的切片顶部和底部填充更接近原图边缘颜色

### Task 3: 做一次完整回归检查并收尾

**Files:**
- Review: `output/TFT_full.png`
- Review: `output/TFT_part1_of_*.png`
- Review: `output/TFT_part*_of_*.png`

- [ ] **Step 1: 目测检查整张长图**

检查点：

- 标签是否为偏粉色高亮块
- 标签字号是否明显大于旧版本
- 长图底部是否仍保留紫色主题

- [ ] **Step 2: 目测检查补高切片**

检查点：

- 第一张或最后一张若有补边，填充色是否贴近边缘
- 非满高切片的上下填充是否不再显得“取样过宽”

- [ ] **Step 3: 记录验证命令与结果**

Run:

```powershell
node .\images\workflow.js .\TFT.md
```

Expected:

- 命令退出码为 `0`
- 生成 `output/metadata.json`
- 生成 `output/TFT_full.png`
- 生成全部分割图

- [ ] **Step 4: 提交本地改动前复查 diff**

Run:

```powershell
git diff -- images/mdToImage.js images/splitImageSmart.js docs/superpowers/specs/2026-04-28-image-style-tuning-design.md docs/superpowers/plans/2026-04-28-image-style-tuning.md
```

Expected:

- diff 只包含本次局部样式与计划文档相关改动
- 没有无关文件被误改
