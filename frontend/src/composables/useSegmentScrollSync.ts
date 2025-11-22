
// useSegmentScrollSync.ts
import { ref, computed, watch, onBeforeUnmount, nextTick, type Ref } from "vue";

// 一个段落位置信息的类型：只关心竖直方向
type SegmentPosition = {
    id: string;
    top: number;
    height: number;
};

// Panel 实例在 defineExpose 暴露出来的结构
type PanelInstance = {
    // 在父组件实例上，这里已经是 DOM 元素本身
    containerRef: HTMLElement | null;
    // 同理，这里是数组本身，而不是 ref
    segmentPositions: SegmentPosition[];
    measureSegments: () => void;
    scrollToOffset: (top: number) => void;
};

// 支持 enabled 既可以传 boolean，也可以传 ref<boolean>
type MaybeRefBoolean = boolean | Ref<boolean>;

export function useSegmentScrollSync(
    originalRef: Ref<PanelInstance | null>,
    translatedRef: Ref<PanelInstance | null>,
    options: { enabled: MaybeRefBoolean }
) {
    console.log("[sync] useSegmentScrollSync setup", { originalRef, translatedRef });
    // 1. 把 enabled 统一转成一个 computed<boolean>
    const syncEnabledRef = computed(() => {
        const raw = options.enabled;
        return typeof raw === "boolean" ? raw : raw.value;
    });

    // 2. 内部状态：当前是由哪一侧在“驱动同步”
    const syncingFrom = ref<"original" | "translated" | null>(null);

    // 3. DOM 引用：只保存滚动容器（只关心 scrollTop）
    let originalEl: HTMLElement | null = null;
    let translatedEl: HTMLElement | null = null;

    let lastSourceTopFromOriginal: number | null = null;
    let lastSourceTopFromTranslated: number | null = null;


    // 小于这个像素级的滚动，就当成“抖动/惯性”，不让另一侧跟着动
    const MIN_SCROLL_DELTA = 3;
    // 根据当前 scrollTop，在源 panel 段落里找到对应位置，
    // 然后映射到目标 panel 的 scrollTop
    function computeMappedScrollTop(
        sourceTop: number,
        srcSegs: SegmentPosition[],
        dstSegs: SegmentPosition[]
    ): number | null {
        // 没有段落，没法同步
        if (!srcSegs.length || !dstSegs.length) return null;

        // 1. 找出“当前滚动位置落在哪个段”
        let idx = srcSegs.findIndex((seg) => {
            return sourceTop < seg.top + seg.height;
        });

        // 如果滚动条已经超过最后一个段，那就对齐到最后一段
        if (idx === -1) {
            idx = srcSegs.length - 1;
        }
        // 额外的类型保护：如果还是不在合法范围，直接放弃同步
        if (idx < 0 || idx >= srcSegs.length) {
            return null;
        }

        const srcSeg = srcSegs[idx];
        // 再加一层防御性判断，兼顾 TS 的类型收窄
        if (!srcSeg) {
            return null;
        }

        // 2. 计算当前在这个段里滚过了多少距离（段内偏移）
        let innerOffset = sourceTop - srcSeg.top;

        // 把段内偏移限制在 0 ~ height 之间，避免 ratio 负数或 > 1
        if (innerOffset < 0) innerOffset = 0;
        if (innerOffset > srcSeg.height) innerOffset = srcSeg.height;
        // 段内滚动比例（0 ~ 1 之间）
        const ratio =
            srcSeg.height > 0 ? innerOffset / srcSeg.height : 0;

        // 3. 目标 panel 直接按索引匹配第 idx 段
        const targetIdx = Math.min(idx, dstSegs.length - 1);
        const dstSeg = dstSegs[targetIdx];
        if (!dstSeg) return null;

        // 4. 用同样的段内比例，算出目标 panel 的 scrollTop
        return dstSeg.top + ratio * dstSeg.height;
    }

    // 4. 事件处理函数（后面再具体实现）
    function handleOriginalScroll() {
        console.log("[sync] original scroll");
        // 如果没开同步，直接忽略
        if (!syncEnabledRef.value) return;

        // 如果当前是对方驱动的同步，避免反向触发
        if (syncingFrom.value === "translated") return;

        const original = originalRef.value;
        const translated = translatedRef.value;

        // 任意一方还没准备好，直接返回
        if (!original || !translated || !originalEl || !translatedEl) {
            return;
        }

        syncingFrom.value = "original";

        const sourceTop = originalEl.scrollTop;

        // 先计算本次滚动相对于上一次的位移
        const prevSourceTop = lastSourceTopFromOriginal;
        if (prevSourceTop != null) {
            const delta = sourceTop - prevSourceTop;

            // 如果这次滚动很小（比如 |delta| < 3 像素），认为只是惯性/抖动，不让另一侧跟着动
            if (Math.abs(delta) < MIN_SCROLL_DELTA) {
                // 但还是更新记录，避免下一次 delta 变得很大
                lastSourceTopFromOriginal = sourceTop;
                syncingFrom.value = null;
                return;
            }
        }

        const destCurrentTop = translatedEl.scrollTop;

        const srcSegs = original.segmentPositions;
        const dstSegs = translated.segmentPositions;

        const mappedTop = computeMappedScrollTop(sourceTop, srcSegs, dstSegs);

        if (mappedTop != null) {
            let finalTop = mappedTop;

            if (prevSourceTop != null) {
                const direction = sourceTop - prevSourceTop;

                if (direction > 0 && finalTop < destCurrentTop) {
                    finalTop = destCurrentTop;
                }

                if (direction < 0 && finalTop > destCurrentTop) {
                    finalTop = destCurrentTop;
                }
            }

            lastSourceTopFromOriginal = sourceTop;

            translated.scrollToOffset(finalTop);
        } else {
            lastSourceTopFromOriginal = sourceTop;
        }

        syncingFrom.value = null;
    }


    function handleTranslatedScroll() {
        console.log("[sync] translated scroll");
        if (!syncEnabledRef.value) return;
        if (syncingFrom.value === "original") return;

        const original = originalRef.value;
        const translated = translatedRef.value;
        if (!original || !translated || !originalEl || !translatedEl) {
            return;
        }

        const sourceTop = translatedEl.scrollTop;

        const prevSourceTop = lastSourceTopFromTranslated;
        if (prevSourceTop != null) {
            const delta = sourceTop - prevSourceTop;

            if (Math.abs(delta) < MIN_SCROLL_DELTA) {
                lastSourceTopFromTranslated = sourceTop;
                return;
            }
        }

        const destCurrentTop = originalEl.scrollTop;

        const srcSegs = translated.segmentPositions;
        const dstSegs = original.segmentPositions;

        const mappedTop = computeMappedScrollTop(sourceTop, srcSegs, dstSegs);

        if (mappedTop != null) {
            let finalTop = mappedTop;

            if (prevSourceTop != null) {
                const direction = sourceTop - prevSourceTop;

                if (direction > 0 && finalTop < destCurrentTop) {
                    finalTop = destCurrentTop;
                }
                if (direction < 0 && finalTop > destCurrentTop) {
                    finalTop = destCurrentTop;
                }
            }

            lastSourceTopFromTranslated = sourceTop;

            original.scrollToOffset(finalTop);
        } else {
            lastSourceTopFromTranslated = sourceTop;
        }
    }

    // 5. 绑定和解绑滚动事件的工具函数
    function attachListeners() {
        if (originalEl) {
            originalEl.addEventListener("scroll", handleOriginalScroll);
        }
        if (translatedEl) {
            translatedEl.addEventListener("scroll", handleTranslatedScroll);
        }
    }

    function detachListeners() {
        if (originalEl) {
            originalEl.removeEventListener("scroll", handleOriginalScroll);
        }
        if (translatedEl) {
            translatedEl.removeEventListener("scroll", handleTranslatedScroll);
        }
    }

    // 6. 当 originalRef / translatedRef 就绪时，初始化同步
    watch(
        () => [originalRef.value, translatedRef.value] as const,
        ([original, translated]) => {
            console.log("[sync] watch fired", { original, translated });
            if (original) {
                console.log("[sync] original keys", Object.keys(original));
            }
            if (translated) {
                console.log("[sync] translated keys", Object.keys(translated));
            }
            // 任意一边还没挂载好：先解绑监听并清空 DOM 引用
            if (!original || !translated) {
                detachListeners();
                originalEl = null;
                translatedEl = null;
                return;
            }

            // 等下一帧，确保子组件的 containerRef 也已经填好 DOM
            nextTick(() => {
                // 先解绑旧监听，避免重复绑定
                detachListeners();

                // 更新 DOM 引用（注意 .value）
                originalEl = original.containerRef
                translatedEl = translated.containerRef;

                console.log("[sync] containerRefs after nextTick", {
                    originalEl,
                    translatedEl,
                });

                // 测量两边的段落位置
                original.measureSegments();
                translated.measureSegments();

                // 都有 DOM 之后再绑定滚动事件
                if (originalEl && translatedEl) {
                    console.log("[sync] attachListeners", { originalEl, translatedEl });
                    attachListeners();
                }
            });
        },
        { immediate: true }
    );
    // 7. 对外暴露的 refreshLayouts，给 App.vue 在拖拽结束 / 文档切换后调用
    function refreshLayouts() {
        const original = originalRef.value;
        const translated = translatedRef.value;
        original?.measureSegments();
        translated?.measureSegments();
    }

    // 8. 组件卸载时清理事件监听
    onBeforeUnmount(() => {
        detachListeners();
    });

    // composable 对外只暴露 refreshLayouts
    return {
        refreshLayouts,
    };
}