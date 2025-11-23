
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
    // 子组件通过 defineExpose 暴露出的 ref / 数据
    containerRef: Ref<HTMLElement | null>;
    segmentPositions: Ref<SegmentPosition[]>;
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
        const ratio = srcSeg.height > 0 ? innerOffset / srcSeg.height : 0;

        // 3. 目标 panel 直接按索引匹配第 idx 段
        const targetIdx = Math.min(idx, dstSegs.length - 1);
        const dstSeg = dstSegs[targetIdx];
        if (!dstSeg) return null;

        // 4. 用同样的段内比例，算出目标 panel 的 scrollTop
        return dstSeg.top + ratio * dstSeg.height;
    }

    function handleOriginalScroll() {
        console.log('[sync] original scroll fired');
        if (!syncEnabledRef.value) return;
        if (syncingFrom.value === "translated") return;

        const original = originalRef.value;
        const translated = translatedRef.value;
        if (!original || !translated || !originalEl || !translatedEl) {
            return;
        }

        syncingFrom.value = "original";

        const sourceTop = originalEl.scrollTop;
        const prevSourceTop = lastSourceTopFromOriginal;

        if (prevSourceTop != null) {
            const delta = sourceTop - prevSourceTop;
            if (Math.abs(delta) < MIN_SCROLL_DELTA) {
                lastSourceTopFromOriginal = sourceTop;
                syncingFrom.value = null;
                return;
            }
        }

        const destCurrentTop = translatedEl.scrollTop;
        const srcSegs = original.segmentPositions.value;
        const dstSegs = translated.segmentPositions.value;

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
        console.log('[sync] translated scroll fired');
        if (!syncEnabledRef.value) return;
        if (syncingFrom.value === "original") return;

        const original = originalRef.value;
        const translated = translatedRef.value;
        if (!original || !translated || !originalEl || !translatedEl) {
            return;
        }

        syncingFrom.value = "translated";

        const sourceTop = translatedEl.scrollTop;
        const prevSourceTop = lastSourceTopFromTranslated;

        if (prevSourceTop != null) {
            const delta = sourceTop - prevSourceTop;

            if (Math.abs(delta) < MIN_SCROLL_DELTA) {
                lastSourceTopFromTranslated = sourceTop;
                syncingFrom.value = null;
                return;
            }
        }

        const destCurrentTop = originalEl.scrollTop;
        const srcSegs = translated.segmentPositions.value;
        const dstSegs = original.segmentPositions.value;
        console.log('[sync] seg lens', srcSegs.length, dstSegs.length);
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

        syncingFrom.value = null;
    }

    function attachListeners() {
        if (originalEl) {
            originalEl.addEventListener("scroll", handleOriginalScroll);
            console.log('[sync] attachListeners', { originalEl, translatedEl });
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

    watch(
        () => [originalRef.value, translatedRef.value] as const,
        ([original, translated]) => {
            if (!original || !translated) {
                detachListeners();
                originalEl = null;
                translatedEl = null;
                return;
            }

            nextTick(() => {
                detachListeners();

                originalEl = original.containerRef.value;
                translatedEl = translated.containerRef.value;

                original.measureSegments();
                translated.measureSegments();

                if (originalEl && translatedEl) {
                    attachListeners();
                }
            });
        },
        { immediate: true }
    );

    function refreshLayouts() {
        const original = originalRef.value;
        const translated = translatedRef.value;
        original?.measureSegments();
        translated?.measureSegments();
    }

    onBeforeUnmount(() => {
        detachListeners();
    });

    return {
        refreshLayouts,
    };
}
