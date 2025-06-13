import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAy39QMZJLT-MUH2CoOaU4U2VB8xZLc-fw",
  authDomain: "lab-files-c993f.firebaseapp.com",
  projectId: "lab-files-c993f",
  storageBucket: "lab-files-c993f.firebasestorage.app",
  messagingSenderId: "500468873323",
  appId: "1:500468873323:web:b300070f13e4913e6b592e",
  measurementId: "G-WVFF0MK5F0"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateForTable(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
}

function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    return `${hours}:${minutes}`;
}

function formatTotalHours(total) {
    const hours = Math.floor(total);
    const minutes = Math.round((total - hours) * 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

async function loadHorasExtras() {
    const horasExtrasList = document.getElementById('horas-extras-list');
    if (!horasExtrasList) {
        showSuccessModal('Error: No se pudo cargar la lista de horas extras.', true);
        return;
    }

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const horasExtrasQuery = query(
            collection(db, 'horasExtras'),
            where('uid', '==', user.uid)
        );
        const horasExtrasSnapshot = await getDocs(horasExtrasQuery);
        horasExtrasList.innerHTML = '';
        horasExtrasSnapshot.forEach(doc => {
            const horaExtra = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="hora-extra-titulo">${horaExtra.titulo}</span>
                <div class="hora-extra-info">
                    <span>Mes: ${horaExtra.mes}</span>
                    <span>Entradas: ${horaExtra.entradas.length}</span>
                </div>
                <div class="hora-extra-actions">
                    <i class="fas fa-edit" data-id="${doc.id}" title="Editar"></i>
                    <i class="fas fa-trash" data-id="${doc.id}" title="Eliminar"></i>
                </div>
            `;
            horasExtrasList.appendChild(li);

            li.querySelector('.hora-extra-titulo').addEventListener('click', () => openEditModal(doc.id, horaExtra));
            li.querySelector('.fa-edit').addEventListener('click', () => openEditModal(doc.id, horaExtra));
            li.querySelector('.fa-trash').addEventListener('click', () => openDeleteModal(doc.id));
        });
    } catch (error) {
        showSuccessModal(`Error al cargar horas extras: ${error.message}`, true);
    }
}

function renderEntradas(entradasList50, entradasList100, entradas) {
    entradasList50.innerHTML = '';
    entradasList100.innerHTML = '';
    let total50 = 0;
    let total100 = 0;

    entradas.forEach((entrada, index) => {
        const tr = document.createElement('tr');
        if (entrada.tipoHora === '50%') {
            tr.innerHTML = `
                <td>${formatDateForTable(entrada.fecha)}</td>
                <td>${formatTime(entrada.horaEntrada)}</td>
                <td>${formatTime(entrada.horaSalida)}</td>
                <td>${formatTotalHours(entrada.total)}</td>
                <td>${entrada.motivo || 'Implantes'}</td>
                <td>
                    <i class="fas fa-edit" data-index="${index}" title="Editar"></i>
                    <i class="fas fa-trash" data-index="${index}" title="Eliminar"></i>
                </td>
            `;
            entradasList50.appendChild(tr);
            total50 += parseFloat(entrada.total) || 0;
        } else {
            tr.innerHTML = `
                <td>${formatDateForTable(entrada.fecha)}</td>
                <td>${formatTime(entrada.horaEntrada)}</td>
                <td>${formatTime(entrada.horaSalida)}</td>
                <td>${formatTotalHours(entrada.total)}</td>
                <td>${entrada.motivo || 'Turno de llamado'}</td>
                <td>${entrada.movilizacion || '4.000'}</td>
                <td>
                    <i class="fas fa-edit" data-index="${index}" title="Editar"></i>
                    <i class="fas fa-trash" data-index="${index}" title="Eliminar"></i>
                </td>
            `;
            entradasList100.appendChild(tr);
            total100 += parseFloat(entrada.total) || 0;
        }

        tr.querySelector('.fa-edit').addEventListener('click', () => openEntradaModal(index, entrada));
        tr.querySelector('.fa-trash').addEventListener('click', () => {
            entradas.splice(index, 1);
            renderEntradas(entradasList50, entradasList100, entradas);
        });
    });

    if (entradasList50.children.length > 0) {
        const trTotal50 = document.createElement('tr');
        trTotal50.innerHTML = `
            <td colspan="6" style="text-align: right; font-weight: bold;">
                Total: ${formatTotalHours(total50)} horas
            </td>
        `;
        entradasList50.appendChild(trTotal50);
    }

    if (entradasList100.children.length > 0) {
        const trTotal100 = document.createElement('tr');
        trTotal100.innerHTML = `
            <td colspan="7" style="text-align: right; font-weight: bold;">
                Total: ${formatTotalHours(total100)} horas
            </td>
        `;
        entradasList100.appendChild(trTotal100);
    }
}

async function loadBonos(horaExtraId) {
    if (!horaExtraId) {
        showSuccessModal('Error: ID de registro no válido.', true);
        return [];
    }
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');
        const bonosQuery = query(
            collection(db, 'bonosLlamado'),
            where('horaExtraId', '==', horaExtraId),
            where('uid', '==', user.uid)
        );
        const bonosSnapshot = await getDocs(bonosQuery);
        const bonos = [];
        bonosSnapshot.forEach(doc => {
            bonos.push({ id: doc.id, ...doc.data() });
        });
        return bonos;
    } catch (error) {
        showSuccessModal(`Error al cargar bonos: ${error.message}`, true);
        return [];
    }
}

function renderBonos(bonosList, bonos) {
    bonosList.innerHTML = '';
    bonos.forEach((bono, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><i class="fas fa-calendar-alt"></i> Turno de llamado desde ${formatDateForTable(bono.fechaInicio)} hasta ${formatDateForTable(bono.fechaFinal)}</td>
            <td>
                <i class="fas fa-edit" data-index="${index}" title="Editar"></i>
                <i class="fas fa-trash" data-index="${index}" title="Eliminar"></i>
            </td>
        `;
        bonosList.appendChild(tr);

        tr.querySelector('.fa-edit').addEventListener('click', () => openBonoModal(index, bono));
        tr.querySelector('.fa-trash').addEventListener('click', async () => {
            try {
                await deleteDoc(doc(db, 'bonosLlamado', bono.id));
                window.currentBonos.splice(index, 1);
                renderBonos(bonosList, window.currentBonos);
                showSuccessModal('Bono eliminado correctamente.');
            } catch (error) {
                showSuccessModal(`Error al eliminar bono: ${error.message}`, true);
            }
        });
    });
}

function loadXlsxLibrary() {
    return new Promise((resolve, reject) => {
        if (window.XLSX && window.XLSX.utils && window.XLSX.write) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.9/xlsx.full.min.js';
        script.async = true;
        script.id = 'xlsx-script';
        script.onload = () => {
            if (window.XLSX && window.XLSX.utils && window.XLSX.write) {
                resolve();
            } else {
                reject(new Error('Librería XLSX no inicializada correctamente'));
            }
        };
        script.onerror = () => {
            reject(new Error('Error al cargar la librería XLSX'));
        };
        document.head.appendChild(script);
    });
}

function validateSheetData(data, sheetName) {
    if (!Array.isArray(data)) {
        throw new Error(`Datos de ${sheetName} no son un arreglo`);
    }
    data.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
            throw new Error(`Fila ${rowIndex} en ${sheetName} no es un arreglo`);
        }
        row.forEach((cell, cellIndex) => {
            if (cell === undefined || cell === null) {
                data[rowIndex][cellIndex] = '';
            }
            if (typeof cell !== 'string' && typeof cell !== 'number') {
                data[rowIndex][cellIndex] = String(cell);
            }
        });
    });
}

