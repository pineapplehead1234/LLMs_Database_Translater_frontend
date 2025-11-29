import { defineStore } from 'pinia';
import { ref } from 'vue';

type ThemeMode = 'system' | 'light' | 'dark' | 'paper'; // 用户选择的模式
type Theme = 'light' | 'dark' | 'paper';

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

function applyThemeToDom(nextTheme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', nextTheme);
  document.documentElement.classList.toggle('dark', nextTheme === 'dark');
}

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

  function setTheme(nextMode: ThemeMode) {
    mode.value = nextMode;
    const nextTheme = resolveTheme(nextMode);
    theme.value = nextTheme;
    applyThemeToDom(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme-mode', nextMode);
    }
  }

  function toggleTheme() {
    const order: ThemeMode[] = ['system', 'light', 'dark', 'paper'];
    const idx = order.indexOf(mode.value);
    const next = order[(idx + 1) % order.length] ?? 'light';
    setTheme(next);
  }

  // 初次创建 store 时同步一次 DOM
  applyThemeToDom(theme.value);

  return { mode, theme, setTheme, toggleTheme };
});
