---
title: rag
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# rag

Base URLs:

# Authentication

# Default

## GET File Preview

GET /index/files

> 返回示例

> 200 Response

```json
{}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### 返回数据结构

<a id="opIdhealth_health_get"></a>

## GET Health

GET /health

连通性测试。

> 返回示例

> 200 Response

```json
{
  "ok": true,
  "store_dir": "./vector_store"
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|{
  "ok": true,
  "store_dir": "./vector_store"
}|string|

<a id="opIdindex_preview_index_get"></a>

## GET Index Preview

GET /index

预览当前向量库索引（截断前 limit 条，limit=0 返回全部索引）。
前端可用这个列表勾选要删除的 seq。
metadata默认 False，为 True 时返回带元数据的索引列表

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|limit|query|integer| 否 | Limit|none|
|metadata|query|boolean| 否 | Metadata|none|

> 返回示例

> 200 Response

```json
{
  "count": 200,
  "items": [
    {
      "seq": 1,
      "pos": 0,
      "id": "8c8c95d3-a2f9-40e1-b638-49569d8ed6f3",
      "preview": "english",
      "metadata": {
        "type": "translation_pair",
        "english": "english",
        "chinese": "chinese",
        "source": "C:\\Users\\zx\\PycharmProjects\\dingjia\\vector_store\\uploads\\40afd237957a4e13b2231dbe810d7f53_nejm_test_en2zh.csv",
        "filename": "nejm_test_en2zh.csv",
        "row": 1
      }
    },
    {
      "seq": 2,
      "pos": 1,
      "id": "778c53aa-3e13-4b63-8dbc-3c7a502cb52c",
      "preview": "asciminib is an allosteric inhibitor that binds a myristoyl site of the BCR ABL1 protein , locking BCR ABL1 into an inac",
      "metadata": {
        "type": "translation_pair",
        "english": "asciminib is an allosteric inhibitor that binds a myristoyl site of the BCR ABL1 protein , locking BCR ABL1 into an inactive conformation through a mechanism distinct from those for all other ABL kinase inhibitors .",
        "chinese": "asciminib是与BCR-ABL1蛋白的豆蔻酰位点相结合的别构抑制剂,它可通过不同于所有其他ABL激酶抑制剂的机制将BCR-ABL1锁定在非活性构象.",
        "source": "C:\\Users\\zx\\PycharmProjects\\dingjia\\vector_store\\uploads\\40afd237957a4e13b2231dbe810d7f53_nejm_test_en2zh.csv",
        "filename": "nejm_test_en2zh.csv",
        "row": 2
      }
    }
  ]
}
```

> 422 Response

```json
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|string|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

<a id="opIddestroy_destroy_post"></a>

## POST Destroy

POST /destroy

删除现有向量库（FAISS + _id_map.json），并清空内存中的 db。
Args:
    remove_dir: 为 True 时，尝试直接删除整个 store_dir 目录；
                为 False 时，仅清空目录内容并保留目录本身。默认为 False。

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|remove_dir|query|boolean| 否 | Remove Dir|none|

> 返回示例

> 200 Response

```json
{
  "ok": true,
  "remove_dir": false,
  "deleted_entries": 5,
  "store_dir": "./vector_store"
}
```

> 422 Response

```json
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|string|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

<a id="opIddelete_delete_post"></a>

## POST Delete

POST /delete

seq 删除与 metadata 删除的统一入口

> Body 请求参数

```json
{
  "indexes": [
    0
  ],
  "targets": [
    "string"
  ],
  "keywords": "source",
  "fuzzy": false,
  "ignore_case": false
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|[DeleteBody](#schemadeletebody)| 是 | DeleteBody|none|

> 返回示例

> 200 Response

```json
{
  "ok": true,
  "metadata": {
    "deleted_docs_name": [
      "C:\\Users\\zx\\PycharmProjects\\dingjia\\docs\\example.csv"
    ],
    "deleted": 62128
  }
}
```

> 422 Response

```json
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|string|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

<a id="opIdenqueue_build_tasks_build_post"></a>

## POST Enqueue Build

POST /tasks/build

> Body 请求参数

```yaml
reinit: "false"
doc_path: ""
file: ""

```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 ||none|
|» reinit|body|boolean| 否 | Reinit|是否覆盖现有向量库|
|» doc_path|body|any| 否 | Doc Path|文件路径（一般不用这个）|
|»» *anonymous*|body|string| 否 ||none|
|»» *anonymous*|body|null| 否 ||none|
|» file|body|string(binary)| 否 ||上传的文件|

> 返回示例

> 202 Response

```json
{
  "ok": true,
  "task_id": "f19b8939...",
  "status_url": "/tasks/f19b8939..."
}
```

> 422 Response

```json
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|202|[Accepted](https://tools.ietf.org/html/rfc7231#section-6.3.3)|Successful Response|string|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

<a id="opIdenqueue_add_tasks_add_post"></a>

## POST Enqueue Add

POST /tasks/add

> Body 请求参数

```yaml
doc_path: ""
file: ""

```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 否 ||none|
|» doc_path|body|any| 否 | Doc Path|文件路径（一般不用这个）|
|»» *anonymous*|body|string| 否 ||none|
|»» *anonymous*|body|null| 否 ||none|
|» file|body|string(binary)| 否 ||上传的文件|

> 返回示例

> 202 Response

```json
{
  "ok": true,
  "task_id": "45c1c7e2-...",
  "status_url": "/tasks/id/45c1c7e2-..."
}
```

> 422 Response

```json
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|202|[Accepted](https://tools.ietf.org/html/rfc7231#section-6.3.3)|Successful Response|string|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

<a id="opIdget_task_tasks_id__task_id__get"></a>

## GET Get Task

GET /tasks/id/{task_id}

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|task_id|path|string| 是 | Task Id|查询的taskid|

> 返回示例

> 200 Response

```json
{
  "task_id": "246b1470-b67b-4c71-af5d-eb783d9eb90e",
  "function_name": "_task_add_documents",
  "kwargs": {
    "doc_path": "C:\\Users\\zx\\PycharmProjects\\dingjia\\vector_store\\uploads\\f55bf840bbd448a68c4e489601ce4c06.csv"
  },
  "status": "finished",
  "is_async": false,
  "created_at": "2025-11-24T12:23:17.329457",
  "started_at": "2025-11-24T12:23:55.343371",
  "finished_at": "2025-11-24T12:24:03.577694",
  "result": {
    "ok": true,
    "added_from": "C:\\Users\\zx\\PycharmProjects\\dingjia\\vector_store\\uploads\\f55bf840bbd448a68c4e489601ce4c06.csv",
    "ingested": 2103
  },
  "error_message": null,
  "traceback": null,
  "created_timestamp": 1763958197.329457
}
```

> 422 Response

```json
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|string|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

<a id="opIdget_task_list_tasks_task_list_get"></a>

## GET Get Task List

GET /tasks/task_list

> 返回示例

> 200 Response

```json
{
  "total_tasks": 1,
  "status_counts": {
    "pending": 0,
    "processing": 0,
    "finished": 1,
    "error": 0
  },
  "async_tasks": 0,
  "sync_tasks": 1,
  "recent_tasks": [
    {
      "task_id": "4f9c3707-b470-4e71-ba22-3e733951a32c",
      "status": "finished",
      "is_async": false,
      "created_at": "2025-11-25T19:28:09.105870",
      "finished_at": "2025-11-25T19:28:15.911434"
    }
  ],
  "database_size": 28672,
  "is_running": true,
  "current_task": null
}
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|string|

# 数据模型

<h2 id="tocS_DeleteBody">DeleteBody</h2>

<a id="schemadeletebody"></a>
<a id="schema_DeleteBody"></a>
<a id="tocSdeletebody"></a>
<a id="tocsdeletebody"></a>

```json
{
  "indexes": [
    0
  ],
  "targets": [
    "string"
  ],
  "keywords": "source",
  "fuzzy": false,
  "ignore_case": false
}

```

DeleteBody

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|indexes|any|false|none|Indexes|按 seq 删除|

anyOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|[integer]|false|none||none|

or

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|null|false|none||none|

continued

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|targets|any|false|none|Targets|需要匹配的目标值，单个字符串或字符串列表|

anyOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|[string]|false|none||none|

or

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|null|false|none||none|

continued

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|keywords|string|false|none|Keywords|metadata 中的字段名，'source'、'english'、'chinese'、'type'、'row' 。|
|fuzzy|boolean|false|none|Fuzzy|是否使用子串模糊匹配|
|ignore_case|boolean|false|none|Ignore Case|删除是否忽略大小写|

<h2 id="tocS_HTTPValidationError">HTTPValidationError</h2>

<a id="schemahttpvalidationerror"></a>
<a id="schema_HTTPValidationError"></a>
<a id="tocShttpvalidationerror"></a>
<a id="tocshttpvalidationerror"></a>

```json
{
  "detail": [
    {
      "loc": [
        "string"
      ],
      "msg": "string",
      "type": "string"
    }
  ]
}

```

HTTPValidationError

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|detail|[[ValidationError](#schemavalidationerror)]|false|none|Detail|none|

<h2 id="tocS_ValidationError">ValidationError</h2>

<a id="schemavalidationerror"></a>
<a id="schema_ValidationError"></a>
<a id="tocSvalidationerror"></a>
<a id="tocsvalidationerror"></a>

```json
{
  "loc": [
    "string"
  ],
  "msg": "string",
  "type": "string"
}

```

ValidationError

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|loc|[anyOf]|true|none|Location|none|

anyOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|string|false|none||none|

or

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|integer|false|none||none|

continued

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|msg|string|true|none|Message|none|
|type|string|true|none|Error Type|none|

