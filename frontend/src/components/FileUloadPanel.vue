<template>
  <!-- 控制区：模式 + 保存到 -->
  <div class="controls">
    <!-- 模式：按钮式单选 -->
    <el-radio-group v-model="strategy" size="default" class="mode-group">
      <el-radio-button label="normal">标准</el-radio-button>
      <el-radio-button label="fast">极速</el-radio-button>
      <el-radio-button label="thinking">精准</el-radio-button>
    </el-radio-group>

    <!-- 保存到：按钮 + 弹出树 -->
    <el-popover
      placement="bottom-start"
      width="260"
      v-model:visible="folderPickerVisible"
      :teleported="false"
    >
      <template #reference>
        <el-button size="small" class="folder-trigger" @click="folderPickerVisible = true">
          <el-icon style="margin-right: 6px"><Folder /></el-icon>
          保存到：{{ selectedFolderLabel }}
          <el-icon style="margin-left: 6px"><ArrowDown /></el-icon>
        </el-button>
      </template>

      <div style="max-height: 240px; overflow: auto; padding-right: 4px">
        <el-tree
          :data="folderTree"
          node-key="id"
          default-expand-all
          highlight-current
          :expand-on-click-node="false"
          @current-change="onSelectFolder"
        />
      </div>
    </el-popover>
  </div>

  <el-upload
    class="upload-area"
    drag
    multiple
    :auto-upload="false"
    :file-list="elFilelist"
    :on-change="onElChange"
    :on-remove="onElRemove"
    :show-file-list="false"
  >
    <div class="upload-text">拖拽文件到这里或点击上传</div>
    <template #tip>
      <div class="el-upload__tip">支持 .pdf / .docx / .md</div>
    </template>
  </el-upload>

  <el-scrollbar v-if="filesWithStatus.length" class="file-list">
    <div
      class="file-row"
      v-for="fileItem in filesWithStatus"
      :key="fileItem.file.name + fileItem.file.size"
    >
      <div class="file-name">📄 {{ fileItem.file.name }}</div>
      <el-tag size="small" :type="getStatusType(fileItem.status)" class="file-status">
        {{ getStatusText(fileItem.status) }}
      </el-tag>
    </div>
  </el-scrollbar>

  <div class="upload-actions" v-if="filesWithStatus.length">
    <el-button
      type="primary"
      @click="upload"
      :loading="loading"
      :disabled="loading || filesWithStatus.length === 0"
    >
      {{ loading ? "上传中..." : "开始上传" }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { API_ENDPOINTS, IS_MOCK } from "@/api/config";
import { Folder, ArrowDown } from "@element-plus/icons-vue";
import type { UploadFile } from "element-plus";

import { useTranslationStore } from "@/stores/translationStore";
import type { FileTreeNode } from "@/stores/translationStore";
import type { TaskResultData } from "@/utils/taskCache";
// 文件上传相关
const elFilelist = ref<UploadFile[]>([]);
const files = ref<File[]>([]);
const loading = ref(false);

const store = useTranslationStore();

// 策略选择（翻译模式）
const strategy = ref<"normal" | "fast" | "thinking">("normal");

// 文件夹选择相关
const folderPickerVisible = ref(false);
const selectedFolderId = ref<string | null>(null);
const selectedFolderLabel = ref<string>("根目录");

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
  elFilelist.value = fileList;
  const rawFiles = fileList.map((f) => f.raw).filter(Boolean) as File[];
  files.value = rawFiles;
  filesWithStatus.value = rawFiles.map((file) => ({
    file,
    status: "pending" as FileStatus,
  }));
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
    pending: "上传中",
    processing: "处理中",
    success: "已完成",
    error: "错误",
  };
  return statusMap[status] || "未知";
}

// 获取状态标签类型
function getStatusType(status: FileStatus): "上传中" | "处理中" | "已完成" | "错误" {
  const typeMap: Record<FileStatus, "上传中" | "处理中" | "已完成" | "错误"> = {
    pending: "上传中",
    processing: "处理中",
    success: "已完成",
    error: "错误",
  };
  return typeMap[status] || "info";
}

// 上传函数
async function upload() {
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

      const uploadRes = await fetch(API_ENDPOINTS.UPLOAD, {
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

      await queryTaskProgress(task_id, fileItem);
    } catch (e) {
      fileItem.error = "上传失败";
      const getErrorMessage = (error: unknown): string =>
        error instanceof Error ? error.message : String(error);
      fileItem.error = getErrorMessage(e);
    }
  }

  loading.value = false;
}

// 查询任务进度
async function queryTaskProgress(taskId: string, fileItem: FileWithStatus) {
  if (IS_MOCK) {
    const response = await fetch(`${API_ENDPOINTS.QUERY}?task_id=${taskId}`);

    if (!response.ok) {
      fileItem.status = "error";
      fileItem.error = `查询失败: ${response.statusText}`;
      return;
    }
    store.setCurrentFile({
      task_id: taskId,
      status: "processing",
      error: null,
      client_request_id: fileItem.file.name,
      original_markdown: {},
      translated_markdown: {},
      term_annotations: {},
    });

    const data = await response.json();

    if (data.status === "success") {
      await cacheAndSetCurrentFile(data, fileItem);
    } else if (data.status === "error") {
      fileItem.status = "error";
      fileItem.error = data.error;
    } else {
      fileItem.status = "processing";
    }
    return;
  }
  store.setCurrentFile({
    task_id: taskId,
    status: "processing",
    error: null,
    client_request_id: fileItem.file.name,
    original_markdown: {},
    translated_markdown: {},
    term_annotations: {},
  });

  const response = await fetch(`${API_ENDPOINTS.QUERY}?taskId=${taskId}`);

  if (!response.body) {
    fileItem.status = "error";
    fileItem.error = "无法获取响应流";
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    const text = decoder.decode(value);
    console.log("收到数据:", text);

    try {
      const data = JSON.parse(text);

      if (data.status === "success") {
        await cacheAndSetCurrentFile(data, fileItem);
        break;
      } else if (data.status === "error") {
        fileItem.status = "error";
        fileItem.error = data.error;
        break;
      } else {
        fileItem.status = "processing";
      }
    } catch (e) {
      console.error("解析数据失败:", e, text);
    }
  }
}

async function cacheAndSetCurrentFile(data: TaskResultData, fileItem: FileWithStatus) {
  const parentId = selectedFolderId.value ?? "root";
  const docType = getDocTypeFromFileName(fileItem.file.name);

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
/* 拖拽上传区域外观（卡片 + 虚线边框） */
.upload-area {
  border: 1px dashed #3a3a3a;
  background: #1a1a1a;
  padding: 8px 0;
}

.upload-text {
  font-size: 14px;
  text-align: center;
  background: #1a1a1a;
}

.file-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-status {
  margin-left: auto;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  margin-bottom: 12px;
}

.mode-group :deep(.el-radio-button__inner) {
  padding: 4px 10px;
}

.folder-trigger {
  --el-button-bg-color: #1f1f1f;
}

.upload-actions {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.file-list {
  max-height: 200px;
  margin-top: 12px;
}
</style>
