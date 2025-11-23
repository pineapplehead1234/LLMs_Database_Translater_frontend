<template>
    <div class="database-config-panel">
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
</template>

<script setup lang="ts">
import { ref } from "vue";

const connectionString = ref("");
const dbType = ref<string | null>(null);
</script>