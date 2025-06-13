import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAy39QMZJLT-MUH2CoOaU4U2VB8xZLc-fw",
  authDomain: "lab-files-c993f.firebaseapp.com",
  projectId: "lab-files-c993f",
  storageBucket: "lab-files-c993f.firebasestorage.app",
  messagingSenderId: "500468873323",
  appId: "1:500468873323:web:b300070f13e4913e6b592e",
  measurementId: "G-WVFF0MK5F0"
};

try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    console.log('Firebase inicializado:', app.name);
    console.log('Firestore inicializado para proyecto:', firebaseConfig.projectId);

    const particleConfig = {
        light: {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: ['#1a202c', '#3182ce', '#2f855a'] },
                shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
                opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
                size: { value: 3, random: true, anim: { enable: false } },
                line_linked: { enable: true, distance: 150, color: '#1a202c', opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
                modes: { grab: { distance: 200, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        },
        dark: {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 } },
                color: { value: ['#e2e8f0', '#63b3ed', '#38a169'] },
                shape: { type: 'circle', stroke: { width: 0, color: '#000000' } },
                opacity: { value: 0.5, random: true, anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false } },
                size: { value: 3, random: true, anim: { enable: false } },
                line_linked: { enable: true, distance: 150, color: '#e2e8f0', opacity: 0.4, width: 1 },
                move: { enable: true, speed: 2, direction: 'none', random: false, straight: false, out_mode: 'out', bounce: false }
            },
            interactivity: {
                detect_on: 'canvas',
                events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: true, mode: 'push' }, resize: true },
                modes: { grab: { distance: 200, line_linked: { opacity: 1 } }, push: { particles_nb: 4 } }
            },
            retina_detect: true
        }
    };

    const savedMode = localStorage.getItem('theme') || 'dark';
    particlesJS('particles-js', particleConfig[savedMode]);

    function updateParticles(theme) {
        particlesJS('particles-js', particleConfig[theme]);
    }

    const toggleModeButton = document.getElementById('toggle-mode');
    const body = document.body;
    const toggleIcon = toggleModeButton.querySelector('i');
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
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

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = document.getElementById('confirm-password').value;

        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');

        if (!username || !email || !password || !confirmPassword) {
            errorMessage.textContent = 'Por favor, completa todos los campos.';
            errorMessage.classList.remove('hidden');
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Las contraseñas no coinciden.';
            errorMessage.classList.remove('hidden');
            return;
        }

        if (password.length < 8) {
            errorMessage.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            errorMessage.classList.remove('hidden');
            return;
        }

        try {
            console.log('Probando conexión a Firestore');
            try {
                const testDocRef = doc(db, 'testCollection', 'testDoc');
                await setDoc(testDocRef, { test: true });
                const testQuery = await getDocs(collection(db, 'testCollection'));
                console.log('Consulta de prueba exitosa:', testQuery.size, 'documentos encontrados');
                await setDoc(testDocRef, { test: false }); // Limpieza
            } catch (testError) {
                console.error('Error en consulta de prueba:', testError.code, testError.message);
                throw testError;
            }

            console.log('Verificando disponibilidad de username:', username);
            const usernameRef = doc(db, 'userData', username);
            const usernameSnap = await getDoc(usernameRef);

            if (usernameSnap.exists()) {
                console.log('Nombre de usuario ya registrado:', username);
                errorMessage.textContent = 'El nombre de usuario ya está registrado.';
                errorMessage.classList.remove('hidden');
                return;
            }

            console.log('Creando usuario con email:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('Usuario creado con UID:', user.uid);

            const timestamp = new Date().toISOString();
            console.log('Guardando documento en users:', user.uid);
            await setDoc(doc(db, 'users', user.uid), {
                email: email,
                role: 'admin',
                permissions: ['Horas Extras'],
                createdAt: timestamp
            });

            console.log('Guardando documento en userData:', username);
            await setDoc(doc(db, 'userData', username), {
                email: email,
                userId: user.uid,
                createdAt: timestamp
            });

            console.log('Registro exitoso para usuario:', username);
            successMessage.textContent = 'Usuario registrado con éxito. Redirigiendo al inicio de sesión...';
            successMessage.classList.remove('hidden');
            errorMessage.classList.add('hidden');

            registerForm.reset();
            passwordInput.type = 'password';
            passwordToggle.classList.remove('fa-eye-slash');
            passwordToggle.classList.add('fa-eye');
            capsLockMessage.classList.add('hidden');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } catch (error) {
            console.error('Error en el registro:', error.code, error.message);
            let errorText = 'Error al registrar usuario. Por favor, intenta de nuevo.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorText = 'El correo electrónico ya está registrado.';
                    break;
                case 'auth/invalid-email':
                    errorText = 'Correo electrónico inválido.';
                    break;
                case 'auth/weak-password':
                    errorText = 'La contraseña es demasiado débil.';
                    break;
                case 'firestore/permission-denied':
                    errorText = 'Permisos insuficientes para crear el usuario. Contacta al administrador.';
                    break;
                default:
                    errorText = `Error: ${error.message}`;
            }
            errorMessage.textContent = errorText;
            errorMessage.classList.remove('hidden');
            successMessage.classList.add('hidden');
        }
    });
} catch (initError) {
    console.error('Error al inicializar Firebase:', initError.message);
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = 'Error al conectar con la base de datos. Contacta al administrador.';
    errorMessage.classList.remove('hidden');
}