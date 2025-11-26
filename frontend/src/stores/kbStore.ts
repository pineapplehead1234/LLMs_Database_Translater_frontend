import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useKbStore = defineStore("kb", () => {
    //知识库状态
    const isConnected = ref(false);
    //是否有知识库更新任务
    const isUpdating = ref(false);

    return {
        isConnected,
        isUpdating,

    }
})