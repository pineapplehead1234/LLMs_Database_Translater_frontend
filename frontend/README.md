# ScholarWeaver 前端说明文档

## 1. 项目概述

ScholarWeaver 是一款面向技术 / 学术文档的本地桌面翻译与知识库管理工具。用户可以将 PDF、Word、Markdown 文档交
给后端大模型服务分段解析与翻译，并在桌面端完成原文 / 译文对照阅读、术语高亮、以及基于 CSV 的知识库索引管理。

前端基于 Web 技术栈构建，通过 Electron 打包为 Windows 桌面应用，同时也可以在浏览器中以纯 Web 方式调试和运行。

- 应用形态：
  - Web SPA（开发调试）
  - Electron 桌面应用（交付形态）
- 主要技术栈：
  - 框架：Vue 3 + TypeScript
  - UI：Element Plus
  - 状态管理：Pinia
  - 构建工具：Vite
  - 桌面壳：Electron + electron-builder

后端接口分为两大类：

- 文档翻译接口（参见 `docs/翻译接口.md`）
- RAG 知识库接口（参见 `docs/api_docs.md`）

前端在 `frontend/` 目录下，源代码位于 `frontend/src/`。

---

## 2. 功能模块

前端整体以 VS Code 风格布局组织在单个页面中，通过左侧 Activity Bar 切换三大工作区：

1. 文档翻译（Translate）
2. 知识库管理（Knowledge Base）
3. 模型配置（Model Config）

### 2.1 文档翻译工作区

对应目录：`src/components/Translate/`  
 核心组件：`FileUloadPanel.vue`、`FileTree.vue`、`OriginalPanel.vue`、`TranslationPanel.vue`、`TabBar.vue`  
 状态：`src/stores/translationStore.ts`

主要能力：

- pdf 文档上传

  - 用户可选择翻译策略（标准 / 极速 / 精准），在 `FileUloadPanel.vue` 中通过单选按钮切换策略参数。
  - 上传前可选择保存到的文件夹节点（与文件树联动）。

- 翻译任务提交与状态跟踪

  - 上传面板调用封装好的 `request` 函数（`src/api/http.ts`），请求翻译后端的上传接口。
  - 后端返回 `task_id` 后，前端轮询查询任务状态，直至获取完整的分段翻译结果。
  - 成功结果写入 `translationStore.handleTaskSuccess`，并通过 `taskCache.ts` 本地持久化。

- 原文 / 译文双栏展示

  - 左侧 `OriginalPanel.vue` 显示原文 Markdown 各段内容，右侧 `TranslationPanel.vue` 显示对应译文。
  - 内容按“段落 ID → 文本”的映射组织，便于滚动同步和术语标注。
  - 图片在后端打包成 ZIP 下发，前端经 `imageCache.ts` 解压并缓存为 Blob，再在 Markdown 渲染时替换为本地  
    `blob:` URL。

- 分段滚动同步

  - 利用 `useSegmentScrollSync.ts` 组合式函数记录原文 / 译文每个 segment 的位置。
  - 用户滚动任一侧时，可选择开启/关闭同步；启用时两侧视图在分段级别保持对齐。

- 文件树 & 多标签文档管理

  - `FileTree.vue` 展示“根目录 → 多层文件夹 → 文档节点”的树形结构。
  - 文档节点与后端任务一一对应：`task_id` + `client_request_id` + `docType`。
  - 支持新建文件夹、重命名节点、删除节点，操作由 `translationStore` 统一执行业务逻辑，并通过 `taskCache.ts`  
    持久化到 IndexedDB。
  - 顶部 `TabBar.vue` 提供类似 VS Code 的多标签栏，可在多份已打开文档间快速切换。

- 术语高亮与提示
  - 翻译结果中包含按段落划分的术语注释信息。
  - `OriginalPanel.vue` 在渲染 Markdown 时，根据当前段落的术语表对文本进行二次处理，将术语包裹为可 hover 的高
    亮元素。
  - 鼠标悬停时，通过 `ElTooltip` 提示框展示术语对应翻译。

### 2.2 知识库管理工作区

对应目录：`src/components/KnowledgeBase/`  
 核心组件：`KnowledgeBaseSidebar.vue`、`KnowledgeBaseView.vue`  
 状态：`src/stores/kbStore.ts`

