import { useEffect, useRef, useState } from 'react';
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileMenuTop, setProfileMenuTop] = useState(0);
  const profileMenuRef = useRef(null);
  const profileTriggerRef = useRef(null);

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

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

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

  const toggleProfileMenu = () => {
    if (!profileMenuOpen) {
      const triggerBounds = profileTriggerRef.current?.getBoundingClientRect();
      if (triggerBounds) setProfileMenuTop(triggerBounds.bottom + 8);
    }
    setProfileMenuOpen((isOpen) => !isOpen);
  };

  if (user) {
    return (
      <div className="user-info">
        <div className="profile-menu" ref={profileMenuRef}>
          <div className="usuario-foto">
            <span>{user.displayName || user.email}</span>
            <button
              type="button"
              ref={profileTriggerRef}
              className="profile-menu-trigger"
              aria-label="Abrir menú de perfil"
              aria-expanded={profileMenuOpen}
              aria-controls="profile-menu-options"
              onClick={toggleProfileMenu}
            >
              <Avatar
                className={`${tema ? 'SombraTemaClaro':'SombraTemaOscuro'} ${!imageLoaded ? 'loading' : ''}`}
                src={imageLoaded ? user.providerData[0]?.photoURL : undefined}
                alt=""
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
              >
                {!imageLoaded ? (user.displayName?.charAt(0) || user.email?.charAt(0)) : null}
              </Avatar>
            </button>
          </div>
          {profileMenuOpen && (
            <div
              className={`profile-menu-options ${tema ? 'temaPrueba' : 'temaClaro'}`}
              id="profile-menu-options"
              style={{ top: `${profileMenuTop}px` }}
            >
              <button
                type="button"
                onClick={toggleTema}
                className="profile-theme-button"
                aria-label={`Tema ${themeMode === 'system' ? 'del dispositivo' : themeMode === 'light' ? 'claro' : 'oscuro'}. Cambiar tema`}
                title={`Tema: ${themeMode === 'system' ? 'dispositivo' : themeMode === 'light' ? 'claro' : 'oscuro'}`}
              >
                <i className={`bi ${themeMode === 'system' ? 'bi-display' : themeMode === 'light' ? 'bi-sun' : 'bi-moon'}`} aria-hidden="true"></i>
                <span>{themeMode === 'system' ? 'Sistema' : themeMode === 'light' ? 'Claro' : 'Oscuro'}</span>
              </button>
              <button
                id="logout-btn"
                type="button"
                className="profile-logout-button"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
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
