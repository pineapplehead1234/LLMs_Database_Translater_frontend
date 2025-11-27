<!-- 知识库视图侧边栏：预留为数据源/任务列表等 -->
<template>
    <div class="kb-sidebar">
        <div class="sidebar-header">
            <span>知识库</span>
        </div>
        <div class="kb-toolbar">
            <!--加号-->
            <el-upload :auto-upload="false" :show-file-list="false" multiple accept=".csv"
                :disabled="kbStore.isUpdating || !kbStore.isConnected" :on-change="onFilesChange">
                <el-tooltip content="导入 csv 文件" placement="top">
                    <el-button circle type="primary" size="small"
                        :disabled="kbStore.isUpdating || !kbStore.isConnected">
                        <el-icon>
                            <Plus />
                        </el-icon>
                    </el-button>
                </el-tooltip>
            </el-upload>
            <!--删除整个知识库-->
            <el-tooltip content="删除整个知识库" placement="top">
                <el-button circle type="danger" size="small" @click="onClickDestroy" :disabled="kbStore.isUpdating">
                    <el-icon>
                        <Delete />
                    </el-icon></el-button>
            </el-tooltip>

        </div>
        <div class="kb-file-list">
            <p v-if="kbStore.files.length === 0" class="sidebar-tip">请导入csv文件</p>
            <div v-for="file in kbStore.files" :key="file.source" class="kb-file-row"
                :class="{ active: kbStore.selectedSource === file.source }" @click="onSelectFile(file)">
                <span class="file-name" :title="file.source">{{ file.display_name }}</span>
                <span class="file-count">{{ file.count }}</span>
                <el-button text type="danger" size="small" @click.stop="onDeleteFile(file)"
                    :disabled="kbStore.isUpdating">
                    <el-icon>
                        <Delete />
                    </el-icon></el-button>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { Plus, Delete } from "@element-plus/icons-vue";
import { onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadFile } from "element-plus";
import { useKbStore } from "@/stores/kbStore";

const kbStore = useKbStore();

/**
 * 组件挂载时，从后端加载一次文件列表
 */
onMounted(() => {
    kbStore.loadFiles();
});

/**
 * 处理 el-upload 选中的文件列表
 * - files 参数从 UploadFile[] 里拿 raw: File
 * - 交给 kbStore.enqueueAdd 做实际的追加任务
 */
async function onFilesChange(_file: UploadFile, fileList: UploadFile[]) {
    if (kbStore.isUpdating) {
        ElMessage.warning("当前有知识库任务在执行，请稍后再上传。");
        return;
    }
    // 从 UploadFile 列表中提取原始 File 对象
    const files = fileList
        .map((f) => f.raw as File | undefined)   // 显式告诉 TS 这是 File 或 undefined
        .filter((f): f is File => !!f);         // 过滤掉 undefined，类型收窄为 File[]
    if (!files.length) {
        return;
    }

    try {
        await kbStore.enqueueAdd(files);
        ElMessage.success("已提交构建任务，稍后刷新文件列表。");
    } catch (error) {
        console.error("[KnowledgeBaseSidebar] 上传 CSV 失败:", error);
        ElMessage.error("上传 CSV 失败");
    }
}

/**
 * 删除整个知识库
 */
async function onClickDestroy() {
    try {
        await ElMessageBox.confirm(
            "确定要删除整个知识库吗？此操作不可恢复。",
            "删除确认",
            { type: "warning" }
        );
        await kbStore.destroyStore(false);
        ElMessage.success("知识库已清空");
    } catch (err) {
        if (err !== "cancel") {
            ElMessage.error("删除知识库失败");
        }
    }
}

/**
 * 选中文件
 */
function onSelectFile(file: { source: string }) {
    kbStore.selectedSource = file.source;
}

/**
 * 删除单个文件
 */
async function onDeleteFile(file: { source: string; display_name?: string }) {
    try {
        await ElMessageBox.confirm(
            `确定要删除文件 "${file.display_name ?? file.source}" 对应的全部索引吗？`,
            "删除确认",
            { type: "warning" }
        );
        await kbStore.deleteFileBySource(file.source);
        ElMessage.success("文件已删除");
    } catch (err) {
        if (err !== "cancel") {
            ElMessage.error("删除文件失败");
        }
    }
}
</script>

<style scoped>
/* 下面三段样式直接复制自 App.vue 中的同名 class，
     这样抽成组件后视觉效果保持不变 */
/* 整个侧边栏容器 */
.kb-sidebar {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.sidebar-header {
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    text-transform: uppercase;
}

/* 工具栏：加号 + 删除按钮一行 */
.kb-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 8px;
    border-bottom: 1px solid var(--border-color);
}

/* 文件列表外层占位容器（下一步会放真正的列表） */
.kb-file-list {
    flex: 1;
    padding: 8px;
    overflow: auto;
}

/* 单行文件展示 */
.kb-file-row {
    display: flex;
    align-items: center;
    padding: 4px 4px;
    border-radius: 4px;
    cursor: pointer;
}

/* hover 效果 */
.kb-file-row:hover {
    background-color: rgba(255, 255, 255, 0.04);
}

/* 选中状态高亮 */
.kb-file-row.active {
    background-color: rgba(64, 158, 255, 0.15);
}

/* 文件名：左侧占满 */
.file-name {
    flex: 1;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 条数：靠右小文本 */
.file-count {
    font-size: 12px;
    color: var(--text-secondary);
    margin: 0 8px;
}

.sidebar-tip {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-secondary);
}
</style>