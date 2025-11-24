import { defineStore } from "pinia";
import { ref } from "vue";
import { loadTaskResult, saveTaskResult, saveFileTree, loadFileTree } from "@/utils/taskCache";
import { prepareTaskImages } from "@/utils/imageCache";
import type { TaskResultData, FileTreeNodeData } from "@/utils/taskCache";

interface TermAnnotation {
  term: string;
  translation: string;
}
interface FileData {
  task_id: string;
  status: string;
  error: string | null;
  original_markdown: Record<string, string>;
  translated_markdown: Record<string, string>;
  term_annotations: Record<string, TermAnnotation[]>;
  client_request_id: string;
}

export type FileTreeNode = FileTreeNodeData;

interface OpenTab {
  task_id: string;
  title: string;
  docType: "md" | "pdf" | "docx";
}

export const useTranslationStore = defineStore("translation", () => {
  const currentFile = ref<FileData | null>(null);
  const status = ref<"pending" | "processing" | "success" | "error">("pending");
  const fileTree = ref<FileTreeNode[]>([
    {
      id: "root",
      type: "folder",
      parent_id: null,
      name: "根目录",
      children: [

      ],
    },
  ]);
  const openTabs = ref<OpenTab[]>([]);
  const activeTaskId = ref<string | null>(null);

  function openTab(options: { task_id: string; title: string; docType: "md" | "pdf" | "docx" }) {
    const exists = openTabs.value.find((tab) => tab.task_id === options.task_id);
    if (!exists) {
      openTabs.value.push({
        task_id: options.task_id,
        title: options.title,
        docType: options.docType,
      });
    }
    activeTaskId.value = options.task_id;
  }
  function closeTab(taskId: string) {
    const index = openTabs.value.findIndex((tab => tab.task_id === taskId));
    if (index === -1) {
      return;
    }
    openTabs.value.splice(index, 1);

    if (activeTaskId.value === taskId) {
      const next = openTabs.value[index] || openTabs.value[index - 1] || null;
      if (next) {
        activeTaskId.value = next.task_id;
        loadTaskFromCache(next.task_id);
      }
      else {
        activeTaskId.value = null;
        currentFile.value = null;
        status.value = "pending";
      }
    }
  }
  function setCurrentFile(data: FileData) {
    currentFile.value = data;
    status.value = "success";
  }

  async function handleTaskSuccess(
    data: TaskResultData,
    option: { parent_id: string | null; docType: "md" | "pdf" | "docx" }
  ) {
    const fileData: FileData = {
      task_id: data.task_id,
      status: data.status,
      error: data.error,
      original_markdown: data.original_markdown,
      translated_markdown: data.translated_markdown,
      term_annotations: data.term_annotations,
      client_request_id: data.client_request_id,
    };

    try {
      await saveTaskResult(data.task_id, data);
    } catch (e) {
      console.error("写入任务结果缓存失败", e);
    }

    setCurrentFile(fileData);
    activeTaskId.value = data.task_id;

    const parentId = option.parent_id ?? "root";
    const docType = option.docType;

    addFileNode({
      task_id: fileData.task_id,
      client_request_id: fileData.client_request_id,
      docType,
      parent_id: parentId,
    });
    openTab({
      task_id: fileData.task_id,
      title: fileData.client_request_id,
      docType,
    })
  }

  async function initFileTreeFromCache() {
    try {
      const cached = await loadFileTree();
      if (cached && cached.length > 0) {
        fileTree.value = cached as FileTreeNode[];
      }
    } catch (e) {
      console.error("加载文件树缓存失败", e);
    }
  }

  async function persistFileTree() {
    try {
      const serializableTree = JSON.parse(JSON.stringify(fileTree.value)) as FileTreeNode[];
      await saveFileTree(serializableTree);
    } catch (e) {
      console.error("保存文件树缓存失败", e);
    }
  }

  async function loadTaskFromCache(taskId: string): Promise<boolean> {
    const cached = await loadTaskResult(taskId);
    if (!cached) {
      return false;
    }

    // 为从缓存打开的任务准备图片资源：
    // 重新下载 / 解压该 task 的图片 zip，并填充内存缓存，
    // 这样 OriginalPanel / TranslationPanel 在同步渲染 markdown 时就能命中 getCachedImageUrl。
    try {
      await prepareTaskImages(taskId);
    } catch (e) {
      console.error("准备任务图片失败", e);
    }

    setCurrentFile(cached as FileData);

    activeTaskId.value = taskId;

    return true;
  }

  function findNodeById(nodes: FileTreeNode[], id: string): FileTreeNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  function findFileNodeByName(parentId: string, name: string): FileTreeNode | null {
    // 1. 先找到父节点
    let parentNode = findNodeById(fileTree.value, parentId);
    if (!parentNode || parentNode.type !== "folder") {
      // 按你现在的约定，不合法就挂到 root
      parentNode = fileTree.value[0] ?? null;
    }
    if (!parentNode || !parentNode.children) return null;

    // 2. 在 children 里找同名 file 节点
    const target = parentNode.children.find(
      (child) => child.type === "file" && child.name === name
    );
    return target ?? null;
  }

  function addFileNode(params: {
    task_id: string;
    client_request_id: string;
    docType: "md" | "pdf" | "docx";
    parent_id: string | null;
  }) {
    const parentId = params.parent_id ?? "root";

    // 1. 找到父节点（folder）
    const root = fileTree.value[0];
    let parentNode = findNodeById(fileTree.value, parentId);

    // 2. 找不到，或者不是 folder，就挂到 root
    if (!parentNode || parentNode.type !== "folder") {
      parentNode = root ?? null;
    }

    if (!parentNode) {
      return;
    }

    // 3. 确保 children 存在
    if (!parentNode.children) {
      parentNode.children = [];
    }

    // 4. 先判断有没有同名文件（覆盖逻辑）
    const existing = findFileNodeByName(parentNode.id, params.client_request_id);

    if (existing) {
      // ✅ 覆盖：更新已有节点的信息
      const oldTaskId = existing.task_id;

      existing.task_id = params.task_id;
      existing.client_request_id = params.client_request_id;
      existing.name = params.client_request_id;
      existing.docType = params.docType;

      // 可选：这里可以顺便处理 openTabs / activeTaskId（下面说）
      // 例如：如果旧的 taskId 有 tab，就关闭它 / 或更新到新的 taskId

    } else {
      // ✅ 新增：没有同名，就 push 新节点（沿用你现在这一段）
      parentNode.children.push({
        id: params.task_id,
        type: "file",
        parent_id: parentNode.id,
        name: params.client_request_id,
        task_id: params.task_id,
        client_request_id: params.client_request_id,
        docType: params.docType,
      });
    }

    persistFileTree();
  }
  function addFolderNode(params: { parent_id: string | null; name: string }) {
    const parentId = params.parent_id ?? "root";

    const root = fileTree.value[0];
    let parentNode = findNodeById(fileTree.value, parentId);

    if (!parentNode || parentNode.type !== "folder") {
      parentNode = root ?? null;
    }
    if (!parentNode) {
      return;
    }


    // 4. 确保 children 存在
    if (!parentNode.children) {
      parentNode.children = [];
    }

    // 5. 插入一个新的 folder 节点
    parentNode.children.push({
      id: crypto.randomUUID(), // 生成一个唯一 id
      type: "folder",
      parent_id: parentNode.id,
      name: params.name,
      children: [],
    });

    persistFileTree();
  }
  function deleteNode(id: string) {
    if (id === "root") {
      return;
    }

    function removeFrom(nodes: FileTreeNode[]): boolean {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (!node) {
          continue;
        }
        if (node.id === id) {
          nodes.splice(i, 1);
          return true;
        }

        if (node?.children && node.children.length > 0) {
          const removed = removeFrom(node.children);
          if (removed) {
            return true;
          }
        }
      }
      return false;
    }
    removeFrom(fileTree.value);
    persistFileTree();
  }

  function renameNode(id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    const target = findNodeById(fileTree.value, id);
    if (!target || target.id === "root") return;

    target.name = trimmed;
    persistFileTree();
  }

  return {
    currentFile,
    status,
    setCurrentFile,
    fileTree,
    openTabs,
    activeTaskId,
    handleTaskSuccess,
    initFileTreeFromCache,
    loadTaskFromCache,
    findNodeById,
    addFileNode,
    addFolderNode,
    deleteNode,
    renameNode,
    openTab,
    closeTab,
  };
});
