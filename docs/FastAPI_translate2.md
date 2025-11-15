---
title: FastAPI_translate2
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

# FastAPI_translate2

Base URLs:

# Authentication

# Default

<a id="opIdsubmit_task_api_task_upload_post"></a>

## POST Submit Task

POST /api/task/upload

> Body 请求参数

```yaml
file: ""
target_lang: 中文
strategy: normal
client_request_id: ""

```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|object| 是 ||none|
|» file|body|string(binary)| 是 | File|The file to upload|
|» target_lang|body|any| 否 | Target Lang|目标语言|
|»» *anonymous*|body|string| 否 ||none|
|»» *anonymous*|body|null| 否 ||none|
|» strategy|body|any| 否 | Strategy|翻译策略，可选值：fast, normal, thinking|
|»» *anonymous*|body|string| 否 ||none|
|»» *anonymous*|body|null| 否 ||none|
|» client_request_id|body|any| 否 | Client Request Id|none|
|»» *anonymous*|body|string| 否 ||none|
|»» *anonymous*|body|null| 否 ||none|

> 返回示例

> 200 Response

```json
null
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|Inline|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

### 返回数据结构

状态码 **422**

*HTTPValidationError*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» detail|[[ValidationError](#schemavalidationerror)]|false|none|Detail|none|
|»» ValidationError|[ValidationError](#schemavalidationerror)|false|none|ValidationError|none|
|»»» loc|[anyOf]|true|none|Location|none|

*anyOf*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»»» *anonymous*|string|false|none||none|

*or*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»»» *anonymous*|integer|false|none||none|

*continued*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»» msg|string|true|none|Message|none|
|»»» type|string|true|none|Error Type|none|

<a id="opIdquery_task_api_task_query_get"></a>

## GET Query Task

GET /api/task/query

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|task_id|query|string| 否 | Task Id|none|

> 返回示例

> 200 Response

```json
"string"
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|string|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

<a id="opIdget_image_api_task_download_images_get"></a>

## GET Get Image

GET /api/task/download/images

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|task_id|query|string| 否 | Task Id|none|

> 返回示例

> 200 Response

```json
null
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|Inline|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

### 返回数据结构

状态码 **422**

*HTTPValidationError*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» detail|[[ValidationError](#schemavalidationerror)]|false|none|Detail|none|
|»» ValidationError|[ValidationError](#schemavalidationerror)|false|none|ValidationError|none|
|»»» loc|[anyOf]|true|none|Location|none|

*anyOf*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»»» *anonymous*|string|false|none||none|

*or*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»»» *anonymous*|integer|false|none||none|

*continued*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»» msg|string|true|none|Message|none|
|»»» type|string|true|none|Error Type|none|

<a id="opIdchange_config_api_task_config_post"></a>

## POST Change Config

POST /api/task/config

> Body 请求参数

```json
{
  "task_type": "change_llms_config",
  "llms": [
    {
      "name": "string",
      "base_url": "string",
      "api_key": "string",
      "model_name": "string",
      "temperature": 0.7,
      "extra_config": {},
      "extra_body": {}
    }
  ]
}
```

### 请求参数

|名称|位置|类型|必选|中文名|说明|
|---|---|---|---|---|---|
|body|body|[ChangeLLMsConfigRequest](#schemachangellmsconfigrequest)| 是 | ChangeLLMsConfigRequest|none|

> 返回示例

> 200 Response

```json
null
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|Inline|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|Validation Error|[HTTPValidationError](#schemahttpvalidationerror)|

### 返回数据结构

状态码 **422**

*HTTPValidationError*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» detail|[[ValidationError](#schemavalidationerror)]|false|none|Detail|none|
|»» ValidationError|[ValidationError](#schemavalidationerror)|false|none|ValidationError|none|
|»»» loc|[anyOf]|true|none|Location|none|

*anyOf*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»»» *anonymous*|string|false|none||none|

*or*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»»» *anonymous*|integer|false|none||none|

*continued*

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|»»» msg|string|true|none|Message|none|
|»»» type|string|true|none|Error Type|none|

<a id="opIdget_config_api_config_get"></a>

## GET Get Config

GET /api/config

> 返回示例

> 200 Response

```json
null
```

### 返回结果

|状态码|状态码含义|说明|数据模型|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Successful Response|Inline|

### 返回数据结构

# 数据模型

<h2 id="tocS_ChangeLLMsConfigRequest">ChangeLLMsConfigRequest</h2>

<a id="schemachangellmsconfigrequest"></a>
<a id="schema_ChangeLLMsConfigRequest"></a>
<a id="tocSchangellmsconfigrequest"></a>
<a id="tocschangellmsconfigrequest"></a>

```json
{
  "task_type": "change_llms_config",
  "llms": [
    {
      "name": "string",
      "base_url": "string",
      "api_key": "string",
      "model_name": "string",
      "temperature": 0.7,
      "extra_config": {},
      "extra_body": {}
    }
  ]
}

```

ChangeLLMsConfigRequest

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|task_type|string|false|none|Task Type|none|
|llms|[[LLMConfig](#schemallmconfig)]|true|none|Llms|[单个 LLM 的配置项。<br />    ]|

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

<h2 id="tocS_LLMConfig">LLMConfig</h2>

<a id="schemallmconfig"></a>
<a id="schema_LLMConfig"></a>
<a id="tocSllmconfig"></a>
<a id="tocsllmconfig"></a>

```json
{
  "name": "string",
  "base_url": "string",
  "api_key": "string",
  "model_name": "string",
  "temperature": 0.7,
  "extra_config": {},
  "extra_body": {}
}

```

LLMConfig

### 属性

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|name|string|true|none|Name|唯一名称，用于引用该 LLM|
|base_url|string|true|none|Base Url|该 LLM 的基础 API 地址|
|api_key|string|true|none|Api Key|访问该 LLM 的 API Key|
|model_name|string|true|none|Model Name|要调用的具体模型名|
|temperature|number|false|none|Temperature|温度，范围 0~2|
|extra_config|any|false|none|Extra Config|额外的运行时配置，如 max_concurrency / rpm 等|

anyOf

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|object|false|none||none|

or

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|» *anonymous*|null|false|none||none|

continued

|名称|类型|必选|约束|中文名|说明|
|---|---|---|---|---|---|
|extra_body|object|false|none|Extra Body|额外透传给模型的请求体|

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

