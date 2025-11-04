
<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <el-row type="flex" align="middle" :gutter="0" class="header-row">
        <el-col :style="{ flex: '0 0 160px' }">
          <div class="title">翻译助手</div>
        </el-col>
        <el-col :style="{ flex: '0 0 200px' }">
          <div class="tools">🌙</div>
        </el-col>
        <el-col :style="{ flex: '1 1 auto' }"></el-col>
        <el-col :style="{ flex: '0 0 100px' }">
          <div class="kill-all-button">
            <div class="kill-all-button-text">x</div>
          </div>
        </el-col>
      </el-row>
    </el-header>

    <el-row style="background-color: black" class="fill">
      <el-col :span="7">
        <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial">
          <h2>单文件上传测试（MVP）</h2>

          <input type="file" @change="onFileChange" accept=".pdf,.docx,.md" />
          <button :disabled="!file || loading" @click="upload">上传并翻译</button>

          <div v-if="loading" style="margin-top: 12px">上传中...</div>

          <div v-if="resp" style="margin-top: 16px">
            <h3>响应</h3>
            <pre style="background: black; padding: 12px; overflow: auto">{{ resp }}</pre>
          </div>
        </div>
      </el-col>
      <el-col :span="1.5"></el-col>
      <el-col :span="7">原文是</el-col>
      <el-col :span="1.5">占位符</el-col>
      <el-col :span="7">译文</el-col>
    </el-row>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from "vue";

const file = ref<File | null>(null);
const loading = ref(false);
const resp = ref<string>("");

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  file.value = input.files?.[0] ?? null;
}

async function upload() {
  if (!file.value) return;
  loading.value = true;
  resp.value = "";
  try {
    const form = new FormData();
    form.append("files", file.value); // 字段名：files（与文档一致）
    form.append("sourceLang", "en");
    form.append("targetLang", "zh");
    form.append("clientRequestId", file.value.name); // MVP：用文件名当 id

    const res = await fetch("/apiA/api/document/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    resp.value = JSON.stringify(data, null, 2);
  } catch (e) {
    const getErrorMessage = (error: unknown): string =>
      error instanceof Error ? error.message : String(error);

    resp.value = `请求失败: ${getErrorMessage(e)}`;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.app-container {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: red;
}

.app-header {
  padding: 0;
  margin: 0;
  background-color: #000;
}

.header-row {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0 12px;
}

.title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kill-all-button {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.kill-all-button-text {
  font-size: 18px;
  color: #fff;
}
</style>
