# Reforger 精简攻略改写 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Reddit 话题内容改写为一篇可直接发布的中文精简干货帖，并覆盖 `TFT.md`。

**Architecture:** 先从归档文件提炼稳定结论，压缩为固定的四段式攻略结构，再覆盖 `TFT.md`。最后通过人工校对确认术语、篇幅和结构符合仓库现有 Markdown 输出习惯。

**Tech Stack:** Markdown, Git, 本地仓库术语习惯

---

### Task 1: 重写攻略正文

**Files:**
- Modify: `TFT.md`
- Reference: `archive/reddit-how-to-effectively-use-reforgers-1s7z3jw.md`
- Reference: `docs/superpowers/specs/2026-04-13-reforger-guide-design.md`

- [ ] **Step 1: 先清空旧内容并写入新的元数据与标题骨架**

```markdown
<!-- tags: 云顶之弈,S14,装备教学,Reforger -->
<!-- cover: comp_image.png -->
<!-- backup: reforger-guide -->
# Reforger 怎么用

## 💡 一句话结论

> **重铸器不是乱赌工具，它最值钱的时候，是帮你把死装备、差徽章和重复功能装变成当前能用的战力。**
```

- [ ] **Step 2: 写入“什么时候该用”章节，保留即时战力与阵容适配两个判断**

```markdown
## ⚔️ 什么时候该用

- 当前散件和阵容明显不匹配，比如 **AP 盘多大剑**、**AD 盘多大棒或眼泪**。
- 你在连胜，或者这回合急需补 **重伤**、**破甲**、前排装这类功能件。
- 前期为了保血先合了过渡装，后期主力成型后，这些装备已经跟终盘不匹配。

<u>核心原则不是赌更胡，而是把低价值资源转成当前战力。</u>
```

- [ ] **Step 3: 写入“最值得洗的目标”章节，聚焦三类高价值对象**

```markdown
## 🎒 最值得洗的目标

- **死散件**：最常见，也最好用。洗掉当前阵容最不想要的那个组件。
- **差徽章 / 差转职**：完全不贴阵容的徽章，通常比死捏着更亏。
- **重复功能装**：已经有重伤、破甲后，再来同类装备就可以考虑重铸。

如果你这盘拿到多个没用徽章，Reforger 的价值会明显抬高。
```

- [ ] **Step 4: 写入“什么时候别乱用”和口诀总结，结束全文**

```markdown
## 🚫 什么时候别乱用

- 当前装备本来就能顺着你的阵容走，没必要为了“可能更好”去拆节奏。
- 别把 Reforger 当纯随机器用，能明确知道自己在洗什么，再按下去。
- 如果只是贪理论最优，结果拖到该合装的时候还不合，通常更亏。

## 🏆 口诀总结

- **先看阵容缺什么，再看手里废什么。**
- **优先洗死散件、差徽章、重复功能装。**
- **能换即时战力就用，已经很顺就别硬赌。**

来源: Reddit
```

- [ ] **Step 5: 保存并检查完整文稿是否控制在精简篇幅**

Run: `Get-Content -Path 'D:\code\TFT\TFT.md'`
Expected: 文件只包含一篇围绕 Reforger 的短篇中文攻略，没有遗留旧主题内容。

### Task 2: 术语与结果校验

**Files:**
- Verify: `TFT.md`
- Reference: `docs/terms/en_to_zh.csv`

- [ ] **Step 1: 人工检查标题、术语和结论是否与原帖边界一致**

重点检查:

```text
Reforger -> 重铸器 / 重铸器用法
Emblem / Trait emblem -> 徽章 / 转职类表达
不要加入未在原帖稳定出现的数值、版本判断或阵容示例
```

- [ ] **Step 2: 复查 Markdown 结构是否符合仓库现有输出习惯**

Run: `Get-Content -Path 'D:\code\TFT\TFT.md'`
Expected: 包含封面元数据、1 个一级标题、3 到 4 个二级标题、结尾来源声明。

- [ ] **Step 3: 查看工作区差异，确认只改了目标文件**

Run: `git diff -- TFT.md`
Expected: diff 仅展示 `TFT.md` 被改写为 Reforger 精简攻略，没有意外修改其他文件。