async function exportToExcel() {
    try {
        if (!window.XLSX || !window.XLSX.utils || !window.XLSX.write) {
            await loadXlsxLibrary();
        }

        const titulo = document.getElementById('hora-extra-titulo').value.trim() || 'Sin Nombre';
        const mes = document.getElementById('hora-extra-mes').value || 'Sin Mes';
        const entradas50 = window.currentEntradas.filter(e => e.tipoHora === '50%');
        const entradas100 = window.currentEntradas.filter(e => e.tipoHora === '100%');
        const bonos = window.currentBonos;

        const wsData = [
            ['Trabajador:', titulo],
            ['Mes:', mes],
            [],
            ['Horas Extras al 50%'],
            ['Fecha', 'Hora Entrada', 'Hora Salida', 'Total (Horas)', 'Motivo']
        ];

        entradas50.forEach(e => {
            wsData.push([
                formatDateForTable(e.fecha),
                formatTime(e.horaEntrada),
                formatTime(e.horaSalida),
                formatTotalHours(e.total),
                e.motivo || 'Implantes'
            ]);
        });

        if (entradas50.length > 0) {
            const total50 = entradas50.reduce((sum, e) => sum + parseFloat(e.total), 0);
            wsData.push([], ['Total:', '', '', formatTotalHours(total50)]);
        }

        wsData.push([], ['Turnos de Llamado']);
        if (bonos.length > 0) {
            bonos.forEach(b => {
                wsData.push([
                    `Bono turno de llamado desde ${formatDateForTable(b.fechaInicio)} hasta ${formatDateForTable(b.fechaFinal)}`
                ]);
            });
            wsData.push(['Total turnos:', bonos.length]);
        } else {
            wsData.push(['No hay turnos de llamado registrados']);
        }

        wsData.push([], ['Horas Extras al 100%']);
        wsData.push(['Fecha', 'Hora Entrada', 'Hora Salida', 'Total (Horas)', 'Motivo', 'Movilización']);
        entradas100.forEach(e => {
            wsData.push([
                formatDateForTable(e.fecha),
                formatTime(e.horaEntrada),
                formatTime(e.horaSalida),
                formatTotalHours(e.total),
                e.motivo || 'Turno de llamado',
                e.movilizacion || '4.000'
            ]);
        });

        if (entradas100.length > 0) {
            const total100 = entradas100.reduce((sum, e) => sum + parseFloat(e.total), 0);
            wsData.push([], ['Total:', '', '', formatTotalHours(total100)]);
        }

        validateSheetData(wsData, 'Informe Horas Extras');
        const ws = window.XLSX.utils.aoa_to_sheet(wsData);
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, 'Informe Horas Extras');

        const filename = `Horas_Extras_${titulo}_${mes}.xlsx`;
        const wbout = window.XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });

        function s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
        const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showSuccessModal('Archivo Excel descargado correctamente.');
    } catch (error) {
        showSuccessModal(`Error al generar el archivo Excel: ${error.message}`, true);
    }
}

