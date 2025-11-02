import { fileURLToPath, URL } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import rawViteConfig from './vite.config'

// 如果 vite.config.ts 是函数导出（defineConfig(({ mode }) => ({ ... }))），先执行得到对象
const viteConfig =
  typeof rawViteConfig === 'function'
    ? rawViteConfig({ mode: 'test', command: 'serve' }) // 用 test 模式，命令随意选 serve 即可
    : rawViteConfig

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
    },
  }),
)