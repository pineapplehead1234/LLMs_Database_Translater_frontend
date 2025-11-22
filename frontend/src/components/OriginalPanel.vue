<template>
  <div class="original-panel" ref="containerRef">
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-icon">📄</div>
      <div class="empty-text">暂无原文内容</div>
      <div class="empty-text">请先上传文件</div>
    </div>
    <div v-else class="segments">
      <div v-for="(text, segmentId) in originalMarkdown" :key="segmentId" class="segment" :data-segment-id="segmentId">
        <div class="segment-content" v-html="renderWithTerms(text, segmentId)" @mouseover="handleMouseOver"
          @mouseout="handleMouseOut"></div>
      </div>
    </div>
    <el-tooltip v-model:visible="tooltipVisible" :content="tooltipContent" placement="top" :virtual-ref="tooltipRef"
      virtual-triggering />
  </div>
</template>

<script setup lang="ts">
import { useTranslationStore } from "@/stores/translationStore";
import { computed, ref, onMounted, nextTick } from "vue";
import { marked } from "marked";
import { ElTooltip } from "element-plus";
import { getCachedImageUrl } from "@/utils/imageCache";
const store = useTranslationStore();

const taskId = computed(() => store.currentFile?.task_id ?? "");

const originalMarkdown = computed(() => store.currentFile?.original_markdown || {});

const hasContent = computed(() => Object.keys(originalMarkdown.value).length > 0);

const tooltipVisible = ref(false);
const tooltipContent = ref("");
const tooltipRef = ref<HTMLElement>();
//滚动容器的Dom引用,只关心Y轴滚动
const containerRef = ref<HTMLElement | null>(null);
// 保存每个段落的位置信息：id、相对容器顶部的 top、高度
const segmentPositions = ref<Array<{ id: string; top: number; height: number }>>([]);

function measureSegments() {
  // 1. 拿到滚动容器的 DOM
  const container = containerRef.value;
  if (!container) return;

  // 2. 选出容器内所有段落元素
  const segmentEls = Array.from(
    container.querySelectorAll<HTMLElement>(".segment")
  );

  // 3. 把每个段落转换成 { id, top, height }
  const positions = segmentEls.map((el) => {
    // 从 data-segment-id 里读出段落 id
    const id = el.dataset.segmentId ?? "";

    // 段落相对于容器顶部的距离：
    // 因为容器是滚动容器 + position: relative，
    // el.offsetTop 就可以理解为“内容内从顶部开始到这个段的像素距离”
    const top = el.offsetTop;

    // 段落高度，避免高度为 0 时后面除以 0
    const height = el.offsetHeight || 1;

    return { id, top, height };
  });

  // 4. 更新响应式数组
  segmentPositions.value = positions;
}
function scrollToOffset(top: number) {
  const container = containerRef.value;
  if (!container) return;

  // 只设置竖直方向的滚动
  container.scrollTop = top;
}
function getTermsForSegment(segmentId: string) {
  const annotations = store.currentFile?.term_annotations;
  if (!annotations) return [];
  return annotations[segmentId] || [];
}

function renderWithTerms(text: string, segmentId: string) {
  let html = renderMarkdownWithImages(text);

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
function renderMarkdownWithImages(text: string): string {
  const renderer = new marked.Renderer();

  renderer.image = ({ href, title, text }: any) => {
    let src = href || "";
    console.log("[renderer.image] href =", href, "initial src =", src, "taskId =", taskId.value);
    // 先只做第一步：把 images/ 前缀去掉，因为 zip 里存的是纯文件名
    if (src.startsWith("images/")) {
      src = src.slice("images/".length);
    }

    let finalSrc = href || "";
    // 只对相对路径（非 http / blob）做映射
    if (taskId.value && src && !src.startsWith("http") && !src.startsWith("blob:")) {
      const blobUrl = getCachedImageUrl(taskId.value, src);
      console.log('[renderer.image] try map src =', src, '=> blobUrl =', blobUrl);
      if (blobUrl) {
        src = blobUrl;
      }
    }

    const altAttr = text ? ` alt="${text}"` : "";
    const titleAttr = title ? ` title="${title}"` : "";

    return `<img src="${src}"${altAttr}${titleAttr} />`;
  };

  return marked(text, { renderer }) as string;
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
onMounted(() => {
  // 等当前这一轮 DOM 更新完，再测量
  nextTick(() => {
    console.log("[panel original] containerRef in child", containerRef.value);
    measureSegments();
  });
});

defineExpose({
  containerRef,
  segmentPositions,
  measureSegments,
  scrollToOffset,
});
</script>

<style scoped>
.original-panel {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 16px;
  background: #1e1e1e;
  color: #ddd;
  position: relative;
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
