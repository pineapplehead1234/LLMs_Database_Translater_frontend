<template>
  <div class="file-tree">
    <el-tree :data="treeData" node-key="id" :props="treeProps" highlight-current default-expand-all
      @node-click="onNodeClick" @current-change="onCurrentChange">
      <template #default="{ data }">
        <el-dropdown trigger="contextmenu" @command="onNodeCommand($event, data)">
          <span class="custom-node">
            <span v-if="editingNodeId !== data.id" class="node-label">
              {{ data.name }}
            </span>
            <el-input v-else v-model="editingName" ref="renameInputRef" size="small" class="node-label"
              @keyup.enter="confirmEdit" @blur="cancelEdit" @keyup.esc="cancelEdit" />

            <!-- 根节点行右侧的“新建文件夹”按钮，VSCode 风格：只显示加号图标、无边框、靠右 -->
            <el-button v-if="data.id === 'root'" class="new-folder-btn" type="text" @click.stop="startCreate">
              <el-icon>
                <Plus />
              </el-icon>
            </el-button>
          </span>

          <template v-if="data.id !== '__create__'" #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="rename" v-if="data.id !== 'root' && data.type === 'folder'">
                重命名
              </el-dropdown-item>
              <el-dropdown-item command="delete" v-if="data.id !== 'root'">
                删除 <!-- 显示的文字 -->
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useTranslationStore } from '@/stores/translationStore';
import type { FileTreeNode } from '@/stores/translationStore';
import { Plus } from '@element-plus/icons-vue'
import { da } from 'element-plus/es/locales.mjs';
const store = useTranslationStore();

const treeProps = { label: 'name', children: 'children' };

const currentSelectedNode = ref<FileTreeNode | null>(null);

const editingNodeId = ref<string | null>(null);
const editingName = ref('');
const createContext = ref<{ parentId: string } | null>(null);

const renameInputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  store.initFileTreeFromCache();
});

function onCurrentChange(data: FileTreeNode | null) {
  currentSelectedNode.value = data;
}
const treeData = computed<FileTreeNode[]>(() => {
  if (!createContext.value || editingNodeId.value !== '__create__') {
    return store.fileTree;
  }

  const cloned = JSON.parse(JSON.stringify(store.fileTree)) as FileTreeNode[];
  const parentId = createContext.value.parentId;

  const placeholder: FileTreeNode = {
    id: '__create__',
    name: editingName.value || '新建文件夹',
    type: 'folder',
    parent_id: parentId,
    children: [],
  };

  const insertPlaceholder = (nodes: FileTreeNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === parentId) {
        node.children = node.children || [];
        node.children.unshift(placeholder);
        return true;
      }
      if (node.children && insertPlaceholder(node.children)) {
        return true;
      }
    }
    return false;
  };

  if (parentId === 'root') {
    const rootNode = cloned.find(item => item.id === 'root');
    if (rootNode) {
      rootNode.children = rootNode.children || [];
      rootNode.children.unshift(placeholder);
    }
    return cloned;
  }

  insertPlaceholder(cloned);
  return cloned;
});

function startCreate() {
  let parentId = 'root';
  const selected = currentSelectedNode.value;
  if (selected && selected.type === 'folder') {
    parentId = selected.id;
  }
  console.log('📁 新建文件夹，父节点ID:', parentId);
  // 🔴 关键：提前检查是否允许在此处新建

  createContext.value = { parentId };
  editingNodeId.value = '__create__';
  editingName.value = '新建文件夹';

  nextTick(() => {
    renameInputRef.value?.focus();
    renameInputRef.value?.select();
  });
}

async function confirmEdit() {
  if (!editingNodeId.value) return;

  const name = editingName.value.trim();
  if (!name) {
    ElMessageBox.alert('名字不能为空', '提示标题', {
      center: true, // 居中显示
      confirmButtonText: '确定',
    });
  }

  try {
    if (editingNodeId.value === '__create__') {
      if (!createContext.value) {
        throw new Error('新建上下文无效');
      }
      await store.addFolderNode({
        parent_id: createContext.value.parentId,
        name,
      });

    } else {
      await store.renameNode(editingNodeId.value, name);
    }

    cancelEdit();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : '操作失败';
    ElMessage.error(msg);
  }
}

function cancelEdit() {
  editingNodeId.value = null;
  editingName.value = '';
  createContext.value = null;
}

async function onNodeCommand(command: string, data: FileTreeNode) {
  if (data.id === '__create__') return;
  if (command === 'delete') {
    try {
      await ElMessageBox.confirm(
        `确定要删除 "${data.name}" 吗？此操作不可恢复。`,
        '删除确认',
        { type: 'warning' }
      );
      await store.deleteNode(data.id);
      ElMessage.success('删除成功');
      store.closeTab(data.task_id || '');
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  } else if (command === 'rename') {
    startRename(data);
  }
}

function startRename(data: FileTreeNode) {
  createContext.value = null;
  editingNodeId.value = data.id;
  editingName.value = data.name || '';
  nextTick(() => {
    renameInputRef.value?.focus();
  });
}

function onNodeClick(data: FileTreeNode) {
  if (data && data.type === 'file' && data.task_id) {
    store.loadTaskFromCache(data.task_id);

    console.log('📄 加载文件，任务ID:', data.task_id);
    store.openTab({
      task_id: data.task_id,
      title: data.name,
      docType: data.docType ?? "md",
    })
  }
}
</script>

<style scoped>
.file-tree {
  padding: 8px;
  background-color: var(--panel-bg);
}

/* 树本体背景透明，沿用外层 panel-bg */
.file-tree :deep(.el-tree) {
  background-color: transparent;
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

/* 每一行节点的文字颜色 */
.file-tree :deep(.el-tree-node__content) {
  color: var(--text-primary);
  font-size: 13px;
}

/* hover 高亮（类似 VSCode 左侧） */
.file-tree :deep(.el-tree-node__content:hover) {
  background-color: var(--activity-item-hover-bg);
  color: var(--accent-color);
}

/* 当前选中节点（依赖 highlight-current） */
.file-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--activity-item-active-bg);
  color: var(--accent-color);
}

.node-icon {
  margin-right: 4px;
  color: var(--text-secondary);
  /* 默认图标略浅一点 */
  flex-shrink: 0;
}

/* 选中行时，让图标也跟着变色 */
.file-tree :deep(.el-tree-node.is-current .node-icon) {
  color: var(--accent-color);
}

:deep(.el-input__wrapper) {
  padding: 2px 8px;
  height: 24px;
  line-height: 20px;
}

.root-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 8px;
}

.root-title {
  font-weight: 600;
}

.new-folder-btn {
  padding: 0 4px;
  min-width: auto;
  height: 22px;
  border: none;
  box-shadow: none;
  color: var(--text-secondary);
  margin-left: 4px;
}

.new-folder-btn:hover {
  background-color: transparent;
  color: var(--accent-color);
}

.new-folder-btn :deep(.el-icon) {
  font-size: 14px;
}
</style>
