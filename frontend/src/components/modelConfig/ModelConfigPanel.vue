<template>
    <div class="model-config-panel scroll-container ">

        <!-- 如果没有选中的模型 -->
        <div v-if="!selectedModel" class="empty-state">
            <p>请先在左侧选择一个模型，或者点击左上角 Add 新建。</p>
        </div>

        <!-- 已选中模型时显示表单 -->
        <div v-else class="editor-content">
            <el-form :model="editableModel" label-position="top" size="default">
                <!-- 1. 基础信息 -->
                <div class="config-group">
                    <div class="group-title">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                        <span>Basic Information</span>
                    </div>
                    <div class="form-grid">
                        <el-form-item label="Display Name (Custom ID)">
                            <el-input v-model="editableModel.name" placeholder="例如：My-GPT-4" />
                        </el-form-item>
                        <el-form-item label="Role Type">
                            <el-select v-model="role" placeholder="选择角色">
                                <el-option label="None (普通模型)" value="none" />
                                <el-option label="Main (主管模型)" value="main" :disabled="mainDisabled" />
                                <el-option label="MT (初步翻译)" value="MT" :disabled="mtDisabled" />
                            </el-select>
                            <div class="help-text">
                                Main 和 MT 全局各只能有一个，其他模型请选择 None。
                            </div>
                        </el-form-item>
                    </div>
                </div>

                <!-- 2. API 连接 -->
                <div class="config-group">
                    <div class="group-title">
                        <el-icon>
                            <Connection />
                        </el-icon>
                        <span>API Connection</span>
                    </div>
                    <div class="form-grid">
                        <el-form-item label="Base URL" class="full-width">
                            <el-input v-model="editableModel.base_url" placeholder="https://api.example.com/v1" />
                        </el-form-item>
                        <el-form-item label="Model Name (Provider ID)">
                            <el-input v-model="editableModel.model_name" placeholder="例如：gpt-4.1-mini" />
                        </el-form-item>
                        <el-form-item label="API Key">
                            <el-input v-model="editableModel.api_key" show-password placeholder="sk-..." />
                        </el-form-item>
                    </div>
                </div>

                <!-- 3. 性能参数 -->
                <div class="config-group">
                    <div class="group-title">
                        <el-icon>
                            <Odometer />
                        </el-icon>
                        <span>Performance &amp; Parameters</span>
                    </div>
                    <div class="form-grid">
                        <el-form-item label="Temperature (Randomness)">
                            <div class="temp-row">
                                <el-slider v-model="editableModel.temperature" :min="0" :max="1" :step="0.1"
                                    style="flex: 1" />
                                <span class="temp-value">{{ editableModel.temperature }}</span>
                            </div>
                        </el-form-item>
                        <el-form-item label="Max Concurrency">
                            <el-input-number v-model="editableModel.extra_config.max_concurrency" :min="1" />
                        </el-form-item>
                        <el-form-item label="RPM (Requests Per Minute)">
                            <el-input-number v-model="editableModel.extra_config.rpm" :min="1" />
                        </el-form-item>
                    </div>
                </div>

                <!-- 4. 高级配置 -->
                <div class="config-group">
                    <div class="group-title">
                        <el-icon>
                            <Warning />
                        </el-icon>
                        <span>Advanced Extra Body (JSON)</span>
                    </div>
                    <el-form-item label="Extra Body (JSON)">
                        <el-input v-model="extraBodyString" type="textarea" :rows="6"
                            placeholder='例如：{ "response_format": { "type": "json_object" } }'
                            @blur="handleExtraBodyBlur" />
                        <div v-if="jsonError" class="error-text">
                            extra_body 不是合法的 JSON，请检查格式。
                        </div>
                    </el-form-item>
                </div>
            </el-form>

            <!-- 底部操作按钮 -->
            <div class="actions">
                <el-button type="danger" @click="handleDelete">
                    删除该模型
                </el-button>
                <el-button type="primary" @click="handleSave">
                    保存修改
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { InfoFilled, Connection, Odometer, Warning } from "@element-plus/icons-vue";
import {
    useModelConfigStore,
    type LLMConfig,
    type RoleType,
} from "@/stores/modelConfigStore";

const store = useModelConfigStore();

// 当前选中的原始模型（来自 store，只读）
const selectedModel = computed(() => store.selectedModel);

