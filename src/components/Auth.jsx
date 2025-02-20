import { useEffect, useState } from 'react';
import { useFirebase } from '../context/FirebaseContext';
import { signInWithPopup, signOut } from 'firebase/auth';
import Avatar from '@mui/material/Avatar';

export default function Auth() {
  const { auth, provider } = useFirebase();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
        
      setUser(user);
    });
    return () => unsubscribe();
  }, [auth]);

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
        <span >{user.displayName || user.email }</span>
        <Avatar src={user.providerData[0].photoURL} alt='photo perfil' />
        </div>
        <button id='logout-btn'onClick={handleLogout}>Cerrar sesión</button>
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