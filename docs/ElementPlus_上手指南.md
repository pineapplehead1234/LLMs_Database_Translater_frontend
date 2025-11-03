Element Plus 上手指南（针对 Vue3 已上手的同学）

---

### 这是什么

- **Element Plus** 是面向 **Vue 3** 的成熟 UI 组件库，提供按钮、表单、对话框、树、上传、通知、布局等常用组件，适合中后台与工具类应用。
- 本指南聚焦「最快落地到本项目」，不做全面讲解，够用、可跑、能扩展。

---

### 5 分钟快速开始

1) 安装

```bash
npm i element-plus @element-plus/icons-vue
```

2) 全量引入（最快）

```ts
// src/main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 可选：暗色变量（配合 useDark）
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'

createApp(App).use(ElementPlus).mount('#app')
```

3) （可选）按需自动引入（更轻量）

```ts
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'

export default {
  plugins: [
    AutoImport({ resolvers: [ElementPlusResolver()] }),
    Components({ resolvers: [ElementPlusResolver()] }),
  ],
}
```

---

### 三栏布局最小骨架（贴合本项目“左树-中原文-右译文”）

```vue
<template>
  <el-container style="height: 100vh">
    <el-header height="48px" class="toolbar">
      <el-button type="primary" @click="openUpload = true">上传</el-button>
      <el-button text @click="toggleDark">🌓 主题</el-button>
    </el-header>
    <el-container>
      <el-aside width="240px" class="aside">
        <el-tree :data="tree" node-key="id" default-expand-all @node-click="onNodeClick" />
      </el-aside>
      <el-main class="main">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-tabs v-model="activeLeft">
              <el-tab-pane label="原文" name="orig">
                <el-input v-model="original" type="textarea" :rows="20" placeholder="粘贴或编辑原文" />
              </el-tab-pane>
            </el-tabs>
            <el-button type="success" @click="translate">→ 翻译 →</el-button>
          </el-col>
          <el-col :span="12">
            <el-tabs v-model="activeRight">
              <el-tab-pane label="译文" name="trans">
                <el-input v-model="translated" type="textarea" :rows="20" placeholder="译文只读" readonly />
              </el-tab-pane>
            </el-tabs>
          </el-col>
        </el-row>
      </el-main>
    </el-container>

    <el-dialog v-model="openUpload" title="上传文档" width="520px">
      <el-upload :auto-upload="false" multiple action="/api/document/upload">
        <el-button type="primary">选择文件</el-button>
      </el-upload>
      <template #footer>
        <el-button @click="openUpload = false">取消</el-button>
        <el-button type="primary" @click="openUpload = false">确定</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)

const tree = ref([{ id: 1, label: '根目录', children: [{ id: 2, label: 'doc1.md' }] }])
const onNodeClick = (node: any) => {}

const original = ref('')
const translated = ref('')
const activeLeft = ref('orig')
const activeRight = ref('trans')
const openUpload = ref(false)

const translate = () => {
  ElNotification.success({ title: '已提交', message: '翻译开始，进度 0/1' })
}
</script>

<style scoped>
.toolbar { display: flex; gap: 8px; align-items: center; }
.aside { border-right: 1px solid var(--el-border-color); }
.main { padding-top: 12px; }
</style>
```

---

### 常用组件速查（最小可用示例）

- **按钮**：`<el-button type="primary">`、`link`、`text`
- **输入**：`<el-input v-model="val" />`，多行：`type="textarea" :rows="X"`
- **表单**：`<el-form :model :rules>` + `FormInstance.validate`
- **对话框**：`<el-dialog v-model="visible">`
- **标签页**：`<el-tabs v-model="active"><el-tab-pane .../></el-tabs>`
- **树**：`<el-tree :data node-key="id" @node-click="fn" />`
- **上传**：`<el-upload action :auto-upload :before-upload :http-request>`
- **进度**：`<el-progress :percentage="n" />`
- **通知/消息**：`ElNotification.*`、`ElMessage.*`

表单 + 校验（类型友好）：

