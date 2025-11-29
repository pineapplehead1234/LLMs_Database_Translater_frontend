<template>
    <div class="tabbar">
        <div
            v-for="tab in store.openTabs"
            :key="tab.task_id"
            class="tab-item"
            :class="{ active: tab.task_id === store.activeTaskId }"
            @click="handleClickTab(tab.task_id)"
        >
            <el-icon class="tab-icon">
                <Document />
            </el-icon>
            <span class="tab-title">
                {{ tab.title }}
            </span>
            <span class="tab-close" @click.stop="handleCloseTab(tab.task_id)">
                ×
            </span>
        </div>
        <!-- 右侧：同步按钮 -->
        <div class="tabbar-right">
            <el-tooltip :content="props.syncEnabled ? '已开启同步滚动' : '点击开启同步滚动'">
                <el-button circle :type="props.syncEnabled ? 'primary' : 'default'" @click="toggleSync">
                    <el-icon>
                        <AddLocation v-if="props.syncEnabled" />
                        <DeleteLocation v-else />
                    </el-icon>
                </el-button>
            </el-tooltip>
        </div>
    </div>
</template>

<script setup lang="ts">// 使用 <script setup> 语法，并启用 TypeScript
import { useTranslationStore } from "@/stores/translationStore"; // 从 stores 路径引入我们刚才修改的翻译 store
import { AddLocation, DeleteLocation, Document } from "@element-plus/icons-vue";
const store = useTranslationStore(); // 创建一个 store 实例，这样模板和下面的函数都可以使用 store 里的数据和方法

function handleClickTab(taskId: string) { // 定义一个函数，当用户点击某个标签时触发，参数是该标签对应的任务 id
    store.loadTaskFromCache(taskId); // 调用 store 的 loadTaskFromCache 函数，从缓存中加载这个任务的内容
    // 这里不需要再调用 openTab，因为点击已经是一个存在的标签，它已经在 openTabs 里了，只需要确保内容同步
} // handleClickTab 函数结束

function handleCloseTab(taskId: string) { // 定义一个函数，当用户点击标签上的关闭按钮时触发
    store.closeTab(taskId); // 调用 store 的 closeTab 函数，关闭这个标签并处理激活状态切换
} // handleCloseTab 函数结束

const props = defineProps<{
    syncEnabled: boolean;
}>();
const emit = defineEmits<{
    (e: "update:syncEnabled", value: boolean): void;
}>();

function toggleSync() {
    emit("update:syncEnabled", !props.syncEnabled);
}
</script>

<style scoped>
/* 样式部分，使用 scoped 表示这些样式只作用在本组件内部 */
.tabbar {
    /* 整个标签栏容器的样式 */
    height: 32px;
    /* 固定高度为 40 像素 */
    border-bottom: 1px solid var(--tabbar-border-color);
    /* 底部加一条深色边框，与下面内容区分开 */
    display: flex;
    /* 使用 flex 布局，把子元素横向排布 */
    align-items: center;
    /* 子元素在垂直方向居中对齐 */
    padding: 0 12px;
    /* 左右各留 12 像素的内边距 */
    color: var(--tab-text-color);
}

.tab-item {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 100%;
    margin-right: 4px;
    background: var(--tab-bg);
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    font-size: 13px;
    color: var(--tab-text-color);
}

.tab-item.active {
    background: var(--tab-bg-active);
    color: var(--tab-text-color-active)
}

.tab-icon {
    font-size: 14px;
    margin-right: 6px;
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

.tabbar {
    display: flex;
    align-items: center;
    padding: 0 8px;
}

.tabbar-tabs {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.tabbar-right {
    flex-shrink: 0;
    margin-left: auto;
    display: flex;
    align-items: center;

}

/* TabBar 右侧的同步开关按钮，只显示图标 */
.tabbar-right :deep(.el-button.is-circle) {
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;
    padding: 0;
    min-width: auto;
}

/* 只改 TabBar 右侧的同步按钮图标颜色 */
.tabbar-right :deep(.el-icon) {
    color: var(--accent-color);
    /* 或者 var(--el-color-primary)，二者等价 */
}

.tabbar-right :deep(.el-button.is-circle:hover),
.tabbar-right :deep(.el-button.is-circle:focus) {
    background-color: transparent;
    border-color: transparent;
    box-shadow: none;
}
</style>
