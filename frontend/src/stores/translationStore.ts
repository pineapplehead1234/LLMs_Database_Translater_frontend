import { defineStore } from "pinia";
import { ref } from "vue";


interface TermAnnotation{
  term:string
  translation:string
}
interface FileData {
  task_id : string;
  status: string;
  error:string | null;
  original_markdown: Record<string, string>;
  translated_markdown: Record<string, string>;
  term_annotations: Record<string,TermAnnotation[]>
  client_request_id: string;
}

interface FileTreeNode{
  id:string;
  type: "folder" | "file";
  parent_id:string | null ;
  children?:FileTreeNode[];
  task_id?:string;
  client_request_id?: string;
  name:string
}

interface OpenTab{
  task_id:string;
  title:string; 
  docType:"md"|"pdf"|"docx"
}

export const useTranslationStore = defineStore("translation", () => {
  const currentFile = ref<FileData | null>(null);
  const status = ref<"pending" | "processing" | "success" | "error">("pending");
  const fileTree = ref<FileTreeNode[]>([
    {
      id: "root",
      type:"folder",
      parent_id:null,
      name:"根目录",
      children:[]
    }
  ])
  const openTabs = ref<OpenTab[]>([]);
  const activeTaskId = ref<string | null>(null);
  function setCurrentFile(data: FileData) {
    currentFile.value = data;
    status.value = "success";
  }

  return {
    currentFile,
    status,
    setCurrentFile,
    fileTree, 
    openTabs,
    activeTaskId,
  };
});
