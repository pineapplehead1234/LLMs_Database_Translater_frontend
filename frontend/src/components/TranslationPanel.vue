<template>
  <div class="translated-panel" ref="containerRef">
    <!-- 空状态提示 -->
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-icon">📝</div>
      <div class="empty-text">暂无译文内容</div>
      <div class="empty-hint">请先上传并翻译文件</div>
    </div>
    <!-- 分段内容显示 -->
    <div v-else class="segments">
      <div v-for="(text, segmentId) in translatedMarkdown" :key="segmentId" class="segment"
        :data-segment-id="segmentId">
        <div class="segment-content" v-html="renderWithoutTerms(text)"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslationStore } from "@/stores/translationStore";
import { computed, ref, onMounted, nextTick } from "vue";
import { marked } from "marked";
import { getCachedImageUrl } from "@/utils/imageCache";
// 获取Store实例
const store = useTranslationStore();

const taskId = computed(() => store.currentFile?.task_id ?? "");

// 容器引用
const containerRef = ref<HTMLElement | null>(null);
// 保存每个段落的位置信息：id、相对容器顶部的 top、高度
const segmentPositions = ref<Array<{ id: string; top: number; height: number }>>([]);
// 计算属性：获取译文数据（区别1：读取translatedMarkdown）
const translatedMarkdown = computed(() => {
  return store.currentFile?.translated_markdown || {};
});

// 计算属性：判断是否有内容
const hasContent = computed(() => {
  return Object.keys(translatedMarkdown.value).length > 0;
});

function renderWithoutTerms(text: string) {
  let html = renderMarkdownWithImages(text);
  return html;

}


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
onMounted(() => {
  nextTick(() => {
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
/* 区别2：类名改为 translated-panel */
.translated-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: #1a1a1a;
  /* 区别3：背景色稍微深一点，区分原文和译文 */
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

/* 临时添加，确保内容可见 */
.segment-content {
  display: flex;
  flex-direction: column;
}
</style>
