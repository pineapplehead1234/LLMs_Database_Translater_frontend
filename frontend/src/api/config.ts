// src/api/config.ts

const isDev = import.meta.env.DEV
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// 翻译
const TRANSLATE_MOCK_BASE_URL = import.meta.env.VITE_MOCK_BASE_URL_TRANSLATE
const TRANSLATE_REAL_BASE_URL = '/apiA'
const BASE_URL = useMock ? TRANSLATE_MOCK_BASE_URL : TRANSLATE_REAL_BASE_URL

// RAG
const RAG_MOCK_BASE_URL = import.meta.env.VITE_MOCK_BASE_URL_RAG
const RAG_REAL_BASE_URL = '/rag'
const RAG_BASE_URL = useMock ? RAG_MOCK_BASE_URL : RAG_REAL_BASE_URL

export const IS_MOCK = useMock

// 翻译相关 API 端点
export const API_ENDPOINTS = {
  UPLOAD: `${BASE_URL}/api/task/upload`,
  QUERY: `${BASE_URL}/api/task/query`,
  DOWNLOAD_IMAGES: `${BASE_URL}/api/task/download/images`,
  CONFIG: `${BASE_URL}/api/task/config`,
  GET_CONFIG: `${BASE_URL}/api/config`,
} as const

// 知识库 / RAG 相关 API 端点
export const RAG_ENDPOINTS = {
  HEALTH: `${RAG_BASE_URL}/health`,
  RERANK: `${RAG_BASE_URL}/rerank`,
  INDEX: `${RAG_BASE_URL}/index`,
  DESTROY: `${RAG_BASE_URL}/destroy`,
  DELETE: `${RAG_BASE_URL}/delete`,
  TASKS_BUILD: `${RAG_BASE_URL}/tasks/build`,
  TASKS_ADD: `${RAG_BASE_URL}/tasks/add`,
  TASK_STATUS: `${RAG_BASE_URL}/tasks/id`,
  TASK_LIST: `${RAG_BASE_URL}/tasks/task_list`,
  FILES: `${RAG_BASE_URL}/statistic`
} as const

// 开发环境日志
if (isDev) {
  console.log(`🚀 API Config:`)
  console.log(`   Mode: ${useMock ? '📡 MOCK' : '🔌 REAL'}`)
  console.log(`   Base URL: ${BASE_URL}`)
  console.log(`   Upload: ${API_ENDPOINTS.UPLOAD}`)
  console.log(`   Query: ${API_ENDPOINTS.QUERY}`)
}
