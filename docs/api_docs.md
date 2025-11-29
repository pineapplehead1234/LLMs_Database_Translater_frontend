# RAG API Documentation

## 通用说明
- **Base URL**：`http://localhost:8031`（这是本地部署，内网穿透后的网址需要找hmk要，直接替换即可）。
- **鉴权**：当前无额外鉴权，直接请求即可；如部署在公网请在网关层补充鉴权（同样问hmk）。
- **默认请求头**：`Content-Type: application/json`，除 POST 接口需改用 `multipart/form-data`。
- **错误返回**：FastAPI 的 HTTP 异常将返回 `{"detail": "...错误信息..."}`，可根据 HTTP 状态码决定提示文案。

---

## 1. GET `/health`
- **用途**：探活接口，用于前端/监控确认服务、向量库目录可用。
- **请求参数**：无。
- **返回内容**：
  - `ok`：布尔值，恒为 `true`。
  - `store_dir`：当前生效的向量库目录路径。
- **调用示例**：
```bash
curl -X 'GET' \
  'http://localhost:8031/health' \
  -H 'accept: application/json'
# 响应
{
  "ok": true,
  "store_dir": "./vector_store"
}
```

## 2. POST `/rerank`
- **用途**：对问题集执行检索+重排，返回英文原文与中文译文（取每个问题的最相关片段）。
- **请求方式**：`application/json`
- **Query 参数**：
  - `topk` *(int, 默认 1, 范围 1-50)*：最终返回的条数。
  - `pool_size` *(int, 默认 5, 范围 1-500)*：粗召回的文档数量，上限需 ≥ `topk`。
  - `lambda_mmr` *(float, 默认 0.7, 范围 0-1)*：MMR 去重权重，越大越强调多样性。
  - `max_score` *(float, 默认 100)*：过滤召回结果的最大距离阈值。
- **Body 参数**：
  - `query` *(string[])*：必填，批量问题列表。
- **返回内容（`SearchResponse`）**：
  - `original_text`：与输入 `query` 顺序一一对应的英文原文列表。
  - `translated_text`：对应中文译文列表（metadata 中的 `chinese` 字段）。
- **调用示例**：
```bash
curl -X 'POST' \
  'http://localhost:8031/rerank?topk=1&pool_size=5&lambda_mmr=0.7&max_score=100' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "query": [
    "车辆质保期多长？", "如何联系客服？"
  ]
}'
# 响应
{
  "original_text": [
    "The vehicle enjoys a 5-year warranty covering ...",
    "You may reach us via hotline ..."
  ],
  "translated_text": [
    "整车质保 5 年 ...",
    "可通过热线联系我们 ..."
  ]
}
```

## 3. GET `/index`
- **用途**：预览当前向量库索引列表，让前端构建删除面板/调试界面。
- **Query 参数**：
  - `limit` *(int, 默认 200, 支持 0 返回全部)*：最多返回的条数。
  - `metadata` *(bool, 默认 false)*：是否在每项中附带 metadata 字段。
- **返回内容**：
  - `count`：命中的总条数。
  - `items`：按 `limit` 截断的索引数组，每项包含 `seq`、`pos`、`source`、`metadata`（取决于入参）。
- **调用示例**：
```bash
curl -X 'GET' \
  'http://localhost:8031/index?limit=200&metadata=true' \
  -H 'accept: application/json'
# 响应片段
{
  "count": 20,
  "items": [
    {
      "seq": 2,
      "pos": 1,
      "id": "54005942-9799-4107-ac10-478da7cbb7d7",
      "preview": "probably not : analysis suggests minimal effect of HT in maintaining lean body mass .",
      "metadata": {
        "type": "translation_pair",
        "english": "probably not : analysis suggests minimal effect of HT in maintaining lean body mass .",
        "chinese": "也许不能：分析结果提示激素疗法在维持去脂体重方面作用很小。",
        "source": "C:\\Users\\zx\\PycharmProjects\\dingjia\\docs\\nejm_train_en2zh.csv",
        "row": 2
      }
    },
    # 此处省略剩余十九个...
  ]
}
```

## 4. POST `/destroy`
- **用途**：销毁当前向量库（FAISS 文件与 `_id_map.json`），通常用于重建前的清理。
- **请求参数**：`remove_dir` *(bool, query, 默认 false)* —— true 时直接删除整个 `store_dir`。
- **返回内容**：
  - `ok`：恒为 true 表示调用成功。
  - `remove_dir`：本次是否连同目录一起删除。
  - `deleted_entries`：VectorManager 报告的清空条数。
- **调用示例**：
```bash
curl -X 'POST' \
  'http://localhost:8031/destroy?remove_dir=false' \
  -H 'accept: application/json' \
  -d ''
# 响应片段
{
  "ok": true,
  "remove_dir": false,
  "deleted_entries": 5,
  "store_dir": "./vector_store"
}
```

## 5. POST `/delete`
- **用途**：对向量库执行精确 seq 删除或 metadata 条件删除。
- **请求方式**：`application/json`
- **Body 参数（`DeleteBody`）**：
  - `indexes` *(int[] 可选)*：按 seq 删除时使用，seq 为从1开始的升序，表示目前在向量库内的例句对的顺序。
  - `targets` *(string[] 可选)*：按 metadata 值删除，可与 `keywords` 配合锁定字段。
  - `keywords` *(string, 默认 "source")*: metadata 中要匹配的字段名，可选 `source`/`english`/`chinese`/`type`/`row` 
  - `fuzzy` *(bool, 默认 false)*：是否对子串模糊匹配。
  - `ignore_case` *(bool, 默认 false)*：是否忽略大小写区别。
