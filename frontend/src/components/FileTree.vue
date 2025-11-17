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
      @node-click="onNodeClick"
    >
    <template #default="{ data }">
      <el-dropdown 
      trigger = "contextmenu"
      @command = "(command:string) => onNodeCommand(command,data)">
       <span class = "custom-node">
        <span class = "node-label">{{ data.name }}</span>
       </span>
       <template #dropdown>
        <el-dropdown-menu>
                    <el-dropdown-item
          command = "delete"
          v-if = "data.id !== 'root'">
        删除</el-dropdown-item>
  
          <el-dropdown-item
          command = "delete"
          v-if = "data.id !== 'root'">
        删除</el-dropdown-item>
        </el-dropdown-menu>
       </template>
      </el-dropdown>
    </template>
    </el-tree>
    
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useTranslationStore } from "@/stores/translationStore";
import type { FileTreeNode } from "@/stores/translationStore";

const store = useTranslationStore();

const treeProps = { label: "name", children: "children" };

onMounted(() => {
  store.initFileTreeFromCache();
});

function addRootFolder() {
  store.addFolderNode({
    parent_id: "root",
    name: "new folder",
  });
}
function onNodeCommand(command: string, data: { id: string }) {
  if (command === "delete") {
    store.deleteNode(data.id);
  }
}

function onNodeClick(node: FileTreeNode) {
  if (node.type === "file" && node.task_id) {
    store.loadTaskFromCache(node.task_id);
  }
}

</script>

<style scoped>
.file-tree {
  padding: 8px;
}
</style>
