<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <el-row type="flex" align="middle" :gutter="0" class="header-row">
        <el-col :style="{ flex: '0 0 160px' }">
          <div class="title">翻译助手</div>
        </el-col>
        <el-col :style="{ flex: '0 0 220px' }">
          <div class="tools">
            <el-space :size="8">
              <!-- 主题切换：浅色 / 深色 -->
              <el-tooltip :content="isDark ? '切换到日间模式' : '切换到夜间模式'">
                <el-button circle :type="isDark ? 'primary' : 'default'" @click="isDark = !isDark">
                  <el-icon>
                    <Moon v-if="isDark" />
                    <Sunny v-else />
                  </el-icon>
                </el-button>
              </el-tooltip>

              <!-- 同步滚动：联动 / 取消联动（仅翻译视图有效） -->
              <el-tooltip :content="syncEnabled ? '已开启同步滚动' : '点击开启同步滚动'">
                <el-button circle :type="syncEnabled ? 'primary' : 'default'" @click="syncEnabled = !syncEnabled">
                  <el-icon>
                    <Link v-if="syncEnabled" />
                    <SwitchButton v-else />
                  </el-icon>
                </el-button>
              </el-tooltip>
            </el-space>
          </div>
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
      <!-- 最左侧 Activity Bar：切换不同工作模式 -->
      <div class="activity-bar">
        <div class="activity-item" :class="{ active: activeView === 'translate' }" @click="activeView = 'translate'"
          title="文档翻译">
          <el-icon>
            <DocumentCopy />
          </el-icon>
        </div>
        <div class="activity-item" :class="{ active: activeView === 'kb' }" @click="activeView = 'kb'" title="知识库管理">
          <el-icon>
            <DataLine />
          </el-icon>
        </div>
        <div class="activity-item" :class="{ active: activeView === 'model' }" @click="activeView = 'model'"
          title="模型配置">
          <el-icon>
            <Setting />
          </el-icon>
        </div>
      </div>

      <!-- 中间侧边栏：随视图变化 -->
      <div class="sidebar" :style="{ width: sidebarWidth + 'vw' }">
        <!-- 翻译视图侧边栏：上传 + 文件树 -->
        <template v-if="activeView === 'translate'">
          <div class="sidebar-header">
            <span>文档</span>
          </div>
          <div class="file-content">
            <div class="file-upload-panel">
              <FileUloadPanel />
            </div>
            <div class="file-tree">
              <FileTree />
            </div>
          </div>
        </template>

        <!-- 知识库视图侧边栏：预留为数据源/任务列表等 -->
        <template v-else-if="activeView === 'kb'">
          <KnowledgeBaseSidebar></KnowledgeBaseSidebar>
        </template>

        <!-- 模型配置视图侧边栏：可以放快捷说明或留空 -->
        <template v-else-if="activeView === 'model'">
          <div class="sidebar-header">
            <span>模型配置</span>
          </div>
          <div class="sidebar-body">
            <p class="sidebar-tip">在右侧配置当前使用的模型和参数。</p>
          </div>
        </template>
      </div>

      <!-- 左侧分隔条（可拖动） -->
      <div class="resizer" @mousedown="startResize('sidebar', $event)"></div>

      <!-- 右侧工作区：随视图切换 -->
      <div class="workbench">
        <!-- 翻译工作台 -->
        <template v-if="activeView === 'translate'">
          <TabBar />

          <div class="dual-pane">
            <!-- 原文区：自动填充剩余空间 -->
            <div class="original-wrapper">
              <OriginalPanel ref="originalRef" />
            </div>

            <!-- 内部分隔条（可拖动） -->
            <div class="inner-resizer" @mousedown="startResize('translated', $event)"></div>

            <!-- 译文区：宽度用 vw 绑定，flex: 0 0 auto 确保宽度被精确控制 -->
            <div class="translated-wrapper" :style="{ width: translatedWidth + 'vw', flex: '0 0 auto' }">
              <TranslationPanel ref="translatedRef" />
            </div>
          </div>
        </template>

        <!-- 知识库管理视图（RAG 管理） -->
        <template v-else-if="activeView === 'kb'">
          <KnowledgeBaseView></KnowledgeBaseView>
        </template>

        <!-- 模型配置视图 -->
        <template v-else-if="activeView === 'model'">
          <div class="model-view">
            <ModelConfigPanel />
          </div>
        </template>
      </div>
    </div>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import OriginalPanel from "@/components/Translate/OriginalPanel.vue";
