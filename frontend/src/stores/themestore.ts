import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';

type Theme = 'light' | 'dark';

function readInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('app-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    // 没有保存时按系统偏好走一遍
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
}
export const useThemeStore = defineStore('theme', () => {
    const theme = ref<Theme>(readInitialTheme())

    function setTheme(next: Theme) {
        theme.value = next
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', next)
            // 如果你想配合 Element Plus 暗色主题，可以顺便加上这一行：
            document.documentElement.classList.toggle('dark', next === 'dark')
        }
        localStorage.setItem('app-theme', next)
    }

    function toggleTheme() {
        setTheme(theme.value === 'light' ? 'dark' : 'light')
    }

    // 初次创建 store 时同步一次 DOM
    if (typeof document !== 'undefined') {
        setTheme(theme.value)
    }

    return { theme, setTheme, toggleTheme }
})