function openEditModal(id = null, horaExtra = null) {
    const horaExtraModal = document.getElementById('hora-extra-modal');
    if (!horaExtraModal) {
        showSuccessModal('Error: No se pudo abrir el modal.', true);
        return;
    }

    horaExtraModal.style.display = 'flex';
    const horaExtraModalTitle = document.getElementById('hora-extra-modal-title');
    const horaExtraTituloInput = document.getElementById('hora-extra-titulo');
    const horaExtraMesInput = document.getElementById('hora-extra-mes');
    if (horaExtra) {
        horaExtraModalTitle.textContent = 'Editar Registro';
        horaExtraTituloInput.value = horaExtra.titulo;
        horaExtraMesInput.value = horaExtra.mes;
        window.currentEntradas = [...horaExtra.entradas];
        window.currentHoraExtraId = id;
    } else {
        horaExtraModalTitle.textContent = 'Crear Nuevo Registro';
        horaExtraTituloInput.value = '';
        horaExtraMesInput.value = '';
        window.currentEntradas = [];
        window.currentHoraExtraId = null;
    }
    const entradasList50 = document.getElementById('entradas-list-50');
    const entradasList100 = document.getElementById('entradas-list-100');
    const bonosList = document.getElementById('bonos-llamado-list');
    renderEntradas(entradasList50, entradasList100, window.currentEntradas);
    loadBonos(id).then(bonos => {
        window.currentBonos = bonos;
        renderBonos(bonosList, window.currentBonos);
    });
}

function openEntradaModal(index = null, entrada = null, tipoHora = '50%') {
    const entradaModal = document.getElementById('entrada-modal');
    if (!entradaModal) {
        showSuccessModal('Error: No se pudo abrir el modal de entrada.', true);
        return;
    }

    entradaModal.style.display = 'flex';
    window.currentTipoHora = tipoHora;
    const entradaModalTitle = document.getElementById('entrada-modal-title');
    const entradaFechaInput = document.getElementById('entrada-fecha');
    const entradaHoraEntradaInput = document.getElementById('entrada-hora-entrada');
    const entradaHoraSalidaInput = document.getElementById('entrada-hora-salida');
    const entradaMotivoInput = document.getElementById('entrada-motivo');
    
    entradaMotivoInput.style.width = '200px';
    entradaMotivoInput.style.height = '60px';

    if (entrada) {
        entradaModalTitle.textContent = `Editar Entrada (${tipoHora})`;
        entradaFechaInput.value = entrada.fecha;
        entradaHoraEntradaInput.value = entrada.horaEntrada;
        entradaHoraSalidaInput.value = entrada.horaSalida;
        entradaMotivoInput.value = entrada.motivo || (tipoHora === '50%' ? 'Implantes' : 'Turno de llamado');
        window.currentEntradaIndex = index;
    } else {
        entradaModalTitle.textContent = `Agregar Entrada (${tipoHora})`;
        entradaFechaInput.value = '';
        entradaHoraEntradaInput.value = '';
        entradaHoraSalidaInput.value = '';
        entradaMotivoInput.value = tipoHora === '50%' ? 'Implantes' : 'Turno de llamado';
        window.currentEntradaIndex = null;
    }
}