```vue
<template>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="88px">
    <el-form-item label="名称" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>
    <el-button type="primary" @click="submit">提交</el-button>
  </el-form>
  <div>值：{{ form.name }}</div>
  <div>校验：{{ valid ? '通过' : '未通过' }}</div>
  <div>错误：{{ errors }}</div>
  <div>提交次数：{{ submitCount }}</div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const form = reactive({ name: '' })
const rules = reactive<FormRules>({ name: [{ required: true, message: '必填', trigger: 'blur' }] })

const valid = ref(false)
const errors = ref('')
const submitCount = ref(0)

const submit = async () => {
  submitCount.value += 1
  try {
    await formRef.value?.validate()
    valid.value = true
    errors.value = ''
  } catch (e: any) {
    valid.value = false
    errors.value = '请完善必填项'
  }
}
</script>
```

上传（限制大小 + 自定义请求占位）：

```vue
<template>
  <el-upload
    :auto-upload="false"
    :before-upload="beforeUpload"
    :http-request="doUpload"
    multiple>
    <el-button type="primary">选择文件</el-button>
  </el-upload>
</template>

<script setup lang="ts">
import type { UploadRequestOptions } from 'element-plus'

const beforeUpload = (file: File) => file.size < 50 * 1024 * 1024

const doUpload = async (opts: UploadRequestOptions) => {
  // 这里接入真实后端：/api/document/upload
  // const form = new FormData(); form.append('file', opts.file as File)
  // await axios.post('/api/document/upload', form)
  opts.onSuccess?.({ ok: true } as any)
}
</script>
```

树（懒加载形态占位）：

```vue
<template>
  <el-tree :load="loadNode" lazy node-key="id" />
</template>

<script setup lang="ts">
const loadNode = (node: any, resolve: (data: any[]) => void) => {
  setTimeout(() => {
    resolve(node.level === 0 ? [{ id: 1, label: '根' }] : [])
  }, 200)
}
</script>
```

通知与消息：

```ts
import { ElNotification, ElMessage } from 'element-plus'

ElNotification.success({ title: '完成', message: '翻译完成 1/5' })
ElMessage.error('上传失败，请重试')
```

---

### 主题与暗色（与本项目一致）

- 引入 `element-plus/theme-chalk/dark/css-vars.css`，搭配 `@vueuse/core` 的 `useDark()`。
- 切换后会在 `html/body` 注入 `.dark` 类，Element Plus 自动应用暗色变量。

```ts
import { useDark, useToggle } from '@vueuse/core'
const isDark = useDark()
const toggleDark = useToggle(isDark)
```

（可选）国际化：

```ts
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
app.use(ElementPlus, { locale: zhCn })
```

---

### 与本项目页面的组件映射

- 顶部工具栏：`el-header` + `el-button` + 主题按钮
- 左侧文件树：`el-tree`（未来扩展右键菜单/拖拽）
- 中间原文：`el-tabs` + `el-input(type="textarea")`
- 右侧译文：`el-tabs` + `el-input(type="textarea" readonly)`
- 上传入口：`el-dialog` + `el-upload`
- 进度浮窗：`ElNotification` + `el-progress`
- 主题切换：`useDark()` + 暗色变量 CSS

在 `FRONTEND_DESIGN.md` 中已明确这些组件选择，按上节最小用法直接落地即可。

---

### 常见坑与排错清单

- Dialog 不显示/遮罩错位：确认 `v-model` 绑定，必要时加 `:append-to-body="true"`。
- 表单校验不触发：`prop` 要与 `model` 字段一致；调用 `await formRef.validate()`。
- Upload 限制与中断：`before-upload` 返回 `false` 阻止；自定义上传用 `http-request`。
- Tree 无法正确选中：必须设置 `node-key`；懒加载需 `lazy` + `:load`。
- 样式未生效：确保引入 `element-plus/dist/index.css`；暗色需额外引入 dark css vars。
- 按需引入后组件报未注册：检查 `unplugin-auto-import`/`unplugin-vue-components` 配置是否生效。

---

### 延伸：图标与尺寸

```ts
// 全局注册图标（或按需）
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
const app = createApp(App)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
```

```vue
<el-button :icon="Edit" size="small" type="primary">编辑</el-button>

<script setup lang="ts">
import { Edit } from '@element-plus/icons-vue'
</script>
```

---

### 我应该先系统学吗？

- 不需要。你已掌握 Vue3，Element Plus 是“现成组件”。按本文档的最小骨架与速查即可边做边学。
- 真正值得提前熟悉的只有三块：表单校验、上传、树。

---

### 参考

- 官方站点：`https://element-plus.org/`
- 组件速查（中文）：`https://element-plus.org/zh-CN/component/button.html`
- 图标：`@element-plus/icons-vue`


