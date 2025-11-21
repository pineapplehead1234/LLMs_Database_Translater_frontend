import JSZip from "jszip";
import { API_ENDPOINTS, IS_MOCK } from "@/api/config";
import { saveImageBlob, loadImageBlob } from "./taskCache";
import imagesZipUrl from "@/mock/images.zip?url";

//内存缓存: key 为taskId + "::" + path,value为blob: 开头的图片url
const memoryUrlCache = new Map<string, string>();

// 记录哪些taskId已经从ZIP解压并准备过图片了,避免重复解压
const prepareTaskIds = new Set<string>();

// 记录正在准备中的 taskId, 避免并发重复请求
const preparingTasks = new Map<string, Promise<void>>();

//生成内存缓存用的key
function getCacheKey(taskId: string, path: string): string {
    return `${taskId}::${path}`;

}

// 同步从内存缓存种获取某张图片的url,如果没有就返回undefined
export function getCachedImageUrl(taskId: string, path: string): string | undefined {
    const key = getCacheKey(taskId, path);
    const value = memoryUrlCache.get(key);
    console.log("[getCachedImageUrl]", { taskId, path, key, value });
    return value;
}

// 从 IndexedDB 读取图片 Blob, 如果有则生成并缓存 blob: URL
async function getOrCreateUrlFromDB(taskId: string, path: string): Promise<string | undefined> {
    const cacheKey = getCacheKey(taskId, path);

    const cached = memoryUrlCache.get(cacheKey);
    if (cached) {
        return cached;
    }

    const blob = await loadImageBlob(taskId, path);
    if (!blob) {
        return undefined;
    }

    const url = URL.createObjectURL(blob);
    memoryUrlCache.set(cacheKey, url);
    return url;
}

// 通用的 ZIP 解压 + 写入 IndexedDB + 内存 URL 缓存
async function prepareImagesFromZipBlob(taskId: string, zipBlob: Blob): Promise<void> {
    const zip = await JSZip.loadAsync(zipBlob);
    const files = Object.values(zip.files);

    for (const entry of files) {
        if (entry.dir) {
            continue;
        }

        const entryName = entry.name;
        const imagePath = entryName;
        // ★ 新增：看解压出来的路径和最终 key
        const cachekey = getCacheKey(taskId, imagePath);
        console.log("[zip] store image", { taskId, entryName, imagePath, cachekey });

        const blob = await entry.async("blob");

        await saveImageBlob(taskId, imagePath, blob);

        const url = URL.createObjectURL(blob);
        const cacheKey = getCacheKey(taskId, imagePath);
        memoryUrlCache.set(cacheKey, url);
    }
}

//开发期专用,从本地images.zip解压出图片,为某个taskId准备图片Blob + URL
async function prepareImagesFromLocalZip(taskId: string): Promise<void> {
    //已经准备过了就直接返回
    if (prepareTaskIds.has(taskId)) {
        return;
    }
    //下载并解压
    const response = await fetch(imagesZipUrl);
    if (!response.ok) {
        console.error("无法下载图片zip文件:", response.statusText);
        return;
    }

    const zipBlob = await response.blob();

    await prepareImagesFromZipBlob(taskId, zipBlob);
}

// 真实环境: 通过后端 /api/task/download/images?task_id=... 下载 ZIP 再解压
async function prepareImagesFromApi(taskId: string): Promise<void> {
    const url = `${API_ENDPOINTS.DOWNLOAD_IMAGES}?task_id=${encodeURIComponent(taskId)}`;
    const response = await fetch(url);
    if (!response.ok) {
        console.error("无法下载任务图片 zip 文件:", response.statusText);
        return;
    }

    const zipBlob = await response.blob();
    await prepareImagesFromZipBlob(taskId, zipBlob);
}

// 对外统一入口: 根据环境准备某个 taskId 的所有图片
export async function prepareTaskImages(taskId: string): Promise<void> {
    if (prepareTaskIds.has(taskId)) {
        return;
    }

    const existing = preparingTasks.get(taskId);
    if (existing) {
        return existing;
    }

    const promise = (async () => {
        try {
            if (IS_MOCK) {
                await prepareImagesFromLocalZip(taskId);
            } else {
                await prepareImagesFromApi(taskId);
            }
            prepareTaskIds.add(taskId);
        } finally {
            preparingTasks.delete(taskId);
        }
    })();

    preparingTasks.set(taskId, promise);
    return promise;
}

// 对外异步获取某张图片的 URL:
// 1) 先查内存缓存
// 2) 查 IndexedDB
// 3) 如没有图片, 尝试 prepareTaskImages 再查一次
export async function getOrLoadImageUrl(taskId: string, path: string): Promise<string | undefined> {
    const fromMemory = getCachedImageUrl(taskId, path);
    if (fromMemory) {
        return fromMemory;
    }

    const fromDB = await getOrCreateUrlFromDB(taskId, path);
    if (fromDB) {
        return fromDB;
    }

    await prepareTaskImages(taskId);
    return getOrCreateUrlFromDB(taskId, path);
}
