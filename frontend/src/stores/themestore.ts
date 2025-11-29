import { defineStore } from 'pinia';
import { ref } from 'vue';

type ThemeMode = 'light' | 'dark' | 'paper'; // 用户选择的模式
type Theme = 'light' | 'dark' | 'paper';

// function getSystemTheme(): Theme {
//   if (typeof window === 'undefined') return 'light';
//   const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
//   return prefersDark ? 'dark' : 'light';
// }

function resolveTheme(mode: ThemeMode): Theme {

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
  if (saved === 'light' || saved === 'dark' || saved === 'paper') {
    return saved;
  }

  return 'light';
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
    const order: ThemeMode[] = ['light', 'dark', 'paper'];
    const idx = order.indexOf(mode.value);
    const next = order[(idx + 1) % order.length] ?? 'light';
    setTheme(next);
  }

  // 初次创建 store 时同步一次 DOM
  applyThemeToDom(theme.value);

  return { mode, theme, setTheme, toggleTheme };
});
