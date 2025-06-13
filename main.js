import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, getIdToken } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

// Cargar librería xlsx al inicio con reintentos
function loadXlsxLibrary(attempts = 3, delay = 1000) {
    return new Promise((resolve, reject) => {
        if (window.XLSX && window.XLSX.utils && window.XLSX.write) {
            console.log('Librería XLSX ya cargada y verificada');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.9/xlsx.full.min.js'; // Actualizado a 0.18.9
        script.async = true;
        script.id = 'xlsx-script'; // Identificador para evitar eliminación accidental

        const tryLoad = (currentAttempt) => {
            script.onload = () => {
                if (window.XLSX && window.XLSX.utils && window.XLSX.write) {
                    console.log('Librería XLSX cargada exitosamente en intento', currentAttempt);
                    resolve();
                } else {
                    console.error('Librería XLSX cargada pero no inicializada correctamente');
                    reject(new Error('Librería XLSX no inicializada'));
                }
            };
            script.onerror = (error) => {
                console.error(`Error al cargar la librería XLSX en intento ${currentAttempt}:`, error);
                if (currentAttempt < attempts) {
                    console.log(`Reintentando carga de XLSX (${currentAttempt + 1}/${attempts})...`);
                    setTimeout(() => {
                        const newScript = document.createElement('script');
                        newScript.src = script.src + `?t=${new Date().getTime()}`; // Evitar caché
                        newScript.async = true;
                        newScript.id = script.id;
                        newScript.onload = script.onload;
                        newScript.onerror = script.onerror;
                        document.head.appendChild(newScript);
                        script.remove();
                        tryLoad(currentAttempt + 1);
                    }, delay);
                } else {
                    reject(new Error('No se pudo cargar la librería XLSX tras varios intentos'));
                }
            };
            document.head.appendChild(script);
        };

        tryLoad(1);
    });
}

setPersistence(auth, browserLocalPersistence)
    .catch(error => console.error('Error al configurar persistencia:', error));

const loadingScreen = document.getElementById('loadingScreen');
const headerDate = document.querySelector('.header-date');
const userName = document.getElementById('userName');
const userLogo = document.getElementById('userLogo');
const userDropdown = document.getElementById('userDropdown');
const toggleModeBtn = document.getElementById('toggle-mode');
const sidebarMenu = document.querySelector('.sidebar-menu');
const sidebarTitle = document.querySelector('.sidebar-title');
const logoutModal = document.getElementById('logoutModal');
const confirmLogout = document.getElementById('confirmLogout');
const cancelLogout = document.getElementById('cancelLogout');
const content = document.querySelector('.content');

const menuData = [
    {
        name: 'Horas Extras',
        icon: 'fa-clock',
        html: 'module/horas-extras/horas-extras.html',
        css: 'module/horas-extras/horas-extras.css',
        js: 'module/horas-extras/horas-extras.js'
    },
    {
        name: 'Guías de Despacho',
        icon: 'fa-truck',
        html: 'module/guias-despacho/guias-despacho.html',
        css: 'module/guias-despacho/guias-despacho.css',
        js: 'module/guias-despacho/guias-despacho.js'
    },
    {
        name: 'Usuarios',
        icon: 'fa-users',
        html: 'module/usuarios/usuarios.html',
        css: 'module/usuarios/usuarios.css',
        js: 'module/usuarios/usuarios.js'
    }
    
];

onAuthStateChanged(auth, async (user) => {
    if (user) {
        if (loadingScreen) loadingScreen.style.display = 'flex';
        try {
            // Cargar xlsx antes de cualquier submódulo
            await loadXlsxLibrary();

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) {
                throw new Error('No se encontró el documento del usuario');
            }
            const userDoc = userSnap.data();

            const userDataQuery = query(collection(db, 'userData'), where('userId', '==', user.uid));
            const userDataSnap = await getDocs(userDataQuery);
            let username = user.email.split('@')[0];
            if (!userDataSnap.empty) {
                const userDataDoc = userDataSnap.docs[0];
                username = userDataDoc.id || username;
            }

            let displayName = username;
            let userIcon = 'img/icono-otro.png';
            let permissions = Array.isArray(userDoc.permissions) ? userDoc.permissions : [];
            let userRole = userDoc.role || '';

            if (userName) {
                userName.textContent = displayName;
            }
            if (userLogo) {
                userLogo.src = userIcon;
            }
            localStorage.setItem('userDocId', user.uid);
            localStorage.setItem('userPermissions', JSON.stringify(permissions.map(perm => ({
                option: perm,
                paths: [menuData.find(item => item.name === perm)?.html].filter(Boolean)
            }))));
            localStorage.setItem('userRole', userRole);

            localStorage.removeItem('cachedSidebarMenu');
            localStorage.removeItem('cachedPermissions');

            renderSidebarMenu(localStorage.getItem('userPermissions'), userRole);

            await loadContent(
                'module/info/informaciones.html',
                'module/info/informaciones.css',
                'module/info/informaciones.js'
            );

            if (loadingScreen) loadingScreen.style.display = 'none';

            await getIdToken(user);
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            if (content) {
                content.innerHTML = `<h2>Error</h2><p>Error al cargar la aplicación: ${error.message}. Contacta al administrador.</p>`;
            }
            if (loadingScreen) loadingScreen.style.display = 'none';
            setTimeout(async () => {
                await signOut(auth);
                window.location.href = 'index.html?error=' + encodeURIComponent(error.message);
            }, 3000);
        }
    } else {
        localStorage.clear();
        window.location.href = 'index.html';
    }
});