function openBonoModal(index = null, bono = null) {
    const bonoModal = document.getElementById('bono-llamado-modal');
    if (!bonoModal) {
        showSuccessModal('Error: No se pudo abrir el modal de bono.', true);
        return;
    }

    bonoModal.style.display = 'flex';
    const bonoModalTitle = document.getElementById('bono-llamado-modal-title');
    const bonoFechaInicioInput = document.getElementById('bono-fecha-inicio');
    const bonoFechaFinalInput = document.getElementById('bono-fecha-final');

    if (bono) {
        bonoModalTitle.textContent = 'Editar Bono de Llamado';
        bonoFechaInicioInput.value = bono.fechaInicio;
        bonoFechaFinalInput.value = bono.fechaFinal;
        window.currentBonoIndex = index;
        window.currentBonoId = bono.id;
    } else {
        bonoModalTitle.textContent = 'Agregar Bono de Llamado';
        bonoFechaInicioInput.value = '';
        bonoFechaFinalInput.value = '';
        window.currentBonoIndex = null;
        window.currentBonoId = null;
    }
}

function openDeleteModal(id) {
    const deleteModal = document.getElementById('delete-modal');
    if (!deleteModal) {
        showSuccessModal('Error: No se pudo abrir el modal de eliminación.', true);
        return;
    }
    window.currentHoraExtraId = id;
    deleteModal.style.display = 'flex';
}

function showSuccessModal(message, isError = false) {
    const successModal = document.getElementById('success-modal');
    const successIcon = document.getElementById('success-icon');
    const successMessage = document.querySelector('.success-message');
    
    if (!successModal || !successIcon || !successMessage) {
        alert(isError ? `Error: ${message}` : `Éxito: ${message}`);
        return;
    }

    successIcon.className = `fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}`;
    successMessage.textContent = message;
    successModal.classList.remove('success', 'error');
    successModal.classList.add(isError ? 'error' : 'success');
    successModal.style.display = 'block';
    setTimeout(() => {
        successModal.style.display = 'none';
    }, 3000);
}

async function logAction(horaExtraId, data) {
    try {
        await addDoc(collection(db, `horasExtras/${horaExtraId}/logs`), {
            action: 'delete',
            timestamp: serverTimestamp(),
            uid: data.uid
        });
    } catch (error) {
    }
}

