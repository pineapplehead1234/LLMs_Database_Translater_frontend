## RAG 接口（最小 MVP 版）

本版只保留“能用就行”的最小能力：上传 CSV 导入术语、术语增改删、列表/搜索。去掉去重、幂等、IndexedDB、批量高级能力等。

---

### 功能范围（MVP）
- 上传 CSV 导入术语
- 列表/搜索术语（分页）
- 新增术语（单条）
- 更新术语（单条）
- 删除术语（单条）

---

### 路由与代理
- 本地开发：前端访问 `http://127.0.0.1:5174`，所有 RAG 接口走 `/rag/**`，由 Vite 转发到后端（如 `http://127.0.0.1:8100`）。

```ts
// vite.config.ts（最小示例）
server: {
  host: '127.0.0.1',
  port: 5174,
  strictPort: true,
  proxy: {
    '/rag': {
      target: process.env.VITE_RAG || 'http://127.0.0.1:8100',
      changeOrigin: true,
      rewrite: p => p.replace(/^\/rag/, ''),
    },
  },
}
```

`.env.local`：
```bash
VITE_RAG=http://127.0.0.1:8100
```

生产：由反向代理将 `/rag/**` 转到 RAG 服务（同域）。

---

### 数据模型（最小）
- 术语条目（Knowledge Item）：
```json
{
  "id": "kb_item_123",
  "chinese": "神经网络",
  "english": "Neural Network"
}
```

---

### 接口

#### 1 上传 CSV（最小）
- POST `/rag/csvs`（multipart/form-data）
- 表单字段：`file`
- 响应（示例）：
```json
{
  "success": true,
  "import": { "total": 45, "inserted": 45 }
}
```

示例（curl）：
```bash
curl -F "file=@./glossary.csv" http://127.0.0.1:5174/rag/csvs
```

#### 2) 列表/搜索术语
- GET `/rag/items?keyword=&page=1&pageSize=50`
```json
{ "success": true, "items": [ /* 条目列表 */ ], "page": 1, "pageSize": 50, "total": 123 }
```

#### 3) 新增单条术语
- POST `/rag/items`
```json
{ "chinese": "深度学习", "english": "Deep Learning" }
```
响应：`{ "success": true, "item": { /* 新条目 */ } }`

#### 4) 更新单条术语
- PATCH `/rag/items/{id}`
```json
{ "english": "Deep Learning (DL)" }
```

#### 5) 删除单条术语
- DELETE `/rag/items/{id}`
```json
{ "success": true }
```

---

### 前端 API 封装（最小）
```ts
// api/rag.ts
import axios from 'axios'

export const rag = axios.create({ baseURL: '/rag', timeout: 30000 })

export const uploadCSV = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return (await rag.post('/csvs', form)).data
}

export const listItems = async (params?: { keyword?: string; page?: number; pageSize?: number }) =>
  (await rag.get('/items', { params })).data

export const createItem = async (item: { chinese: string; english: string }) =>
  (await rag.post('/items', item)).data

export const updateItem = async (id: string, patch: Partial<{ chinese: string; english: string }>) =>
  (await rag.patch(`/items/${id}`, patch)).data

export const deleteItem = async (id: string) => (await rag.delete(`/items/${id}`)).data
```

---

### 页面最小用法
```ts
// 上传 CSV 后刷新术语列表
await uploadCSV(file)
await refreshItems()

// 列表
const data = await listItems({ keyword, page, pageSize })
items.value = data.items

// 新增/更新/删除
await createItem({ chinese: '深度学习', english: 'Deep Learning' })
await updateItem(id, { english: 'Deep Learning (DL)' })
await deleteItem(id)
```

---

### 错误处理（最小）
- 仅判断 `success` 或 HTTP 状态码；失败时用 `message` 文本提示。
- 不做重试/幂等/取消，后续再加。

---

### 验收清单（MVP）
- 能上传 CSV 并导入术语
- 能列表/搜索术语（分页）
- 能新增/更新/删除单条术语
- 前端以 `axios` 调通上述接口

---

### 以后再做（非 MVP）
- 批量增删、去重策略、幂等键、链路追踪
- 本地缓存/离线（IndexedDB/pendingOps/增量同步）
- 统计接口、CSV 管理（列表/删除/导出）
- 请求取消、失败重试、并发控制
