<template>
    <div class="rag-view">
        <div class="rag-status-indicator">
            <span class="status-dot" />
            <span class="rag-status-text">知识库服务</span>
        </div>
        <h2 class="rag-title">知识库管理</h2>
        <p class="rag-subtitle">在这里执行知识库的构建、追加和删除操作。</p>

        <div class="rag-panel">
            <h3 style="margin: 8px 0; color: #ddd;">数据库配置（开发中）</h3>

            <el-form label-width="90px">
                <el-form-item label="连接字符串">
                    <el-input v-model="connectionString" placeholder="如 postgres://user:pass@host/db" />
                </el-form-item>

                <el-form-item label="库类型">
                    <el-select v-model="dbType" placeholder="选择类型">
                        <el-option label="PostgreSQL" value="postgres" />
                        <el-option label="MySQL" value="mysql" />
                    </el-select>
                </el-form-item>
            </el-form>

        </div>
    </div>
</template>
<script setup lang="ts">
/**
 * 这里先简单地把原来 App.vue 里用到的 DatabaseConfigPanel 引进来，
 * 等我们把左侧 / 右侧拆成独立组件后，再慢慢替换这个内部内容。
 */
import { ref } from "vue";

const connectionString = ref("");
const dbType = ref<string | null>(null);
</script>

<style scoped>
/* 下面这几段样式直接拷贝自 App.vue 里原来的同名 class，保证外观不变 */

/* 知识库视图主区域 */
.rag-view {
    flex: 1;
    padding: 16px 20px;
    position: relative;
    overflow: auto;
}

/* 右上角状态条容器 */
.rag-status-indicator {
    position: absolute;
    top: 16px;
    right: 20px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    background: var(--bg-sidebar);
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

/* 状态圆点（先统一用绿色，后面接入在线/离线状态再细分） */
.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #67c23a;
    box-shadow: 0 0 5px #67c23a;
}

/* 标题 + 副标题 */
.rag-title {
    margin: 0 0 4px;
    font-size: 18px;
    color: var(--accent-color);
}

.rag-subtitle {
    margin: 0 0 16px;
    font-size: 13px;
    color: var(--text-secondary);
}

/* 内部面板留一点上边距 */
.rag-panel {
    margin-top: 8px;
}
</style>