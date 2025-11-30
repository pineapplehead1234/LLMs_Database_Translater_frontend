<template>
  <div class="upload-card">
    <!-- 控制区：模式 + 保存到 -->
    <div class="controls">
      <!-- 模式：按钮式单选 -->
      <el-radio-group v-model="strategy" size="default" class="mode-group">
        <el-radio-button value="normal">标准</el-radio-button>
        <el-radio-button value="fast">极速</el-radio-button>
        <el-radio-button value="thinking">精准</el-radio-button>
      </el-radio-group>

      <!-- 保存到：弹出树 -->
      <el-popover placement="bottom-start" width="260" v-model:visible="folderPickerVisible" :teleported="false">
        <template #reference>
          <el-button size="small" class="folder-trigger" @click="folderPickerVisible = true">
            <el-icon style="margin-right: 6px">
              <Folder />
            </el-icon>
            保存到：{{ selectedFolderLabel }}
            <el-icon style="margin-left: 6px">
              <ArrowDown />
            </el-icon>
          </el-button>
        </template>

        <div class="folder-tree-popover" style="max-height: 240px; overflow: auto; padding-right: 4px">
          <el-tree :data="folderTree" node-key="id" default-expand-all highlight-current :expand-on-click-node="false"
            @current-change="onSelectFolder" :props="folderTreeProps" />
        </div>
      </el-popover>
    </div>

    <el-upload class="upload-area" drag multiple :auto-upload="false" :file-list="elFilelist" :on-change="onElChange"
      :on-remove="onElRemove" :show-file-list="false" accept=".pdf" :disabled="kbStore.isUpdating">
      <div class="upload-text">拖拽文件到这里或点击上传</div>
      <template #tip>
        <div class="upload-tip">仅支持 .pdf</div>
      </template>
    </el-upload>

    <el-scrollbar v-if="filesWithStatus.length" class="file-list">
      <div class="file-row" v-for="fileItem in filesWithStatus" :key="fileItem.file.name + fileItem.file.size">
        <div class="file-name">{{ fileItem.file.name }}</div>
        <el-tag size="small" :type="getStatusType(fileItem.status)" class="file-status"
          :class="getStatusClass(fileItem.status)">
          {{ getStatusText(fileItem.status) }}
        </el-tag>
      </div>
    </el-scrollbar>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { API_ENDPOINTS } from "@/api/config";
import { request } from "@/api/http";
import { Folder, ArrowDown } from "@element-plus/icons-vue";
import type { UploadFile } from "element-plus";

import { useTranslationStore } from "@/stores/translationStore";
import type { FileTreeNode } from "@/stores/translationStore";
import type { TaskResultData } from "@/utils/taskCache";
import { prepareTaskImages } from "@/utils/imageCache";
import { ElMessage } from "element-plus";
import { useKbStore } from "@/stores/kbStore";
// 文件上传相关
const elFilelist = ref<UploadFile[]>([]);
const files = ref<File[]>([]);
const loading = ref(false);

const store = useTranslationStore();
const kbStore = useKbStore();
// 策略选择（翻译模式）
const strategy = ref<"normal" | "fast" | "thinking">("normal");

// 文件夹选择相关
const folderPickerVisible = ref(false);
const selectedFolderId = ref<string | null>(null);
const selectedFolderLabel = ref<string>("根目录");

//限制文件类型
const ALLOWED_FILE_TYPES = ["pdf", "docx", "md"];

const folderTreeProps = {
  label: 'name',
  children: 'children',
};

//工具函数:判断一个File是否是予许的类型
function isAllowedFile(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  return ALLOWED_FILE_TYPES.includes(ext);
}
const folderTree = computed<FileTreeNode[]>(() => {
  const onlyFolders = (nodes: FileTreeNode[]): FileTreeNode[] => {
    return nodes
      .filter((n) => n.type === "folder")
      .map((n) => ({
        ...n,
        children: n.children ? onlyFolders(n.children) : [],
      }));
  };
  return onlyFolders(store.fileTree);
});

// 文件状态类型
type FileStatus = "success" | "pending" | "processing" | "error";

// 带状态的文件类型
type FileWithStatus = {
  file: File;
  status: FileStatus;
  task_id?: string;
  error?: string;
};

const filesWithStatus = ref<FileWithStatus[]>([]);

