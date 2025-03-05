import { useState, useEffect } from 'react';
import Auth from './components/Auth';
/* import Formulario from './components/Formulario'; */
import TablaRegistros from './components/TablaRegistros';
import { useFirebase } from './context/FirebaseContext';
import { ThemeProvider, useTheme  } from './context/ThemeContext';
import './styles/App.css';

function AppContent() {
  const { auth } = useFirebase();
  const [, setEditingId] = useState(null);
  const [user, setUser] = useState(null);
  const { tema } = useTheme();
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  return ( 
    <div className={tema ? 'temaPrueba app-container' : 'temaClaro app-container'}>
      <Auth />
      {user ? (
        <div className={`main-content ${tema ? 'temaPrueba' : 'temaClaro'}`}>
          <h1 className={tema ? 'temaPrueba' : 'temaClaro'}>Registro de Datos</h1>
          <TablaRegistros 
            setEditingId={setEditingId}
          />
        </div>
      ) : (
        <p className={tema ? 'temaPrueba' : 'temaClaro'}>
          Por favor, inicia sesión para ver los registros.
        </p>
      )}
    </div>
  );
}
export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}