- **返回内容**：
  - `ok`：恒为 true。
  - `seq`：当 `indexes` 生效时附带，字段包含 `requested_seqs`、`resolved_pos`、`not_found_seqs`、`deleted`。
  - `metadata`：当 `targets` 生效时附带，包含 `deleted_docs_name` 与 `deleted` 数量。
- **调用示例 (以删除来自`example.csv`文件的例句对为例)**：
```bash
curl -X 'POST' \
  'http://localhost:8031/delete' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "indexes": [], #注意按 metadata 删除时此处需要传空值
  "targets": [
    "C:\\Users\\zx\\PycharmProjects\\dingjia\\docs\\example.csv" #填写所要删除的数据对应的 metadata 中 source 字段的值。
  ],
  "keywords": "source", #选择 metadata 中要匹配的字段名为 source
  "fuzzy": false,
  "ignore_case": false
}'
#响应
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

## 6. POST `/tasks/build`
- **用途**：异步重建整个向量库（可上传文件或传服务器已有路径）。
- **请求方式**：`multipart/form-data`
- **Form 字段**：
  - `file` *(可选)*：上传的文档集合压缩包/单文档。存在时优先级最高，服务会保存到 `vector_store/uploads/`。
  - `doc_path` *(可选)*：服务器可访问的文档路径，未上传文件时必填。
  - `reinit` *(bool, 默认 false)*：true 时允许覆盖已有向量库。
- **返回内容**：
  - `ok`：是否入队成功。
  - `task_id`：任务唯一 ID。
  - `status_url`：查询任务的 GET 路径。
- **调用示例**：
```bash
curl -X 'POST' \
  'http://localhost:8031/tasks/build' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'reinit=false' \
  -F 'doc_path=string' \
  -F 'file=@nejm_train_en2zh.csv;type=text/csv'
# 202 Accepted
{
  "ok": true,
  "task_id": "f19b8939...",
  "status_url": "/tasks/f19b8939..."
}
```

## 7. POST `/tasks/add`
- **用途**：将新增文件异步追加到现有向量库，字段与 `/tasks/build` 类似。
- **请求方式**：`multipart/form-data`
- **Form 字段**：
  - `file` *(可选)*：上传文件，优先使用。
  - `doc_path` *(可选)*：已有文件路径，两者必须至少提供一个。
- **返回内容**：与 `/tasks/build` 相同。
- **调用示例**：
```bash
curl -X POST http://localhost:8000/tasks/add \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'doc_path=string' \ #有上传文件 此行被忽略
  -F "doc_path=/data/uploads/example.csv"
  # 202 Accepted
{
  "ok": true,
  "task_id": "45c1c7e2-...",
  "status_url": "/tasks/id/45c1c7e2-..."
}
```

## 8. GET `/tasks/id/{task_id}`
- **用途**：查询某个异步任务的实时进度或最终结果。
- **路径参数**：`task_id` —— 入队时返回的 ID。
- **返回内容**（字段来自任务队列/SQLite）：
  - `task_id`、`function_name`、`kwargs`。
  - `status`：`pending` / `processing` / `finished` / `error`。
  - `is_async`：布尔值。
  - `created_at`、`started_at`、`finished_at`（ISO 字符串）。
  - `result`：任务结果（`_task_build_vector` 会返回 `ok/built_from/count/preview` 等）。
  - `error_message`、`traceback`：存在错误时返回。
- **调用示例**：
```bash
curl -X 'GET' \
  'http://localhost:8031/tasks/id/246b1470-b67b-4c71-af5d-eb783d9eb90e' \
  -H 'accept: application/json'
# 响应片段
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

## 9. GET `/tasks/task_list`
- **用途**：获取任务队列整体状态，用于展示“后台正在处理 X 个任务”。
- **请求参数**：无。
- **返回内容**：
  - `total_tasks`、`pending_count`、`processing_count`、`finished_count`、`error_count`。
  - `async_tasks`、`sync_tasks`：按任务类型统计。
  - `current_task`：当前执行的任务 ID（若为空表示空闲）。
  - `is_running`：任务线程是否在运行。
- **调用示例**：
```bash
curl -X 'GET' \
  'http://localhost:8031/tasks/task_list' \
  -H 'accept: application/json'
# 响应
{
  "total_tasks": 3,
  "pending_count": 1,
  "processing_count": 1,
  "finished_count": 1,
  "error_count": 0,
  "async_tasks": 3,
  "sync_tasks": 0,
  "current_task": "45c1c7e2-...",
  "is_running": true
}
```

---

### 建议
1. **批量查询**：`/rerank` 支持一次提交多个问题，可在聊天面板内批量触发并按序映射返回值。
2. **异步任务轮询**：构建/追加向量库均返回 `task_id`，建议 2~5 秒轮询 `/tasks/id/{task_id}`，若 `status=finished` 再提示用户。
3. **删除操作提示**：调用 `/delete` 前可通过 `/index` 获取 `seq`，执行后根据响应中的 `deleted` 数量给出 toast。
4. `index`接口中设置`metadata`为`True`并分批次请求，每次请求几百个（一两秒即可响应），若一次请求全部，则响应时间较长（十几秒）。

---

### TODO
1. 如果导入文件时是通过上传文件的形式，需要考虑是否保留原文件的命名，目前是，为了避免命名冲突后端会生成一个 UUID 文件名，形如：`f55bf840bbd448a68c4e489601ce4c06.csv`。但这样可读性不好，是否改为`{uuid}_{filename}`，然后你这边显示时再作解析，只显示`filename`?
2. `/tasks/task_list`设计上是一个查询任务id相关的信息接口。返回的内容按你需求返回。后续告知我需要返回的信息。
3. 其余接口返回体中不必要的字段请标注出来，后续我作删改。