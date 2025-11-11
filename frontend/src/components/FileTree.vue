<template>
    <div class="file-tree">
      <div class = "toolbar">
        <el-button size = "small" @click = "addRootFolder">新建文件夹</el-button>
                                        
      </div>
      <el-tree
        :data="tree"
        node-key="id"
        :props="treeProps"
        default-expand-all
        highlight-current
      />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  
  type Node = { id: string; name: string; children?: Node[] }
  
  const treeProps = { label: 'name', children: 'children' }
  
  const tree = ref<Node[]>([
    {
      id: 'root',
      name: '根目录',
      children: [
        { id: 'docs', name: 'docs', children: [] },
        { id: 'uploads', name: 'uploads', children: [] },
      ],
    },
  ])

  function addRootFolder() {
    const root = tree.value.find(n => n.id === 'root')
    if(!root) return;
    if(!root.children) root.children = []
    root.children.push(
        {id:crypto.randomUUID(), name: '新文件夹'}
    )
    tree.value = [...tree.value]
  }
  </script>
  
  <style scoped>
  .file-tree { padding: 8px; }
  </style>