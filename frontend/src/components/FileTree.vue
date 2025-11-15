<template>
  <div class="file-tree">
    <div class="toolbar">
      <el-button size="small" @click="addRootFolder">新建文件夹</el-button>
    </div>
    <el-tree
      :data="store.fileTree"
      node-key="id"
      :props="treeProps"
      default-expand-all
      highlight-current
    />
    
  </div>
</template>

<script setup lang="ts">
import { useTranslationStore } from "@/stores/translationStore";

const store = useTranslationStore();

const treeProps = { label: "name", children: "children" };

function addRootFolder() {
  const root = store.fileTree.find((n) => n.id === "root");
  if (!root) return;
  if (!root.children) {
    root.children = [];
  }
  root.children.push({
    id: crypto.randomUUID(),
    type: "folder",
    parent_id: "root",
    name: "新文件夹",
  });
}
</script>

<style scoped>
.file-tree {
  padding: 8px;
}
</style>