主要能力：

- CSV 导入与索引构建

  - 左侧侧边栏通过 `el-upload` 接收 `.csv` 文件，交由 `kbStore.enqueueAdd` 逐个提交给 RAG 服务。
  - 后端返回任务 ID 后，前端轮询任务状态；任务完成后，服务端生成新的向量索引。
  - 支持多文件导入，导入中的操作会锁定相关按钮，避免重复提交。

- 知识库健康检查与文件列表

  - 启动时通过 `/health` 检查 RAG 服务是否可用，结果映射为在线 / 离线状态指示。
  - `kbStore.loadFiles` 调用 `/files` 获取当前已建索引的 CSV 文件列表，含 `source`、`display_name`、  
    `start_seq`、`end_seq`、`count` 等字段。
  - 用户可点击单个文件查看其条目数量，或选中后进行删除。

- 当前文件索引浏览

  - `KnowledgeBaseView.vue` 中的“当前文件”标签页，展示选中文件的中英文对照条目。
  - 支持分页浏览、显示行号、对单条记录执行删除操作。

- 全量索引浏览

  - “全部索引”标签页按 seq 聚合展示所有文件中的索引条目，包括来源文件名、英文文本和中文翻译。
  - 同样支持分页和单条删除，用于排查问题或清理错误入库的数据。

- 知识库清空与按文件删除
  - 用户可以通过侧边栏按钮请求后端执行 `/destroy`，清空整个向量存储（可配置是否保留服务器侧目录）。
  - 也可以针对某个 `source` 调用删除接口，仅移除该 CSV 文件相关的所有索引条目。

### 2.3 模型配置工作区

对应目录：`src/components/modelConfig/`  
 核心组件：`ModelConfigSidebar.vue`、`ModelConfigPanel.vue`  
 状态：`src/stores/modelConfigStore.ts`

主要能力（根据实际实现填充，可调整措辞）：

- 模型列表与分组展示

  - 从后端或本地配置读取可用模型信息（模型名称、提供方、用途标签等）。
  - 在侧边栏按分组/标签列出，支持点击切换当前选中的模型。

- 模型参数调整

  - 在 `ModelConfigPanel.vue` 中提供可视化表单调整温度、最大长度、top_p 等推理参数。
  - 支持保存模型配置到本地，启动时通过 `modelConfigStore.ensureInitialized` 恢复。

- 与翻译 / RAG 流程集成
  - 翻译视图在调用后端接口时从 `modelConfigStore` 读取当前模型配置，附带到请求中，使服务端可针对不同模型进行
    路由。

### 2.4 主题与桌面壳

对应组件：`App.vue`，状态：`src/stores/themestore.ts`

- 主题切换

  - 顶部右上角提供主题切换按钮，支持日间模式、夜间模式与纸质阅读主题。
  - `themestore.ts` 维护当前主题状态，并通过 CSS 变量统一控制颜色体系。

- Electron 窗口控制
  - 标题栏右侧模拟 VS Code 风格的最小化 / 最大化 / 关闭按钮。
  - 通过 `window.electronAPI` 与主进程通信，实现真实窗口操作。

---

## 3. 前端架构设计

### 3.1 布局与视图结构

入口组件：`src/App.vue`

- 顶部 `el-header`：应用标题、主题切换按钮、窗口控制按钮。
- 左侧 Activity Bar：三个图标按钮分别对应“文档翻译”、“知识库”、“模型配置”，通过本地状态 `activeView` 控制当前
  视图。
- 中间 Sidebar：
  - 在翻译模式下，用于展示文件管理侧边栏（上传区域 + 文件树）。
  - 在知识库模式下展示知识库文件列表及操作。
  - 在模型配置模式下展示模型列表与分组。
- 右侧 Workbench：
  - 翻译模式下：上方为标签栏，下方为原文/译文双栏，可拖动分割条调整宽度。
  - 知识库模式下：整块区域用于展示索引表格。
  - 模型配置模式下：展示模型配置表单。

布局采用 CSS Flex 组合，并提供两个可以拖动的垂直分隔条，用于控制侧边栏宽度和译文区域宽度。

### 3.2 组件组织结构

按目录划分核心组件：

