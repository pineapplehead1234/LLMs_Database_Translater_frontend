import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';

type ThemeMode = 'system' | 'light' | 'dark' | 'paper';  // 用户选择的模式
type Theme = 'light' | 'dark' | 'paper';

function readInitialMode(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('app-theme-mode') as ThemeMode | null;
    if (saved === 'system' || saved === 'light' || saved === 'dark' || saved === 'paper') {
        return saved;
    }
    // 如果没有保存，就用系统偏好决定初始模式：
    // 比如：系统暗色 -> 默认走 system（暗），否则 light
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'system' : 'light';
}
export const useThemeStore = defineStore('theme', () => {
    const mode = ref<ThemeMode>(readInitialMode());
    const theme = ref<Theme>(resolveTheme(mode.value));

    function applyThemeToDom(nextTheme: Theme) {
        if (typeof document !== 'undefined') {
            setTheme(theme.value)
        }
        document.documentElement.setAttribute('data-theme', nextTheme);
        document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    }

    function setMode(nextMode: ThemeMode) {
        mode.value = nextMode;                 // 1. 更新模式
        const nextTheme = resolveTheme(nextMode);
        theme.value = nextTheme;               // 2. 更新实际主题
        applyThemeToDom(nextTheme);            // 3. 写入 DOM
        localStorage.setItem('app-theme-mode', nextMode);   // 4. 只持久化模式
    }

    function toggleMode() {
        const order: ThemeMode[] = ['system', 'light', 'dark', 'paper'];
        const idx = order.indexOf(mode.value);
        const next = order[(idx + 1) % order.length] ?? 'light';
        setMode(next);
    }
    function getSystemTheme(): Theme {
        if (typeof window === 'undefined') return 'light';
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }

    function resolveTheme(mode: ThemeMode): Theme {
        if (mode === 'system') {
            return getSystemTheme();
        }
        // mode 是 'light' | 'dark' | 'paper' 时，直接当成主题用
        return mode;
    }
    // 初次创建 store 时同步一次 DOM
    if (typeof document !== 'undefined') {
        setTheme(theme.value)
    }

    return { theme, setTheme, toggleTheme }
})