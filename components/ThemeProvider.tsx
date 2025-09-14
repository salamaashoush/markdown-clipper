import { createContext, useContext, createSignal, createEffect, JSX, onMount } from 'solid-js';
import { storage } from '~/services/storage';
import { Theme } from '~/types/storage';

interface ThemeContextValue {
  theme: () => Theme;
  resolvedTheme: () => 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>();

export function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setThemeState] = createSignal<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = createSignal<'light' | 'dark'>('light');

  // Load theme from storage
  onMount(async () => {
    const preferences = await storage.getPreferences();
    setThemeState(preferences.theme || 'system');
  });

  // Resolve the actual theme based on system preference
  createEffect(() => {
    const currentTheme = theme();

    // Normalize theme to lowercase for comparison
    const normalizedTheme = currentTheme.toLowerCase();

    if (normalizedTheme === 'system') {
      // Check system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedTheme(isDark ? 'dark' : 'light');
    } else if (normalizedTheme === 'dark') {
      setResolvedTheme('dark');
    } else if (normalizedTheme === 'light') {
      setResolvedTheme('light');
    } else {
      // Default to light if unknown
      setResolvedTheme('light');
    }
  });

  // Apply theme class to document
  createEffect(() => {
    const resolved = resolvedTheme();

    // For Tailwind CSS 4, we only need to toggle the dark class on documentElement
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Also set data-theme attribute for reference
    document.documentElement.setAttribute('data-theme', resolved);
  });

  // Listen for system theme changes
  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme().toLowerCase() === 'system') {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    // Also listen for storage changes to sync across tabs/pages
    const handleStorageChange = async (changes: any, area: string) => {
      if (area === 'sync' && changes.preferences) {
        const preferences = await storage.getPreferences();
        setThemeState(preferences.theme);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      browser.storage.onChanged.removeListener(handleStorageChange);
    };
  });

  const setTheme = async (newTheme: Theme) => {
    // Normalize to lowercase
    const normalizedTheme = newTheme.toLowerCase() as Theme;
    setThemeState(normalizedTheme);

    // Save to storage
    const preferences = await storage.getPreferences();
    await storage.savePreferences({
      ...preferences,
      theme: normalizedTheme,
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
