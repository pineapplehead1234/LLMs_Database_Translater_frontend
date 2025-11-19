import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface TaskResultData {
  task_id: string;
  status: string;
  error: string | null;
  original_markdown: Record<string, string>;
  translated_markdown: Record<string, string>;
  term_annotations: Record<string, { term: string; translation: string }[]>;
  client_request_id: string;
}

export type DocumentType = "md" | "pdf" | "docx";

export type FileTreeNodeData =
  | FolderNodeData
  | FileNodeData;

export interface BaseNodeData {
  id: string;
  name: string;
  parent_id: string | null;
  type: "folder" | "file";
  children?: FileTreeNodeData[];
}

export interface FolderNodeData extends BaseNodeData {
  type: "folder";
  children: FileTreeNodeData[];
}

export interface FileNodeData extends BaseNodeData {
  type: "file";
  task_id: string;
  client_request_id: string;
  docType: DocumentType;
  children?: undefined;
}

interface CacheDB extends DBSchema {
  tasks: {
    key: string;
    value: TaskResultData;
  };
  fileTree: {
    key: string;
    value: FileTreeNodeData[];
  };
}

const DB_NAME = "translation-cache";
const DB_VERSION = 1;
const FILE_TREE_KEY = "tree";

let dbPromise: Promise<IDBPDatabase<CacheDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<CacheDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("tasks")) {
          db.createObjectStore("tasks", { keyPath: "task_id" });
        }
        if (!db.objectStoreNames.contains("fileTree")) {
          db.createObjectStore("fileTree");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveTaskResult(taskId: string, data: TaskResultData) {
  const db = await getDb();
  await db.put("tasks", { ...data, task_id: taskId });
}

export async function loadTaskResult(taskId: string) {
  const db = await getDb();
  return db.get("tasks", taskId);
}

export async function saveFileTree(tree: FileTreeNodeData[]) {
  const db = await getDb();
  await db.put("fileTree", tree, FILE_TREE_KEY);
}

export async function loadFileTree() {
  const db = await getDb();
  return db.get("fileTree", FILE_TREE_KEY);
}
