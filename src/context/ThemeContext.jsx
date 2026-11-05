import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();
const THEME_STORAGE_KEY = 'theme-mode';

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
    return ['system', 'light', 'dark'].includes(savedMode) ? savedMode : 'system';
  });
  const [systemPrefersLight, setSystemPrefersLight] = useState(
    () => window.matchMedia('(prefers-color-scheme: light)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (event) => setSystemPrefersLight(event.matches);

    setSystemPrefersLight(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const tema = themeMode === 'system' ? systemPrefersLight : themeMode === 'light';
  const toggleTema = () => {
    setThemeMode((currentMode) => (
      currentMode === 'system' ? 'light' : currentMode === 'light' ? 'dark' : 'system'
    ));
  };

  const value = {
    tema,
    themeMode,
    toggleTema
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
      throw new Error('useTheme debe usarse dentro de un ThemeProvider');
    }
    return context;
  }

  ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
  };
  