function renderSidebarMenu(permissions, userRole) {
    if (!sidebarMenu) return;
    let parsedPermissions = [];
    try {
        parsedPermissions = JSON.parse(permissions || '[]');
        if (!Array.isArray(parsedPermissions)) parsedPermissions = [];
    } catch (e) {
        parsedPermissions = [];
    }

    const allowedOptions = [...new Set(parsedPermissions.map(p => p.option).filter(Boolean))];
    sidebarMenu.innerHTML = '';
    menuData.forEach(item => {
        if (allowedOptions.includes(item.name) || userRole.toLowerCase() === 'admin') {
            const li = document.createElement('li');
            li.classList.add('sidebar-menu-item');
            li.setAttribute('data-option', item.name);
            li.innerHTML = `<i class="fas ${item.icon} sidebar-icon"></i><span class="sidebar-text">${item.name}</span>`;
            li.addEventListener('click', () => loadContent(item.html, item.css, item.js));
            sidebarMenu.appendChild(li);
        }
    });
}

async function loadContent(htmlFile, cssFile, jsFile) {
    try {
        if (!content) {
            console.error('Elemento .content no encontrado en el DOM');
            throw new Error('Elemento .content no encontrado');
        }
        
        // Disparar evento de limpieza
        const cleanupEvent = new CustomEvent('moduleCleanup');
        window.dispatchEvent(cleanupEvent);

        // Limpiar contenido previo
        content.innerHTML = '';
        const existingStyles = document.querySelectorAll('style[data-submodule]');
        existingStyles.forEach(style => style.remove());
        const existingScripts = document.querySelectorAll('script[data-submodule]');
        existingScripts.forEach(script => script.remove());

        // Intentar cargar HTML y CSS
        let htmlContent, cssContent;
        const cachedHtml = localStorage.getItem(`cached_${htmlFile}`);
        const cachedCss = localStorage.getItem(`cached_${cssFile}`);

        try {
            htmlContent = cachedHtml || await (await fetch(htmlFile, { cache: 'no-cache' })).text();
            cssContent = cachedCss || await (await fetch(cssFile, { cache: 'no-cache' })).text();
        } catch (fetchError) {
            console.error(`Error al cargar archivos: ${htmlFile}, ${cssFile}`, fetchError);
            throw new Error(`Error al cargar archivos: ${fetchError.message}`);
        }

        if (!htmlContent || !cssContent) {
            console.error('Contenido HTML o CSS vacío', { htmlFile, htmlLength: htmlContent?.length, cssLength: cssContent?.length });
            throw new Error('Contenido HTML o CSS vacío');
        }

        // Guardar en caché si no está cacheado
        if (!cachedHtml) localStorage.setItem(`cached_${htmlFile}`, htmlContent);
        if (!cachedCss) localStorage.setItem(`cached_${cssFile}`, cssContent);

        // Insertar contenido HTML
        content.innerHTML = htmlContent;

        // Insertar CSS
        const style = document.createElement('style');
        style.setAttribute('data-submodule', htmlFile);
        style.textContent = cssContent;
        document.head.appendChild(style);

        // Verificar DOM
        await new Promise((resolve, reject) => {
            const maxAttempts = 500;
            let attempts = 0;
            const checkDOM = () => {
                const contentContainer = document.querySelector('.content-container');
                if (content.innerHTML) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('Timeout esperando el DOM:', {
                        contentContainer: !!contentContainer,
                        contentInnerHTML: !!content.innerHTML,
                        htmlFile: htmlFile,
                        contentHTML: content.innerHTML.substring(0, 200),
                        documentBody: document.body.innerHTML.substring(0, 200)
                    });
                    content.innerHTML = `<h2>Error</h2><p>No se pudo cargar el módulo: ${htmlFile}. Verifica la consola para más detalles.</p>`;
                    reject(new Error('Timeout esperando el DOM'));
                } else {
                    attempts++;
                    setTimeout(checkDOM, 10);
                }
            };
            setTimeout(checkDOM, 50);
        });

        // Cargar script
        const script = document.createElement('script');
        script.setAttribute('data-submodule', htmlFile);
        script.type = 'module';
        const timestamp = new Date().getTime();
        script.src = `${jsFile}?t=${timestamp}`;
        script.onerror = (error) => {
            console.error(`Error al cargar script ${jsFile}:`, error);
            content.innerHTML = `<h2>Error</h2><p>No se pudo cargar el script: ${error.message}</p>`;
        };
        document.body.appendChild(script);
    } catch (error) {
        console.error(`Error en loadContent (${htmlFile}):`, error);
        content.innerHTML = `<h2>Error</h2><p>Error al cargar el contenido: ${error.message}</p>`;
        throw error;
    }
}

