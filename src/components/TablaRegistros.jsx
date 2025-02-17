import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function TablaRegistros({ setEditingId }) {
  const { db, auth } = useFirebase();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setError('Por favor, inicia sesión para ver los registros.');
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'datosPersonales'),
      (snapshot) => {
        const datos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setRegistros(datos);
        setLoading(false);
      },
      (error) => {
        setError('Error al cargar los registros');
        console.error(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, auth]);

  const handleEditar = (id) => {
    setEditingId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    
    try {
      await deleteDoc(doc(db, 'datosPersonales', id));
    } catch (error) {
      setError('Error al eliminar el registro');
      console.error(error);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(registros);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
    XLSX.writeFile(workbook, 'registros.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Registros almacenados', 20, 10);
    doc.autoTable({
      head: [['Nombre', 'Email', 'Teléfono', 'Dirección', 'Edad']],
      body: registros.map(registro => [
        registro.nombre,
        registro.email,
        registro.telefono,
        registro.direccion,
        registro.edad
      ]),
    });
    doc.save('registros.pdf');
  };

  if (loading) return <div>Cargando registros...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="table-container">
      <h2>Registros almacenados</h2>
      <button onClick={exportToExcel}>Exportar a Excel</button>
      <button onClick={exportToPDF}>Exportar a PDF</button>
      <table className="registros-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Edad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <tr key={registro.id}>
              <td>{registro.nombre}</td>
              <td>{registro.email}</td>
              <td>{registro.telefono}</td>
              <td>{registro.direccion}</td>
              <td>{registro.edad}</td>
              <td>
                <button 
                  className="editar-btn"
                  onClick={() => handleEditar(registro.id)}
                >
                  Editar
                </button>
                <button
                  className="eliminar-btn"
                  onClick={() => handleEliminar(registro.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

TablaRegistros.propTypes = {
  setEditingId: PropTypes.func.isRequired,
};