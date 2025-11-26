<!-- 知识库视图侧边栏：预留为数据源/任务列表等 -->
<template>
    <div class="sidebar-header">
        <span>知识库</span>
    </div>
    <div class="sidebar-body">
        <p class="sidebar-tip">在右侧可以执行知识库的导入和删除操作。</p>
    </div>
</template>
<script setup lang="ts">
</script>

<style scoped>
/* 下面三段样式直接复制自 App.vue 中的同名 class，
     这样抽成组件后视觉效果保持不变 */

.sidebar-header {
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-color);
    text-transform: uppercase;
}

.sidebar-body {
    padding: 12px;
}

.sidebar-tip {
    margin: 0;
    font-size: 12px;
    line-height: 1.6;
    color: var(--text-secondary);
}
</style>