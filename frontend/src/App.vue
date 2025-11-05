<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <el-row type="flex" align="middle" :gutter="0" class="header-row">
        <el-col :style="{ flex: '0 0 160px' }">
          <div class="title">翻译助手</div>
        </el-col>
        <el-col :style="{ flex: '0 0 200px' }">
          <div class="tools">🌙</div>
        </el-col>
        <el-col :style="{ flex: '1 1 auto' }"></el-col>
        <el-col :style="{ flex: '0 0 100px' }">
          <div class="kill-all-button">
            <div class="kill-all-button-text">x</div>
          </div>
        </el-col>
      </el-row>
    </el-header>

    <div class="main-content">
      <!-- 第1列：左侧栏 -->
      <div class="sidebar" :style="{ width: sidebarWidth + 'vw' }">
        <div class="nav-bar">
          <el-button @click="activeTab = 'files'">📁</el-button>
          <el-button @click="activeTab = 'knowledgeBase'">📚</el-button>
          <el-button class="nav-btn">⚙️</el-button>
        </div>
        <FileUloadPanel />
      </div>

      <!-- 第2列：分隔条（可拖动） -->
      <div class="resizer" @mousedown="startResize('sidebar', $event)"></div>

      <!-- 第3列：原文区 -->
      <div class="original-panel">原文区域</div>

      <!-- 第4列：分隔条（可拖动） -->
      <div class="resizer" @mousedown="startResize('translated', $event)"></div>

      <!-- 第5列：译文区 -->
      <div class="translated-panel" :style="{ width: translatedWidth + 'vw' }">译文区域</div>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";

const activeTab = ref("files");

//拖动
// 列宽度（单位：px）
const sidebarWidth = ref(20); // 左侧栏初始宽度
const translatedWidth = ref(40); // 原文区初始宽度
// 译文区自动填充剩余空间，不需要变量

// 拖动相关
const isResizing = ref(false);
const resizingTarget = ref<"sidebar" | "translated" | null>(null);
const startX = ref(0);
const startWidth = ref(0);

// 开始拖动
function startResize(target: "sidebar" | "translated", event: MouseEvent) {
  isResizing.value = true;
  resizingTarget.value = target;
  startX.value = event.clientX;

  // 记录当前宽度
  if (target === "sidebar") {
    startWidth.value = sidebarWidth.value;
  } else {
    startWidth.value = translatedWidth.value;
  }
  // 👇 添加这两行：强制整个页面使用 col-resize 光标
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none"; // 防止选中文字

  // 添加全局监听
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);

  // 防止选中文字
  event.preventDefault();
}

// 拖动中
function handleResize(event: MouseEvent) {
  if (!isResizing.value || !resizingTarget.value) return;

  const deltaX = event.clientX - startX.value;
  const deltaVw = (deltaX / window.innerWidth) * 100;
  // 设置最小宽度，避免拖得太小
  const minWidth = 10;
  const maxWidth = 50;

  if (resizingTarget.value === "sidebar") {
    const newWidth = startWidth.value + deltaVw;
    sidebarWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
  } else if (resizingTarget.value === "translated") {
    const newWidth = startWidth.value - deltaVw; // 👈 这里改成减号
    translatedWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
  }
}

// 停止拖动
function stopResize() {
  isResizing.value = false;
  resizingTarget.value = null;

  // 👇 这里恢复默认光标（取消强制）
  document.body.style.cursor = "";
  document.body.style.userSelect = "";

  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
}
</script>

<style scoped>
.app-container {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: red;
}

.app-header {
  padding: 0;
  margin: 0;
  background-color: #000;
}

.header-row {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0 12px;
}

.title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kill-all-button {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.kill-all-button-text {
  font-size: 18px;
  color: #fff;
}

.nav-bar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #252525;
  border-bottom: 1px solid #333;
}

/* 导航按钮默认样式 */
.nav-btn {
  flex: 1;
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

/* 鼠标悬停效果（你要的变亮） */
.nav-btn:hover {
  background: #333;
  color: #fff;
}

/* 主内容区（替代 el-row） */
.main-content {
  display: flex;
  height: 100%;
  background-color: #1e1e1e;
}

/* 左侧栏 */
.sidebar {
  flex-shrink: 0; /* 不自动缩小 */
  background: #252525;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 原文区（自动填充剩余空间） */
.original-panel {
  flex: 1; /* 👈 改成自动填充 */
  background: #1e1e1e;
  overflow-y: auto;
  padding: 16px;
  color: #fff;
}

/* 译文区（固定宽度） */
.translated-panel {
  flex-shrink: 0; /* 👈 改成不缩小，保持固定宽度 */
  background: #1a1a1a;
  overflow-y: auto;
  padding: 16px;
  color: #fff;
}

/* 分隔条（可拖动） */
.resizer {
  width: 4px; /* 👈 很细，只有4px */
  background: #333;
  cursor: col-resize; /* 👈 鼠标变成左右箭头 */
  flex-shrink: 0;
  transition: background 0.2s;
}

/* 鼠标悬停时高亮 */
.resizer:hover {
  background: #007acc; /* 蓝色高亮，像 VS Code */
}

/* 拖动时的效果 */
.resizer:active {
  background: #007acc;
}

/* 内容区（你原来的） */
.content-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
</style>
