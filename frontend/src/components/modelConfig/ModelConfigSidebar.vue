<template>
  <div class="model-config-sidebar">
    <!-- 顶部标题 + 新增按钮 -->
    <div class="panel-header">
      <span>Configured LLMs</span>
      <el-button type="primary" link size="small" @click="handleAdd">
        <el-icon>
          <Plus />
        </el-icon>
      </el-button>
    </div>

    <!-- 模型列表 -->
    <div class="model-list">
      <div
        v-for="model in store.llms"
        :key="model.id"
        class="model-item"
        :class="{ active: model.id === store.selectedId }"
        @click="store.setSelectedId(model.id)"
      >
        <div class="model-name">{{ model.name }}</div>
        <div class="model-tag" :class="roleTagClass(store.getRole(model))">
          {{ roleLabel(store.getRole(model)) }}
        </div>
      </div>

      <!-- 无数据时的占位提示 -->
      <div v-if="store.llms.length === 0" class="empty-tip">
        暂无模型，请点击右上角按钮新增。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
import { useModelConfigStore, type RoleType } from "@/stores/modelConfigStore";

// 使用 Pinia store 进行状态管理
const store = useModelConfigStore();

// 根据角色返回展示标签文案
function roleLabel(role: RoleType) {
  if (role === "main") return "MAIN";
  if (role === "MT") return "MT";
  return "GENERAL";
}

// 根据角色返回不同的样式 class
function roleTagClass(role: RoleType) {
  if (role === "main") return "tag-main";
  if (role === "MT") return "tag-mt";
  return "tag-general";
}

// 新增模型并自动选中
function handleAdd() {
  const id = store.addModel();
  store.setSelectedId(id);
}
</script>

<style scoped>
.model-config-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page, #1e1e1e);
  border-right: 1px solid var(--el-border-color-light, #333333);
}

.panel-header {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  color: var(--el-text-color-secondary, #999999);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light, #333333);
}

.model-list {
  flex: 1;
  overflow: auto;
}

.model-item {
  padding: 8px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: background 0.15s ease;
}

.model-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.model-item.active {
  background: rgba(64, 158, 255, 0.12);
  border-left-color: #409eff;
}

.model-name {
  font-size: 13px;
  color: var(--el-text-color-primary, #dddddd);
  font-weight: 500;
}

.model-tag {
  display: inline-block;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  width: fit-content;
}

.tag-main {
  background: rgba(64, 158, 255, 0.2);
  color: #409eff;
}

.tag-mt {
  background: rgba(103, 194, 58, 0.2);
  color: #67c23a;
}

.tag-general {
  background: rgba(255, 255, 255, 0.08);
  color: #aaaaaa;
}

.empty-tip {
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #888888);
}
</style>

