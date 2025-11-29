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

<a id="opIdchange_config_api_task_config_post"></a>

## POST Change Config

POST /api/task/config

> Body 请求参数

```json
"{\r\n    \"task_type\": \"change_llms_config\", //固定\r\n    \"llms\": [\r\n        {\r\n            \"name\": \"GLM-4.5-Flash\", //用户自定义的模型名称,作为标识符\r\n            \"base_url\": \"https://open.bigmodel.cn/api/paas/v4\", //供应商的API网址\r\n            \"api_key\": \"sk-xxx\", //API秘钥\r\n            \"model_name\": \"GLM-4.5-Flash\", //模型名称,发送给供应商来确定模型\r\n            \"temperature\": 0.1, //温度,(随机性/创造力程度)\r\n            \"extra_config\": { //额外配置,用于本地程序,不会发送给供应商\r\n                \"max_concurrency\": 1, //最大同时并发数\r\n                \"rpm\": 10, //每分钟最大请求次数\r\n                \"type\": \"main\" //类型,main用于处理杂货,mt用于处理初步翻译\r\n            },\r\n            \"extra_body\": { //每个供应商对应模型的额外参数\r\n                \"response_format\": {\r\n                    \"type\": \"json_object\" //使用json格式返回\r\n                }\r\n            }\r\n        },\r\n        {\r\n            \"name\": \"GLM-4.5-Air\",\r\n            \"base_url\": \"https://open.bigmodel.cn/api/paas/v4\",\r\n            \"api_key\": \"sk-xxx\",\r\n            \"model_name\": \"GLM-4.5-Air\",\r\n            \"temperature\": 0.1,\r\n            \"extra_config\": {\r\n                \"max_concurrency\": 3,\r\n                \"rpm\": 20\r\n            },\r\n            \"extra_body\": {\r\n                \"response_format\": {\r\n                    \"type\": \"json_object\"\r\n                }\r\n            }\r\n        },\r\n        {\r\n            \"name\": \"THUDM/GLM-4-9B-0414\",\r\n            \"base_url\": \"https://api.siliconflow.cn/v1\",\r\n            \"api_key\": \"sk-xxx\",\r\n            \"model_name\": \"THUDM/GLM-4-9B-0414\",\r\n            \"temperature\": 0.3,\r\n            \"extra_config\": {\r\n                \"max_concurrency\": 20,\r\n                \"rpm\": 100\r\n            },\r\n            \"extra_body\": {\r\n                \"response_format\": {\r\n                    \"type\": \"json_object\"\r\n                }\r\n            }\r\n        },\r\n        {\r\n            \"name\": \"llama-3.3-70b\",\r\n            \"base_url\": \"https://api.cerebras.ai/v1\",\r\n            \"api_key\": \"sk-xxx\",\r\n            \"model_name\": \"llama-3.3-70b\",\r\n            \"temperature\": 0.3,\r\n            \"extra_config\": {\r\n                \"max_concurrency\": 5,\r\n                \"rpm\": 50\r\n            },\r\n            \"extra_body\": {\r\n                \"response_format\": {\r\n                    \"type\": \"json_object\"\r\n                }\r\n            }\r\n        },\r\n        {\r\n            \"name\": \"qwen3-next-80b-a3b-instruct\",\r\n            \"base_url\": \"https://cloud.infini-ai.com/maas/v1\",\r\n            \"api_key\": \"sk-xxx\",\r\n            \"model_name\": \"qwen3-next-80b-a3b-instruct\",\r\n            \"temperature\": 0.1,\r\n            \"extra_config\": {\r\n                \"max_concurrency\": 5,\r\n                \"rpm\": 6\r\n            },\r\n            \"extra_body\": {}\r\n        },\r\n        {\r\n            \"name\": \"tencent/Hunyuan-MT-7B\",\r\n            \"base_url\": \"https://api.siliconflow.cn/v1\",\r\n            \"api_key\": \"sk-xxx\",\r\n            \"model_name\": \"tencent/Hunyuan-MT-7B\",\r\n            \"temperature\": 0.2,\r\n            \"extra_config\": {\r\n                \"max_concurrency\": 200,\r\n                \"rpm\": 500,\r\n                \"type\": \"MT\"\r\n            },\r\n            \"extra_body\": {}\r\n        }\r\n    ]\r\n}"
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
|llms|[[LLMConfig](#schemallmconfig)]|true|none|Llms|[单个 LLM 的配置项]|

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

