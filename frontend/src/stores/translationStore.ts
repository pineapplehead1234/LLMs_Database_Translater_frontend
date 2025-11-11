import { defineStore } from "pinia";
import { ref } from "vue";

interface FileData {
  fileId: string;
  originalMarkdown: Record<string, string>;
  translatedMarkdown: Record<string, string>;
  termAnnotations: string[]; //暂时用any
}

export const useTranslationStore = defineStore("translation", () => {
  const currentFile = ref<FileData | null>(null);
  const status = ref<"idle" | "uploading" | "processing" | "completed" | "error">("idle");

  function setCurrentFile(data: FileData) {
    currentFile.value = data;
    status.value = "completed";
  }

  function clearCurrentFile() {
    currentFile.value = null;
    status.value = "idle";
  }
  return {
    currentFile,
    status,
    setCurrentFile,
    clearCurrentFile,
  };
});
