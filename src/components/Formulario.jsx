import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { addDoc, collection, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function Formulario({ editingId, setEditingId }) {
  const { db } = useFirebase();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    edad: ''
  });

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
      const datosPersona = { ...formData, fechaRegistro: new Date() };
      
      if (editingId) {
        await updateDoc(doc(db, 'datosPersonales', editingId), datosPersona);
      } else {
        await addDoc(collection(db, 'datosPersonales'), datosPersona);
      }
      
      setFormData({ nombre: '', email: '', telefono: '', direccion: '', edad: '' });
      setEditingId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} id="formulario">
      
        <label htmlFor="nombre">Nombre:</label>
        <input
          type="text"
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          required
        />
   
    
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
    
      
        <label htmlFor="telefono">Teléfono:</label>
        <input
          type="tel"
          id="telefono"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          required
        />
     
      
        <label htmlFor="direccion">Dirección:</label>
        <input
          type="text"
          id="direccion"
          name="direccion"
          value={formData.direccion}
          onChange={handleChange}
          required
        />
      
      
        <label htmlFor="edad">Edad:</label>
        <input
          type="number"
          id="edad"
          name="edad"
          value={formData.edad}
          onChange={handleChange}
          required
        />
      
      <button id="guardar-btn" type="submit">Guardar</button>
    </form>
  );
}

Formulario.propTypes = {
  editingId: PropTypes.string,
  setEditingId: PropTypes.func.isRequired,
};