import TranslationPanel from "@/components/Translate/TranslationPanel.vue";
import FileTree from "@/components/Translate/FileTree.vue";
import FileUloadPanel from "@/components/Translate/FileUloadPanel.vue";
import TabBar from "./components/Translate/TabBar.vue";
import { useSegmentScrollSync } from "@/composables/useSegmentScrollSync";
import ModelConfigPanel from "@/components/modelConfig/ModelConfigPanel.vue";
import { useThemeStore } from "@/stores/themestore";
import {
  Sunny,
  Moon,
  Link,
  SwitchButton,
  DocumentCopy,
  DataLine,
  Setting,
} from "@element-plus/icons-vue";
import KnowledgeBaseView from "@/components/KnowledgeBase/KnowledgeBaseView.vue";
import c from "./components/KnowledgeBase/KnowledgeBaseSidebar.vue";
import KnowledgeBaseSidebar from "./components/KnowledgeBase/KnowledgeBaseSidebar.vue";

const originalRef = ref<any>(null);
const translatedRef = ref<any>(null);

// 是否开启同步：默认 true（仅翻译模式有意义）
const syncEnabled = ref(true);
const { refreshLayouts } = useSegmentScrollSync(originalRef, translatedRef, {
  enabled: syncEnabled,
});

// 顶层视图：翻译 / 知识库 / 模型配置
const activeView = ref<"translate" | "kb" | "model">("translate");

// 宽度用 vw 单位值（数字）
const sidebarWidth = ref(20); // 中间侧边栏初始宽度（vw）
const translatedWidth = ref(40); // 译文区初始宽度（vw）

// 拖动相关
const isResizing = ref(false);
const resizingTarget = ref<"sidebar" | "translated" | null>(null);
const startX = ref(0);
const startWidth = ref(0);

const themeStore = useThemeStore();
const isDark = computed({
  get: () => themeStore.theme === "dark",
  set: (val: boolean) => themeStore.setTheme(val ? "dark" : "light"),
});

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
  // 拖动结束后，通知两侧 Panel 重新测量段落高度（只影响 Y 轴）
  refreshLayouts();
}
</script>

<style scoped>
.app-container {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: var(--bg-app);
}

.app-header {
  padding: 0;
  margin: 0;
  background-color: var(--bg-header);
  height: 32px;
}

/* 主内容区：Activity Bar + Sidebar + Workbench */
.main-content {
  display: flex;
  height: calc(100% - 32px);
  background-color: var(--bg-main);
  min-height: 0;
}

/* Activity Bar：最左侧窄栏 */
.activity-bar {
  width: 48px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 6px;
  flex-shrink: 0;
}

.activity-item {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  border-left: 2px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.activity-item.active {
  color: var(--accent-color);
  border-left-color: var(--accent-color);
  background-color: rgba(0, 0, 0, 0.04);
}

.activity-item .el-icon {
  font-size: 20px;
}

.activity-spacer {
  flex: 1;
}

/* 中间侧边栏 */
.sidebar {
  flex-shrink: 0;
  background: var(--bg-sidebar);
  overflow: auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.sidebar-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border-color);
  text-transform: uppercase;
}

.sidebar-body {
  padding: 12px;
}

.sidebar-tip {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.file-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.file-upload-panel {
  flex: 0 0 auto;
  padding: 8px 8px 0;
  position: relative;
  /* ✅ 新增 */
  z-index: 2;
  /* ✅ 新增：让上传区域在上 */
}

.file-tree {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px;
  position: relative;
  /* 可选 */
  z-index: 1;
  /* 可选：比上传区低 */
}

/* 左侧分隔条（Sidebar 与 Workbench） */
.resizer {
  width: 6px;
  background: #333;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background 0.15s;
  height: 100%;
  position: relative;
  z-index: 10;
}

.resizer:hover {
  background: #007acc;
}

/* 工作区：占剩余宽度 */
.workbench {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background-color: var(--bg-workbench);
}

/* 翻译模式：双面板容器 */
.dual-pane {
  display: flex;
  flex: 1;
  min-height: 0;
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
  position: relative;
  z-index: 10;
}

.inner-resizer:hover {
  background: #007acc;
}

/* 译文区：固定由绑定的宽度控制 */
.translated-wrapper {
  flex-shrink: 0;
  min-width: 0;
  overflow: hidden;
}

.tools {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

/* 模型配置视图主区域 */
.model-view {
  flex: 1;
  padding: 16px 20px;
  overflow: auto;
}
</style>
