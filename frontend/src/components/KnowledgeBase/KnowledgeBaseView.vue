<template>
    <div class="kb-view">
        <div class="kb-header">
            <el-tabs v-model="activeTab" class="kb-tabs" type="card">
                <el-tab-pane label="当前文件" name="current"></el-tab-pane>
                <el-tab-pane label="全部索引" name="all"></el-tab-pane>
            </el-tabs>
            <div class="kb-status">
                <span class="status-dot" :class="{ offline: !kbStore.isConnected }" />
                <span class="rag-status-text">{{ kbStore.isConnected ? "已连接" : "为连接" }}</span>
            </div>
        </div>

        <div class="rag-panel">
            <!-- 当前文件 Tab -->
            <template v-if="activeTab === 'current'">
                <div v-if="!kbStore.selectedSource" class="sidebar-tip">
                    请先在左侧选择一个 CSV 文件。
                </div>

                <template v-else>
                    <el-table :data="tableData" v-loading="tableLoading" size="small" border style="width: 100%;">
                        <el-table-column prop="seq" label="Seq" width="80" />
                        <el-table-column prop="english" label="英文" min-width="260" show-overflow-tooltip />
                        <el-table-column prop="chinese" label="中文" min-width="260" show-overflow-tooltip />
                        <!-- ✅ 行号列：只显示 row 数字 -->
                        <el-table-column prop="row" label="行号" width="80" />
                        <!-- ✅ 操作列：专门放删除按钮 -->
                        <el-table-column label="操作" width="80">
                            <template #default="{ row }">
                                <el-button type="danger" text size="small" :disabled="kbStore.isUpdating"
                                    @click="onDeleteRow(row, 'current')">
                                    删除
                                </el-button>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div style="margin-top: 8px; text-align: right;">
                        <el-pagination background layout="prev, pager, next" :page-size="pageSize"
                            :current-page="currentPage" :total="totalCount" @current-change="loadCurrentFilePage" />
                    </div>
                </template>
            </template>

            <!-- 全部索引 Tab：先放一个占位，后面再实现 -->
            <template v-else>
                <el-table :data="tableDataAll" v-loading="tableLoadingAll" size="small" border style="width: 100%;">
                    <el-table-column prop="seq" label="Seq" width="80" />
                    <el-table-column prop="source" label="文件" min-width="220" show-overflow-tooltip />
                    <el-table-column prop="english" label="英文" min-width="260" show-overflow-tooltip />
                    <el-table-column prop="chinese" label="中文" min-width="260" show-overflow-tooltip />
                    <!-- ✅ 行号列：只显示 row 数字 -->
                    <el-table-column prop="row" label="行号" width="80" />
                    <!-- ✅ 操作列：专门放删除按钮 -->
                    <el-table-column label="操作" width="80">
                        <template #default="{ row }">
                            <el-button type="danger" text size="small" :disabled="kbStore.isUpdating"
                                @click="onDeleteRow(row, 'all')">
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>

                <div style="margin-top: 8px; text-align: right;">
                    <el-pagination background layout="prev, pager, next" :page-size="pageSizeAll"
                        :current-page="currentPageAll" :total="totalAll" @current-change="loadGlobalPage" />
                </div>
            </template>
        </div>
    </div>
</template>
<script setup lang="ts">

import { onMounted, ref, watch, computed } from "vue";
import { useKbStore } from "@/stores/kbStore";
import { RAG_ENDPOINTS } from "@/api/config";
//创建kbStore实例
const kbStore = useKbStore();


const activeTab = ref<"current" | "all">("current");

//表格数据,当前页的索引条目
interface KbEntry {
    seq: number;
    english: string;
    chinese: string;
    source: string;
    row?: number;
}
//当前文件的Tab的表格状态
const tableData = ref<KbEntry[]>([]);
const tableLoading = ref(false);
const pageSize = ref(100); //每页多少条
const currentPage = ref(1); // 当前第几页
const totalCount = ref(0); // 当前文件总条数

// ===== 全部索引 Tab 的表格状态 =====

