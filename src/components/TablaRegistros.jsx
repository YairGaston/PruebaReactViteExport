import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addDay } from "@formkit/tempo";
import { monthEnd } from "@formkit/tempo";
import { diffDays } from "@formkit/tempo"
/* import { format } from "@formkit/tempo" */

const mostrarFormulario = document.getElementById("formulario");
export default function TablaRegistros({ setEditingId }) {
  const { db, auth } = useFirebase();
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc'); // Estado para manejar el orden
  const [count, setCount] = useState(0); // Estado para manejar el contador de días que se debe mover el planning
  const [isVisible, setIsVisible] = useState(false);
  const [isVisible2, setIsVisible2] = useState(false);
  const [diasNombreMes1, setDiasNombreMes1] = useState(0);
  const [diasNombreMes2, setDiasNombreMes2] = useState(0);
  const [diasNombreMes3, setDiasNombreMes3] = useState(0);

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

  useEffect(() => {
    const DiaCentral = new Date();
    const DiaInicioDeTabla = addDay(DiaCentral, count - 15);
    const FinDeMes = monthEnd(DiaInicioDeTabla);
    const FinDeMes2 = monthEnd(addDay(FinDeMes, 1));
    const diasNombreMes1 = diffDays(FinDeMes, DiaInicioDeTabla) + 1;

    let diasNombreMes2;
    if (addDay(DiaInicioDeTabla, +30) > FinDeMes2) {
      diasNombreMes2 = diffDays(FinDeMes2, FinDeMes);
    } else {
      diasNombreMes2 = diffDays(addDay(DiaInicioDeTabla, +31), addDay(FinDeMes, 1));
    }
    const diasNombreMes3 = 31 - diasNombreMes1 - diasNombreMes2;
    setDiasNombreMes1(diasNombreMes1);
    setDiasNombreMes2(diasNombreMes2);
    setDiasNombreMes3(diasNombreMes3);
    handleClick();

  }, [count]);

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

  function handleClick() {

    const DiaCentral = new Date();
    const DiaInicioDeTabla = addDay(DiaCentral, count - 15);
    const FinDeMes = monthEnd(DiaInicioDeTabla);
    const FinDeMes2 = monthEnd(addDay(FinDeMes, 1));
    const diasNombreMes1 = diffDays(FinDeMes, DiaInicioDeTabla) + 1;

    let diasNombreMes2;
    if (addDay(DiaInicioDeTabla, +30) > FinDeMes2) {
      diasNombreMes2 = diffDays(FinDeMes2, FinDeMes);
    } else {
      diasNombreMes2 = diffDays(addDay(DiaInicioDeTabla, +31), addDay(FinDeMes, 1));
    }
    if (((diasNombreMes1 )) > 30 && isVisible2 === true) {
      setIsVisible2(!isVisible2);
    } else if (((diasNombreMes1) ) <= 30 && isVisible2 === false) {
      setIsVisible2(!isVisible2);
    } 
    if (((diasNombreMes1 + diasNombreMes2)) > 30 && isVisible === true) {
      setIsVisible(!isVisible);
    } else if (((diasNombreMes1) + (diasNombreMes2)) <= 30 && isVisible === false) {
      setIsVisible(!isVisible);
    }
  }

  return (
    <div className="registros-table">
      <h2>Registros almacenados {QtyRegistros} -//- {diasNombreMes1} -- {diasNombreMes2} ++ {(diasNombreMes1 + diasNombreMes2)} ++ -* {diasNombreMes3} *- </h2>
      <div className="MovimientoDeTabla">
        <button onClick={() => { setCount((count) => count - 1); handleClick(); }} id="guardar-btn">count is <span>{count}</span></button>
        <button onClick={handleSort} id="guardar-btn">{sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}</button>
        <button onClick={() => { setCount((count) => count + 1); handleClick(); }} id="guardar-btn">count is <span>{count}</span></button>
      </div>
      <table>
        <thead>
          <tr className="NombreMes">
            <th colSpan={diasNombreMes1}><button id="btn-NombreMes">{addDay(new Date(), count - 15).toLocaleString('es-AR', { month: 'short' })} </button> </th>
            {isVisible2 &&<th colSpan={diasNombreMes2}><button id="btn-NombreMes">{addDay(monthEnd(addDay(new Date(), count - 15)), 1).toLocaleString('es-AR', { month: 'short' })}</button></th>}
            {isVisible && <th colSpan={diasNombreMes3}><button id="btn-NombreMes">{addDay(monthEnd(addDay(monthEnd(addDay(new Date(), count - 15)), 1)), 1).toLocaleString('es-AR', { month: 'short' })}</button></th>}
          </tr>
          <tr>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 15).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 14).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th>{addDay(new Date(), count - 13).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 12).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 11).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 10).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 9).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 8).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 7).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 6).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 5).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 4).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 3).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 2).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count - 1).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 0).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 1).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 2).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 3).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 4).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 5).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 6).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 7).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 8).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 9).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 10).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 11).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 12).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 13).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 14).toLocaleString('es-AR', { day: '2-digit' })}</th>
            <th>{addDay(new Date(), count + 15).toLocaleString('es-AR', { day: '2-digit' })}</th>
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