// 文件夹选择处理
function onSelectFolder(node: FileTreeNode | null) {
  if (!node) {
    selectedFolderId.value = null;
    selectedFolderLabel.value = "根目录";
  } else {
    selectedFolderId.value = node.id;
    selectedFolderLabel.value = node.name;
    folderPickerVisible.value = false;
  }
}

// 文件变更处理
function onElChange(_file: UploadFile, fileList: UploadFile[]) {
  // 先从 UploadFile 列表里拿到原始 File 对象
  const rawFiles = fileList.map((f) => f.raw).filter(Boolean) as File[];

  // 按是否允许拆分
  const allowedFiles: File[] = [];
  const rejectedFiles: File[] = [];

  rawFiles.forEach((file) => {
    if (isAllowedFile(file)) {
      allowedFiles.push(file);
    } else {
      rejectedFiles.push(file);
    }
  });

  // 更新内部使用的文件列表，只保留合法文件
  files.value = allowedFiles;
  filesWithStatus.value = allowedFiles.map((file) => ({
    file,
    status: "pending" as FileStatus,
  }));

  // el-upload 自己维护的 fileList 也可以只保留合法文件（更干净）
  elFilelist.value = fileList.filter((item) => {
    const raw = item.raw as File | undefined;
    return raw ? isAllowedFile(raw) : false;
  });

  // 如果有被拒绝的文件，给用户弹一个 warning 提示
  if (rejectedFiles.length > 0) {
    const names = rejectedFiles.map((f) => f.name).join("、");
    ElMessage.warning(`以下文件类型不支持：${names}。仅支持 .pdf / .docx / .md`);
  }

  // 有合法文件并且当前不在上传时，自动开始上传
  if (filesWithStatus.value.length > 0 && !loading.value) {
    upload();
  }
}

function onElRemove(_file: UploadFile, fileList: UploadFile[]) {
  elFilelist.value = fileList;
  const rawFiles = fileList.map((f) => f.raw).filter(Boolean) as File[];
  files.value = rawFiles;
  filesWithStatus.value = rawFiles.map((file) => ({
    file,
    status: "pending" as FileStatus,
  }));
}

// 获取状态文本
function getStatusText(status: FileStatus): string {
  const statusMap: Record<FileStatus, string> = {
    pending: "等待上传",
    processing: "处理中",
    success: "已完成",
    error: "错误",
  };
  return statusMap[status] ?? "未知";
}

// 获取 Element Plus 的标签类型，配合 base.css 中的主题色
function getStatusType(status: FileStatus): "info" | "warning" | "success" | "danger" {
  const typeMap: Record<FileStatus, "info" | "warning" | "success" | "danger"> = {
    pending: "info",
    processing: "warning",
    success: "success",
    error: "danger",
  };
  return typeMap[status] ?? "info";
}

// 为不同状态附加 class，方便用主题变量精细控制文字颜色
function getStatusClass(status: FileStatus): string {
  const map: Record<FileStatus, string> = {
    pending: "file-status--pending",
    processing: "file-status--processing",
    success: "file-status--success",
    error: "file-status--error",
  };
  return map[status] ?? "file-status--pending";
}

