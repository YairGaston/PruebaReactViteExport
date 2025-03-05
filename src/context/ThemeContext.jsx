import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(true);

  const toggleTema = () => {
    setTema(prevTema => !prevTema);
    console.log('Tema cambiado a:', !tema); // Para debugging
  };

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
  