// 复用 KbEntry，不需要再定义类型
const tableDataAll = ref<KbEntry[]>([]);
const tableLoadingAll = ref(false);
const pageSizeAll = ref(100);     // 全部索引每页 100 条
const currentPageAll = ref(1);
const totalAll = computed(() => kbStore.totalSeqCount); // 总条数 = 所有文件 count 之和
async function loadCurrentFilePage(page = 1) {
    // 如果当前 Tab 不是“当前文件”，直接返回
    if (activeTab.value !== "current") return;

    // 没选文件时，清空表格并返回
    if (!kbStore.selectedSource) {
        tableData.value = [];
        totalCount.value = 0;
        return;
    }

    // 找到当前选中的文件
    const file = kbStore.files.find(
        (f) => f.source === kbStore.selectedSource
    );
    if (!file) {
        tableData.value = [];
        totalCount.value = 0;
        return;
    }

    // 根据文件的 start_seq / end_seq 计算这一页的 seq 区间
    const startSeq = file.start_seq + (page - 1) * pageSize.value;
    const endSeq = Math.min(
        file.end_seq,
        startSeq + pageSize.value - 1
    );

    // 如果计算出来的 startSeq 已经超过 end_seq，说明超出范围，清空即可
    if (startSeq > file.end_seq) {
        tableData.value = [];
        return;
    }

    tableLoading.value = true;
    try {
        const url =
            `${RAG_ENDPOINTS.INDEX}` +
            `?start_seq=${startSeq}&end_seq=${endSeq}&metadata=true`;

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`加载索引失败: HTTP ${res.status}`);
        }

        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];

        // 映射到前端使用的结构
        tableData.value = items.map((item: any): KbEntry => {
            const meta = item.metadata ?? {};
            return {
                seq: item.seq ?? 0,
                english: meta.english ?? "",
                chinese: meta.chinese ?? "",
                source: meta.source ?? "",
                row:
                    typeof meta.row === "number"
                        ? meta.row
                        : undefined,
            };
        });

        // 当前文件总条数直接用文件的 count
        totalCount.value = file.count;
        currentPage.value = page;
    } catch (error) {
        console.error("[KnowledgeBaseView] loadCurrentFilePage 失败:", error);
    } finally {
        tableLoading.value = false;
    }
}
//组件挂载是,调用一次/health 探话
onMounted(() => {
    kbStore.checkHealth();
    if (activeTab.value === "current" && kbStore.selectedSource) {
        loadCurrentFilePage(1);
    } else if (activeTab.value === "all") {
        loadGlobalPage(1);
    }
})
watch(
    () => activeTab.value,
    (val) => {
        if (val === "current" && kbStore.selectedSource) {
            loadCurrentFilePage(1);
        }
    }
);
async function loadGlobalPage(page = 1) {
    if (activeTab.value !== "all") return;
    const total = kbStore.totalSeqCount;
    if (!total) {
        tableDataAll.value = [];
        currentPageAll.value = 1;
        return;
    }

    const startSeq = (page - 1) * pageSizeAll.value + 1;
    const endSeq = Math.min(total, startSeq + pageSizeAll.value - 1);

    if (startSeq > total) {
        tableDataAll.value = [];
        return;
    }

    tableLoadingAll.value = true;
    try {
        const url =
            `${RAG_ENDPOINTS.INDEX}` +
            `?start_seq=${startSeq}&end_seq=${endSeq}&metadata=true`;

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`加载全部索引失败: HTTP ${res.status}`);
        }

        const data = await res.json();
        const items = Array.isArray(data.items) ? data.items : [];

        tableDataAll.value = items.map((item: any): KbEntry => {
            const meta = item.metadata ?? {};
            return {
                seq: item.seq ?? 0,
                english: meta.english ?? "",
                chinese: meta.chinese ?? "",
                source: meta.source ?? "",
                row: typeof meta.row === "number" ? meta.row : undefined,
            };
        });

        currentPageAll.value = page;
    } catch (error) {
        console.error("[KnowledgeBaseView] loadGlobalPage 失败:", error);
    } finally {
        tableLoadingAll.value = false;
    }
}
async function onDeleteRow(row: KbEntry, from: "current" | "all") {
    if (kbStore.isUpdating) {
        // 有任务在跑时就不再发删除
        return;
    }
    try {
        // 简单确认，后面你也可以换成 ElMessageBox.confirm
        await kbStore.deleteBySeq(row.seq);

        // 删除成功后，只刷新当前视图的这一页
        if (from === "current") {
            loadCurrentFilePage(currentPage.value);
        } else {
            loadGlobalPage(currentPageAll.value);
        }
    } catch (e) {
        console.error("[KnowledgeBaseView] 删除索引失败:", e);
    }
}
watch(
    () => kbStore.selectedSource,
    (newSource) => {
        if (activeTab.value === "current" && newSource) {
            loadCurrentFilePage(1);
        } else {
            tableData.value = [];
            totalCount.value = 0;
        }
    }
);
</script>

<style scoped>
/* 下面这几段样式直接拷贝自 App.vue 里原来的同名 class，保证外观不变 */

/* 知识库视图主区域 */
.kb-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 8px 8px 8px 8px;
    overflow: hidden;
    background-color: var(--bg-workbench);
}

/* 顶部：Tab + 状态（类似 VSCode 编辑器顶部条） */
.kb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 26px;
    padding: 0 4px;
    border-bottom: 1px solid var(--border-color);
}

/* 右侧状态块：小胶囊样式，可以当成“运行按钮 / 状态指示” */
.kb-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    background: var(--bg-sidebar);
    padding: 2px 8px;
    border-radius: 12px;
    border: 1px solid var(--border-color);
}

/* 状态圆点（先统一用绿色，后面接入在线/离线状态再细分） */
.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--kb-status-online);
    box-shadow: 0 0 5px var(--kb-status-online);
}

/* 未连接时的红色状态点 */
.status-dot.offline {
    background: var(--kb-status-offline);
    box-shadow: 0 0 5px var(--kb-status-offline);
}

.status-text {
    color: var(--text-secondary);
}

.rag-panel {
    margin-top: 8px;
    flex: 1;
    overflow: auto;
}
</style>