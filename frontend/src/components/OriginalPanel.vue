<template>
  <div class="original-panel">
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-icon">📄</div>
      <div class="empty-text">暂无原文内容</div>
      <div class="empty-text">请先上传文件</div>
    </div>
    <div v-else class="segments">
      <div v-for="(text, segmentId) in originalMarkdown" :key="segmentId" class="segment">
        <div class="segment-header">
          <span class="segment-number">段落 {{ segmentId }}</span>
        </div>
        <div class="segment-content">{{ text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslationStore } from '@/stores/translationStore';
import {computed} from 'vue'

const store = useTranslationStore();

const originalMarkdown = computed(() => store.currentFile?.originalMarkdown || {});

const hasContent = computed(() => Object.keys(originalMarkdown.value).length > 0);
</script>

<style scoped>
.original-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: #1e1e1e;
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
  white-space: pre-wrap;  /* 保留换行符 */
  word-wrap: break-word;
  color: #ddd;
}
</style>