// 上传函数
async function upload() {
  // 知识库正在更新时禁止上传翻译任务
  if (kbStore.isUpdating) {
    ElMessage.warning("知识库正在更新，请稍后再上传翻译文件。");
    return;
  }
  if (!filesWithStatus.value || filesWithStatus.value.length === 0) return;
  loading.value = true;

  for (let i = 0; i < filesWithStatus.value.length; i++) {
    const fileItem = filesWithStatus.value[i];

    if (!fileItem) continue;

    const file = fileItem.file;
    fileItem.status = "pending";

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target_lang", "ch");
      form.append("strategy", strategy.value);
      form.append("client_request_id", file.name);

      const uploadRes = await request(API_ENDPOINTS.UPLOAD, {
        method: "POST",
        body: form,
      });

      if (!uploadRes.ok) {
        throw new Error(`上传失败: ${uploadRes.statusText}`);
      }

      const uploadData = await uploadRes.json();

      if (uploadData.status !== "success") {
        fileItem.status = "error";
        fileItem.error = uploadData.error || "上传失败";
        continue;
      }

      const task_id = uploadData.task_id;
      fileItem.task_id = task_id;
      fileItem.status = "processing";
      // 等 1 秒再开始轮询
      await new Promise(resolve => setTimeout(resolve, 10000));

      await queryTaskProgress(task_id, fileItem);
    } catch (e) {
      fileItem.error = "上传失败";
      const getErrorMessage = (error: unknown): string =>
        error instanceof Error ? error.message : String(error);
      fileItem.error = getErrorMessage(e);
    }
  }

  loading.value = false;

  // 关键：上传完成后清空这几个列表，下次点击“开始上传”只能处理新选择的文件

  filesWithStatus.value = []; // 清空“上传记录列表”（下面那个 v-for 会不再显示任何文件）
  files.value = []; // 清空原始 File 数组（如果后面有用到，可以保持一致）
  elFilelist.value = []; // 清空 el-upload 控制的文件列表（相当于“把上传控件重置”）
}
const MAX_QUERY_RETRY = 5;       // 最多轮询/重连 5 次
const QUERY_INTERVAL = 2000;     // 每次间隔 2 秒
// 查询任务进度
async function queryTaskProgress(taskId: string, fileItem: FileWithStatus) {
  store.setCurrentFile({
    task_id: taskId,
    status: "processing",
    error: null,
    client_request_id: fileItem.file.name,
    original_markdown: {},
    translated_markdown: {},
    term_annotations: {},
  });

  for (let attempt = 1; attempt <= MAX_QUERY_RETRY; attempt++) {
    try {
      const response = await request(
        `${API_ENDPOINTS.QUERY}?task_id=${taskId}`,
      );

      if (!response.ok) {
        throw new Error(`查询失败: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === "success") {
        // 查询成功：缓存 + 更新状态，然后结束轮询
        await cacheAndSetCurrentFile(data, fileItem);
        return;
      }

      if (data.status === "error") {
        // 后端明确返回 error：直接结束轮询
        fileItem.status = "error";
        fileItem.error = data.error;
        return;
      }

      // 走到这里一般是 data.status === "processing"
      fileItem.status = "processing";
      // 不是最后一次尝试，则等待一段时间再查
      if (attempt < MAX_QUERY_RETRY) {
        await new Promise(resolve => setTimeout(resolve, QUERY_INTERVAL));
      }
    } catch (err) {
      // 网络异常 / 其他异常：可以认为是“需要重连”的场景
      if (attempt === MAX_QUERY_RETRY) {
        fileItem.status = "error";
        fileItem.error =
          err instanceof Error ? err.message : String(err);
        return;
      }
      // 不是最后一次，稍等再重试
      await new Promise(resolve => setTimeout(resolve, QUERY_INTERVAL));
    }
  }
  // 循环结束仍未 success / error，认为超时
  fileItem.status = "error";
  fileItem.error = "查询超时，请稍后重试";
}

async function cacheAndSetCurrentFile(data: TaskResultData, fileItem: FileWithStatus) {
  const parentId = selectedFolderId.value ?? "root";
  const docType = getDocTypeFromFileName(fileItem.file.name);

  // 先为这个 task 解压并准备所有图片（内存 + IndexedDB）
  await prepareTaskImages(data.task_id);

  // 图片准备好了，再把任务数据写入 store，这样 Panel 首次渲染时就能直接命中 getCachedImageUrl
  await store.handleTaskSuccess(data, {
    parent_id: parentId,
    docType,
  });

  // 更新当前这个文件的状态
  fileItem.status = "success";
}

function getDocTypeFromFileName(name: string): "md" | "pdf" | "docx" {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf" || ext === "docx" || ext === "md") {
    return ext;
  }
  return "md";
}
</script>

<style scoped>
.upload-card {
  display: flex;
  flex-direction: column;
  padding: 8px;
  border-radius: 8px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  min-height: 0;
}

/* 拖拽上传区域外观（卡片 + 虚线边框） */
.upload-area {
  background-color: var(--upload-area-bg);
  border: 1px dashed var(--upload-area-border);
  color: var(--upload-text-color);
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 里面的提示文字也跟随主题颜色 */
.upload-area :deep(.el-upload-dragger .el-upload__text) {
  color: var(--upload-text-color);
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: var(--accent-color);
}

.upload-text {
  font-size: 13px;
  text-align: center;
  color: var(--upload-text-color);
  margin-bottom: 4px;
}

.upload-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.file-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.file-status {
  margin-left: auto;
}

/* 文件状态标签：根据状态 + 主题变量控制文字颜色 */
.file-status--pending :deep(.el-tag__content) {
  color: var(--text-secondary);
}

.file-status--processing :deep(.el-tag__content) {
  color: var(--accent-color);
}

.file-status--success :deep(.el-tag__content) {
  color: var(--kb-status-online);
}

.file-status--error :deep(.el-tag__content) {
  color: var(--kb-status-offline);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 4px 0 12px;
}

.mode-group {
  flex: 1 1 auto;
}

.mode-group :deep(.el-radio-button__inner) {
  padding: 4px 10px;
}

.folder-trigger {
  --el-button-bg-color: var(--upload-folder-btn-bg);
  --el-button-text-color: var(--text-primary);
  /* 新增：按钮文字颜色 */
  flex-shrink: 0;
}

.upload-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.file-list {
  max-height: 200px;
  margin-top: 12px;
  scrollbar-gutter: stable;
}

/* Popover 面板本身：统一走面板背景 */
:deep(.el-popover) {
  background-color: var(--panel-bg);
  color: var(--text-primary);
  border: 1px solid var(--panel-border);
}

/* Tree 节点文字颜色 */
:deep(.el-popover .el-tree-node__content) {
  color: var(--text-primary);
}

/* 当前选中的目录：用侧边栏/Activity 的激活色，保证有对比 */
:deep(.el-popover .el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--activity-item-active-bg);
  color: var(--accent-color);
}

/* hover 时轻微高亮 */
:deep(.el-popover .el-tree-node__content:hover) {
  background-color: var(--activity-item-hover-bg);
}

/* 真正控制中间白色框的那层 */
.upload-area :deep(.el-upload-dragger) {
  background-color: var(--upload-area-bg);
  border: 1px dashed var(--upload-area-border);
  color: var(--upload-text-color);
}

/* 里面的提示文字 */
.upload-area :deep(.el-upload-dragger .el-upload__text) {
  color: var(--upload-text-color);
}

/* hover 边框高亮 */
.upload-area :deep(.el-upload-dragger:hover) {
  border-color: var(--accent-color);
}

.folder-trigger {
  /* 默认状态：跟上传卡片靠近一点 */
  --el-button-bg-color: var(--panel-bg);
  --el-button-text-color: var(--text-primary);
  --el-button-border-color: var(--panel-border);
}

/* hover 状态：稍微高亮一下 */
.folder-trigger:hover {
  --el-button-bg-color: var(--activity-item-hover-bg);
  --el-button-text-color: var(--accent-color);
  --el-button-border-color: var(--activity-item-active-border);
}

/* Popover 外层：统一面板背景 */
.upload-card :deep(.el-popover) {
  background-color: var(--panel-bg) !important;
  color: var(--text-primary);
  border: 1px solid var(--panel-border);
}

/* Popover 内容内部那层容器，也跟着用 panel-bg */
.upload-card :deep(.el-popover__content) {
  background-color: var(--panel-bg) !important;
}

/* Tree 容器如果本身有白色背景，也统一掉 */
.upload-card :deep(.el-popover .el-tree) {
  background-color: transparent !important;
  /* 用外面的 panel-bg 就够了 */
}

/* Tree 行文字颜色、hover、选中高亮 */
.upload-card :deep(.el-popover .el-tree-node__content) {
  color: var(--text-primary);
}

.upload-card :deep(.el-popover .el-tree-node__content:hover) {
  background-color: var(--activity-item-hover-bg);
}

.upload-card :deep(.el-popover .el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--activity-item-active-bg);
  color: var(--accent-color);
}

/* “保存到”弹窗里的文件夹树文字颜色 */
.folder-tree-popover :deep(.el-tree-node__label) {
  color: var(--text-primary);
  /* 普通状态文字颜色，跟整体主题走 */
  font-size: 13px;
}

/* 当前选中节点的文字颜色（高亮一点） */
.folder-tree-popover :deep(.is-current > .el-tree-node__content .el-tree-node__label) {
  color: var(--accent-color);
}

/* 鼠标悬停时，可以稍微变深一点（可选） */
.folder-tree-popover :deep(.el-tree-node__content:hover .el-tree-node__label) {
  color: var(--accent-color);
}
</style>
