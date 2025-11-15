<template>
  <div class="original-panel">
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-icon">📄</div>
      <div class="empty-text">暂无原文内容</div>
      <div class="empty-text">请先上传文件</div>
    </div>
    <div v-else class="segments">
      <div v-for="(text, segmentId) in originalMarkdown" :key="segmentId" class="segment">
        <div
          class="segment-content"
          v-html="renderWithTerms(text, segmentId)"
          @mouseover="handleMouseOver"
          @mouseout="handleMouseOut"
        ></div>
      </div>
    </div>
    <el-tooltip
      v-model:visible="tooltipVisible"
      :content="tooltipContent"
      placement="top"
      :virtual-ref="tooltipRef"
      virtual-triggering
    />
  </div>
</template>

<script setup lang="ts">
import { useTranslationStore } from "@/stores/translationStore";
import { computed, ref } from "vue";
import { marked } from "marked";
import { ElTooltip } from "element-plus";
const store = useTranslationStore();

const originalMarkdown = computed(() => store.currentFile?.original_markdown || {});

const hasContent = computed(() => Object.keys(originalMarkdown.value).length > 0);

const tooltipVisible = ref(false);
const tooltipContent = ref("");
const tooltipRef = ref<HTMLElement>();



function getTermsForSegment(segmentId: string) {
  const annotations = store.currentFile?.term_annotations;
  if (!annotations) return [];
  return annotations[segmentId] || [];
}

function renderWithTerms(text: string, segmentId: string) {
  let html = marked(text) as string;

  const terms = getTermsForSegment(segmentId);
  
  console.log('🔍 Segment:', segmentId);
  console.log('📝 Original text:', text);
  console.log('🏷️ Terms for this segment:', terms);
  console.log('📄 HTML after marked:', html);

  terms.forEach(({ term, translation }) => {
    // 只有当 translation 存在且不为空时才添加高亮
    if (!translation) {
      console.warn('⚠️ 跳过无翻译的术语:', term);
      return;
    }
    
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`\\b${escapedTerm}\\b`, "gi");
    
    const beforeReplace = html;
    html = html.replace(regex, (match) => {
      console.log('✅ 匹配到术语:', match, '翻译:', translation);
      return `<span class="term-highlight" data-term="${match}" data-translation="${translation}">${match}</span>`;
    });
    
    if (beforeReplace === html) {
      console.warn('❌ 术语未匹配:', term, '正则:', regex);
    }
  });
  
  console.log('🎨 Final HTML:', html);
  return html;
}

function handleMouseOver(event: MouseEvent) {
  const target = event.target as HTMLElement;
  
  console.log('🖱️ Mouse over:', target);
  console.log('📌 Has term-highlight class:', target.classList.contains("term-highlight"));

  if (target.classList.contains("term-highlight")) {
    const translation = target.getAttribute("data-translation");
    const term = target.getAttribute("data-term");
    console.log('🏷️ Term:', term);
    console.log('🌐 Translation:', translation);
    
    // 只有当翻译内容存在且有效时才显示 tooltip
    if (translation && translation !== "undefined" && translation !== "null") {
      tooltipContent.value = translation;
      tooltipRef.value = target;
      tooltipVisible.value = true;
      console.log('✅ Tooltip 已显示');
    } else {
      console.warn('⚠️ 翻译内容无效:', translation);
    }
  }
}

function handleMouseOut(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (target.classList.contains("term-highlight")) {
    tooltipVisible.value = false;
  }
}
</script>

<style scoped>
.original-panel {
  height: 100%;
  width: 100%;
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
}



/* 术语高亮样式 */
.segment-content :deep(.term-highlight) {
  background: linear-gradient(to bottom, transparent 60%, rgba(255, 193, 7, 0.3) 60%);
  border-bottom: 2px dotted #ffc107;
  cursor: default;
  transition: all 0.2s;
  padding: 0 2px;
  border-radius: 2px;
}

.segment-content :deep(.term-highlight:hover) {
  background: rgba(255, 193, 7, 0.4);
  border-bottom-color: #ff9800;
}
</style>
