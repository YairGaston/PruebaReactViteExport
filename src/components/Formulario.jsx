import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { addDoc, collection, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

const NEW_NAME_VALUE = '__new_name__';

export default function Formulario({ editingId, /* setEditingId , */ initialData, onCancel, onSuccess, nombre, fechaOperacion }) {
  const { db } = useFirebase();
  const [nombresUnicos, setNombresUnicos] = useState([]);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [ingresandoNombreNuevo, setIngresandoNombreNuevo] = useState(false);
  const [formData, setFormData] = /* useState(initialData); */ useState({
    nombre: nombre, //  Usar el nombre pasado como prop
    email: '',
    telefono: '',
    direccion: '',
    edad: '',
    fechaOperacion: fechaOperacion  // Usar la fecha pasada como prop
  });
  const { tema } = useTheme();
  console.log('Tema en MiComponente:', tema);

  useEffect(() => {
    const cargarDatos = async () => {
      if (editingId) {
        const docRef = doc(db, 'datosPersonales', editingId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFormData(docSnap.data());
        }
      }
    };

    cargarDatos();
  }, [editingId, db]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };
  useEffect(() => {
    const cargarNombresUnicos = async () => {
      const querySnapshot = await getDocs(collection(db, 'datosPersonales'));
      const nombres = querySnapshot.docs.map(doc => doc.data().nombre);
      const nombresUnicos = [...new Set(nombres)].filter(Boolean).sort();
      setNombresUnicos(nombresUnicos);
    };
    cargarNombresUnicos();
  }, [db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fechaRegistro = /* new Date(); */Timestamp.now(); // Crear un Timestamp de Firestore
      const nombre = ingresandoNombreNuevo ? nombreNuevo.trim() : formData.nombre;
      if (!nombre && ingresandoNombreNuevo) {
        const campoNombreNuevo = e.currentTarget.elements.namedItem('nombre-nuevo');
        campoNombreNuevo?.setCustomValidity('Ingresá un nombre');
        campoNombreNuevo?.reportValidity();
        return;
      }
      const datosPersona = { ...formData, nombre, fechaRegistro};
      if (editingId) {
        await updateDoc(doc(db, 'datosPersonales', editingId), datosPersona);
        onSuccess({ id: editingId, ...datosPersona });
      } else {
        // Guarda la referencia del documento nuevo
        const docRef = await addDoc(collection(db, 'datosPersonales'), datosPersona);
        // Usa el ID del documento nuevo
        onSuccess({ id: docRef.id, ...datosPersona });
      }
        setFormData({ nombre: '', email: '', telefono: '', direccion: '', edad: '', fechaOperacion: '' });
    } catch (error) {
      console.error('Error al guardar:',error);
    }
  };
  const handleReset = (e) => {
    e.preventDefault();
    setFormData({ nombre: '', email: '', telefono: '', direccion: '', edad: '', fechaOperacion: '' });
    setNombreNuevo('');
    setIngresandoNombreNuevo(false);
    if (onCancel) onCancel();
  };    

  return (
  <form   onSubmit={handleSubmit} onReset={handleReset} className=' formulario' >
    <label htmlFor="nombre">Nombre:</label>
    {/* <input type="text" id="nombre" name="nombre" placeholder="Nombre y Apellido" value={formData.nombre } 
    onChange={handleChange}  required/> */}
    <select
      id="nombre"
      name="nombre"
      value={ingresandoNombreNuevo ? NEW_NAME_VALUE : formData.nombre}
      onChange={(event) => {
        const { value } = event.target;
        const esNombreNuevo = value === NEW_NAME_VALUE;
        setIngresandoNombreNuevo(esNombreNuevo);
        setNombreNuevo('');
        setFormData((previousData) => ({
          ...previousData,
          nombre: esNombreNuevo ? '' : value,
        }));
      }}
      required={!ingresandoNombreNuevo}
    >
        <option value="" disabled>Seleccione un nombre</option>
        <option value={NEW_NAME_VALUE}>Crear un nombre nuevo...</option>
        {nombresUnicos.map((nombreExistente) => (
          <option key={nombreExistente} value={nombreExistente}>
            {nombreExistente}
          </option>
        ))}
      </select>
    {ingresandoNombreNuevo && (
      <>
        <label htmlFor="nombre-nuevo">Nombre nuevo:</label>
        <input
          id="nombre-nuevo"
          name="nombreNuevo"
          type="text"
          placeholder="Nombre y apellido"
          value={nombreNuevo}
          onChange={(event) => {
            event.target.setCustomValidity('');
            setNombreNuevo(event.target.value);
          }}
          required
        />
      </>
    )}

    <label htmlFor="email">Email:</label>
    <input  type="email"  id="email"  name="email"  placeholder="nombre@gmail.com"  value={formData.email}  
    onChange={handleChange}  required/>
    <label htmlFor="telefono">Teléfono:</label>
    <input  type="tel"  id="telefono"  name="telefono"  placeholder='(54) 11 1234-5678'  value={formData.telefono}
    onChange={handleChange} required/>
    <label htmlFor="direccion">Dirección:</label>
    <input  type="text"  id="direccion"  name="direccion"  placeholder='domiciolio o direccion'  value={formData.direccion}
    onChange={handleChange}  required/>
    <label htmlFor="edad">Edad:</label>
    <input  type="number"  id="edad"  name="edad"  placeholder='##'  value={formData.edad}
    onChange={handleChange}  required/>
    <label htmlFor="fechaOperacion">Fecha OP:</label>
    <input  type="date"  id="fechaOperacion"  name="fechaOperacion"  placeholder='dd/mm/aaaa'  value={formData.fechaOperacion }
    onChange={handleChange}  required/>
    <div className='comandos-form'>
    <button id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'} type="submit" aria-label="Guardar" title="Guardar">
      <i className="bi bi-floppy" aria-hidden="true"></i>
    </button>
    <button id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'} type="reset" aria-label="Cancelar" title="Cancelar">
      <i className="bi bi-x-lg" aria-hidden="true"></i>
    </button>
    </div>
  </form>);}
Formulario.propTypes = {
  editingId: PropTypes.string,
  /* setEditingId: PropTypes.func.isRequired, */
  initialData: PropTypes.object,
/*   initialData: PropTypes.shape({
    nombre: PropTypes.string,
    email: PropTypes.string,
    telefono: PropTypes.string,
    direccion: PropTypes.string,
    edad: PropTypes.string,
  }), */
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func,
  nombre: PropTypes.string,
  fechaOperacion: PropTypes.string
};
Formulario.defaultProps = {
  editingId: null,
  initialData: null,
  onCancel: () => {},
  onSuccess: () => {},
};