- `src/components/Translate/`

  - `FileUloadPanel.vue`：文件上传面板与翻译策略选择。
  - `FileTree.vue`：文档树形结构，支持新建 / 重命名 / 删除。
  - `OriginalPanel.vue`：原文分段展示、术语高亮与提示。
  - `TranslationPanel.vue`：译文分段展示与图片渲染。
  - `TabBar.vue`：多标签页文档切换及同步开关按钮。

- `src/components/KnowledgeBase/`

  - `KnowledgeBaseSidebar.vue`：CSV 文件列表、导入和删除操作。
  - `KnowledgeBaseView.vue`：当前文件 / 全部索引的分页表格视图。

- `src/components/modelConfig/`

  - `ModelConfigSidebar.vue`：模型分组列表。
  - `ModelConfigPanel.vue`：模型参数编辑表单。

- `src/composables/useSegmentScrollSync.ts`
  - 封装原文 / 译文分段位置测量与滚动同步逻辑，对两个面板暴露统一接口。

### 3.3 状态管理与数据模型

Pinia Stores 分工如下：

- `translationStore.ts`

  - 当前已打开文档的内容与状态：
    - `currentFile`：包含 `task_id`、`status`、`original_markdown`、`translated_markdown`、`term_annotations`
      等字段。
    - `status`：当前翻译任务状态（pending / processing / success / error）。
  - 文档树与标签栏：
    - `fileTree`：根节点 + 文件夹节点 + 文档节点（携带 `task_id` 与 `docType`）。
    - `openTabs`：当前打开的任务标签列表。
    - `activeTaskId`：当前聚焦的任务 ID。
  - 提供方法：
    - `handleTaskSuccess`：处理翻译任务完成后的数据落盘与树节点更新。
    - `initFileTreeFromCache` / `persistFileTree`：与本地缓存同步文档树。
    - `loadTaskFromCache`：按 `task_id` 加载本地缓存中的任务结果并准备图片缓存。
    - `addFileNode` / `addFolderNode` / `deleteNode` / `renameNode`：维护文档树结构。
    - `openTab` / `closeTab`：管理标签页。

- `kbStore.ts`

  - 知识库状态：
    - `isConnected`：RAG 服务健康状态。
    - `isUpdating`：当前是否有任务进行，避免并发操作。
    - `files`：CSV 文件列表及其 seq 范围与计数。
    - `selectedSource`：当前选中的源文件标识。
    - `totalSeqCount`：所有文件的总索引条目数。
  - 提供方法：
    - `checkHealth` / `loadFiles`：初始化与刷新知识库状态。
    - `destroyStore`：清空整个向量存储。
    - `deleteFileBySource` / `deleteBySeq`：按文件或按单条 seq 删除。
    - `enqueueAdd`：提交 CSV 文件构建索引任务并轮询状态。

- `modelConfigStore.ts`

  - 存储当前可用模型配置和用户选择，以及初始化逻辑 `ensureInitialized` 等。

- `themestore.ts`
  - 存储当前主题并提供 `toggleTheme` 方法，与 `App.vue` 的 UI 交互。

---

## 4. 与后端接口交互

前端通过 `src/api/http.ts` 封装 `fetch` 请求，并由 `src/api/config.ts` 统一管理接口基础地址和路径。接口大致分
为两大类：

### 4.1 文档翻译接口

（详细参数参见 `docs/翻译接口.md`）

- 上传接口

  - 负责接收 PDF / DOCX / Markdown 文件以及翻译策略。
  - 请求成功后返回 `task_id`，前端不立即获取结果，而是进入轮询阶段。

- 任务查询接口

  - 通过 `task_id` 查询任务进度。
  - 当状态为 `success` 时，返回分段原文 / 译文、术语注释等数据结构。
  - 出错时返回错误信息，前端根据状态做提示。

- 图片资源下载接口
  - 按任务 ID 下载图片 ZIP 包。
  - 前端解压并根据相对路径缓存成 Blob URL，用于 Markdown 渲染中的图片替换。

### 4.2 RAG 知识库接口

（详细参数参见 `docs/api_docs.md`）

- 健康检查接口 `/health`

  - 返回向量库目录与服务状态，用于 KnowledgeBase 视图顶部在线状态展示。

- 文件列表接口 `/files`

  - 返回当前所有已索引的 CSV 文件及其元信息，前端据此构建知识库文件列表。