async function saveHoraExtra() {
    const horaExtraTituloInput = document.getElementById('hora-extra-titulo');
    const horaExtraMesInput = document.getElementById('hora-extra-mes');
    const titulo = horaExtraTituloInput.value.trim();
    const mes = horaExtraMesInput.value;

    if (!titulo || !mes) {
        showSuccessModal('Por favor, completa el nombre del trabajador y el mes.', true);
        return;
    }

    if (!Array.isArray(window.currentEntradas)) {
        showSuccessModal('Error: Los datos de entradas no son válidos.', true);
        return;
    }

    for (const entrada of window.currentEntradas) {
        if (!entrada.tipoHora || !['50%', '100%'].includes(entrada.tipoHora) ||
            !entrada.fecha || !entrada.horaEntrada || !entrada.horaSalida || 
            isNaN(entrada.total) || (entrada.motivo && typeof entrada.motivo !== 'string')) {
            showSuccessModal('Error: Una o más entradas tienen datos inválidos.', true);
            return;
        }
        if (entrada.tipoHora === '100%' && (!entrada.movilizacion || entrada.movilizacion !== '4.000')) {
            showSuccessModal('Error: Las entradas al 100% deben tener movilización de 4.000.', true);
            return;
        }
    }

    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        let horaExtraId = window.currentHoraExtraId;
        if (horaExtraId) {
            const horaExtraRef = doc(db, 'horasExtras', horaExtraId);
            const updatedData = {
                titulo,
                mes,
                entradas: window.currentEntradas,
                fechaModificacion: serverTimestamp()
            };
            await updateDoc(horaExtraRef, updatedData);
            await logAction(horaExtraId, { uid: user.uid });
            showSuccessModal('Registro actualizado correctamente.');
        } else {
            const newHoraExtra = {
                uid: user.uid,
                titulo,
                mes,
                entradas: window.currentEntradas,
                fechaCreacion: serverTimestamp(),
                fechaModificacion: null
            };
            const horaExtraRef = await addDoc(collection(db, 'horasExtras'), newHoraExtra);
            horaExtraId = horaExtraRef.id;
            await logAction(horaExtraId, { uid: user.uid });
            showSuccessModal('Registro creado correctamente.');
        }

        for (const bono of window.currentBonos) {
            if (bono.id) {
                const bonoRef = doc(db, 'bonosLlamado', bono.id);
                await updateDoc(bonoRef, {
                    fechaInicio: bono.fechaInicio,
                    fechaFinal: bono.fechaFinal,
                    mes: bono.mes
                });
            } else {
                await addDoc(collection(db, 'bonosLlamado'), {
                    uid: user.uid,
                    horaExtraId,
                    fechaInicio: bono.fechaInicio,
                    fechaFinal: bono.fechaFinal,
                    mes: bono.mes,
                    fechaCreacion: serverTimestamp()
                });
            }
        }

        loadHorasExtras();
        const horaExtraModal = document.getElementById('hora-extra-modal');
        horaExtraModal.style.display = 'none';
        horaExtraTituloInput.value = '';
        horaExtraMesInput.value = '';
        window.currentEntradas = [];
        window.currentBonos = [];
        window.currentHoraExtraId = null;
    } catch (error) {
        showSuccessModal(`Error al guardar registro: ${error.message}`, true);
    }
}

function saveEntrada() {
    const entradaFechaInput = document.getElementById('entrada-fecha');
    const entradaHoraEntradaInput = document.getElementById('entrada-hora-entrada');
    const entradaHoraSalidaInput = document.getElementById('entrada-hora-salida');
    const entradaMotivoInput = document.getElementById('entrada-motivo');
    const fecha = entradaFechaInput.value;
    const horaEntrada = entradaHoraEntradaInput.value;
    const horaSalida = entradaHoraSalidaInput.value;
    const tipoHora = window.currentTipoHora;
    const motivo = entradaMotivoInput.value.trim() || (tipoHora === '50%' ? 'Implantes' : 'Turno de llamado');

    if (!fecha || !horaEntrada || !horaSalida) {
        showSuccessModal('Por favor, completa la fecha y las horas.', true);
        return;
    }

    if (!['50%', '100%'].includes(tipoHora)) {
        showSuccessModal('Error: Tipo de hora inválido.', true);
        return;
    }

    let total;
    if (tipoHora === '100%') {
        total = 2.00;
    } else {
        const entradaDate = new Date(`1970-01-01T${horaEntrada}:00`);
        const salidaDate = new Date(`1970-01-01T${horaSalida}:00`);
        if (salidaDate < entradaDate) {
            showSuccessModal('Error: La hora de salida debe ser posterior a la hora de entrada.', true);
            return;
        }
        const diffMs = salidaDate - entradaDate;
        total = diffMs / (1000 * 60 * 60);
        total = Math.max(0, total - 9);
        total = Math.round(total * 100) / 100;
    }

    const entrada = {
        tipoHora,
        fecha,
        horaEntrada,
        horaSalida,
        total,
        motivo,
        ...(tipoHora === '100%' && { movilizacion: '4.000' })
    };

    if (window.currentEntradaIndex !== null) {
        window.currentEntradas[window.currentEntradaIndex] = entrada;
    } else {
        window.currentEntradas.push(entrada);
    }

    const entradasList50 = document.getElementById('entradas-list-50');
    const entradasList100 = document.getElementById('entradas-list-100');
    renderEntradas(entradasList50, entradasList100, window.currentEntradas);
    const entradaModal = document.getElementById('entrada-modal');
    entradaModal.style.display = 'none';
    window.currentEntradaIndex = null;
    window.currentTipoHora = null;
}

