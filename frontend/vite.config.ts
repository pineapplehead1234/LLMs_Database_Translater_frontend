import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'


import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const BACKEND_A = env.VITE_BACKEND_A || 'http://127.0.0.1:8000'
  const BACKEND_B = env.VITE_BACKEND_B || 'http://127.0.0.1:9000'

  return {
    plugins: [vue(),
       vueDevTools(),
      AutoImport({
        resolvers: [ElementPlusResolver({ importStyle: 'css', directives: true })],
      }),
      Components({
        // 自动按需注册 Element Plus 组件（<el-button/> 等），并自动引入对应 CSS
        resolvers: [ElementPlusResolver({ importStyle: 'css', directives: true })],
      }),],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      host: '127.0.0.1',
      port: 5174,
      strictPort: true,
      proxy: {
        '/apiA': { target: BACKEND_A, changeOrigin: true, rewrite: p => p.replace(/^\/apiA/, '') },
        '/apiB': { target: BACKEND_B, changeOrigin: true, rewrite: p => p.replace(/^\/apiB/, '') },
      },
    },
  }
})