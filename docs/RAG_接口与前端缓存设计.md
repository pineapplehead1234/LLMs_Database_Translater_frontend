## RAG 接口设计文档

### 功能范围
- **CSV 文件管理**：批量上传、列表查询、删除文件
- **术语条目管理**：列表/搜索（分页）、新增、更新、删除
- **核心设计**：CSV 文件管理与术语条目管理分离，术语记录来源信息

---

### 路由与代理
- 本地开发：前端访问 `http://127.0.0.1:5174`，所有 RAG 接口走 `/rag/**`，由 Vite 转发到后端 `http://127.0.0.1:8100`
- 生产环境：由反向代理将 `/rag/**` 转到 RAG 服务（同域）

---

## 一、CSV 文件管理接口

### 数据模型
```json
{
  "id": "csv_file_001",
  "filename": "医学术语.csv",
  "uploadedAt": "2025-11-04T10:30:00Z",
}
```

### 1.1上传 CSV 文件
**POST** `/rag/csv-file`

- Content-Type: `multipart/form-data`
- 表单字段：`file`

**响应示例**：
```json
{
  "success": true,
  "file": {
    "id": "csv_file_001",
    "filename": "医学术语.csv",
    "uploadedAt": "2025-11-04T10:30:00Z"
  }
}
```

### 1.2 列出所有 CSV 文件
**GET** `/rag/csv-files?page=1&pageSize=20`

**响应示例**：
```json
{
  "success": true,
  "files": 
    {
      "id": "csv_file_001",
      "filename": "医学术语.csv",
      "uploadedAt": "2025-11-04T10:30:00Z",
    }
  
}
```

### 1.3 删除 CSV 文件
**DELETE** `/rag/csv-files/{csvFileId}`

**响应示例**：
```json
{
  "success": true,
  "deletedFile": "csv_file_001",
}
```


