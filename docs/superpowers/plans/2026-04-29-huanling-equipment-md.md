# Huanling Equipment Markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把用户提供的 Datatft 幻灵装备 HTML 片段整理为可直接发布的 `TFT.md` 图文稿，并通过现有图片工作流验证可读性。

**Architecture:** 实现分为两段。第一段只处理内容整理：把原始网页 DOM 信息抽取成按阶数分段的线性装备卡片，覆盖 `TFT.md`。第二段只做渲染验证：运行现有 `images/workflow.js`，检查主图、属性图标和长图可读性，不修改渲染器代码。

**Tech Stack:** Markdown, 简化 HTML, Node.js ESM, Puppeteer-based image workflow

---

### Task 1: 重建 `TFT.md` 的文档骨架

**Files:**
- Modify: `TFT.md`

- [ ] **Step 1: 清空当前攻略内容，写入新的顶层元数据和标题**

把 `TFT.md` 顶部改成如下骨架：

```md
<!-- tags: 幻灵装备, 装备图鉴, Datatft -->
<!-- cover: comp_image.png -->
<!-- backup: huanling-equipment -->
# 幻灵装备

## 0阶装备

## 1阶装备

## 2阶装备

## 3阶装备

## 4阶装备
```

- [ ] **Step 2: 保持章节顺序只按阶数分组**

按用户提供 HTML 中的原始内容顺序，将装备分别归入：

- `0阶装备`
- `1阶装备`
- `2阶装备`
- `3阶装备`
- `4阶装备`

不得打乱同一阶内部的出现顺序。

### Task 2: 把单个装备整理成统一卡片结构

**Files:**
- Modify: `TFT.md`

- [ ] **Step 1: 定义单个装备卡片模板**

每个装备统一使用如下结构，避免保留原网页三列栅格：

```html
<div>
  <div><img src="装备主图URL" width="42" height="42"> <strong>装备名</strong></div>
  <div>属性：<img src="属性图标URL" width="18" height="18"> +数值 / <img src="属性图标URL" width="18" height="18"> +数值</div>
  <div>效果：原始效果文案</div>
  <div><em>专属加成：原始加成文案</em></div>
  <div><em>额外规则：原始规则文案</em></div>
  <div><u>X阶装备</u></div>
</div>
```

规则：

- 没有的字段直接省略，不写空行
- 图标尺寸固定为小图，不让正文图片样式接管
- 装备主图和属性图标都保留原始 CDN 链接

- [ ] **Step 2: 先整理 0阶与 1阶装备**

根据原始 HTML，至少写入以下装备：

```text
0阶:
- 破损原型
- 泄露原型
- 闪光原型

1阶:
- 附灵飞弹
- 火箭狂潮
- 无情砍削
- 触手重击
```

要求：

- 属性顺序与原 HTML 一致
- 效果、专属加成、规则说明按原文保留

- [ ] **Step 3: 整理 2阶装备**

根据原始 HTML，写入：

```text
- 歼灭者
- 战兔十字弩
- 旋风切割器
- 回响蝠刃
- 冰爆护甲
- 雌狮之怨
- 耀光力场
- 炽烈短弓
- UwU魔爆炮
```

- [ ] **Step 4: 整理 3阶与 4阶装备**

根据原始 HTML，写入：

```text
3阶:
- 幻灵启示录
- 战兔至尊弩炮
- 不息气旋
- 薇恩的炫彩战刃
- 深度冻结
- 猛狮之殇
- 日蚀之刻
- 进化余烬射击
- OwO魔爆炮

4阶:
- 幻灵合体至尊炮
```

### Task 3: 做一次渲染验证

**Files:**
- Modify: `TFT.md`
- Verify: `output/TFT_full.png`
- Verify: `output/TFT_part*_of_*.png`

- [ ] **Step 1: 运行完整工作流**

Run:

```powershell
node .\images\workflow.js .\TFT.md
```

Expected:

- 命令退出码为 `0`
- 生成 `output/TFT_full.png`
- 生成切片图片

- [ ] **Step 2: 检查图片与图标渲染**

检查点：

- 装备主图正常显示
- 属性小图标正常显示
- 单个装备块内没有明显文字重叠
- 分阶章节清晰可辨

- [ ] **Step 3: 如可读性差，优先调整内容排布，不改渲染器**

如果长图可读性不足，只允许在 `TFT.md` 内做以下调整：

- 增加空行分隔
- 拆分过长说明为两行
- 把“专属加成 / 额外规则 / 推荐定位”拆成独立行

不允许：

- 修改 `images/mdToImage.js`
- 修改 `images/workflow.js`

- [ ] **Step 4: 记录最终验证结果**

Run:

```powershell
git diff -- TFT.md
```

Expected:

- diff 只体现 `TFT.md` 的内容覆盖
- 图片工作流输出属于预期产物
