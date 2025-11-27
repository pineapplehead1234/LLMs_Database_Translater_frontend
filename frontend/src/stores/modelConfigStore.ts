import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { API_ENDPOINTS } from "@/api/config";

// 前端内部使用的角色枚举
export type RoleType = "main" | "MT" | "none";

// 对应 extra_config 的结构
export interface ExtraConfig {
    max_concurrency: number;
    rpm: number;
    type?: "main" | "MT";
}

// 前端使用的完整模型配置（带本地 id）
export interface LLMConfig {
    id: string; // 本地唯一 id，仅前端使用
    name: string;
    base_url: string;
    api_key: string;
    model_name: string;
    temperature: number;
    extra_config: ExtraConfig;
    extra_body: Record<string, any>;
}

// 与后端交互时的 LLMConfig 结构（不包含本地 id）
interface BackendLLMConfig {
    name: string;
    base_url: string;
    api_key: string;
    model_name: string;
    temperature?: number;
    extra_config?: Partial<ExtraConfig>;
    extra_body?: Record<string, any>;
}

// 对应 ChangeLLMsConfigRequest
interface ChangeLLMsConfigRequest {
    task_type?: string;
    llms: BackendLLMConfig[];
}

// 生成本地 id 的小工具
function createLocalId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `model_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// 根据 extra_config.type 推断角色
function inferRoleFromExtraConfig(model: LLMConfig): RoleType {
    const t = model.extra_config?.type;
    if (t === "main") return "main";
    if (t === "MT") return "MT";
    return "none";
}

export const useModelConfigStore = defineStore("modelConfig", () => {
    // 所有模型列表
    const llms = ref<LLMConfig[]>([]);

    // 当前选中的模型 id（用于右侧编辑面板）
    const selectedId = ref<string | null>(null);

    // 全局索引：当前 main / MT 模型是谁
    const mainId = ref<string | null>(null);
    const mtId = ref<string | null>(null);

    // 是否已经完成一次初始化（避免重复请求）
    const initialized = ref(false);

    // 根据 selectedId 计算当前选中模型
    const selectedModel = computed<LLMConfig | null>(() => {
        return llms.value.find((m) => m.id === selectedId.value) ?? null;
    });

    // 重算 mainId / mtId，保证全局最多各一个
    function recomputeRoleIndexes() {
        mainId.value = null;
        mtId.value = null;

        for (const model of llms.value) {
            const role = inferRoleFromExtraConfig(model);
            if (role === "main" && !mainId.value) {
                mainId.value = model.id;
            } else if (role === "MT" && !mtId.value) {
                mtId.value = model.id;
            } else if (role !== "none") {
                // 多余的 main / MT 降级为普通模型
                delete model.extra_config.type;
            }
        }
    }

    // 获取某个模型的角色
    function getRole(model: LLMConfig): RoleType {
        return inferRoleFromExtraConfig(model);
    }

    // 设置某个模型的角色，保持 main / MT 全局唯一
    function setRole(id: string, role: RoleType) {
        const target = llms.value.find((m) => m.id === id);
        if (!target) return;

        if (role === "none") {
            if ("type" in target.extra_config) {
                delete target.extra_config.type;
            }
            if (mainId.value === id) mainId.value = null;
            if (mtId.value === id) mtId.value = null;
            return;
        }

        if (!target.extra_config) {
            target.extra_config = { max_concurrency: 1, rpm: 60 };
        }

        if (role === "main") {
            if (mainId.value && mainId.value !== id) {
                const oldMain = llms.value.find((m) => m.id === mainId.value);
                if (oldMain && oldMain.extra_config) {
                    delete oldMain.extra_config.type;
                }
            }
            target.extra_config.type = "main";
            mainId.value = id;
            if (mtId.value === id) mtId.value = null;
        } else if (role === "MT") {
            if (mtId.value && mtId.value !== id) {
                const oldMt = llms.value.find((m) => m.id === mtId.value);
                if (oldMt && oldMt.extra_config) {
                    delete oldMt.extra_config.type;
                }
            }
            target.extra_config.type = "MT";
            mtId.value = id;
            if (mainId.value === id) mainId.value = null;
        }
    }

    // 切换当前选中模型
    function setSelectedId(id: string | null) {
        selectedId.value = id;
    }

    // 更新某个模型配置（从表单保存时调用）
    function updateModel(updated: LLMConfig) {
        const index = llms.value.findIndex((m) => m.id === updated.id);
        if (index === -1) return;
        llms.value[index] = { ...updated };
    }

    // 新增模型，返回新模型的 id
    function addModel(): string {
        const id = createLocalId();
        const newModel: LLMConfig = {
            id,
            name: "New Model",
            base_url: "",
            api_key: "",
            model_name: "",
            temperature: 0.5,
            extra_config: {
                max_concurrency: 5,
                rpm: 60,
            },
            extra_body: {},
        };

        llms.value.push(newModel);

        if (!selectedId.value) {
            selectedId.value = id;
        }

        return id;
    }

    // 删除一个模型，并更新相关索引与选中状态
    function removeModel(id: string) {
        const index = llms.value.findIndex((m) => m.id === id);
        if (index === -1) return;

        if (mainId.value === id) mainId.value = null;
        if (mtId.value === id) mtId.value = null;

        llms.value.splice(index, 1);

        if (selectedId.value === id) {
            const next = llms.value[index] || llms.value[index - 1] || null;
            selectedId.value = next ? next.id : null;
        }
    }

    // 选中模型 id 的本地缓存 key
    const SELECTED_KEY = "model-config:selected-id";

    // 初始化时尝试从 localStorage 恢复选中项
    if (typeof window !== "undefined") {
        const savedId = window.localStorage.getItem(SELECTED_KEY);
        if (savedId) {
            selectedId.value = savedId;
        }
    }

    // 选中项变化时写入 localStorage
    watch(
        selectedId,
        (id) => {
            if (typeof window === "undefined") return;
            if (id) {
                window.localStorage.setItem(SELECTED_KEY, id);
            } else {
                window.localStorage.removeItem(SELECTED_KEY);
            }
        },
        { immediate: false }
    );

    // 从后端 GET /api/config 拉取配置
    async function fetchConfig() {
        const res = await fetch(API_ENDPOINTS.GET_CONFIG, {
            method: "GET",
        });

        if (!res.ok) {
            throw new Error(`拉取配置失败: ${res.status} ${res.statusText}`);
        }

        const data = (await res.json()) as ChangeLLMsConfigRequest | null;

        if (!data || !Array.isArray(data.llms)) {
            throw new Error("配置数据格式不正确：缺少 llms 数组");
        }

        const next: LLMConfig[] = data.llms.map((item) => {
            return {
                id: createLocalId(),
                name: item.name,
                base_url: item.base_url,
                api_key: item.api_key,
                model_name: item.model_name,
                temperature: item.temperature ?? 0.5,
                extra_config: {
                    max_concurrency: item.extra_config?.max_concurrency ?? 1,
                    rpm: item.extra_config?.rpm ?? 60,
                    ...(item.extra_config?.type ? { type: item.extra_config.type } : {}),
                },
                extra_body: item.extra_body ?? {},
            };
        });

        llms.value = next;
        recomputeRoleIndexes();

        if (!selectedId.value && llms.value.length > 0) {
            const llm = llms.value[0];
            if (llm)
                selectedId.value = llm.id;
        }
    }

    // 把当前 llms 序列化为后端需要的格式并保存
    async function saveConfig() {
        const backendLlms: BackendLLMConfig[] = llms.value.map((model) => {
            const { id: _id, ...rest } = model;

            const extra_config: Partial<ExtraConfig> = {
                max_concurrency: rest.extra_config?.max_concurrency ?? 1,
                rpm: rest.extra_config?.rpm ?? 60,
                ...(rest.extra_config?.type ? { type: rest.extra_config.type } : {}),
            };

            if (!extra_config.type) {
                delete extra_config.type;
            }

            return {
                name: rest.name,
                base_url: rest.base_url,
                api_key: rest.api_key,
                model_name: rest.model_name,
                temperature: rest.temperature,
                extra_config,
                extra_body: rest.extra_body ?? {},
            };
        });

        const payload: ChangeLLMsConfigRequest = {
            task_type: "change_llms_config",
            llms: backendLlms,
        };

        const res = await fetch(API_ENDPOINTS.CONFIG, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            throw new Error(`保存配置失败: ${res.status} ${res.statusText}`);
        }
    }

    // 对外暴露的初始化入口：只会真正初始化一次
    async function ensureInitialized() {
        if (initialized.value) return;
        try {
            await fetchConfig();
            initialized.value = true;
        } catch (e) {
            console.error("从后端拉取配置失败，使用空列表作为兜底", e);
            llms.value = [];
            recomputeRoleIndexes();
            initialized.value = true;
        }
    }

    return {
        llms,
        selectedId,
        mainId,
        mtId,
        selectedModel,
        setSelectedId,
        getRole,
        setRole,
        addModel,
        removeModel,
        updateModel,
        ensureInitialized,
        saveConfig,
    };
});

