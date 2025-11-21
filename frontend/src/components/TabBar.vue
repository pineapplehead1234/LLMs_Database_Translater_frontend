<template>
    <div class="tabbar">
        <div v-for="tab in store.openTabs" :key="tab.task_id" class="tab-item"
            :class="{ active: tab.task_id === store.activeTaskId }" @click="handleClickTab(tab.task_id)">
            <span class="tab-title">
                {{ tab.title }}
            </span>
            <span class="tab-close" @click.stop="handleCloseTab(tab.task_id)">
                ×
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">// 使用 <script setup> 语法，并启用 TypeScript
import { useTranslationStore } from "@/stores/translationStore"; // 从 stores 路径引入我们刚才修改的翻译 store

const store = useTranslationStore(); // 创建一个 store 实例，这样模板和下面的函数都可以使用 store 里的数据和方法

function handleClickTab(taskId: string) { // 定义一个函数，当用户点击某个标签时触发，参数是该标签对应的任务 id
    store.loadTaskFromCache(taskId); // 调用 store 的 loadTaskFromCache 函数，从缓存中加载这个任务的内容
    // 这里不需要再调用 openTab，因为点击已经是一个存在的标签，它已经在 openTabs 里了，只需要确保内容同步
} // handleClickTab 函数结束

function handleCloseTab(taskId: string) { // 定义一个函数，当用户点击标签上的关闭按钮时触发
    store.closeTab(taskId); // 调用 store 的 closeTab 函数，关闭这个标签并处理激活状态切换
} // handleCloseTab 函数结束
</script>

<style scoped>
/* 样式部分，使用 scoped 表示这些样式只作用在本组件内部 */
.tabbar {
    /* 整个标签栏容器的样式 */
    height: 40px;
    /* 固定高度为 40 像素 */
    border-bottom: 1px solid #2a2a2a;
    /* 底部加一条深色边框，与下面内容区分开 */
    display: flex;
    /* 使用 flex 布局，把子元素横向排布 */
    align-items: center;
    /* 子元素在垂直方向居中对齐 */
    padding: 0 12px;
    /* 左右各留 12 像素的内边距 */
    color: #ddd;
    /* 默认文字颜色为浅灰色 */
}

.tab-item {
    /* 单个标签的基础样式 */
    display: flex;
    /* 使用 flex 让标题和关闭按钮在一行内排列 */
    align-items: center;
    /* 垂直方向居中 */
    padding: 0 12px;
    /* 左右内边距 12 像素，上下为 0 */
    height: 100%;
    /* 高度占满整个 tabbar 的高度 */
    margin-right: 4px;
    /* 每个标签之间右侧留 4 像素间距 */
    background: #262626;
    /* 背景颜色为深灰色 */
    border-radius: 4px 4px 0 0;
    /* 上边两个角是圆角，下边是直角，看起来像标签页 */
    cursor: pointer;
    /* 鼠标移上来显示为小手，表示可以点击 */
    font-size: 13px;
    /* 标签文字大小为 13 像素 */
    color: #aaa;
    /* 标签文字颜色为偏浅的灰色 */
}

.tab-item.active {
    /* 当前激活标签的样式 */
    background: #1e1e1e;
    /* 背景颜色略微变深，与下面内容区域融为一体 */
    color: #fff;
    /* 激活状态下文字颜色为白色 */
}

.tab-title {
    /* 标签标题文本的样式 */
    max-width: 160px;
    /* 限制最大宽度为 160 像素，防止文件名太长撑破布局 */
    overflow: hidden;
    /* 多出来的部分隐藏 */
    text-overflow: ellipsis;
    /* 隐藏部分用省略号显示 */
    white-space: nowrap;
    /* 不换行，一行显示完 */
}

.tab-close {
    /* 标签关闭按钮（×）的样式 */
    margin-left: 8px;
    /* 和标题之间左边留 8 像素间距 */
    font-size: 12px;
    /* 关闭按钮字号稍微小一点 */
    opacity: 0.7;
    /* 默认稍微透明一点 */
}

.tab-close:hover {
    /* 鼠标移到关闭按钮上时的样式 */
    opacity: 1;
    /* 悬停时变为完全不透明，提示可以点击 */
}
</style>