import { createContext, useContext, useState, /* useEffect */ } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(true);

  const toggleTema = () => {
    setTema(prevTema => !prevTema);
    console.log('Tema cambiado a:', !tema); // Para debugging
  };

  /*   // Inicializar el tema basado en la preferencia del sistema
  const [tema, setTema] = useState(() => {
    // Retorna true si el tema del sistema es claro
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    // Escuchar cambios en el tema del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleChange = (e) => {
      setTema(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Limpieza del listener
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTema = () => {
    setTema(prevTema => !prevTema);
    console.log('Tema cambiado a:', !tema);
  }; */

  const value = {
    tema,
    setTema,
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
  