# Markdown 转图片工具

将 Markdown 文件转换为高质量 PNG 图片，支持中文字体和 Emoji 表情。

## 功能特性

- ✅ 完美支持中文字体（微软雅黑）
- ✅ 完美渲染 Emoji 表情
- ✅ **支持嵌入图片** - 自动加载 MD 文件中的图片（相对路径）
- ✅ **移动端优化** - 字体更大（20px），间距更舒适
- ✅ 适配移动端尺寸（1080px 宽度）
- ✅ VSCode 深色主题配色
- ✅ 高分辨率输出（2倍像素）
- ✅ 自动适应内容高度
- ✅ 美观的样式设计

## 使用方法

### 基本用法

```bash
# 在 mdToImg 目录下运行
node mdToImage.js <markdown文件路径> [输出图片路径]
```

### 示例

```bash
# 转换单个文件，输出到当前目录
node mdToImage.js "../translated_guides/玛尔扎哈水晶玫瑰连败转型攻略.md"

# 指定输出路径
node mdToImage.js "../translated_guides/玛尔扎哈水晶玫瑰连败转型攻略.md" "输出图片.png"

# 转换其他目录的文件
node mdToImage.js "../../other/file.md" "./output/result.png"
```

## 配置选项

在 `mdToImage.js` 文件的 `CONFIG` 对象中可以自定义：

```javascript
const CONFIG = {
  // 图片宽度（像素）
  width: 1200,

  // 背景颜色（CSS颜色值）- 当前使用 VSCode 深色主题
  backgroundColor: '#1e1e1e',  // VSCode 深色背景
  // backgroundColor: '#ffffff',  // 白色
  // backgroundColor: '#f5f5f5',  // 浅灰色

  // 字体设置
  fontFamily: 'Microsoft YaHei, Arial, sans-serif',  // 微软雅黑
  fontSize: '16px',
  lineHeight: '1.6',

  // 内边距
  padding: '40px',

  // 输出格式
  imageFormat: 'png',   // 'png' 或 'jpeg'
  imageQuality: 100,    // JPEG 质量 (1-100)
};
```

## 主题配色

当前使用 **VSCode Dark+ 主题**配色方案：

- 背景色：`#1e1e1e` (深蓝灰色)
- 文本颜色：`#d4d4d4` (浅灰色)
- 标题颜色：`#4ec9b0` (青色)
- 强调文本：`#569cd6` (蓝色)
- 代码块背景：`#2d2d30` (深灰色)
- 链接颜色：`#3794ff` (亮蓝色)

完全模仿 VSCode 编辑器的 Markdown 预览效果！

## 样式自定义

脚本中的 `CSS_STYLE` 变量包含了所有样式定义，你可以自定义：

- 标题样式（h1, h2, h3）
- 段落间距
- 列表样式
- 代码块样式
- 引用块样式
- 颜色主题

## 输出说明

- 默认输出格式：PNG（支持透明度，质量更好）
- 分辨率：2倍像素密度（更清晰）
- 宽度：1200px（可配置）
- 高度：自动根据内容调整

## 常见问题

### 如何更改背景颜色？

修改 `CONFIG.backgroundColor` 的值：
- VSCode 深色：`'#1e1e1e'`（当前默认）
- 白色：`'#ffffff'`
- 浅灰：`'#f5f5f5'`
- 纯黑：`'#000000'`

**注意**：如果改为浅色背景，记得同时修改 `CSS_STYLE` 中的文本颜色以确保可读性。

### 如何调整图片宽度？

修改 `CONFIG.width` 的值，例如：
- 小尺寸：`800`
- 中等：`1200`（默认）
- 大尺寸：`1920`

### 如何更换字体？

修改 `CONFIG.fontFamily`，例如：
```javascript
fontFamily: 'SimHei, Arial, sans-serif',  // 黑体
fontFamily: 'SimSun, serif',              // 宋体
```

### 如何输出 JPEG 格式？

修改配置：
```javascript
imageFormat: 'jpeg',
imageQuality: 90,  // 调整质量 (1-100)
```

## 技术栈

- **Puppeteer**: 无头浏览器，负责渲染和截图
- **Marked**: Markdown 解析器，将 MD 转为 HTML
- **Node.js**: 运行环境

## 注意事项

1. 首次运行可能需要等待 Puppeteer 下载 Chromium
2. 确保系统已安装中文字体（Windows 自带微软雅黑）
3. 图片越大，生成时间越长
4. 如遇到字体问题，检查系统是否安装了指定字体

## 输出示例

生成的图片会包含：
- 完整的 Markdown 内容渲染
- 正确显示的中文字符
- 彩色 Emoji 表情
- 美观的排版和间距
- 清晰的 2x 分辨率

## 许可证

MIT
