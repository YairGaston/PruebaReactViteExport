import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFirebase } from '../context/FirebaseContext';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { addDay, monthStart, format } from "@formkit/tempo";
import { monthEnd } from "@formkit/tempo";
import { diffDays } from "@formkit/tempo";
import Formulario from './Formulario';
import { useTheme } from '../context/ThemeContext';
/* import { format } from "@formkit/tempo" */

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
  const [RestarMes, setRestarMes] = useState(0);
  const [SumarMes, setSumarMes] = useState(0);
  const [popupInfo, setPopupInfo] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showFormNuevo, setShowFormNuevo] = useState(false);
  const { tema, /* toggleTema */ } = useTheme();
  /* const [updatedRecord, setUpdatedRecord] = useState(null); */
  if (!tema && typeof tema !== 'boolean') {
    console.log('Tema no está definido:', tema);
  }
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

let RestarMes;
if (diffDays(DiaInicioDeTabla,monthStart(DiaInicioDeTabla)) === 0){
  RestarMes = diffDays(DiaInicioDeTabla,monthStart(addDay(monthStart(DiaInicioDeTabla),-1)));
}else{
  RestarMes = diffDays(DiaInicioDeTabla,monthStart(DiaInicioDeTabla));
}
let SumarMes = diffDays(addDay(FinDeMes,1),DiaInicioDeTabla );




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
setRestarMes(RestarMes);
setSumarMes(SumarMes);
handleClick();

}, [count/* , handleClick */]);

const formatearFechaISO = (fechaString) => {
const [dia, mes, anio] = fechaString.split('/');
return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
};

const handleEditar = (id) => {
setEditingId(id);
setEditingRecord(registros.find(registro => registro.id === id));
setShowForm(true);
setShowFormNuevo(false);
/* window.scrollTo({ top: 0, behavior: 'smooth' }); */
};

