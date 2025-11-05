<template>
  <div class="content-area">
    <input type="file" multiple @change="onFileChange" accept=".pdf,.docx,.md" />
    <button :disabled="!files.length || loading" @click="upload">
      上传并翻译({{ files.length }})
    </button>
    <div v-if="loading" style="margin-top: 12px">上传中...</div>
    <div v-if="resp" style="margin-top: 16px">
      <h3>响应</h3>
      <pre style="background: black; padding: 12px; overflow: auto">{{ resp }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const files = ref<File[]>([]);
const loading = ref(false);
const resp = ref<string>("");

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  files.value = input.files ? Array.from(input.files) : [];
}

async function upload() {
  if (!files.value || files.value.length === 0) return;
  loading.value = true;
  resp.value = "";
  
  // 遍历每个文件，逐个上传
  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i];  // 👈 取出单个文件
    if (!file) continue;  // 跳过 undefined（虽然实际不会发生）
    resp.value += `\n[${i + 1}/${files.value.length}] 正在上传: ${file.name}\n`;
    
    try {
      // ====== 第1步：上传单个文件，获取 taskId ======
      const form = new FormData();
      form.append("file", file);  // 👈 单个文件
      form.append("target_lang", "ch");
      form.append("strategy", "normal");
      form.append("client_request_id", file.name);  // 👈 单个文件的名字

      const uploadRes = await fetch("/apiA/api/task/upload", {
        method: "POST",
        body: form,
      });
      const uploadData = await uploadRes.json();
      
      if (uploadData.status !== "success") {
        resp.value += `  ❌ ${file.name} 上传失败\n`;
        continue;  // 👈 继续下一个文件
      }
      
      const taskId = uploadData.taskId;
      resp.value += `  ✅ ${file.name} 已提交，ID: ${taskId}\n`;
      
      // ====== 第2步：查询进度（SSE） ======
      // 选项A：等待每个文件翻译完成再上传下一个
      resp.value += `  ⏳ 正在翻译 ${file.name}...\n`;
      await queryTaskProgress(taskId);
      
      // 选项B：只上传不等待（更快，但不知道进度）
      // resp.value += `  ⏳ ${file.name} 正在后台翻译...\n`;
      
    } catch (e) {
      const getErrorMessage = (error: unknown): string =>
        error instanceof Error ? error.message : String(error);
      resp.value += `  ❌ ${file.name} 请求失败: ${getErrorMessage(e)}\n`;
    }
  }
  
  loading.value = false;
  resp.value += `\n✨ 所有文件处理完成！\n`;
}
async function queryTaskProgress(taskId: string) {
  // 使用 fetch 接收 SSE 流
  const response = await fetch(`/apiA/api/task/query?taskId=${taskId}`);

  if (!response.body) {
    resp.value = "无法获取响应流";
    return;
  }

  // 创建一个读取器来读取流数据
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break; // 流结束
    }

    // 解码收到的数据
    const text = decoder.decode(value);
    console.log("收到数据:", text);

    try {
      // 把字符串转成对象
      const data = JSON.parse(text);

      if (data.status === "success") {
        // 👈 翻译完成！
        resp.value = `翻译完成！\n\n原文:\n${JSON.stringify(
          data.originalMarkdown,
          null,
          2
        )}\n\n译文:\n${JSON.stringify(data.translatedMarkdown, null, 2)}`;
        break;
      } else if (data.status === "error") {
        // 👈 出错了
        resp.value = `错误: ${data.error}`;
        break;
      } else {
        // 👈 还在处理中
        resp.value = `任务状态: ${data.status}`;
      }
    } catch (e) {
      console.error("解析数据失败:", e, text);
    }
  }
}
</script>

<style scoped>
.content-area {
  padding: 16px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}
</style>
