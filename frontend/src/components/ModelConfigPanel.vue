<template>
    <div class="model-config-panel">

        <h3 style="margin: 8px 0; color: #ddd;">模型配置（开发中）</h3>

        <el-form label-width="80px">
            <el-form-item label="模型类型">
                <el-select v-model="modelType" placeholder="选择模型">
                    <el-option label="GPT-4" value="gpt-4" />
                    <el-option label="GPT-4.1" value="gpt-4.1" />
                </el-select>
            </el-form-item>

            <el-form-item label="温度">
                <el-slider v-model="temperature" :min="0" :max="1" :step="0.1" />
            </el-form-item>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const modelType = ref<string | null>(null);
const temperature = ref(0.7);
</script>