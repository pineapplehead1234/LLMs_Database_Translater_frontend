<template>
  <div class="file-tree">
    <div class="toolbar">
      <el-button size="small" @click="openAddDialog">新建文件夹</el-button>
    </div>

    <el-tree
      ref="treeRef"
      :data="store.fileTree"
      node-key="id"
      :props="treeProps"
      default-expand-all
      highlight-current
      @node-click="onNodeClick"
      @current-change="onCurrentChange"
    >
      <template #default="{ data }">
        <el-dropdown trigger="contextmenu" @command="onNodeCommand($event, data)">
          <span class="custom-node">
            <span v-if="editingNodeId !== data.id" class="node-label">
              {{ data.name }}
            </span>
            <el-input
              v-else
              v-model="editingName"
              ref="renameInputRef"
              size="small"
              class="node-label"
              @keyup.enter="confirmRename"
              @blur="cancelRename"
            />
          </span>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename" v-if="data.id !== 'root'">重命名</el-dropdown-item>
              <el-dropdown-item command="delete" v-if="data.id !== 'root'">删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-tree>

    <!-- 新建文件夹对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新建文件夹"
      :close-on-click-modal="false"
      width="300px"
      @opened="focusAddInput"
    >
      <el-form>
        <el-form-item label="文件夹名称" :label-width="80">
          <el-input
            v-model="newFolderName"
            ref="addInputRef"
            @keyup.enter="confirmAdd"
            placeholder="请输入名称"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd" :loading="adding">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTranslationStore } from '@/stores/translationStore';
import type { FileTreeNode } from '@/stores/translationStore';

const store = useTranslationStore();

// 树配置
const treeProps = { label: 'name', children: 'children' };

// 当前选中的节点（用于确定新建位置）
const currentSelectedNode = ref<FileTreeNode | null>(null);

// 树引用（可选，用于未来扩展）
const treeRef = ref();

// === 新建状态 ===
const addDialogVisible = ref(false);
const newFolderName = ref('');
const addInputRef = ref<HTMLInputElement | null>(null);
const adding = ref(false);

// === 重命名状态 ===
const editingNodeId = ref<string | null>(null);
const editingName = ref('');
const renameInputRef = ref<HTMLInputElement | null>(null);

// 初始化
onMounted(() => {
  store.initFileTreeFromCache();
});

// 监听当前选中节点变化
function onCurrentChange(data: FileTreeNode | null) {
  currentSelectedNode.value = data;
}

// 打开新建对话框
function openAddDialog() {
  newFolderName.value = '';
  addDialogVisible.value = true;
}

// 自动聚焦 - 新建
function focusAddInput() {
  nextTick(() => {
    addInputRef.value?.focus();
  });
}

// 确认新建
async function confirmAdd() {
  const name = newFolderName.value.trim();
  if (!name) {
    ElMessage.warning('请输入文件夹名称');
    return;
  }

  // 确定父节点：如果选中的是文件夹，则用它；否则用 root
  let parentId = 'root';
  const selected = currentSelectedNode.value;
  if (selected && selected.type === 'folder') {
    parentId = selected.id;
  }

  adding.value = true;
  try {
    await store.addFolderNode({ parent_id: parentId, name });
    ElMessage.success('新建成功');
    addDialogVisible.value = false;
    newFolderName.value = '';
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '新建失败，请稍后重试';
    ElMessage.error(msg);
  } finally {
    adding.value = false;
  }
}

// 节点右键命令
async function onNodeCommand(command: string, data: FileTreeNode) {
  if (command === 'delete') {
    try {
      await ElMessageBox.confirm(
        `确定要删除 "${data.name}" 吗？此操作不可恢复。`,
        '删除确认',
        { type: 'warning' }
      );
      await store.deleteNode(data.id);
      ElMessage.success('删除成功');
    } catch (error) {
      // 用户取消或删除失败
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  } else if (command === 'rename') {
    startRename(data);
  }
}

// 开始重命名
function startRename(data: FileTreeNode) {
  editingNodeId.value = data.id;
  editingName.value = data.name || '';
  focusRenameInput();
}

// 自动聚焦 - 重命名
function focusRenameInput() {
  nextTick(() => {
    renameInputRef.value?.focus();
  });
}

// 确认重命名
async function confirmRename() {
  if (!editingNodeId.value) return;

  const name = editingName.value.trim();
  if (!name) {
    ElMessage.warning('名称不能为空');
    return;
  }

  try {
    await store.renameNode(editingNodeId.value, name);
    ElMessage.success('重命名成功');
    cancelRename();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '重命名失败';
    ElMessage.error(msg);
  }
}

// 取消重命名
function cancelRename() {
  editingNodeId.value = null;
  editingName.value = '';
}

// 点击节点（用于加载文件内容）
function onNodeClick(data: FileTreeNode) {
  if (data && data.type === 'file' && data.task_id) {
    store.loadTaskFromCache(data.task_id);
  }
}
</script>

<style scoped>
.file-tree {
  padding: 8px;
}

.toolbar {
  margin-bottom: 8px;
}

.custom-node {
  display: flex;
  align-items: center;
  width: 100%;
  padding-right: 8px;
  box-sizing: border-box;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-input__wrapper) {
  padding: 2px 8px;
  height: 24px;
  line-height: 20px;
}
</style>