二、前端页面与交互设计（基于现有 test_rag.html 简化改造）

  1. 顶部栏（保留 +加强）
      - 左侧：
          - 状态点：healthOk → 绿色/灰色。
          - 文案：RAG Service Ready / RAG Service Disconnect。
      - 右侧：
          - 主题切换 el-switch（沿用 isDark）。
          - 任务状态标签：
              - 空闲：不显示或显示 Idle。
              - 有任务：显示 Indexing...（基于任务轮询结果与本地发起任务状态）。
      - 状态来源：
          - 每 10–30 秒轮询 /health 更新 healthOk。
          - 每 3–5 秒轮询 /tasks/task_list 决定是否“后台有任务”。
  2. 左侧 Sidebar（Indexed Sources）
      - 列表展示：
          - 顶部标题：Indexed Sources。
          - 右侧按钮：
              - “清空库”按钮：调用 /destroy（保留）。
              - “上传文件”按钮：打开上传弹窗（保留）。
          - 中间：
              - “All Records” 虚拟项：显示总向量条数。
              - 文件列表：sourceList（来自 /index 聚合 metadata.source）：
                  - 展示文件名（getFileName(path)）。
                  - 每个文件条数 count。
                  - 右侧小 Delete 图标：删除该源文件的所有向量。
      - 操作行为：
          - 点击某个源：currentFilter = file.path，右侧 Data Inspector 只展示该源的向量。
          - 删除源按钮：确认后调用 /delete，Body：
              - {"indexes": [], "targets": [path], "keywords": "source"}。
  3. 右侧工作区（只保留 Data Inspector）
      - Tab 改造：
          - 去掉 Retrieval Playground Tab。
          - 保留 Data Inspector，默认激活。
      - 数据表结构：
          - 使用现有 el-table：
              - metadata.english、metadata.chinese、metadata.source。
              - “Action” 列包含单行删除按钮，按 seq 调用 /delete。
      - 数据来源：
          - 初始化 & 切换筛选时，调用 /index?limit=200&metadata=true：
              - 前端按 metadata.source 聚合成 sourceList。
              - rawIndexData 保存完整条目。
              - filteredTableData 根据 currentFilter 过滤。
          - 避免一次性全量：按文档建议 limit 控制为 200–500，必要时增加“加载更多”。
  4. 上传弹窗
      - 弹窗结构：
          - 文件选择组件 el-upload（drag）。
          - 底部按钮：
              - Cancel：关闭弹窗。
              - Upload & Build 或 Upload & Add：
                  - 推荐：默认 Add（增量），高级用户可用“覆盖重建”开关映射到 /tasks/build+reinit=true。
      - 上传行为：
          - 选择文件后提交：
              - POST /tasks/add：
                  - file：上传文件。
                  - 或 /tasks/build（全量重建场景）。
              - 成功返回 task_id 后：
                  - 本地记录该 task_id 到 activeTasks 数组。
                  - 立即将 kbBusy = true，按钮锁定。
          - 错误提示：
              - 后端返回错误时，用 ElMessage.error 提示并解除本地“请求中”状态；是否解除 kbBusy 由 /tasks/
                task_list 的轮询结果决定。

  ———

  三、锁定逻辑设计（“知识库有任务更新时，所有按钮锁定”）

  1. 状态变量设计
      - healthOk: boolean：来自 /health。
      - taskListStatus: { is_running: boolean, pending_count: number, processing_count: number }：
          - 来自 /tasks/task_list。
      - localMutating: boolean：
          - 前端发起任何“知识库写操作”期间为 true，例如：
              - /destroy 请求未结束。
              - /delete 请求未结束。
              - 上传文件接口请求未结束。
      - kbBusy: computed：

        const kbBusy = computed(() => {
          return !healthOk.value
            || localMutating.value
            || taskListStatus.value.is_running
            || (taskListStatus.value.pending_count + taskListStatus.value.processing_count) > 0;
        });
  2. 被锁定的交互元素
      - 左侧：
          - “Destroy Database” 按钮：:disabled="kbBusy"。
          - “Upload New File” 按钮：:disabled="kbBusy"。
          - source-item 点击和删除图标：
              - CSS: .source-item.disabled { pointer-events: none; opacity: 0.5; }
              - Vue：:class="{ disabled: kbBusy }".
      - 右侧：
          - Data Inspector 中单行删除向量按钮：:disabled="kbBusy"。
          - “Reload index data” 按钮（如果保留）：:disabled="kbBusy".
      - 上传弹窗：
          - el-upload：:disabled="kbBusy"。
          - 确认上传按钮：:disabled="kbBusy"。
      - 视觉反馈：
          - 顶部显示 Indexing...。
          - 整个工作区可加一个浅蒙层：当 kbBusy 为 true 时，显示半透明背景 + 文案“后台任务处理中，暂时无法操作
            知识库”。
  3. “任务更新”的判定与生命周期
      - 异步任务型（build/add）：
          - 用户点击上传 → 发送 /tasks/add → 返回 task_id：
              - 本地：记录到 activeTaskIds，并立即 kbBusy = true。
              - 后台：轮询 /tasks/id/{task_id} 或统一轮询 /tasks/task_list。
              - 当 /tasks/task_list 显示无 pending/processing 且 is_running=false 时，认为任务全部完成，
                kbBusy=false。
      - 同步写操作型（delete/destroy）：
          - 调用前 localMutating = true。
          - 请求结束（成功或失败）localMutating = false。
          - 即使调用成功后短时间仍有后台整理任务，也会被 /tasks/task_list 捕获，确保 kbBusy 在后台真正空闲前不
            恢复。
      - 断网/后端崩溃：
          - /health 或 /tasks/task_list 请求失败 → healthOk=false → kbBusy=true，并在 UI 上展示“服务不可用”。

  ———

  四、后端接口使用方案（与前端设计对应）

  - 连接状态：
      - 周期性 GET /health。
      - 若失败则切换为 Disconnect 状态，禁止所有写操作。
  - 索引浏览：
      - GET /index?limit=200&metadata=true。
      - 数据结构同文档示例，用于：
          - Data Inspector 表格显示。
          - 汇总 sourceList。
  - 删除单条向量：
      - POST /delete，Body：{ "indexes": [seq], "targets": [], "keywords": "source" }。
  - 删除整个文件：
      - POST /delete，Body：{ "indexes": [], "targets": [path], "keywords": "source" }。
  - 清空向量库：
      - POST /destroy?remove_dir=false。
  - 异步构建/追加：
      - 上传文件：
          - POST /tasks/add（推荐默认路径）。
          - 或 POST /tasks/build + reinit=true（重建）。
      - 任务状态：
          - 优先统一轮询 GET /tasks/task_list（减轻多任务轮询 /tasks/id/* 的调用次数）。
          - 某些场景需要详细结果时，再按需调用 /tasks/id/{task_id}。

  ———

  五、性能与架构可行性分析

  1. 性能角度

  - 前端：
      - 只保留增删和索引浏览，取消 /rerank 检索逻辑，整体交互复杂度降低。
      - /index：
          - 按文档建议设置 limit，例如 200–500 条，避免一次性返回全部向量导致十几秒响应。
          - 如果向量条数很大，可后续扩展为“分页加载”或“按文件分页”，当前设计已兼容。
      - 轮询：
          - /health 每 10–30 秒一次，开销极小。
          - /tasks/task_list 每 3–5 秒一次，返回体很小，即使多个前端实例也很难成为瓶颈。
  - 后端：
      - 写操作通过 /tasks/build、/tasks/add 异步队列处理，前端锁定按钮可以防止重复请求、减少冲突。
      - 删除接口 /delete、/destroy 已是单次调用，锁定期间不会有多并发写请求，简化后端并发处理（相当于“前端乐观
        限流”）。
      - 总体来看，该设计对后端压力有限，主要性能风险在于大规模 /index 请求，已经通过 limit 和前端分页设计
        规避。

  2. 架构角度

  - 前端架构：
      - 推荐将“知识库任务状态”和锁定逻辑抽象为一个 composable 或 store（如 useKnowledgeBaseStore）：
          - 统一维护 healthOk、taskListStatus、localMutating、kbBusy。
          - 对外提供 withKbMutation(fn) 这样的包装方法，内部自动设置/清理 localMutating。
      - 这样无论是 Sidebar 按钮、右侧表格、上传弹窗，统一从 store 读取 kbBusy 作为禁用条件，避免散落多处逻辑。
      - 设计上与现有 test_rag.html 的写法兼容（Composition API + ref/computed），只是在实际项目中拆分文件/组件
        即可。
  - 后端架构：
      - 现有 FastAPI + 任务队列 + SQLite 状态管理结构已经支持：
          - 异步任务（构建、追加）状态查询。
          - 全局任务列表 /tasks/task_list 用于“后台是否有任务”的判断。
      - 新增需求只是在前端利用这套状态信息做“全局锁定”，不需要额外后端改动。
      - 如果未来有多个知识库或多租户：
          - 按需在任务中加入“知识库ID/租户ID”，前端传递上下文即可；锁定策略可以细化为“只锁当前知识库”。

  3. 可维护性与扩展性

  - 将“锁定逻辑”集中在少数状态变量与一个 computed kbBusy 上，后续增加新按钮、新写接口时，只要遵守：
      - 写操作 → 使用 withKbMutation 包裹。
      - 按钮 → :disabled="kbBusy"。
        就可以自动纳入统一管控，维护成本低。
  - 若未来需要重新开放检索功能：
      - 直接在当前架构下新加一个 Tab 并使用 /rerank 即可，不影响现有增删逻辑和锁定方案。

  ———
  - 从架构看，前端通过集中状态管理实现统一锁定；后端无需结构性改造，只是更充分地利用已有任务状态接口，可行性和
    扩展性都较好