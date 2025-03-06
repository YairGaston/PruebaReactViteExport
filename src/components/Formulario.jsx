import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';

export default function Formulario({ editingId, /* setEditingId , */ initialData, onCancel, onSuccess, nombre, fechaOperacion }) {
  const { db } = useFirebase();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const fechaRegistro = /* new Date(); */Timestamp.now(); // Crear un Timestamp de Firestore
      const datosPersona = { ...formData, fechaRegistro};
      if (editingId) {
        await updateDoc(doc(db, 'datosPersonales', editingId), datosPersona);
        onSuccess({ id: editingId, ...formData });
      } else {
        // Guarda la referencia del documento nuevo
        const docRef = await addDoc(collection(db, 'datosPersonales'), datosPersona);
        // Usa el ID del documento nuevo
        onSuccess({ id: docRef.id, ...formData, fechaRegistro });
      }
        setFormData({ nombre: '', email: '', telefono: '', direccion: '', edad: '', fechaOperacion: '' });
    } catch (error) {
      console.error('Error al guardar:',error);
    }
  };
  const handleReset = (e) => {
    e.preventDefault();
    setFormData({ nombre: '', email: '', telefono: '', direccion: '', edad: '', fechaOperacion: '' });
    if (onCancel) onCancel();
  };    
  return (
  <form   onSubmit={handleSubmit} onReset={handleReset} className=' formulario' >
    <label htmlFor="nombre">Nombre:</label>
    <input type="text" id="nombre" name="nombre" placeholder="Nombre y Apellido" value={formData.nombre } 
    onChange={handleChange}  required/>
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
    <button id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'} type="submit">Guardar</button>
    <button id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'} type="reset">Cancelar</button>
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