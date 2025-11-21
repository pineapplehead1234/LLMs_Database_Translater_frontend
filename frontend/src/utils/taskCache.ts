

export type TaskResultData = {
  task_id: string;
  status: string;
  error: string | null;
  client_request_id: string;
  original_markdown: Record<string, string>;
  translated_markdown: Record<string, string>;
  term_annotations: Record<string, TermAnnotation[]>;
};

type TermAnnotation = {
  term: string
  translation: string
}

//文件树
export type FileTreeNodeData = {
  id: string;
  type: "folder" | "file";
  parent_id: string | null;
  children?: FileTreeNodeData[];
  task_id?: string;
  client_request_id?: string;
  name: string;
  docType?: "md" | "pdf" | "docx";
}

const DB_NAME = "llm-translator-db"; //数据库名字
const DB_VERSION = 2; //版本号,用于升级
const TASK_STORE = "tasks"; //表(objectstore)的名字
const FILE_TREE_KEY = "tree";
const IMAGE_STORE = "images";

//创建indexdb数据库的工具函数
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    // 数据库第一次创建,或者版本号升级时调用
    request.onupgradeneeded = () => {
      const db = request.result;
      // 如果还没有名为task的表就创建一个

      if (!db.objectStoreNames.contains(TASK_STORE)) {
        db.createObjectStore(TASK_STORE, { keyPath: "key" });
      }

      //新增images这个表
      if (!db.objectStoreNames.contains(IMAGE_STORE)) {
        db.createObjectStore(IMAGE_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

// 根据task_id 生产逻辑key
function getTaskKey(taskId: string): string {
  return `task:${taskId}`;
}

// 为图片生成key:image:{taskId}:{path}
function getImageKey(taskId: string, path: string): string {
  return `image:${taskId}:${path}`;
}

export async function saveTaskResult(taskId: string, data: TaskResultData): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASK_STORE, "readwrite");
    const store = tx.objectStore(TASK_STORE);

    store.put({ key: getTaskKey(taskId), value: data });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// 从IndexedDB读取任务结果
export async function loadTaskResult(taskId: string): Promise<TaskResultData | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASK_STORE, "readonly");
    const store = tx.objectStore(TASK_STORE);
    const req = store.get(getTaskKey(taskId));

    req.onsuccess = () => {
      const record = req.result as {
        key: string;
        value: TaskResultData;
      };
      resolve(record ? record.value : null);
    };

    req.onerror = () => reject(req.error);
  });
}

//保存文件树
export async function saveFileTree(tree: FileTreeNodeData[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASK_STORE, "readwrite");
    const store = tx.objectStore(TASK_STORE);

    store.put({ key: FILE_TREE_KEY, value: tree });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

//加载文件树
export async function loadFileTree(): Promise<FileTreeNodeData[] | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TASK_STORE, "readonly");
    const store = tx.objectStore(TASK_STORE);
    const req = store.get(FILE_TREE_KEY);

    req.onsuccess = () => {
      const record = req.result as {
        key: string;
        value: FileTreeNodeData[];
      };
      resolve(record ? record.value : null);
    };

    req.onerror = () => reject(req.error);
  })
}

export async function saveImageBlob(taskId: string, path: string, blob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readwrite")
    const store = tx.objectStore(IMAGE_STORE);

    store.put({ key: getImageKey(taskId, path), value: blob });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  })

}

export async function loadImageBlob(taskId: string, path: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readonly"); // 在 images 表上开启只读事务
    const store = tx.objectStore(IMAGE_STORE);          // 拿到 images 表
    const req = store.get(getImageKey(taskId, path));  // 根据 key 取出记录

    req.onsuccess = () => {
      const record = req.result as { key: string; value: Blob } | undefined;
      resolve(record ? record.value : null);             // 有记录就返回 blob,否则返回 null
    };

    req.onerror = () => reject(req.error);              // 出错时 reject
  });
}