function saveBono() {
    const bonoFechaInicioInput = document.getElementById('bono-fecha-inicio');
    const bonoFechaFinalInput = document.getElementById('bono-fecha-final');
    const fechaInicio = bonoFechaInicioInput.value;
    const fechaFinal = bonoFechaFinalInput.value;
    const mes = fechaInicio ? fechaInicio.slice(0, 7) : '';

    if (!fechaInicio || !fechaFinal) {
        showSuccessModal('Por favor, completa las fechas de inicio y final.', true);
        return;
    }

    if (new Date(fechaInicio) > new Date(fechaFinal)) {
        showSuccessModal('La fecha de inicio debe ser anterior o igual a la fecha final.', true);
        return;
    }

    const bonosMes = window.currentBonos.filter(b => b.mes === mes);
    if (bonosMes.length >= 3 && !window.currentBonoIndex) {
        showSuccessModal('No se pueden agregar más de 3 turnos de llamado en el mismo mes.', true);
        return;
    }

    const bono = { fechaInicio, fechaFinal, mes };

    if (window.currentBonoIndex !== null) {
        window.currentBonos[window.currentBonoIndex] = { ...bono, id: window.currentBonoId };
    } else {
        window.currentBonos.push(bono);
    }

    const bonosList = document.getElementById('bonos-llamado-list');
    renderBonos(bonosList, window.currentBonos);
    const bonoModal = document.getElementById('bono-llamado-modal');
    bonoModal.style.display = 'none';
    window.currentBonoIndex = null;
    window.currentBonoId = null;
}

async function deleteHoraExtra() {
    try {
        if (!window.currentHoraExtraId) throw new Error('ID de registro no válido');
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const horaExtraRef = doc(db, 'horasExtras', window.currentHoraExtraId);
        const horaExtraDoc = await getDoc(horaExtraRef);
        if (!horaExtraDoc.exists()) {
            throw new Error('El registro no existe');
        }
        if (horaExtraDoc.data().uid !== user.uid) {
            throw new Error('No tienes permisos para eliminar este registro');
        }

        await logAction(window.currentHoraExtraId, { uid: user.uid });
        await deleteDoc(horaExtraRef);

        const bonosQuery = query(
            collection(db, 'bonosLlamado'),
            where('horaExtraId', '==', window.currentHoraExtraId)
        );
        const bonosSnapshot = await getDocs(bonosQuery);
        for (const bonoDoc of bonosSnapshot.docs) {
            await deleteDoc(doc(db, 'bonosLlamado', bonoDoc.id));
        }

        showSuccessModal('Registro y bonos asociados eliminados correctamente.');
        loadHorasExtras();
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.style.display = 'none';
        window.currentHoraExtraId = null;
    } catch (error) {
        showSuccessModal(`Error al eliminar registro: ${error.message}`, true);
    }
}

