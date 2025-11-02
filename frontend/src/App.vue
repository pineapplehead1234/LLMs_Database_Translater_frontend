<template>
  <div style="padding: 24px; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
    <h2>单文件上传测试（MVP）</h2>

    <input type="file" @change="onFileChange" accept=".pdf,.docx,.md" />
    <button :disabled="!file || loading" @click="upload">上传并翻译</button>

    <div v-if="loading" style="margin-top:12px;">上传中...</div>

    <div v-if="resp" style="margin-top:16px;">
      <h3>响应</h3>
      <pre style="background:#f6f8fa; padding:12px; overflow:auto;">{{ resp }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const file = ref<File | null>(null)
const loading = ref(false)
const resp = ref<string>('')

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
}

async function upload() {
  if (!file.value) return
  loading.value = true
  resp.value = ''
  try {
    const form = new FormData()
    form.append('files', file.value) // 字段名：files（与文档一致）
    form.append('sourceLang', 'en')
    form.append('targetLang', 'zh')
    form.append('clientRequestId', file.value.name) // MVP：用文件名当 id

    const res = await fetch('/apiA/api/document/upload', {
      method: 'POST',
      body: form
    })
    const data = await res.json()
    resp.value = JSON.stringify(data, null, 2)
  } catch (e) {
    const getErrorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : String(error)

    resp.value = `请求失败: ${getErrorMessage(e)}`
  } finally {
    loading.value = false
  }
}
</script>