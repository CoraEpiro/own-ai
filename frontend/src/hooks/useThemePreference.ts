import { useEffect, useState } from 'react';

const readThemePreference = () => {
  if (typeof document === 'undefined') {
    return true;
  }

  return document.documentElement.classList.contains('dark');
};

const applyThemePreference = (isDark: boolean) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

const useThemePreference = () => {
  const [isDark, setIsDark] = useState(readThemePreference);

  useEffect(() => {
    applyThemePreference(isDark);
  }, [isDark]);

  return {
    isDark,
    setIsDark,
    toggleTheme: () => setIsDark((current) => !current),
  };
};

export default useThemePreference;