function initializeModule() {
    const requiredElements = {
        'horas-extras-list': 'Lista de horas extras',
        'crear-hora-extra-btn': 'Botón para crear registro',
        'hora-extra-modal': 'Modal de edición',
        'hora-extra-modal-title': 'Título del modal',
        'hora-extra-titulo': 'Input del título',
        'hora-extra-mes': 'Input del mes',
        'entradas-list-50': 'Lista de entradas al 50%',
        'entradas-list-100': 'Lista de entradas al 100%',
        'bonos-llamado-list': 'Lista de bonos',
        'add-horas-50-btn': 'Botón para horas al 50%',
        'add-horas-100-btn': 'Botón para horas al 100%',
        'add-bono-llamado-btn': 'Botón para agregar bono',
        'save-hora-extra-btn': 'Botón para guardar registro',
        'download-excel-btn': 'Botón para descargar Excel',
        'cancel-hora-extra-btn': 'Botón para cancelar registro',
        'entrada-modal': 'Modal de entrada',
        'entrada-modal-title': 'Título del modal de entrada',
        'entrada-fecha': 'Input de fecha',
        'entrada-hora-entrada': 'Input de hora de entrada',
        'entrada-hora-salida': 'Input de hora de salida',
        'entrada-motivo': 'Input de motivo',
        'save-entrada-btn': 'Botón para guardar entrada',
        'cancel-entrada-btn': 'Botón para cancelar entrada',
        'bono-llamado-modal': 'Modal de bono',
        'bono-llamado-modal-title': 'Título del modal de bono',
        'bono-fecha-inicio': 'Input de fecha inicio',
        'bono-fecha-final': 'Input de fecha final',
        'save-bono-btn': 'Botón para guardar bono',
        'cancel-bono-btn': 'Botón para cancelar bono',
        'delete-modal': 'Modal de eliminación',
        'confirm-delete-btn': 'Botón para confirmar eliminación',
        'cancel-delete-btn': 'Botón para cancelar eliminación',
        'success-modal': 'Modal de éxito',
        'success-icon': 'Ícono de éxito'
    };

    for (const [id, description] of Object.entries(requiredElements)) {
        if (!document.getElementById(id)) {
            alert(`Error: No se encontró el elemento ${description}. Por favor, recarga la página.`);
            return;
        }
    }

    if (!document.querySelector('.success-message')) {
        alert('Error: No se encontró el elemento Mensaje de éxito. Por favor, recarga la página.');
        return;
    }

    const crearHoraExtraBtn = document.getElementById('crear-hora-extra-btn');
    const addHoras50Btn = document.getElementById('add-horas-50-btn');
    const addHoras100Btn = document.getElementById('add-horas-100-btn');
    const addBonoLlamadoBtn = document.getElementById('add-bono-llamado-btn');
    const saveHoraExtraBtn = document.getElementById('save-hora-extra-btn');
    const downloadExcelBtn = document.getElementById('download-excel-btn');
    const cancelHoraExtraBtn = document.getElementById('cancel-hora-extra-btn');
    const saveEntradaBtn = document.getElementById('save-entrada-btn');
    const cancelEntradaBtn = document.getElementById('cancel-entrada-btn');
    const saveBonoBtn = document.getElementById('save-bono-btn');
    const cancelBonoBtn = document.getElementById('cancel-bono-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    crearHoraExtraBtn.addEventListener('click', () => openEditModal());
    addHoras50Btn.addEventListener('click', () => openEntradaModal(null, null, '50%'));
    addHoras100Btn.addEventListener('click', () => openEntradaModal(null, null, '100%'));
    addBonoLlamadoBtn.addEventListener('click', () => openBonoModal());
    saveHoraExtraBtn.addEventListener('click', saveHoraExtra);
    downloadExcelBtn.addEventListener('click', exportToExcel);
    cancelHoraExtraBtn.addEventListener('click', () => {
        const horaExtraModal = document.getElementById('hora-extra-modal');
        horaExtraModal.style.display = 'none';
        const horaExtraTituloInput = document.getElementById('hora-extra-titulo');
        const horaExtraMesInput = document.getElementById('hora-extra-mes');
        horaExtraTituloInput.value = '';
        horaExtraMesInput.value = '';
        window.currentEntradas = [];
        window.currentBonos = [];
        window.currentHoraExtraId = null;
    });
    saveEntradaBtn.addEventListener('click', saveEntrada);
    cancelEntradaBtn.addEventListener('click', () => {
        const entradaModal = document.getElementById('entrada-modal');
        entradaModal.style.display = 'none';
        window.currentEntradaIndex = null;
        window.currentTipoHora = null;
    });
    saveBonoBtn.addEventListener('click', saveBono);
    cancelBonoBtn.addEventListener('click', () => {
        const bonoModal = document.getElementById('bono-llamado-modal');
        bonoModal.style.display = 'none';
        window.currentBonoIndex = null;
        window.currentBonoId = null;
    });
    confirmDeleteBtn.addEventListener('click', deleteHoraExtra);
    cancelDeleteBtn.addEventListener('click', () => {
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.style.display = 'none';
        window.currentHoraExtraId = null;
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            loadHorasExtras();
        } else {
            showSuccessModal('Error: Usuario no autenticado. Por favor, inicia sesión.', true);
        }
    });

    window.addEventListener('moduleCleanup', () => {
        const horaExtraModal = document.getElementById('hora-extra-modal');
        const entradaModal = document.getElementById('entrada-modal');
        const bonoModal = document.getElementById('bono-llamado-modal');
        const deleteModal = document.getElementById('delete-modal');
        const successModal = document.getElementById('success-modal');
        if (horaExtraModal) horaExtraModal.style.display = 'none';
        if (entradaModal) entradaModal.style.display = 'none';
        if (bonoModal) bonoModal.style.display = 'none';
        if (deleteModal) deleteModal.style.display = 'none';
        if (successModal) successModal.style.display = 'none';
    });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeModule, 0);
} else {
    document.addEventListener('DOMContentLoaded', initializeModule);
}