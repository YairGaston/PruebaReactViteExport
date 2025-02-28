import { useState, useEffect } from 'react';
import Auth from './components/Auth';
/* import Formulario from './components/Formulario'; */
import TablaRegistros from './components/TablaRegistros';
import { useFirebase } from './context/FirebaseContext';
import './styles/App.css';

export default function App() {
  const { auth } = useFirebase();
  const [/* editingId */, setEditingId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

  return (
    <div className="app-container">
      <Auth />
      
      {user ? (
        <div className="main-content">
          <h1>Registro de Datos - Prueba React + Vite</h1>
          
          {/* <Formulario 
            editingId={editingId}
            setEditingId={setEditingId}
          /> */} 
          
          <TablaRegistros 
            setEditingId={setEditingId}
          />
        </div>
      ) : (
        <p>Por favor, inicia sesión para ver los registros.</p>
      )}
    </div>
  );
}