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
  
  // Mock 服务地址（本地 Mock）
  const MOCK_BASE_URL = env.VITE_MOCK_BASE_URL || 'http://127.0.0.1:4523/m1/7404747-7137418-6550118'
  
  // 真实后端地址
  const REAL_BACKEND_A = env.VITE_BACKEND_A || 'http://127.0.0.1:8000'
  
  // 根据配置选择目标地址
  const BACKEND_A = useMock ? MOCK_BASE_URL : REAL_BACKEND_A
  const BACKEND_B = env.VITE_BACKEND_B || 'http://127.0.0.1:9000'

  // 开发环境日志
  if (mode === 'development') {
    console.log(`\n🚀 API Mode: ${useMock ? '📡 MOCK (本地)' : '🔌 REAL (真实接口)'}`)
    console.log(`📍 Backend URL: ${BACKEND_A}\n`)
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
          target: BACKEND_A, 
          changeOrigin: true, 
          rewrite: p => p.replace(/^\/apiA/, '') 
        },
        '/apiB': { 
          target: BACKEND_B, 
          changeOrigin: true, 
          rewrite: p => p.replace(/^\/apiB/, '') 
        },
      },
    },
  }
})