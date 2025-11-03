Element Plus 常用组件速查（最小可用示例）

— 基于按需引入：已配置 `unplugin-auto-import` 与 `unplugin-vue-components` + `ElementPlusResolver` 的情况下，模板里直接使用 `<el-*>`，脚本里可直接使用 `ElMessage/ElNotification` 等。

---

### 按钮 Button
```vue
<template>
  <el-button>默认</el-button>
  <el-button type="primary">主按钮</el-button>
  <el-button type="success" plain>成功</el-button>
  <el-button type="danger" :loading="loading">删除</el-button>
  <el-button type="primary" disabled>禁用</el-button>
  <el-button link>链接样式</el-button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const loading = ref(false)
</script>
```

---

### 布局 Layout（容器/分栏）
```vue
<template>
  <el-container style="height:100vh">
    <el-header height="48px">顶部</el-header>
    <el-container>
      <el-aside width="240px">侧栏</el-aside>
      <el-main>
        <el-row :gutter="12">
          <el-col :span="12"><div class="box">A</div></el-col>
          <el-col :span="12"><div class="box">B</div></el-col>
        </el-row>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.box { height: 160px; border: 1px dashed var(--el-border-color); }
</style>
```

---

### 输入与表单 Input + Form（含校验）
```vue
<template>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="88px">
    <el-form-item label="名称" prop="name">
      <el-input v-model="form.name" clearable />
    </el-form-item>
    <el-form-item label="年龄" prop="age">
      <el-input-number v-model="form.age" :min="1" :max="120" />
    </el-form-item>
    <el-button type="primary" @click="submit">提交</el-button>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const form = reactive({ name: '', age: 18 })
const rules = reactive<FormRules>({
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  age: [{ type: 'number', required: true, message: '请输入年龄', trigger: 'change' }],
})

const submit = async () => { await formRef.value?.validate(); ElMessage.success('提交成功') }
</script>
```

---

### 选择器类 Select / Radio / Checkbox / Switch / DatePicker
```vue
<template>
  <el-select v-model="lang" placeholder="选择语言" style="width:160px">
    <el-option label="中文" value="zh" />
    <el-option label="英文" value="en" />
  </el-select>

  <el-radio-group v-model="size">
    <el-radio-button label="small" />
    <el-radio-button label="default" />
    <el-radio-button label="large" />
  </el-radio-group>

  <el-checkbox v-model="agree">同意协议</el-checkbox>
  <el-switch v-model="enabled" />

  <el-date-picker v-model="date" type="date" placeholder="选择日期" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const lang = ref('zh'); const size = ref('default'); const agree = ref(false); const enabled = ref(true)
const date = ref<string | Date>()
</script>
```

---

### 对话框 / 抽屉 Dialog / Drawer
```vue
<template>
  <el-button type="primary" @click="open=true">打开对话框</el-button>
  <el-dialog v-model="open" title="标题" width="520px">
    内容...
    <template #footer>
      <el-button @click="open=false">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>

  <el-button @click="drawer=true">打开抽屉</el-button>
  <el-drawer v-model="drawer" title="侧边" size="30%">内容...</el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const open = ref(false); const drawer = ref(false)
const confirm = () => { open.value = false; ElMessage.success('确认') }
</script>
```

---

### 标签页 Tabs
```vue
<template>
  <el-tabs v-model="active">
    <el-tab-pane label="原文" name="orig" />
    <el-tab-pane label="译文" name="trans" />
  </el-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref('orig')
</script>
```

---

### 表格 + 分页 Table + Pagination（最小）
```vue
<template>
  <el-table :data="rows" style="width:100%">
    <el-table-column prop="name" label="名称" />
    <el-table-column prop="size" label="大小" width="120" />
  </el-table>
  <div style="margin-top:8px; text-align:right;">
    <el-pagination
      background
      layout="prev, pager, next"
      :page-size="10"
      :total="total"
      @current-change="load" />
  </div>
  
</template>

<script setup lang="ts">
import { ref } from 'vue'
const rows = ref([{ name: 'doc1.md', size: '12KB' }])
const total = ref(1)
const load = (page: number) => { /* 拉取第 page 页数据 */ }
</script>
```

---

### 上传 Upload（前置校验 + 自定义请求）
```vue
<template>
  <el-upload :auto-upload="false" :before-upload="limit" :http-request="doUpload" multiple>
    <el-button type="primary">选择文件</el-button>
  </el-upload>
</template>

<script setup lang="ts">
import type { UploadRequestOptions } from 'element-plus'
const limit = (f: File) => f.size < 50 * 1024 * 1024
const doUpload = async (o: UploadRequestOptions) => {
  // const fd = new FormData(); fd.append('files', o.file as File)
  // await fetch('/api/document/upload', { method:'POST', body: fd })
  o.onSuccess?.({ ok: true } as any)
}
</script>
```

---

### 树 Tree（含复选/懒加载占位）
```vue
<template>
  <el-tree :data="nodes" node-key="id" show-checkbox default-expand-all @node-click="openFile" />
</template>

<script setup lang="ts">
const nodes = [{ id:1, label:'根', children:[{ id:2, label:'doc1.md' }] }]
const openFile = (node: any) => {}
</script>
```

懒加载：
```vue
<template>
  <el-tree :load="load" lazy node-key="id" />
</template>

<script setup lang="ts">
const load = (node: any, resolve: (children: any[]) => void) => {
  setTimeout(() => resolve(node.level === 0 ? [{ id: 1, label: '根' }] : []), 200)
}
</script>
```

---

### 进度 Progress
```vue
<el-progress :percentage="70" status="success" />
```

---

### 消息/通知/弹框 Message / Notification / MessageBox
```ts
ElMessage.success('已保存')
ElNotification.info({ title: '进度', message: '翻译完成 1/5' })
const ok = await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
```

---

### 工具提示 Tooltip / Popover
```vue
<el-tooltip content="复制" placement="top">
  <el-button icon="CopyDocument" circle />
</el-tooltip>

<el-popover placement="bottom" title="更多" width="200" trigger="click">
  <p>内容...</p>
  <template #reference>
    <el-button>点击弹出</el-button>
  </template>
  
</el-popover>
```

---

### 骨架 / 空状态 Skeleton / Empty
```vue
<el-skeleton :rows="6" animated />
<el-empty description="暂无数据" />
```

---

### Loading 指令（遮罩）
```vue
<template>
  <div v-loading="loading" style="height:120px">加载中...</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const loading = ref(true)
</script>
```

---

### 快速提示
- 组件自带常见交互状态（hover/focus/disabled/loading/校验态等），无需手写皮肤；但页面布局与业务样式需自行编写。
- 按需引入时已自动引入用到的组件样式（`importStyle: 'css'`），避免全量样式。
- 深度主题定制可用 CSS 变量或改为 `sass` 样式方案。
- 图标建议按需引入：`import { Edit } from '@element-plus/icons-vue'`。


