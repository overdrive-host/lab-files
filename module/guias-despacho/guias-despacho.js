import { getAuth } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, serverTimestamp, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';

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

function formatDateForTable(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
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

async function loadGuias(searchTerm = '') {
    const guiasList = document.getElementById('guias-list');
    const loadingScreen = document.getElementById('loadingScreen');
    if (!guiasList) {
        showSuccessModal('Error: No se pudo cargar la lista de guías.', true);
        return;
    }

    if (loadingScreen) loadingScreen.style.display = 'flex';
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        let guiasQuery = query(
            collection(db, 'guiasDespacho'),
            where('uid', '==', user.uid)
        );

        if (searchTerm) {
            // Firestore no soporta búsqueda de texto parcial en 'folio' directamente.
            // Filtraremos localmente tras obtener los documentos.
        }

        const guiasSnapshot = await getDocs(guiasQuery);
        guiasList.innerHTML = '';
        guiasSnapshot.forEach(doc => {
            const guia = doc.data();
            if (!searchTerm || guia.folio.toString().includes(searchTerm)) {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span class="guia-titulo">${guia.folio || '-'}</span>
                    <div class="guia-info">
                        <span>Fecha: ${formatDateForTable(guia.fechaEmision)}</span>
                        <span>Razón Social: ${guia.razonSocial || '-'}</span>
                    </div>
                    <div class="guia-actions">
                        <i class="fas fa-edit" data-id="${doc.id}" title="Editar"></i>
                        <i class="fas fa-trash" data-id="${doc.id}" title="Eliminar"></i>
                    </div>
                `;
                guiasList.appendChild(li);

                li.querySelector('.guia-titulo').addEventListener('click', () => openEditModal(doc.id, guia));
                li.querySelector('.fa-edit').addEventListener('click', () => openEditModal(doc.id, guia));
                li.querySelector('.fa-trash').addEventListener('click', () => openDeleteModal(doc.id));
            }
        });

        if (guiasList.innerHTML === '') {
            guiasList.innerHTML = '<li>No se encontraron guías.</li>';
        }
    } catch (error) {
        console.error('Error al cargar guías:', error);
        showSuccessModal(`Error al cargar guías: ${error.message}`, true);
    } finally {
        if (loadingScreen) loadingScreen.style.display = 'none';
    }
}

function renderDetalles(detallesList, detalles) {
    detallesList.innerHTML = '';
    detalles.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.nombre || '-'}</td>
            <td>${item.codigo || '-'}</td>
            <td>${Math.round(parseFloat(item.cantidad) || 0)}</td>
            <td>${item.descripcion || '-'}</td>
            <td>${item.fechaVencimiento || '-'}</td>
        `;
        detallesList.appendChild(tr);
    });
}

function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, 297]
    });
    const margin = 10;
    let y = margin;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 2 * margin;

    const addText = (text, x, y, fontSize = 10, maxWidth = 190, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + (lines.length * fontSize * 0.3);
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Guía de Despacho Electrónica ${data.folio || 'Sin Folio'}`, margin, y + 10);
    y += 15;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, maxWidth, 15, "F");
    y = addText("Información del Documento", margin + 5, y + 5, 10, maxWidth, true);
    y = addText(`Folio: ${data.folio || "-"}`, margin + 5, y + 3, 10);
    y = addText(`Fecha de Emisión: ${data.fechaEmision || "-"}`, margin + 5, y + 3, 10);
    y += 15;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, maxWidth, 15, "F");
    y = addText("Emisor", margin + 5, y + 5, 10, maxWidth, true);
    y = addText(`Razón Social: ${data.razonSocial || "-"}`, margin + 5, y + 3, 10);
    y += 15;

    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, maxWidth, 10, "F");
    y = addText("Detalles de los Ítems", margin + 5, y + 5, 10, maxWidth, true);

    const headers = ["Items", "Nombre", "Código", "Cantidad", "Lote", "Vencimiento"];
    const colWidths = [20, 50, 30, 20, 40, 30];
    const colSpacing = 1;
    let x = margin;
    doc.setFillColor(200, 200, 200);
    doc.rect(margin, y, maxWidth, 7, "F");
    headers.forEach((header, i) => {
        doc.text(header, x + 2, y + 5, { maxWidth: colWidths[i] });
        x += colWidths[i] + colSpacing;
    });
    y += 7;

    (data.detalles || []).forEach((item, index) => {
        x = margin;
        const descLines = doc.splitTextToSize(item.nombre || "-", colWidths[1]);
        const rowHeight = Math.max(descLines.length * 4, 10);
        if (y + rowHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
            x = margin;
            doc.setFillColor(200, 200, 200);
            doc.rect(margin, y, maxWidth, 7, "F");
            headers.forEach((header, i) => {
                doc.text(header, x + 2, y + 5, { maxWidth: colWidths[i] });
                x += colWidths[i] + colSpacing;
            });
            y += 7;
        }
        doc.setFillColor(index % 2 === 0 ? 255 : 240, 245, 255);
        doc.rect(margin, y, maxWidth, rowHeight, "F");
        doc.text((index + 1).toString(), x + 2, y + (rowHeight / 2), { maxWidth: colWidths[0], align: "center" });
        x += colWidths[0] + colSpacing;
        doc.text(descLines, x + 2, y + (rowHeight / 2), { maxWidth: colWidths[1] });
        x += colWidths[1] + colSpacing;
        doc.text(item.codigo || "-", x + 2, y + (rowHeight / 2), { maxWidth: colWidths[2], align: "center" });
        x += colWidths[2] + colSpacing;
        doc.text(Math.round(parseFloat(item.cantidad) || 0).toString(), x + 2, y + (rowHeight / 2), { maxWidth: colWidths[3], align: "center" });
        x += colWidths[3] + colSpacing;
        doc.text(item.descripcion || "-", x + 2, y + (rowHeight / 2), { maxWidth: colWidths[4], align: "center" });
        x += colWidths[4] + colSpacing;
        doc.text(item.fechaVencimiento || "-", x + 2, y + (rowHeight / 2), { maxWidth: colWidths[5], align: "center" });
        y += rowHeight;
    });

    return doc;
}

function openEditModal(id = null, guia = null) {
    const guiaModal = document.getElementById('guia-modal');
    if (!guiaModal) {
        showSuccessModal('Error: No se pudo abrir el modal.', true);
        return;
    }

    guiaModal.style.display = 'flex';
    const guiaModalTitle = document.getElementById('guia-modal-title');
    const guiaFolioDisplay = document.getElementById('guia-folio-display');
    const guiaFechaEmisionDisplay = document.getElementById('guia-fecha-emision-display');
    const guiaRazonSocialDisplay = document.getElementById('guia-razon-social-display');
    const xmlFileInput = document.getElementById('xml-file-input');
    const detallesList = document.getElementById('detalles-list').querySelector('tbody');
    const saveGuiaBtn = document.getElementById('save-guia-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');

    if (guia) {
        guiaModalTitle.textContent = 'Editar Guía';
        guiaFolioDisplay.textContent = guia.folio || '-';
        guiaFechaEmisionDisplay.textContent = formatDateForTable(guia.fechaEmision);
        guiaRazonSocialDisplay.textContent = guia.razonSocial || '-';
        window.currentGuiaId = id;
        window.currentGuiaData = guia;
        saveGuiaBtn.disabled = false;
        downloadPdfBtn.disabled = false;
    } else {
        guiaModalTitle.textContent = 'Nueva Guía';
        guiaFolioDisplay.textContent = '-';
        guiaFechaEmisionDisplay.textContent = '-';
        guiaRazonSocialDisplay.textContent = '-';
        xmlFileInput.value = '';
        window.currentGuiaId = null;
        window.currentGuiaData = null;
        saveGuiaBtn.disabled = true;
        downloadPdfBtn.disabled = true;
    }

    renderDetalles(detallesList, guia?.detalles || []);
}

function openDeleteModal(id) {
    const deleteModal = document.getElementById('delete-modal');
    if (!deleteModal) {
        showSuccessModal('Error: No se pudo abrir el modal de eliminación.', true);
        return;
    }
    window.currentGuiaId = id;
    deleteModal.style.display = 'flex';
}

async function saveGuia() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!window.currentGuiaData) {
        showSuccessModal('No hay datos de guía para guardar.', true);
        return;
    }

    const { folio, fechaEmision, razonSocial, detalles } = window.currentGuiaData;
    if (!folio || !fechaEmision || !razonSocial || !detalles || detalles.length === 0) {
        showSuccessModal('Faltan datos requeridos en el XML.', true);
        return;
    }

    if (loadingScreen) loadingScreen.style.display = 'flex';
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        await user.getIdToken(true);

        let guiaId = window.currentGuiaId;
        if (guiaId) {
            const guiaRef = doc(db, 'guiasDespacho', guiaId);
            const guiaData = {
                uid: user.uid,
                folio,
                fechaEmision,
                razonSocial,
                detalles,
                fechaModificacion: serverTimestamp()
            };
            await updateDoc(guiaRef, guiaData);
            showSuccessModal('Guía actualizada correctamente.');
        } else {
            const guiaData = {
                uid: user.uid,
                folio,
                fechaEmision,
                razonSocial,
                detalles,
                fechaCreacion: serverTimestamp()
            };
            const guiaRef = await addDoc(collection(db, 'guiasDespacho'), guiaData);
            guiaId = guiaRef.id;
            showSuccessModal('Guía creada correctamente.');
        }

        loadGuias();
        const guiaModal = document.getElementById('guia-modal');
        guiaModal.style.display = 'none';
        window.currentGuiaId = null;
        window.currentGuiaData = null;
    } catch (error) {
        console.error('Error detallado:', error);
        showSuccessModal(`Error al guardar guía: ${error.message}`, true);
    } finally {
        if (loadingScreen) loadingScreen.style.display = 'none';
    }
}

async function deleteGuia() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.style.display = 'flex';
    try {
        if (!window.currentGuiaId) throw new Error('ID de guía no válido');
        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        await user.getIdToken(true);

        const guiaRef = doc(db, 'guiasDespacho', window.currentGuiaId);
        const guiaDoc = await getDoc(guiaRef);
        if (!guiaDoc.exists()) {
            throw new Error('La guía no existe');
        }
        if (guiaDoc.data().uid !== user.uid) {
            throw new Error('No tienes permisos para eliminar esta guía');
        }

        await deleteDoc(guiaRef);
        showSuccessModal('Guía eliminada correctamente.');
        loadGuias();
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.style.display = 'none';
        window.currentGuiaId = null;
    } catch (error) {
        console.error('Error al eliminar guía:', error);
        showSuccessModal(`Error al eliminar guía: ${error.message}`, true);
    } finally {
        if (loadingScreen) loadingScreen.style.display = 'none';
    }
}

function initializeModule() {
    const requiredElements = {
        'guias-list': 'Lista de guías',
        'crear-guia-btn': 'Botón para crear guía',
        'search-guia-input': 'Input de búsqueda',
        'guia-modal': 'Modal de edición',
        'guia-modal-title': 'Título del modal',
        'guia-folio-display': 'Display de folio',
        'guia-fecha-emision-display': 'Display de fecha de emisión',
        'guia-razon-social-display': 'Display de razón social',
        'xml-file-input': 'Input de archivo XML',
        'detalles-list': 'Lista de detalles',
        'save-guia-btn': 'Botón para guardar guía',
        'download-pdf-btn': 'Botón para visualizar PDF',
        'cancel-guia-btn': 'Botón para cancelar guía',
        'close-guia-btn': 'Botón para cerrar modal',
        'delete-modal': 'Modal de eliminación',
        'confirm-delete-btn': 'Botón para confirmar eliminación',
        'cancel-delete-btn': 'Botón para cancelar eliminación',
        'success-modal': 'Modal de éxito',
        'success-icon': 'Ícono de éxito'
    };

    for (const [id, description] of Object.entries(requiredElements)) {
        if (!document.getElementById(id)) {
            showSuccessModal(`Error: No se encontró el elemento ${description}.`, true);
            return;
        }
    }

    if (!document.querySelector('.success-message')) {
        showSuccessModal('Error: No se encontró el elemento Mensaje de éxito.', true);
        return;
    }

    const crearGuiaBtn = document.getElementById('crear-guia-btn');
    const searchGuiaInput = document.getElementById('search-guia-input');
    const saveGuiaBtn = document.getElementById('save-guia-btn');
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    const cancelGuiaBtn = document.getElementById('cancel-guia-btn');
    const closeGuiaBtn = document.getElementById('close-guia-btn');
    const xmlFileInput = document.getElementById('xml-file-input');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    crearGuiaBtn.addEventListener('click', () => openEditModal());
    searchGuiaInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim();
        loadGuias(searchTerm);
    });
    saveGuiaBtn.addEventListener('click', saveGuia);
    downloadPdfBtn.addEventListener('click', () => {
        if (!window.currentGuiaData) {
            showSuccessModal('No hay datos de guía para visualizar PDF.', true);
            return;
        }
        const pdfDoc = generatePDF(window.currentGuiaData);
        const pdfUrl = pdfDoc.output('bloburl');
        window.open(pdfUrl, '_blank');
    });
    cancelGuiaBtn.addEventListener('click', () => {
        const guiaModal = document.getElementById('guia-modal');
        guiaModal.style.display = 'none';
        window.currentGuiaId = null;
        window.currentGuiaData = null;
    });
    closeGuiaBtn.addEventListener('click', () => {
        const guiaModal = document.getElementById('guia-modal');
        guiaModal.style.display = 'none';
        window.currentGuiaId = null;
        window.currentGuiaData = null;
    });
    confirmDeleteBtn.addEventListener('click', deleteGuia);
    cancelDeleteBtn.addEventListener('click', () => {
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.style.display = 'none';
        window.currentGuiaId = null;
    });

    xmlFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            const xmlString = e.target.result;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlString, "text/xml");

            if (!xmlDoc.querySelector("DTE")) {
                showSuccessModal('El archivo XML no es un DTE válido.', true);
                return;
            }

            const encabezado = xmlDoc.querySelector("Encabezado");
            if (!encabezado) {
                showSuccessModal('El XML no contiene un elemento <Encabezado>.', true);
                return;
            }

            const idDoc = encabezado.querySelector("IdDoc");
            const emisor = encabezado.querySelector("Emisor");
            const detalles = xmlDoc.querySelectorAll("Detalle");

            if (!idDoc || !emisor) {
                showSuccessModal('El XML no contiene los elementos requeridos (IdDoc, Emisor).', true);
                return;
            }

            const getText = (node, tag) => {
                if (!node) return null;
                const element = node.querySelector(tag);
                return element ? element.textContent.trim() : null;
            };

            const guiaData = {
                folio: getText(idDoc, "Folio"),
                fechaEmision: getText(idDoc, "FchEmis"),
                razonSocial: getText(emisor, "RznSoc"),
                detalles: Array.from(detalles).map(detalle => {
                    const cantidadText = getText(detalle, "QtyItem");
                    const cantidad = cantidadText ? parseFloat(cantidadText) : null;
                    return {
                        numeroLinea: getText(detalle, "NroLinDet") || "-",
                        codigo: getText(detalle.querySelector("CdgItem"), "VlrCodigo") || "-",
                        nombre: getText(detalle, "NmbItem") || "-",
                        descripcion: getText(detalle, "DscItem") || "-",
                        cantidad: isNaN(cantidad) ? 0 : cantidad,
                        fechaVencimiento: getText(detalle, "FchVencim") || "-"
                    };
                })
            };

            if (
                !guiaData.folio ||
                !guiaData.fechaEmision ||
                !guiaData.razonSocial ||
                guiaData.detalles.length === 0 ||
                guiaData.detalles.some(d => 
                    !d.nombre || 
                    d.cantidad === null || 
                    isNaN(d.cantidad)
                )
            ) {
                showSuccessModal('El XML no contiene datos válidos o completos.', true);
                return;
            }

            if (!/^\d{4}-\d{2}-\d{2}$/.test(guiaData.fechaEmision)) {
                showSuccessModal('La fecha de emisión en el XML no tiene el formato correcto (AAAA-MM-DD).', true);
                return;
            }

            window.currentGuiaData = guiaData;
            document.getElementById('guia-folio-display').textContent = guiaData.folio;
            document.getElementById('guia-fecha-emision-display').textContent = formatDateForTable(guiaData.fechaEmision);
            document.getElementById('guia-razon-social-display').textContent = guiaData.razonSocial;
            const detallesList = document.getElementById('detalles-list').querySelector('tbody');
            renderDetalles(detallesList, guiaData.detalles);
            document.getElementById('save-guia-btn').disabled = false;
            document.getElementById('download-pdf-btn').disabled = false;
        };
        reader.readAsText(file);
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            loadGuias();
        } else {
            showSuccessModal('Error: Usuario no autenticado. Por favor, inicia sesión.', true);
        }
    });

    window.addEventListener('moduleCleanup', () => {
        const guiaModal = document.getElementById('guia-modal');
        const deleteModal = document.getElementById('delete-modal');
        const successModal = document.getElementById('success-modal');
        if (guiaModal) guiaModal.style.display = 'none';
        if (deleteModal) deleteModal.style.display = 'none';
        if (successModal) successModal.style.display = 'none';
        window.currentGuiaId = null;
        window.currentGuiaData = null;
    });
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initializeModule, 0);
} else {
    document.addEventListener('DOMContentLoaded', initializeModule);
}
