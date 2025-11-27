import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  // 是否使用 Mock
  const useMock = env.VITE_USE_MOCK === 'true'


  // 根据配置选择目标地址
  const BACKEND_TAN = useMock ? env.VITE_MOCK_BASE_URL_TRANSLATE : env.VITE_BACKEND
  const BACKEND_RAG = useMock ? env.VITE_MOCK_BASE_URL_RAG : env.VITE_BACKEND

  // 开发环境日志
  if (mode === 'development') {
    console.log(`\n🚀 API Mode: ${useMock ? '📡 MOCK (本地)' : '🔌 REAL (真实接口)'}`)
    console.log(`📍 Backend URL: ${env.VITE_BACKEND}\n`)
  }

  return {
    plugins: [
      vue(),
      vueDevTools(),
      AutoImport({
        resolvers: [ElementPlusResolver({ importStyle: 'css', directives: true })],
      }),
      Components({
        resolvers: [ElementPlusResolver({ importStyle: 'css', directives: true })],
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      proxy: {
        '/apiA': {
          target: BACKEND_TAN,
          changeOrigin: true,
          rewrite: p => p.replace(/^\/apiA/, '')
        },
        '/rag': {
          target: BACKEND_RAG,
          changeOrigin: true,
          rewrite: p => p.replace(/^\/rag/, '')
        },
      },
    },
  }
})