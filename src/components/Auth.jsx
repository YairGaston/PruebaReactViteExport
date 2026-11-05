import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { signInWithPopup, signOut } from 'firebase/auth';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '../context/ThemeContext';
import googleLogo from '../assets/google.svg';

export default function Auth({
  count,
  setCount,
  filtroNombre,
  setFiltroNombre,
  filtroAnio,
  setFiltroAnio,
  opcionesFiltros,
}) {
  const { auth, provider } = useFirebase();
  const [user, setUser] = useState(null);
  const { tema, themeMode, toggleTema } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [menuFiltrosAbierto, setMenuFiltrosAbierto] = useState(false);
  const [fechaInicioBorrador, setFechaInicioBorrador] = useState('');
  const [nombreBorrador, setNombreBorrador] = useState('');
  const [anioBorrador, setAnioBorrador] = useState('');
  
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

  const getFechaInicio = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + count - 15);
    return [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0'),
    ].join('-');
  };

  const handleToggleMenuFiltros = () => {
    if (!menuFiltrosAbierto) {
      setFechaInicioBorrador(getFechaInicio());
      setNombreBorrador(filtroNombre);
      setAnioBorrador(filtroAnio);
    }
    setMenuFiltrosAbierto((abierto) => !abierto);
  };

  const handleAplicarFiltros = (event) => {
    event.preventDefault();
    if (fechaInicioBorrador) {
      const [year, month, day] = fechaInicioBorrador.split('-').map(Number);
      const fechaSeleccionada = new Date(year, month - 1, day);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      setCount(Math.round((fechaSeleccionada.getTime() - hoy.getTime()) / 86400000) + 15);
    }
    setFiltroNombre(nombreBorrador);
    setFiltroAnio(anioBorrador);
    setMenuFiltrosAbierto(false);
  };

  const handleLimpiarFiltros = () => {
    setCount(0);
    setFiltroNombre('');
    setFiltroAnio('');
    setMenuFiltrosAbierto(false);
  };

  if (user) {
    return (
      <div className="user-info">
      <div className="perfil-filtros">
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
        <button
          type="button"
          className={`boton-filtros ${tema ? 'SombraTemaClaro' : 'SombraTemaOscuro'}`}
          aria-expanded={menuFiltrosAbierto}
          aria-controls="menu-filtros-registros"
          onClick={handleToggleMenuFiltros}
        >
          <i className="bi bi-funnel" aria-hidden="true"></i>
          Filtros
          <i className={`bi ${menuFiltrosAbierto ? 'bi-chevron-up' : 'bi-chevron-down'}`} aria-hidden="true"></i>
        </button>
        {menuFiltrosAbierto && (
          <form
            id="menu-filtros-registros"
            className={`menu-filtros-registros ${tema ? 'temaPrueba' : 'temaClaro'}`}
            onSubmit={handleAplicarFiltros}
          >
            <label>
              Fecha de inicio
              <input
                type="date"
                value={fechaInicioBorrador}
                onChange={(event) => setFechaInicioBorrador(event.target.value)}
              />
            </label>
            <label>
              Nombre
              <select value={nombreBorrador} onChange={(event) => setNombreBorrador(event.target.value)}>
                <option value="">Todos los nombres</option>
                {opcionesFiltros.nombres.map((nombre) => (
                  <option key={nombre} value={nombre}>{nombre}</option>
                ))}
              </select>
            </label>
            <label>
              Año
              <select value={anioBorrador} onChange={(event) => setAnioBorrador(event.target.value)}>
                <option value="">Todos los años</option>
                {opcionesFiltros.anios.map((anio) => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </label>
            <div className="acciones-filtros">
              <button type="button" onClick={handleLimpiarFiltros}>Limpiar</button>
              <button type="submit">Aplicar filtros</button>
            </div>
          </form>
        )}
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

Auth.propTypes = {
  count: PropTypes.number.isRequired,
  setCount: PropTypes.func.isRequired,
  filtroNombre: PropTypes.string.isRequired,
  setFiltroNombre: PropTypes.func.isRequired,
  filtroAnio: PropTypes.string.isRequired,
  setFiltroAnio: PropTypes.func.isRequired,
  opcionesFiltros: PropTypes.shape({
    nombres: PropTypes.arrayOf(PropTypes.string).isRequired,
    anios: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
};
