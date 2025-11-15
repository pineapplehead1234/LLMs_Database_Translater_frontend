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
      <!-- 左侧栏 -->
      <div class="sidebar" :style="{ width: sidebarWidth + 'vw' }">
        <div class="nav-bar">
          <el-button @click="activeTab = 'files'">📁</el-button>
          <el-button @click="activeTab = 'knowledgeBase'">📚</el-button>
          <el-button class="nav-btn">⚙️</el-button>
        </div>
        <div class="file-content">
          <div class="file-upload-panel"><FileUloadPanel /></div>
          <div class="file-tree"><FileTree /></div>
        </div>
      </div>

      <!-- 左侧分隔条（可拖动） -->
      <div class="resizer" @mousedown="startResize('sidebar', $event)"></div>

      <!-- 工作区（占剩余宽度） -->
      <div class="workbench">
        <div class="tabbar">标签区域</div>

        <div class="dual-pane">
          <!-- 原文区：自动填充剩余空间 -->
          <div class="original-wrapper">
            <OriginalPanel />
          </div>

          <!-- 内部分隔条（可拖动） -->
          <div class="inner-resizer" @mousedown="startResize('translated', $event)"></div>

          <!-- 译文区：宽度用 vw 绑定，flex: 0 0 auto 确保宽度被精确控制 -->
          <div
            class="translated-wrapper"
            :style="{ width: translatedWidth + 'vw', flex: '0 0 auto' }"
          >
            <TranslationPanel />
          </div>
        </div>
      </div>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import OriginalPanel from "@/components/OriginalPanel.vue";
import TranslationPanel from "@/components/TranslationPanel.vue";
import FileTree from "@/components/FileTree.vue";
import FileUloadPanel from "@/components/FileUloadPanel.vue";
const activeTab = ref("files");

// 宽度用 vw 单位值（数字）
const sidebarWidth = ref(20); // 左侧栏初始宽度（vw）
const translatedWidth = ref(40); // 译文区初始宽度（vw）

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

  if (target === "sidebar") {
    startWidth.value = sidebarWidth.value;
  } else {
    startWidth.value = translatedWidth.value;
  }

  // 强制光标与禁止选中
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";

  // 全局监听
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);

  event.preventDefault();
}

// 拖动中
function handleResize(event: MouseEvent) {
  if (!isResizing.value || !resizingTarget.value) return;

  const deltaX = event.clientX - startX.value;
  // delta 换算成 vw（百分比宽度）
  const deltaVw = (deltaX / window.innerWidth) * 100;
  const minWidth = 8; // 最小宽度（vw）
  const maxWidth = 80; // 最大宽度（vw）

  if (resizingTarget.value === "sidebar") {
    const newWidth = startWidth.value + deltaVw;
    sidebarWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
  } else if (resizingTarget.value === "translated") {
    // 译文区：鼠标向右移动 -> translatedWidth 应该增大，向左移动 -> 减小
    // 但因为 inner-resizer 在原文左侧，计算方式如下（这是更直观的处理）：
    const newWidth = startWidth.value - deltaVw;
    translatedWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
  }
}

// 停止拖动
function stopResize() {
  isResizing.value = false;
  resizingTarget.value = null;

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
  overflow: hidden;
}

.app-header {
  padding: 0;
  margin: 0;
  background-color: #000;
  height: 56px;
}

/* 主内容区 */
.main-content {
  display: flex;
  height: calc(100% - 56px);
  background-color: #1e1e1e;
  min-height: 0;
}

/* 左侧栏 */
.sidebar {
  flex-shrink: 0;
  background: #252525;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

/* 左侧分隔条 */
.resizer {
  width: 6px;
  background: #333;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
  height: 100%;
  z-index: 5;
}
.resizer:hover {
  background: #007acc;
}

/* 工作区：占剩余宽度 */
.workbench {
  display: flex;
  flex-direction: column;
  flex: 1; /* 占剩余空间 */
  min-width: 0;
}

/* tabbar */
.tabbar {
  height: 40px;
  border-bottom: 1px solid #2a2a2a;
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #ddd;
}

/* 双面板容器 */
.dual-pane {
  display: flex;
  flex: 1;
  min-height: 0; /* 必须：让子滚动条正常工作 */
  min-width: 0;
}
.original-wrapper {
 flex: 1 1 auto;
 min-width: 200px;
 display: flex;
 overflow: hidden;
}

/* 内部分隔条（译文区左侧） */
.inner-resizer {
  width: 6px;
  background: #333;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
  height: 100%;
  z-index: 6; /* 保证在内容之上 */
}
.inner-resizer:hover {
  background: #007acc;
}

/* 译文区：固定由绑定的宽度控制 */
/* 译文区外层容器：固定由绑定的宽度控制 */
.translated-wrapper {
  flex-shrink: 0;
  min-width: 0;
  overflow: hidden; /* 改为hidden，让内部组件处理滚动 */
}

/* 其余样式略过（保持你原来的） */
.nav-bar {
  display: flex;
  gap: 4px;
  padding: 8px;
  background: #252525;
  border-bottom: 1px solid #333;
}
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
.nav-btn:hover {
  background: #333;
  color: #fff;
}

.file-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.file-upload-panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.file-tree {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
