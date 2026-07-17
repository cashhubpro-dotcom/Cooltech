import { useEffect, useState } from 'react';

const KEY = 'cooltech-theme';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(KEY) === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem(KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  return [isDark, setIsDark];
}