import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js';

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

const particleConfig = {
    light: {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#3182ce" },
            shape: { type: "star", stroke: { width: 0 } },
            opacity: { value: 0.7, random: true },
            size: { value: 4, random: true },
            move: { enable: true, speed: 4, direction: "none", random: true, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "bubble" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: { bubble: { distance: 200, size: 6, opacity: 0.8 }, push: { particles_nb: 3 } }
        },
        retina_detect: true
    },
    dark: {
        particles: {
            number: { value: 60, density: { enable: true, value_area: 800 } },
            color: { value: "#63b3ed" },
            shape: { type: "star", stroke: { width: 0 } },
            opacity: { value: 0.7, random: true },
            size: { value: 4, random: true },
            move: { enable: true, speed: 4, direction: "none", random: true, out_mode: "out" }
        },
        interactivity: {
            detect_on: "canvas",
            events: { onhover: { enable: true, mode: "bubble" }, onclick: { enable: true, mode: "push" }, resize: true },
            modes: { bubble: { distance: 200, size: 6, opacity: 0.8 }, push: { particles_nb: 3 } }
        },
        retina_detect: true
    }
};

const savedMode = localStorage.getItem('theme') || 'dark';
particlesJS('particles-js', particleConfig[savedMode]);

function updateParticles(theme) {
    particlesJS('particles-js', particleConfig[theme]);
}

// Resto del código (sin cambios)
const toggleModeButton = document.getElementById('toggle-mode');
const body = document.body;
const toggleIcon = toggleModeButton.querySelector('i');
const loginButton = document.getElementById('login-btn');
const loginModal = document.getElementById('login-modal');
const closeModalButton = document.getElementById('close-modal');
const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const passwordInput = document.getElementById('password');
const passwordToggle = document.getElementById('password-toggle');
const capsLockMessage = document.getElementById('caps-lock-message');

if (savedMode === 'dark') {
    body.classList.add('dark-mode');
    toggleIcon.classList.remove('fa-sun');
    toggleIcon.classList.add('fa-moon');
} else {
    body.classList.remove('dark-mode');
    toggleIcon.classList.remove('fa-moon');
    toggleIcon.classList.add('fa-sun');
}

toggleModeButton.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    toggleIcon.classList.toggle('fa-sun', !isDarkMode);
    toggleIcon.classList.toggle('fa-moon', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateParticles(isDarkMode ? 'dark' : 'light');
});

loginButton.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
});

closeModalButton.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loginForm.reset();
    passwordInput.type = 'password';
    passwordToggle.classList.remove('fa-eye-slash');
    passwordToggle.classList.add('fa-eye');
    capsLockMessage.classList.add('hidden');
});

passwordToggle.addEventListener('click', () => {
    const isPasswordVisible = passwordInput.type === 'text';
    passwordInput.type = isPasswordVisible ? 'password' : 'text';
    passwordToggle.classList.toggle('fa-eye', isPasswordVisible);
    passwordToggle.classList.toggle('fa-eye-slash', !isPasswordVisible);
});

passwordInput.addEventListener('input', () => {
    if (!passwordInput.value) {
        passwordInput.type = 'password';
        passwordToggle.classList.remove('fa-eye-slash');
        passwordToggle.classList.add('fa-eye');
    }
});

passwordInput.addEventListener('keydown', (e) => {
    if (e.getModifierState) {
        const isCapsLockOn = e.getModifierState('CapsLock');
        capsLockMessage.classList.toggle('hidden', !isCapsLockOn);
    }
});

passwordInput.addEventListener('keyup', (e) => {
    if (e.getModifierState) {
        const isCapsLockOn = e.getModifierState('CapsLock');
        capsLockMessage.classList.toggle('hidden', !isCapsLockOn);
    }
});

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
        js: 'auto/gui.js'
    }
];

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.querySelector('#username').value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        errorMessage.textContent = 'Por favor, complete todos los campos.';
        errorMessage.classList.remove('hidden');
        return;
    }

    try {
        console.log('Estado de autenticación antes de consultar userData:', auth.currentUser);
        console.log('Consultando userData para username:', username);
        const usernameRef = doc(db, 'userData', username);
        const userData = await getDoc(usernameRef);

        if (!userData.exists()) {
            console.log('Usuario no encontrado en userData:', username);
            errorMessage.textContent = 'No se encontró el usuario.';
            errorMessage.classList.remove('none');
            return;
        }

        const email = userData.data().email;
        const userId = userData.data().userId;

        console.log('Intentando iniciar con email:', email);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (userId !== user.uid) {
            console.log('Error: ID de usuario no coincide. UID:', user.uid, ' userId:', userId);
            errorMessage.textContent = 'Error: ID de usuario no coincide.';
            errorMessage.classList.remove('none');
            return;
        }

        console.log('Leyendo documento de usuario en users:', user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
            console.log('No existe documento en:', user.uid);
            errorMessage.textContent = 'No se encontraron datos de usuario.';
            errorMessage.classList.remove('');
            return;
        }

        const userDocData = userDoc.data();
        console.log('Datos de usuario:', userDocData);
        const permissions = Array.isArray(userDocData.permissions) ? userDocData.permissions : [];
        const userRole = userDocData.role || '';

        localStorage.setItem('userDocId', user.uid);
        localStorage.setItem('userPermissions', JSON.stringify(permissions.map(perm => ({
            option: { name: perm },
            paths: [menuData.find(item => item.name === perm)?.html].filter(Boolean)
        }))));
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userEmail', email);

        console.log('Inicio de sesión exitoso, redirigiendo a main.html');
        window.location.href = 'main.html';

        loginModal.classList.add('hidden');
        errorMessage.classList.add('none');
        loginForm.reset();
        passwordInput.type = 'password';
        passwordToggle.classList.remove('fa-eye-slash');
        passwordToggle.classList.add('fa-eye');
        passwordInput.classList.add('none');

    } catch (error) {
        console.error('Error en el inicio de sesión:', error.code, error.message);
        let errorText = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
        switch (error.code) {
            case 'auth/wrong-password':
                errorText = 'Usuario o contraseña incorrectos.';
                break;
            case 'auth/user-not-found':
                errorText = 'No se encontró el usuario.';
                break;
            case 'auth/too-many-requests':
                errorText = 'Demasiados intentos fallidos. Intenta de nuevo más tarde.';
                break;
            case 'auth/invalid-email':
                errorText = 'El correo asociado al usuario es inválido.';
                break;
            case 'firestore/permission-denied':
                errorText = 'Permiso denegado para acceder a los datos del usuario. Contacta al administrador.';
                break;
            default:
                errorText = `Error: ${error.message}`;
        }
        errorMessage.textContent = errorText;
        errorMessage.classList.remove('none');
    }
});