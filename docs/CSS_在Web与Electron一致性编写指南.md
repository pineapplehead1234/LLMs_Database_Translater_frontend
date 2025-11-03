## CSS 在 Web 与 Electron 一致性编写指南（前端实用版）

目标：让你在浏览器里看到的样式，打包到 Electron 后也尽量一致，避免“高度变化/被拉伸/比例怪异/滚动条挤压”等问题。

---

### 1 视口与布局基线
- 用 flex 架构页面，减少绝对像素高度对窗口变化的敏感度。
- 让根节点撑满视口，内容区可滚动，不被 header/footer 挤压。

```css
html, body, #app { height: 100%; margin: 0; }

#app {
  display: flex;
  flex-direction: column;  /* 头-体-尾 */
  min-height: 100vh;       /* 视口高度基线 */
}

.header { height: 56px; flex: 0 0 auto; }
.footer { height: 40px; flex: 0 0 auto; }
.content {
  flex: 1 1 auto;
  min-height: 0;           /* 关键：允许在 Flex 中正确滚动 */
  overflow: auto;
}
```

实战要点：
- 子容器在 flex 布局下需要 `min-height: 0` 才会把溢出交给滚动条。
- 窗口尺寸变化不应挤乱内容区；用 `flex: 1` 而非固定 px 高度。

---

### 2) 单位选择与排版基线
- 字体基线：`html { font-size: 16px; }`，间距尺寸优先用 `rem`，控件尺寸可用 `rem` 或 `px`。
- 避免依赖“1px 细线”的绝对视觉效果（不同 DPI 会不同），用半透明边或 `box-shadow` 取代。
- 容器宽度用 `%/fr`（Grid）或 `flex-basis`，减少魔法数字。

```css
html { font-size: 16px; }
:root {
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem;  /* 8px */
  --space-3: 1rem;    /* 16px */
}
.card { padding: var(--space-3); border-radius: 0.5rem; }
```

---

### 3) DPI/系统缩放与页面缩放
- Electron 使用 Chromium 渲染，和 Chrome 一致。建议固定页面缩放为 1.0，样式层用相对单位适配 100%/125%/150% 系统缩放。
- 测试时至少覆盖 Windows 显示缩放 100%/125%/150%。

Electron 主进程（示例，仅供认知）：
```js
// BrowserWindow 建议
const win = new BrowserWindow({
  width: 1280,
  height: 800,
  useContentSize: true,      // 以内容区为准，避免边框影响
  webPreferences: { zoomFactor: 1.0 }
})
win.webContents.setZoomFactor(1.0)
win.webContents.setVisualZoomLevelLimits(1, 1) // 可选：禁用手势缩放
```

---

### 4) 标题栏/菜单对高度的影响
- 使用系统标题栏（`frame: true`）时，网页内容区高度不受影响。
- 自定义标题栏（`frame: false` 或 `titleBarOverlay: true`）时，需要在页面顶部预留同等高度的内边距。

```css
/* 若开启了自定义标题栏，给 body 或 #app 顶部预留空间 */
.has-overlay { padding-top: 32px; }
/* 可视需要用变量抽象：--titlebar-height: 32px; */
```

---

### 5) 滚动条与布局抖动
- Windows 滚动条会占据宽度，导致“表格/卡片微抖”。
- 使用 `scrollbar-gutter: stable;` 或给滚动容器预留空间，保持布局稳定。

```css
.content { scrollbar-gutter: stable; }

/* 可选：自定义滚动条（Chromium 专属） */
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: rgba(0,0,0,.25); border-radius: 6px; }
*::-webkit-scrollbar-track { background: transparent; }
```

---

### 6) 字体与图标
- 指定稳定的字体栈，减少不同系统字体带来的行高变化；图标优先 SVG。

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
               'Noto Sans', 'Microsoft YaHei', Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
}
```

---

### 7) 资源路径与构建
- Vite 生产构建时将 `base` 设为 `./`，CSS 内 `url()` 资源使用相对路径，以便 Electron `loadFile` 能正确加载。

```ts
// vite.config.ts（关键）
export default defineConfig({
  base: './'
})
```

---

### 8) 响应式与最小窗口
- 设定最小窗口，避免被拖拽到太小导致布局拥挤；组件容器对小宽度做断点调整。

```css
@media (max-width: 1024px) {
  .sidebar { display: none; }
  .content { padding: var(--space-2); }
}
```

---

### 9) 常见问题速查
- 去掉浏览器地址栏后会“变高/变形”？
  - 不会。Electron 内容区高度由窗口决定，按上面的 flex + 100vh 基线布局即可稳定。
- 表格/列表在 Windows 上“时宽时窄”？
  - 给滚动容器加 `scrollbar-gutter: stable;`，或固定一列留白避免抖动。
- HiDPI 下边框看起来粗细不一？
  - 避免硬性 1px 细线，用半透明或阴影营造细线感。
- 自定义标题栏遮住了页面顶部？
  - 给根容器加顶部内边距（如 32px），或关闭 overlay。

---

### 10) 最小模板（可直接套用）
```css
/* 视口与 Flex 基线 */
html, body, #app { height: 100%; margin: 0; }
#app { display: flex; flex-direction: column; min-height: 100vh; }
.header { height: 56px; flex: 0 0 auto; }
.content { flex: 1 1 auto; min-height: 0; overflow: auto; scrollbar-gutter: stable; }

/* 字体与单位基线 */
html { font-size: 16px; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans', 'Microsoft YaHei', Arial, sans-serif; }
:root { --space-1: .25rem; --space-2: .5rem; --space-3: 1rem; }

/* 自定义标题栏时启用 */
/* .has-overlay { padding-top: 32px; } */

/* 滚动条优化（可选） */
*::-webkit-scrollbar { width: 10px; height: 10px; }
*::-webkit-scrollbar-thumb { background: rgba(0,0,0,.25); border-radius: 6px; }
*::-webkit-scrollbar-track { background: transparent; }
```

---

### 11) 开发自测清单（建议勾选）
- [ ] Windows 显示缩放 100%/125%/150% 下页面布局无明显错位
- [ ] 最小窗口（如 1024×700）布局可用，滚动正常
- [ ] 带/不带自定义标题栏时，顶部内容不被遮挡
- [ ] 滚动条出现时布局不抖动；表格/列表列宽稳定
- [ ] 字体与图标在不同 DPI 下视觉一致、未糊
- [ ] 生产构建后，Electron `loadFile` 能正确加载 CSS 与资源


