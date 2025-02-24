import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addDay } from "@formkit/tempo"
/* import { format } from "@formkit/tempo" */

const mostrarFormulario = document.getElementById("formulario");
export default function TablaRegistros({ setEditingId }) {
  const { db, auth } = useFirebase();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // Estado para manejar el orden
  const [count, setCount] = useState(0); // Estado para manejar el contador de días que se debe mover el planning

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
    console.log(registros.filter(registro => registro.id === id));
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
    const sortedRegistros = [...registros]
    .sort((b, a) => a.fechaRegistro.toDate() - b.fechaRegistro.toDate())
    .map(registro => ({
      id: registro.id,
      Nombre: registro.nombre,
      Email: registro.email,
      Teléfono: registro.telefono,
      Dirección: registro.direccion,
      Edad: registro.edad,
      "Fecha de registro": registro.fechaRegistro.toDate().toLocaleDateString(),
      "Hora de registro": registro.fechaRegistro.toDate().toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      })
    }));
    const worksheet = XLSX.utils.json_to_sheet(sortedRegistros);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registroslala');
    XLSX.writeFile(workbook, 'registros123.xlsx');
  };

  let QtyRegistros = registros.length;
  
  
  const exportToPDF = () => {
    const sortedRegistros = [...registros].sort((b, a) => a.fechaRegistro.toDate() - b.fechaRegistro.toDate());
  const doc = new jsPDF( { orientation: 'landscape',format: 'a4' });
  doc.setFontSize(12);
  doc.text(`Registros almacenados ${QtyRegistros}` , 20, 10 );
  doc.autoTable({
    head: [['id', 'Nombre', 'Email', 'Teléfono', 'Dirección', 'Edad', 'Fecha de registro', 'Hora de registro']],
    body: sortedRegistros.map(registro => [
      registro.id,
      registro.nombre,
        registro.email,
        registro.telefono,
        registro.direccion,
        registro.edad,
        registro.fechaRegistro.toDate().toLocaleDateString(),
        registro.fechaRegistro.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),  
      ]),
      styles: { fontSize: 8 },
      headStyles: { 
        halign: 'center',  // Centrar horizontalmente
        valign: 'middle',  // Centrar verticalmente
        /* fillColor: [200, 200, 200], // Color de fondo del encabezado (opcional)
        textColor: [0, 0, 0], // Color del texto (opcional) */
        fontStyle: 'bold', // Estilo de fuente (opcional)
        fontSize: 9
      }
    });
   
    doc.save('registros.pdf');
  };

  const handleSort = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
  };

  const sortedRegistros = [...registros].sort((a, b) => {
    const dateA = a.fechaRegistro.toDate();
    const dateB = b.fechaRegistro.toDate();
    
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

  if (loading) return <div>Cargando registros...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const DiaCentral = new Date();

  return (
    <div className="table-container">
      <h2>Registros almacenados {QtyRegistros}</h2>
      <div className="MovimientoDeTabla">
      <button onClick={() => setCount((count) => count - 1)}id="guardar-btn">count is <span>{count}</span></button>
      <button onClick={handleSort} id="guardar-btn">{sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}</button>
      <button onClick={() => setCount((count) => count + 1)}id="guardar-btn">count is <span>{count}</span></button>
      </div>
      <table className="registros-table">
        <thead>
          <tr className="NombreMes">
            <th /* colSpan={count} */>{addDay(DiaCentral,count -15).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -14).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -13).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -12).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -11).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -10).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -9).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -8).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -6).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -5).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -4).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -3).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -2).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -7).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count -1).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count +0).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count +1).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 2).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 3).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 4).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 5).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 6).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 7).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 8).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 9).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 10).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 11).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 12).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 13).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 14).toLocaleString('es-AR', {month: 'short' })}</th>
            <th>{addDay(DiaCentral,count + 15).toLocaleString('es-AR', {month: 'short' })}</th>

          </tr>
          <tr>
            <th>{addDay(DiaCentral,count -15).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -14).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -13).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -12).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -11).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -10).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -9).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -8).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -7).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -6).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -5).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -4).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -3).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -2).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count -1).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count +0).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count +1).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 2).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 3).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 4).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 5).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 6).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 7).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 8).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 9).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 10).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 11).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 12).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 13).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 14).toLocaleString('es-AR', {day:'2-digit'})}</th>
            <th>{addDay(DiaCentral,count + 15).toLocaleString('es-AR', {day:'2-digit'})}</th>
          </tr>
        </thead>
        <tbody>
          {sortedRegistros.map((registro) => (
            <tr key={registro.id}>
              <td><button>{registro.nombre}</button></td>
              <td><button>{registro.email}</button></td>
              <td><button>{registro.telefono}</button></td>
              <td><button>{registro.direccion}</button></td>
              <td><button>{registro.edad}</button></td>
              <td><button>{registro.fechaRegistro.toDate().toLocaleDateString()}</button></td>
              <td><button>{registro.fechaRegistro.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</button></td>
              <td>
                <button 
                  className="editar-btn"
                  onClick={() => {handleEditar(registro.id), mostrarFormulario.classList.toggle("oculto")}}
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
      <br />
      <div className="export-buttons">
        <button onClick={exportToExcel} id="guardar-btn">Exportar a Excel</button>
        <button onClick={exportToPDF} id="guardar-btn">Exportar a PDF</button>
      </div>
    </div>
  );
}

TablaRegistros.propTypes = {
  setEditingId: PropTypes.func.isRequired,
};