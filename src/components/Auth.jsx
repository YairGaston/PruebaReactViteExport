import {  useEffect, useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { signInWithPopup, signOut } from 'firebase/auth';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '../context/ThemeContext';
export default function Auth( ) {
  const { auth, provider } = useFirebase();
  const [user, setUser] = useState(null);
  const { tema, toggleTema } = useTheme();
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
          src={imageLoaded ? user.providerData[0].photoURL : undefined}
          alt={user.displayName?.charAt(0) || user.email?.charAt(0)}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        >
          {!imageLoaded ? (user.displayName?.charAt(0) || user.email?.charAt(0)) : null}
        </Avatar>
      </div>
      <div className="usuario-foto">
        <button id='logout-btn' className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'} onClick={handleLogout}>Cerrar sesión</button>
        <button onClick={ toggleTema } className={ tema ? "btn-tema-Claro" : "btn-tema-Oscuro"}>{tema ? '🌙': '☀️'} </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
        <h2>Iniciar Sesión</h2>
      <button onClick={handleGoogleLogin} className="google-btn">
      <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/2048px-Google_%22G%22_logo.svg.png" alt="Google Logo"/>
        Iniciar sesión con Google
      </button>
    </div>
  );
}
