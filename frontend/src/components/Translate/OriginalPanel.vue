<template>
  <div class="original-panel scroll-container" ref="containerRef">
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-text">暂无原文内容</div>
      <div class="empty-text">请先上传文件</div>
    </div>
    <div v-else class="segments">
      <div v-for="(text, segmentId) in originalMarkdown" :key="segmentId" class="segment" :data-segment-id="segmentId">
        <div class="segment-content markdown-body" v-html="renderWithTerms(text, segmentId)"
          @mouseover="handleMouseOver" @mouseout="handleMouseOut"></div>
      </div>
    </div>
    <el-tooltip v-model:visible="tooltipVisible" :content="tooltipContent" placement="top" :virtual-ref="tooltipRef"
      virtual-triggering />
  </div>
</template>

<script setup lang="ts">
import { useTranslationStore } from "@/stores/translationStore";
import { computed, ref, onMounted, nextTick, watch } from "vue";
import { renderMarkdown, createBaseRenderer } from "@/utils/markdown";
import { ElTooltip } from "element-plus";
import { getCachedImageUrl } from "@/utils/imageCache";
import type { TermAnnotation } from "@/utils/taskCache";
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
function highlightTermsInHtml(html: string, terms: TermAnnotation[]): string {
  // 如果没有术语，直接返回原始 HTML
  if (!terms || terms.length === 0) return html;

  // SSR 场景下没有 document，这里加一个保险
  if (typeof document === "undefined") return html;

  // 预处理术语：过滤掉空值，并为每个 term 提前编译正则
  const processed = terms
    .filter(t => t.term && t.translation)
    .map(t => {
      // 把 term 中可能影响正则的特殊字符转义
      const escaped = t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // 和你之前一样，用 \b 做单词边界，忽略大小写
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      return { ...t, regex };
    });

  if (processed.length === 0) return html;

  // 用一个临时 div 作为容器，让浏览器帮我们把 HTML 解析成 DOM
  const container = document.createElement("div");
  container.innerHTML = html;

  /**
   * 深度优先遍历 DOM：
   * - 遇到文本节点：把里面的术语切出来，替换成「文本节点 + span 节点」。
   * - 遇到元素节点：递归子节点，但跳过 <script>/<style> 和 已经是 term-highlight 的节点。
   */
  const walk = (node: Node) => {
    // 1) 文本节点：真正做术语替换的地方
    if (node.nodeType === Node.TEXT_NODE) {
      const originalText = node.nodeValue || "";
      // 全是空白就没必要处理
      if (!originalText.trim()) return;

      // parts：按顺序存「纯文本」或「待高亮片段」
      let parts: Array<string | { text: string; term: string; translation: string }> = [
        originalText,
      ];

      // 依次应用每个术语的正则，把字符串拆成文本片段 + 高亮片段
      for (const { term, translation, regex } of processed) {
        const nextParts: typeof parts = [];

        for (const part of parts) {
          // 已经是高亮片段的，不再拆，直接保留
          if (typeof part !== "string") {
            nextParts.push(part);
            continue;
          }

          let lastIndex = 0;
          let match: RegExpExecArray | null;

          // 使用全局正则前要把游标清零
          regex.lastIndex = 0;

          while ((match = regex.exec(part)) !== null) {
            const start = match.index;
            const end = start + match[0].length;

            // 术语前面的普通文本
            if (start > lastIndex) {
              nextParts.push(part.slice(lastIndex, start));
            }

            // 匹配到的术语 -> 高亮片段
            nextParts.push({
              text: match[0],
              term,
              translation,
            });

            lastIndex = end;
          }

          // 剩余尾巴文本
          if (lastIndex < part.length) {
            nextParts.push(part.slice(lastIndex));
          }
        }

        parts = nextParts;
      }

      // 如果 parts 和原文本完全一样，说明没有任何匹配，直接返回
      if (parts.length === 1 && typeof parts[0] === "string" && parts[0] === originalText) {
        return;
      }

      // 用 DocumentFragment 一次性替换原来的文本节点
      const fragment = document.createDocumentFragment();

      for (const part of parts) {
        if (typeof part === "string") {
          // 普通文本 -> 直接变成 text node
          fragment.appendChild(document.createTextNode(part));
        } else {
          // 高亮片段 -> 生成 span.term-highlight，带上 data-term / data-translation
          const span = document.createElement("span");
          span.className = "term-highlight";
          span.setAttribute("data-term", part.term);
          span.setAttribute("data-translation", part.translation);
          span.textContent = part.text;
          fragment.appendChild(span);
        }
      }

      // 用新的若干节点替换掉原来的一个文本节点
      node.parentNode?.replaceChild(fragment, node);
      return;
    }

    // 2) 元素节点：递归其子节点
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;

      // 不在 <script>/<style> 里做替换
      if (tag === "SCRIPT" || tag === "STYLE") {
        return;
      }

      // 已经是高亮 span 的节点不再向下递归，避免嵌套 span
      if (el.classList.contains("term-highlight")) {
        return;
      }
      // 新增：KaTeX 公式节点不递归
      if (el.classList.contains("katex") || el.classList.contains("katex-display")) {
        return;
      }
      // 遍历子节点时要先存一下 nextSibling，避免替换时指针乱掉
      let child = node.firstChild;
      while (child) {
        const next = child.nextSibling;
        walk(child);
        child = next;
      }
    }
  };

  // 从容器根节点开始递归
  walk(container);

  // 返回高亮处理后的 HTML 字符串，给 v-html 使用
  return container.innerHTML;
}

function renderWithTerms(text: string, segmentId: string) {
  // 1. 先把 markdown 渲成 HTML（包含图片、表格等）
  let html = renderMarkdownWithImages(text);

  // 2. 获取当前段落的术语列表（来自 pinia store 的 term_annotations）
  const terms = getTermsForSegment(segmentId) as TermAnnotation[];

  // 调试日志看清流水线每一步（可按需要保留/删除）
  console.log("🔍 Segment:", segmentId);
  console.log("📝 Original text:", text);
  console.log("🏷️ Terms for this segment:", terms);
  console.log("📄 HTML after marked:", html);

  // 3. 没有术语，直接返回原始 HTML
  if (!terms || terms.length === 0) {
    return html;
  }

  // 4. 调用 DOM 高亮函数，只在纯文本里插入 span，不破坏 <table> 等标签
  const highlighted = highlightTermsInHtml(html, terms);

  console.log("🎨 Final HTML:", highlighted);
  return highlighted;
}
function renderMarkdownWithImages(text: string): string {
  const renderer = createBaseRenderer();

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

  return renderMarkdown(text, { renderer });
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
    measureSegments();
  });
});

// 当当前文件发生切换时，内容高度会变化，需要重新测量各段的位置
watch(
  () => store.currentFile?.task_id,
  () => {
    nextTick(() => {
      measureSegments();
    });
  }
);

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
  background: var(--editor-bg);
  border-right: 1px solid var(--editor-border);
  color: var(--text-primary);
  position: relative;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);

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
  color: var(--text-secondary);
}

/* 分段内容样式 */
.segments {
  display: flex;
  flex-direction: column;
}



/* 术语高亮样式 */
.segment-content :deep(.term-highlight) {
  background: linear-gradient(to bottom, transparent 60%, var(--term-highlight-bg) 60%);
  border-bottom: 2px dotted var(--term-highlight-border);
  cursor: default;
  transition: all 0.2s;
  padding: 0 2px;
  border-radius: 2px;
}

.segment-content :deep(.term-highlight:hover) {
  background: var(--term-highlight-hover-bg);
  border-bottom-color: var(--term-highlight-hover-border);
}
</style>
