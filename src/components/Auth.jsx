import { useEffect, useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { signInWithPopup, signOut } from 'firebase/auth';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '../context/ThemeContext';
import googleLogo from '../assets/google.svg';

export default function Auth() {
  const { auth, provider } = useFirebase();
  const [user, setUser] = useState(null);
  const { tema, themeMode, toggleTema } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (user?.providerData[0]?.photoURL) {
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
      };
      img.src = user.providerData[0].photoURL;
    }
  }, [user]);

  if (isLoading) {
    return <div>Cargando...</div>;
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  if (user) {
    return (
      <div className="user-info">
        <div className="usuario-foto">
          <span>{user.displayName || user.email}</span>
          <Avatar
            className={`${tema ? 'SombraTemaClaro':'SombraTemaOscuro'} ${!imageLoaded ? 'loading' : ''}`}
            src={imageLoaded ? user.providerData[0]?.photoURL : undefined}
            alt={user.displayName?.charAt(0) || user.email?.charAt(0)}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          >
            {!imageLoaded ? (user.displayName?.charAt(0) || user.email?.charAt(0)) : null}
          </Avatar>
        </div>
      <div className="usuario-foto">
        <button id='logout-btn' className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'} onClick={handleLogout}>Cerrar sesión</button>
        <button
          type="button"
          onClick={toggleTema}
          className={tema ? "btn-tema-Claro" : "btn-tema-Oscuro"}
          aria-label={`Tema ${themeMode === 'system' ? 'del dispositivo' : themeMode === 'light' ? 'claro' : 'oscuro'}. Cambiar tema`}
          title={`Tema: ${themeMode === 'system' ? 'dispositivo' : themeMode === 'light' ? 'claro' : 'oscuro'}`}
        >
          {themeMode === 'system' ? '🖥️' : themeMode === 'light' ? '☀️' : '🌙'}
        </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
        <h2>Iniciar Sesión</h2>
      <button onClick={handleGoogleLogin} className="google-btn">
      <img src={googleLogo} alt="" aria-hidden="true" />
        Iniciar sesión con Google
      </button>
    </div>
  );
}
