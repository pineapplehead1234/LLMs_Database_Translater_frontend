<template>
  <div class="translated-panel">
    <!-- 空状态提示 -->
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无译文内容</div>
      <div class="empty-hint">请先上传并翻译文件</div>
    </div>
    <!-- 分段内容显示 -->
    <div v-else class="segments">
      <div v-for="(text, segmentId) in translatedMarkdown" :key="segmentId" class="segment">
        <div class="segment-header">
          <span class="segment-number">段落 {{ segmentId }}</span>
        </div>
        <div class="segment-content">{{ text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslationStore } from "@/stores/translationStore";
import { computed } from "vue";

// 获取Store实例
const store = useTranslationStore();

// 计算属性：获取译文数据（区别1：读取translatedMarkdown）
const translatedMarkdown = computed(() => {
  return store.currentFile?.translatedMarkdown || {};
});

// 计算属性：判断是否有内容
const hasContent = computed(() => {
  return Object.keys(translatedMarkdown.value).length > 0;
});
</script>

<style scoped>
/* 区别2：类名改为 translated-panel */
.translated-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: #1a1a1a;  /* 区别3：背景色稍微深一点，区分原文和译文 */
  color: #ddd;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 14px;
  color: #555;
}

/* 分段内容样式 */
.segments {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.segment {
  border: 1px solid #333;
  border-radius: 4px;
  padding: 12px;
  background: #252525;
}

.segment-header {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
}

.segment-number {
  font-size: 12px;
  color: #888;
  font-weight: bold;
}

.segment-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #ddd;
}
</style>