const handleEliminar = async (id) => {
if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
try {
await deleteDoc(doc(db, 'datosPersonales', id));

// Filtrar el registro eliminado de la lista actual
const listaActualizada = popupInfo.lista.filter(registro => registro.id !== id);
if (listaActualizada.length === 0) {
// Si no quedan registros, cerrar el popup
setPopupInfo(null);
} else {
// Actualizar el popup con la lista filtrada
setPopupInfo({
  ...popupInfo,
  lista: listaActualizada,
  qty: listaActualizada.length
});}
setShowForm(false);
setShowFormNuevo(false);
} catch (error) {
setError('Error al eliminar el registro');
console.error(error);
}
};

  const exportToExcel = () => {
    const sortedRegistros = [...registros].sort((a, b) =>{
      const DatoA = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const DatoB = b.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (DatoA > DatoB){
  return 1;
  }
  if (DatoA < DatoB){
  return -1;
  }
  return 0;}
  ).map(registro => ({
      Id: registro.id,
      Nombre: registro.nombre,
      Email: registro.email,
      Teléfono: registro.telefono,
      Dirección: registro.direccion,
      Edad: registro.edad,
      "Fecha de registro": registro.fechaRegistro.toDate().toLocaleDateString(),
      "Hora de registro": registro.fechaRegistro.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      FechaOP: registro.fechaOperacion,
    }));
    const worksheet = XLSX.utils.json_to_sheet(sortedRegistros);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RegistroGeneral');
    XLSX.writeFile(workbook, 'registros.xlsx');
  };

  let QtyRegistros = registros.length;
  
  const exportToPDF = () => {
    const sortedRegistros = [...registros].sort((a, b) =>{
      const DatoA = a.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const DatoB = b.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (DatoA > DatoB){
  return 1;
  }
  if (DatoA < DatoB){
  return -1;
  }
  return 0;}
  );
  const doc = new jsPDF( { orientation: 'landscape',format: 'a4' });
  doc.setFontSize(12);
  doc.setTextColor (50, 200, 180);
  doc.text(`Registros almacenados ${QtyRegistros}` , 20, 10 );
  doc.autoTable({
    head: [['id', 'Nombre', 'Email', 'Teléfono', 'Dirección', 'Edad', 'Fecha de registro', 'Hora de registro', 'Fecha OP']],
    body: sortedRegistros.map(registro => [
      registro.id,
      registro.nombre,
        registro.email,
        registro.telefono,
        registro.direccion,
        registro.edad,
        registro.fechaRegistro.toDate().toLocaleDateString(),
        registro.fechaRegistro.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),  
        registro.fechaOperacion,
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

  const uniqueNames = [...new Set(registros.map(registro => registro.nombre))];
       //--- ordenar lista ---

  const nombreOrden = uniqueNames.sort((a, b) => {
    const nameA = a.toLowerCase();
    const nameB = b.toLowerCase();
    if (nameA < nameB) return sortOrder === 'asc' ? -1 : 1;
    if (nameA > nameB) return sortOrder === 'asc' ? 1 : -1;
    console.log(nombreOrden);
    return 0;
  }
  );
  return (
    <div className={tema ? 'temaPrueba registros-table' : 'temaClaro registros-table'}>
      <h2 className={tema ? 'temaPrueba' : 'temaClaro'}>Registros almacenados {QtyRegistros}</h2>
      <div className="MovimientoDeTabla">
        <button onClick={() => { setCount((count) => count - 1); handleClick(); }} id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'}> <i className="bi bi-caret-left-fill "></i> </button>
        <button onClick={() => { setCount((count) => count - RestarMes); handleClick(); }} id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'}> <i className="bi bi-caret-left-fill"></i><i className="bi bi-caret-left-fill"></i> </button>

        <div>
          <button onClick={() => { setCount(0); handleClick(); }} id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'}><i className="bi bi-calendar"></i></button>
        {/* <button onClick={handleSort} id="guardar-btn">{sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}</button> */}
        </div>
        <button onClick={() => { setCount((count) => count + SumarMes); handleClick(); }} id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'}><i className="bi bi-caret-right-fill"></i><i className="bi bi-caret-right-fill"></i></button>

        <button onClick={() => { setCount((count) => count + 1); handleClick(); }} id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'}><i className="bi bi-caret-right-fill"></i> </button>
      </div>
     <table>
        <thead>
          <tr className="NombreMes">
            <th rowSpan={3}><button onClick={handleSort}  className="TituloNombre">Nombre {sortOrder === 'asc' ? '↓' : '↑'}</button></th>
            <th colSpan={diasNombreMes1}><button id="btn-NombreMes">{addDay(new Date(), count - 15).toLocaleString('es-AR', { month: 'short' ,year:'2-digit' })} </button> </th>
            {isVisible2 &&<th colSpan={diasNombreMes2}><button id="btn-NombreMes">{addDay(monthEnd(addDay(new Date(), count - 15)), 1).toLocaleString('es-AR', { month: 'short' , year:'2-digit' })}</button></th>}
            {isVisible && <th colSpan={diasNombreMes3}><button id="btn-NombreMes">{addDay(monthEnd(addDay(monthEnd(addDay(new Date(), count - 15)), 1)), 1).toLocaleString('es-AR', { month: 'short', year:'2-digit'})}</button></th>}
          </tr>
          <tr>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 15),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 14),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 13),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 12),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 11),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 10),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 9),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 7),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 6),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 5),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 8),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 4),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 3),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 2),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count - 1),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 0),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 1),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 2),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 3),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 4),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 5),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 6),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 7),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 8),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 9),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 10),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 11),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 12),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 13),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 14),"ddd","es")}</button></th>
          <th><button id="btn-NombreDia">{format(addDay(new Date(), count + 15),"ddd","es")}</button></th>
          </tr>
          <tr>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 15).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 14).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 13).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 12).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 11).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 10).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 9).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 8).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 7).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 6).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 5).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 4).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 3).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 2).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count - 1).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 0).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 1).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 2).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 3).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 4).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 5).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 6).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 7).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 8).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 9).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 10).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 11).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 12).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 13).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 14).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
            <th><button id="btn-encabezado">{addDay(new Date(), count + 15).toLocaleString('es-AR', { day: '2-digit' })}</button></th>
          </tr>
        </thead>
        <tbody>
        {uniqueNames.map((nombre) => {
        // Obtener todos los registros para este nombre
        const registrosDelNombre = registros.filter(registro => registro.nombre === nombre);
        return ( // -------------- Coloca los nombres unicos en la primera columna ----------------
          <tr key={nombre}>
            <td><button 
            className='colNombre'
            title={`e-mail: ${registros.find(registros => registros.nombre === nombre).email}`}
            >
              {nombre.toLowerCase()}
            </button></td>
            
            {Array(31).fill().map((_, index) => {
              // Calcular la fecha para esta celda
              const fechaCelda = addDay(new Date(), count - 15 + index).toLocaleDateString('es-AR');
              // -----------------   Verificar si hay un registro para esta fecha    ----------------------
               const tieneRegistro = registrosDelNombre.some(registro => 
                registro.fechaRegistro.toDate().toLocaleDateString('es-AR') === fechaCelda
              );
              /* ----------------   Obtener los registros para el día y nombre  -------------------- */
              const registrosDelNombreDia = registrosDelNombre.filter(registro => registro.fechaRegistro.toDate().toLocaleDateString('es-AR') === fechaCelda);
              
              const classNameClaro = `${tieneRegistro && tema ? 'tiene-registro-Claro' : tieneRegistro === false && tema ? 'no-tiene-registro-Claro' : tieneRegistro && tema === false? 'tiene-registro-Oscuro' : 'no-tiene-registro-Oscuro'}`;
              return ( // ------------------  Rellena la fila activando los botones si es que tiene registros ese día -------
                <td key={index}>
                  <button
                    className={classNameClaro}
                    title={tieneRegistro ? `Hay ${registrosDelNombreDia.length} registro en esta fecha` : ''}
                    onClick={() => {
                      if (tieneRegistro) {
                        const registrosDelNombreDia = registrosDelNombre.filter(registro => registro.fechaRegistro.toDate().toLocaleDateString('es-AR') === fechaCelda);
                        setPopupInfo({
                          lista:registrosDelNombreDia,
                          qty: registrosDelNombreDia.length,
                          nombre: nombre,
                          fecha: fechaCelda,
                          email: registrosDelNombreDia.email,
                          telefono: registrosDelNombreDia.telefono,
                          direccion: registrosDelNombreDia.direccion,
                          fechaISO: formatearFechaISO(fechaCelda),
                        });
                      }else {
                        setShowFormNuevo(true);
                        setPopupInfo({
                          lista:registrosDelNombreDia,
                          qty: registrosDelNombreDia.length,
                          nombre: nombre,
                          fecha: fechaCelda,
                          email: '',
                          telefono: '',
                          direccion: '',
                          fechaISO: formatearFechaISO(fechaCelda),
                        });
                      } 
                      
                      }}>
                    {tieneRegistro ? `${registrosDelNombreDia.length} ` : ''}
                  </button>
                </td>
              );
            })
            }
          </tr>
        );
      }
      )
      }
        </tbody>
      </table>
      
      <div className="export-buttons">
        <button onClick={exportToExcel} id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'}><i className="bi bi-filetype-xlsx"></i></button>
        <button onClick={exportToPDF} id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'}><i className="bi bi-filetype-pdf"></i></button>
      </div>

      {/* ----------------------   PopUp    ------------------------------------*/}
      {popupInfo && (
        <div className='PopUp-Visible'>
          <div onClick={() => {setPopupInfo(null); setShowForm(false);setEditingRecord(null);setShowFormNuevo(false);}} className='popup-overlay'>
          </div>
          <div className={`popup ${tema ? 'temaPrueba' : 'temaClaro'}`}>
          <div className='encabezado-popup'>  
            <div className='titulo-popUp'><h3>Detalles de Registros</h3> </div>
            <div className='comandos-popUp'> 
          <button id="guardar-btn" className={tema ? 'SombraTemaClaro':'SombraTemaOscuro'} onClick={() =>{ { showFormNuevo ? setShowFormNuevo(false): setShowFormNuevo(true), setShowForm(false)}}}> {'+'} Agregar</button>
          <button className={tema ? 'btn-cerrar-popup SombraTemaClaro':'btn-cerrar-popup SombraTemaOscuro'} onClick={() => {setPopupInfo(null); setShowForm(false);setEditingRecord(null);setShowFormNuevo(false);}}> {'✕'} Cerrar</button>
            </div>
          </div>
          <table>
            <thead>
            <tr className="NombreMesPopUp">
            <th><button id="btn-encabezado">Nombre</button></th>
            <th><button id="btn-encabezado">Email</button></th>
            <th><button id="btn-encabezado">Teléfono</button></th>
            <th><button id="btn-encabezado">Dirección</button></th>
            <th><button id="btn-encabezado">Edad</button></th>
            <th><button id="btn-encabezado">Fecha</button></th>
            <th><button id="btn-encabezado">Hora</button></th>
            <th><button id="btn-encabezado">Acciones</button></th>
            </tr>
            </thead>
            <tbody>
            {popupInfo.lista.map((registro) => (
            <tr key={registro.id}>
              {<td><button>{registro.nombre}</button></td>}
              <td><button>{registro.email}</button></td>
              <td><button>{registro.telefono}</button></td>
              <td><button>{registro.direccion}</button></td>
              <td><button>{registro.edad}</button></td>
              <td><button>{registro.fechaRegistro.toDate().toLocaleDateString()}</button></td>
              <td><button>{registro.fechaRegistro.toDate().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</button></td>
              <td>
                <button 
                  className="editar-btn"
                  onClick={() => {handleEditar(registro.id)/* , mostrarFormulario.classList.toggle("oculto") */}}
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
          {!showForm ? ( /* -----  Aquí se decide si se abre el formmulario dentro del PopUp  --------- */
                    // ------  Acá tenfgo que poner el form para nuevo regis. si tiene registro abree el de editar y sino el otro. -------
            <> 
            {showFormNuevo ? (
            <> 

            <h3>Crear nuevo Registro</h3>
              <Formulario 
              nombre={popupInfo.nombre}  // Pasar el nombre de la fila seleccionada
              fechaOperacion={popupInfo.fechaISO}  // Pasar la fecha de la celda            
            onCancel={() => {
            }}
            onSuccess={(nuevoRegistro) => {
              /* setShowFormNuevo(false);  */
              if (!nuevoRegistro || !nuevoRegistro.fechaRegistro) {
                console.error('Datos del registro incompletos');
                return;
              }
              // Actualiza el estado `registros` con los nuevos datos
              setRegistros((prevRegistros) => {
                const updatedRegistros = prevRegistros.map((registro) => 
                  registro.id === nuevoRegistro.id ? nuevoRegistro : registro
                );
              // --------   Actualiza el popupInfo con los registros actualizados
              const fechaCelda2 = nuevoRegistro.fechaRegistro.toDate().toLocaleDateString('es-AR');
              const registrosDelNombre2 = updatedRegistros.filter(registro => registro.nombre === nuevoRegistro.nombre);
              const registrosDelNombreDia2 = registrosDelNombre2.filter(registro => registro.fechaRegistro.toDate().toLocaleDateString('es-AR') === fechaCelda2);
              setPopupInfo({
                lista:registrosDelNombreDia2,
                qty: registrosDelNombreDia2.length,
                nombre: nuevoRegistro.nombre,
                fecha: fechaCelda2,
                email: nuevoRegistro.email,
                telefono: nuevoRegistro.telefono,
                direccion: nuevoRegistro.direccion
              });
              return updatedRegistros;              
            });
            setShowFormNuevo(false);
            }}
          />
          </> 
          ): null
          }
          </> 
          ) : (
        <>  {/*---------------------  muestra el Formulario para editar ---------*/}
          <h3>Editar Registro</h3>
          <Formulario 
            editingId={editingRecord.id}
            initialData={editingRecord}
            nombre={popupInfo.nombre}  
            fechaOperacion={popupInfo.fechaISO} 
            onCancel={() => {
              setShowForm(false);
              setEditingRecord(null);
            }}
            onSuccess={(nuevoRegistro) => {
              console.log(nuevoRegistro);
              if (!nuevoRegistro || !nuevoRegistro.fechaRegistro) {
                console.error('Datos del registro incompletos');
                return;
              }
              // Actualiza el estado `registros` con los nuevos datos
              setRegistros((prevRegistros) => {
                const updatedRegistros = prevRegistros.map((registro) => 
                  registro.id === nuevoRegistro.id ? nuevoRegistro : registro
                );
              // --------   Actualiza el popupInfo con los registros actualizados
              const fechaCelda2 = nuevoRegistro.fechaRegistro.toDate().toLocaleDateString('es-AR')
              const registrosDelNombre2 = updatedRegistros.filter(registro => registro.nombre === nuevoRegistro.nombre);
              const registrosDelNombreDia2 = registrosDelNombre2.filter(registro => registro.fechaRegistro.toDate().toLocaleDateString('es-AR') === fechaCelda2);
              setPopupInfo({
                lista:registrosDelNombreDia2,
                qty: registrosDelNombreDia2.length,
                nombre: nuevoRegistro.nombre,
                fecha: fechaCelda2,
                email: nuevoRegistro.email,
                telefono: nuevoRegistro.telefono,
                direccion: nuevoRegistro.direccion
              });
              return updatedRegistros;              
            });
              setShowForm(false);
              setEditingRecord(null);
            }}
          />
        </>
      )}
          </div>
        
        </div>
)}
    </div>
  );
}
TablaRegistros.propTypes = {
  setEditingId: PropTypes.func.isRequired,
  fechaCelda: PropTypes.string.isRequired,
  nombre: PropTypes.string.isRequired,
};