function showOptionsInfo() {
    loadContent(
        'module/info/informaciones/informaciones.html',
        'module/info/informaciones/informaciones.css',
        'module/info/informaciones/informaciones.js'
    );
}

const updateDate = () => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (headerDate) headerDate.textContent = date.toLocaleDateString('es-ES', options);
};
updateDate();

if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = toggleModeBtn.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-sun');
            icon.classList.toggle('fa-moon');
        }
    });
}

if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    if (toggleModeBtn) toggleModeBtn.querySelector('i').classList.replace('fa-sun', 'fa-moon');
}

if (userLogo) {
    userLogo.addEventListener('click', () => {
        if (userDropdown) userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
    });
}

if (userName) {
    userName.addEventListener('click', () => {
        if (userDropdown) userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
    });
}

document.addEventListener('click', (e) => {
    if (userLogo && userName && userDropdown && !userLogo.contains(e.target) && !userName.contains(e.target) && !userDropdown.contains(e.target)) {
        userDropdown.style.display = 'none';
    }
});

document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.getAttribute('data-action');
        switch (action) {
            case 'personal-data':
                loadContent(
                    'module/info/datos-personales/datos-personales.html',
                    'module/info/datos-personales/datos-personales.css',
                    'module/info/datos-personales/datos-personales.js'
                );
                break;
            case 'change-password':
                loadContent(
                    'module/info/cambiar-contrasena/cambiar-contrasena.html',
                    'module/info/cambiar-contrasena/cambiar-contrasena.css',
                    'module/info/cambiar-contrasena/cambiar-contrasena.js'
                );
                break;
            case 'logout':
                if (logoutModal) logoutModal.style.display = 'flex';
                break;
        }
        if (userDropdown) userDropdown.style.display = 'none';
    });
});

if (sidebarTitle) sidebarTitle.addEventListener('click', showOptionsInfo);

if (confirmLogout) {
    confirmLogout.addEventListener('click', async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('userDocId');
            localStorage.removeItem('userPermissions');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('cachedSidebarMenu');
            localStorage.removeItem('cachedPermissions');
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('cached_')) localStorage.removeItem(key);
            });
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });
}

if (cancelLogout) {
    cancelLogout.addEventListener('click', () => {
        if (logoutModal) logoutModal.style.display = 'none';
    });
}

if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });
}