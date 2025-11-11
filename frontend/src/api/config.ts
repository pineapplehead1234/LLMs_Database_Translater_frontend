// src/api/config.ts

// 从环境变量读取配置
const isDev = import.meta.env.DEV
const useMock = import.meta.env.VITE_USE_MOCK === 'true'

// Mock 服务地址（本地 Mock）- 必须包含完整的基础 URL
const MOCK_BASE_URL = import.meta.env.VITE_MOCK_BASE_URL || 'http://127.0.0.1:4523/m1/7373604-7105599-6509159'
// 真实后端地址（使用代理路径）
const REAL_BASE_URL = '/apiA'

// 根据配置选择基础 URL
export const BASE_URL = useMock ? MOCK_BASE_URL : REAL_BASE_URL

// 是否使用 Mock（用于代码中判断）
export const IS_MOCK = useMock

// API 端点
export const API_ENDPOINTS = {
  UPLOAD: `${BASE_URL}/api/task/upload`,
  QUERY: `${BASE_URL}/api/task/query`,
  DOWNLOAD_IMAGES: `${BASE_URL}/api/task/download/images`,
  CONFIG: `${BASE_URL}/api/task/config`,
  GET_CONFIG: `${BASE_URL}/api/config`,
} as const

// 开发环境日志
if (isDev) {
  console.log(`🚀 API Config:`)
  console.log(`   Mode: ${useMock ? '📡 MOCK' : '🔌 REAL'}`)
  console.log(`   Base URL: ${BASE_URL}`)
  console.log(`   Upload: ${API_ENDPOINTS.UPLOAD}`)
  console.log(`   Query: ${API_ENDPOINTS.QUERY}`)
}