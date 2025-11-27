import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { RAG_ENDPOINTS, IS_MOCK } from "@/api/config";
import { file } from "jszip";

// 直接按后端字段定义
interface KbFile {
    source: string;
    display_name: string;
    start_seq: number;
    end_seq: number;
    count: number;
}

export const useKbStore = defineStore("kb", () => {
    const isConnected = ref(false);
    const isUpdating = ref(false);

    const files = ref<KbFile[]>([]);
    const selectedSource = ref<string | null>(null); // 用source作为唯一标识
    //当前选中文件的完整信息
    const selectedFile = computed<KbFile | null>(() => {
        if (!selectedSource.value) return null;
        return files.value.find(f => f.source === selectedSource.value) ?? null;
    })
    //全部文件的总条数
    const totalSeqCount = computed(() => files.value.reduce((sum, f) => sum + (f.count ?? 0), 0));
    function sleep(ms: number) {
        return new Promise<void>(resolve => setTimeout(resolve, ms));
    }
    async function checkHealth() {
        try {
            const res = await fetch(RAG_ENDPOINTS.HEALTH);
            if (!res.ok) {
                throw new Error(`HTTP 状态码: ${res.status}`);
            }
            const data = await res.json();
            isConnected.value = !!data.ok;
        } catch (error) {
            isConnected.value = false;
            console.error("[kbStore] checkHealth 失败:", error);
        }
    }

    async function loadFiles() {
        const res = await fetch(RAG_ENDPOINTS.FILES);
        if (!res.ok) {
            throw new Error(`加载文件列表失败: HTTP ${res.status}`);
        }
        const data = await res.json();

        if (!Array.isArray(data)) {
            files.value = [];
            selectedSource.value = null;
            return;
        }

        // ✅ 不做字段转换，直接用后端结构
        files.value = data as KbFile[];

        if (!selectedSource.value && files.value.length > 0) {
            selectedSource.value = files.value[0]?.source ?? null;
        }
        if (
            selectedSource.value &&
            !files.value.some(f => f.source === selectedSource.value)
        ) {
            selectedSource.value = null;
        }
    }
    //删除整个向量库
    async function destroyStore(removeDir: boolean) {
        if (isUpdating.value) return;
        isUpdating.value = true;
        try {
            const url = `${RAG_ENDPOINTS.DESTROY}?remove_dir=${removeDir ? "true" : "false"}`;
            const res = await fetch(url, {
                method: "POST",
            });
            if (!res.ok) {
                throw new Error(`调用 /destroy 失败: HTTP ${res.status}`);
            }

            // 后端清空成功后，本地文件列表归零
            files.value = [];
            selectedSource.value = null;
        } catch (error) {
            console.error("[kbStore] destroyStore 失败:", error);
        } finally {
            isUpdating.value = false;
        }

    }
    //删除整文件:
    async function deleteFileBySource(source: string) {
        if (isUpdating.value) return;
        isUpdating.value = true;
        try {
            const body = {
                indexes: [] as number[], // 按 metadata 删除时 indexes 需要传空数组
                targets: [source],
                keywords: "source",
                fuzzy: false,
                ignore_case: false,
            };

            const res = await fetch(RAG_ENDPOINTS.DELETE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                throw new Error(`调用 /delete (by source) 失败: HTTP ${res.status}`);
            }

            // 删除成功后，重新拉文件列表（start_seq/end_seq/count 都可能变化）
            await loadFiles();
        } catch (error) {
            console.error("[kbStore] deleteFileBySource 失败:", error);
        } finally {
            isUpdating.value = false;
        }
    }
    //删除单条
    async function deleteBySeq(seq: number) {
        if (isUpdating.value) return;
        isUpdating.value = true;
        try {
            const body = {
                indexes: [seq],
                targets: [] as string[],
                keywords: "source",
                fuzzy: false,
                ignore_case: false,
            };

            const res = await fetch(RAG_ENDPOINTS.DELETE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                throw new Error(`调用 /delete (by seq) 失败: HTTP ${res.status}`);
            }
            await loadFiles();
        } finally {
            isUpdating.value = false;

        }
    }
    //追加文件(支持多文件)
    async function enqueueAdd(filesToAdd: File[]) {
        if (!filesToAdd || filesToAdd.length === 0) return;
        if (isUpdating.value) return;
        isUpdating.value = true;

        try {
            for (const file of filesToAdd) {
                const form = new FormData();
                form.append("file", file);

                const res = await fetch(RAG_ENDPOINTS.TASKS_ADD, {
                    method: "POST",
                    body: form,
                });

                if (!res.ok) {
                    throw new Error(`调用 /tasks/add 失败: HTTP ${res.status}`);
                }

                const data = await res.json();
                const taskId: string = data.task_id;

                // ✅ mock 模式下，不轮询任务，直接跳过
                if (IS_MOCK) {
                    console.log("[kbStore] mock 模式下跳过任务轮询，task_id =", taskId);
                    continue;
                }

                const statusUrl = `${RAG_ENDPOINTS.TASK_STATUS}/${taskId}`;
                while (true) {
                    const r = await fetch(statusUrl);
                    if (!r.ok) {
                        throw new Error(`查询任务状态失败: HTTP ${r.status}`);
                    }
                    const d = await r.json();
                    const status = d.status as string | undefined;

                    if (status === "finished") {
                        break;
                    }
                    if (status === "error") {
                        const msg = d.error_message || "任务执行失败";
                        throw new Error(msg);
                    }

                    await sleep(2000);
                }
            }

            await loadFiles();
        } catch (error) {
            console.error("[kbStore] enqueueAdd 多文件失败:", error);
        } finally {
            isUpdating.value = false;
        }
    }
    return {
        isConnected,
        isUpdating,
        files,
        selectedSource,
        checkHealth,
        loadFiles,
        destroyStore,
        deleteFileBySource,
        deleteBySeq,
        enqueueAdd,
        totalSeqCount,
    };
});