- 构建任务接口 `/tasks/add`
  - 接收 CSV 文件，构建对应索引。
  - 返回 task_id，前端轮询 `/task_status`，待状态为 finished 后刷新文件列表。
- 查询接口 `/index` / `/rerank`

  - 用于按查询词检索知识库内容并返回中英对照结果（可供后续页面使用）。

- 删除接口 `/delete`

  - 支持按 `seq` 或按 `source` 删除索引条目，与前端单条删除或按文件删除操作对应。

- 销毁接口 `/destroy`
  - 清空整个向量库，常用于重置环境或调试。

---

## 5. 本地缓存与文件树设计（前端视角）

本地缓存逻辑在 `src/utils/taskCache.ts` 和 `src/utils/imageCache.ts` 中实现，设计目标是让用户在重启应用后仍然
能够：

- 找回历史翻译任务与对应文件树结构；
- 继续查看之前的原文 / 译文与图片；
- 不必重新拉取所有图片资源。

关键点如下：

- 文档树持久化

  - 文档树整体序列化为 JSON，并存储在本地（如 IndexedDB）。
  - 每个文件节点包含与翻译任务一一对应的 `task_id` 与 `client_request_id`，用于恢复任务。

- 任务结果缓存

  - 按 `task_id` 将任务结果（原文 / 译文分段、术语注释等）存入 IndexedDB。
  - `translationStore.loadTaskFromCache` 会在打开历史文档时读取这些数据并填充 `currentFile`。

- 图片缓存
  - 每个任务的图片 ZIP 在下载后进行解压，按相对路径存储到 IndexedDB。
  - 渲染 Markdown 时，组件根据 `task_id` + 图片相对路径从缓存中查找 Blob，并生成 `blob:` URL 替换原路径。

这一套设计的结果是：即便后端服务临时不可用，用户也可以通过本地缓存继续阅读已完成的翻译文档。

---

## 6. 典型使用流程

### 6.1 文档翻译流程

1. 打开应用，进入“文档翻译”视图。
2. 在左侧上传面板选择翻译策略，并选定目标文件夹。
3. 拖拽或点击上传 PDF 文档，前端将文件与策略一起提交到翻译后端。
4. 任务进入排队 / 处理阶段，前端轮询任务状态。
5. 翻译完成后，文档以一个新的文件节点出现在文件树中，同时在右侧以“原文 / 译文双栏 + 标签页”的形式展示结果。
6. 用户可以重命名文件节点、移动到不同文件夹，或在标签栏中关闭 / 切换文档。

### 6.2 知识库维护流程

1. 切换到“知识库”视图。
2. 通过左侧上传按钮导入一个或多个 CSV 文件。
3. 等待 RAG 服务构建索引，完成后在文件列表中可以看到每个文件的条目数量。
4. 在右侧“当前文件”标签中分页浏览选中文件的中英文条目；或切换到“全部索引”查看全库内容。
5. 如需清理错误数据，可对单条记录执行删除，或按文件删除整块索引，必要时也可以一键清空整个知识库。

---

## 7. 特色与优势

- 桌面级体验  
  采用 Electron 封装与 VS Code 风格布局，支持窗口级控制和可拖拽分栏，适合长时间阅读与编辑场景。

- 面向文档的翻译体验  
   针对 PDF 的结构化分段展示，支持原文 / 译文对照、术语高亮与图片保留，适合技术文档与论文  
  翻译。

- 本地持久化与离线友好  
  翻译结果、文档树、图片资源全部缓存于本地，重启应用可以继续阅读历史文档，降低对后端实时可用性的依赖。

- 内置知识库支持  
  支持基于 CSV 构建向量索引的知识库管理，与翻译结果互补，方便后续对翻译条目进行统一检索与复用。

- 配置化模型路由  
  提供模型配置视图，便于调整不同模型和参数策略，使前后端在多模型部署场景下更加灵活。

---

## 8. 构建与运行说明（前端）

在 `frontend/` 目录下执行以下命令：

- 安装依赖：

  ```bash
  npm install

  ```

- 启动 Web 开发服务：
  npm run dev
- 启动 Electron + Web 联合调试：
  npm run dev:all
- 构建 Web 产物：
  npm run build
- 构建 Electron 安装包：
  npm run build:electron

具体配置可参考 frontend/package.json 与 vite.config.ts、electron/main.cjs。