// 用于表单编辑的本地副本（深拷贝，避免直接改 store）
const editableModel = ref<LLMConfig>({} as LLMConfig);
// 当前选择的角色（Main / MT / None）
const role = ref<RoleType>("none");

// 把 extra_body 转成字符串，在 textarea 里编辑
const extraBodyString = ref("");
const jsonError = ref(false);

/**
 * 当选中的模型发生变化时：
 * - 深拷贝一份到 editableModel
 * - 初始化 role（根据 extra_config.type）
 * - 初始化 extraBodyString
 */
watch(
    selectedModel,
    (model) => {
        if (!model) {
            editableModel.value = {} as LLMConfig;
            extraBodyString.value = "";
            jsonError.value = false;
            role.value = "none";
            return;
        }
        editableModel.value = JSON.parse(JSON.stringify(model)) as LLMConfig;
        role.value = store.getRole(model);
        extraBodyString.value = JSON.stringify(model.extra_body || {}, null, 2);
        jsonError.value = false;
    },
    { immediate: true }
);

/**
 * 控制下拉框中 Main/MT 是否禁用：
 * - 如果已经有一个 main，并且当前选中的模型不是那个 main，就禁用 main 选项。
 * - MT 同理。
 */
const mainDisabled = computed(() => {
    if (!selectedModel.value) return false;
    return store.mainId !== null && store.mainId !== selectedModel.value.id;
});

const mtDisabled = computed(() => {
    if (!selectedModel.value) return false;
    return store.mtId !== null && store.mtId !== selectedModel.value.id;
});

/**
 * 当 textarea 失焦时，尝试解析 extraBodyString。
 * 如果 JSON 不合法，就设置 jsonError = true，并保持原值。
 */
function handleExtraBodyBlur() {
    if (!editableModel.value) return;
    try {
        const text = extraBodyString.value.trim();
        const obj = text ? JSON.parse(text) : {};
        editableModel.value.extra_body = obj;
        jsonError.value = false;
    } catch (e) {
        console.error("extra_body JSON parse error", e);
        jsonError.value = true;
    }
}

// 保存当前模型配置并提交到后端
async function handleSave() {
    if (!editableModel.value || !selectedModel.value) return;

    handleExtraBodyBlur();
    if (jsonError.value) {
        ElMessage.error("请先修正 extra_body 的 JSON 格式");
        return;
    }

    const merged: LLMConfig = {
        ...editableModel.value,
        id: selectedModel.value.id,
    };

    store.updateModel(merged);
    store.setRole(selectedModel.value.id, role.value);

    try {
        await store.saveConfig();
        ElMessage.success("配置已保存");
    } catch (e) {
        console.error(e);
        const msg =
            e instanceof Error ? e.message : typeof e === "string" ? e : "未知错误";
        ElMessage.error(`保存失败: ${msg}`);
    }
}

/**
 * 删除当前模型：
 * - 调用 store.removeModel
 * - 选中状态和 role 索引在 store 内部自动维护
 */
function handleDelete() {
    if (!selectedModel.value) return;
    if (!confirm(`确定要删除模型 ${selectedModel.value.name} 吗？`)) return;
    store.removeModel(selectedModel.value.id);
}
</script>

<style scoped>
.model-config-panel {
    padding: 16px 24px;
    box-sizing: border-box;
    color: var(--el-text-color-primary, #dddddd);
}

.empty-state {
    padding: 12px 0;
    font-size: 13px;
    color: var(--el-text-color-secondary, #aaaaaa);
}

.editor-content {
    flex: 1;
    padding: 24px 8px 24px 0;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
}

.config-group {
    margin-bottom: 24px;
}

.group-title {
    font-size: 14px;
    font-weight: bold;
    color: var(--accent-color, #409eff);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--border-color, #333333);
    padding-bottom: 8px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.full-width {
    grid-column: span 2;
}

.help-text {
    font-size: 12px;
    color: var(--el-text-color-secondary, #999999);
    margin-top: 4px;
}

.error-text {
    font-size: 12px;
    color: var(--el-color-danger, #f56c6c);
    margin-top: 4px;
}

.temp-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.temp-value {
    width: 40px;
    text-align: right;
    font-size: 12px;
    color: var(--el-text-color-secondary, #aaaaaa);
}

.actions {
    margin-top: 16px;
    display: flex;
    gap: 8px;
}
</style>
