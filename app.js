/* --------------------------------------------------
   MONZINI MECHANICS PLATFORM - CORE ENGINE
   State Management, Camera Scanner, Excel Exporter, SPA Router
-------------------------------------------------- */

// --- CONFIGURACIÓN DE BASE DE DATOS EN LA NUBE (Firebase Realtime Database) ---
// Para conectar múltiples dispositivos, crea una base de datos Realtime en Firebase
// y pega la URL aquí abajo (ejemplo: "https://mi-proyecto-rtdb.firebaseio.com").
// Si se deja vacío, la aplicación funcionará de forma local (Modo Local).
const CONFIG_DATABASE_URL = "https://monzini-mecanica-default-rtdb.firebaseio.com"; 

// --- CONFIGURACIÓN DE FIREBASE AUTH (login anónimo automático) ---
// Necesario porque las reglas de la base de datos ahora exigen "auth != null".
// No pide usuario/contraseña a los técnicos: el navegador inicia sesión anónima
// automáticamente y usa ese token para leer/escribir en Realtime Database.
const FIREBASE_PROJECT_ID = "monzini-mecanica";
const FIREBASE_API_KEY = "AIzaSyD1a7s4tZq9baS_aXVgsoNeq26r7XULO-I";
let firebaseIdToken = null;
let firebaseAuthReady = null;

// --- CONFIGURACIÓN DE ALERTAS POR TELEGRAM ---
// 1. Abre Telegram, busca "@BotFather", envía /newbot y sigue los pasos para crear tu bot.
// 2. BotFather te dará un TOKEN parecido a: 123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
// 3. Pega ese token aquí abajo, reemplazando el texto entre comillas.
// Si se deja vacío (""), las alertas de Telegram quedan desactivadas y el resto de la app funciona igual.
const TELEGRAM_BOT_TOKEN = "8796194319:AAGIaLqTgpjlx-e7d7ozTQZEi5nyA2_jUiw";

// Lista de mecánicos del taller (debe coincidir con las opciones de los <select> en index.html)
const MECHANIC_LIST = [
    "Franklin Nuñez", "Edgar Martinez", "Emerson", "Jose Navarro", "Derson Flores",
    "Ever Humaña", "Jose Montes", "William Murillo", "Hector Fajardo", "Denis Rodriguez"
];

// Personas que reciben copia de respaldo de CADA alerta de Telegram (no solo la suya).
const BACKUP_LIST = ["Franklin Nuñez", "Ever Humaña", "Heidy"];

function initFirebaseAuth() {
    if (!CONFIG_DATABASE_URL || !FIREBASE_API_KEY) {
        firebaseAuthReady = Promise.resolve(null);
        return firebaseAuthReady;
    }
    if (window.firebase && !window.firebase.apps.length) {
        window.firebase.initializeApp({
            apiKey: FIREBASE_API_KEY,
            authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
            databaseURL: CONFIG_DATABASE_URL
        });
    }
    firebaseAuthReady = new Promise((resolve) => {
        if (!window.firebase) { resolve(null); return; }
        window.firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    firebaseIdToken = await user.getIdToken();
                    resolve(firebaseIdToken);
                } catch (e) {
                    console.error("Error obteniendo token de Firebase Auth:", e);
                    resolve(null);
                }
            } else {
                window.firebase.auth().signInAnonymously().catch((err) => {
                    console.error("Error iniciando sesión anónima en Firebase:", err);
                    resolve(null);
                });
            }
        });
    });
    return firebaseAuthReady;
}

// Construye la URL de Realtime Database agregando el token de auth cuando exista
function buildAuthedDbUrl(baseUrl) {
    if (!firebaseIdToken) return baseUrl;
    const sep = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${sep}auth=${firebaseIdToken}`;
}

// --- PIN DE JEFE DE ÁREA ---
// Se usa tanto para desbloquear "Reportes (Jefe)" como para confirmar cambios de
// maquinaria (agregar / editar / eliminar). Cambia el valor aquí y se actualiza en
// ambos lugares automáticamente.
const BOSS_PIN = "1234";

// --- INITIAL DATA & LOCALSTORAGE SEEDING ---
const DEFAULT_MACHINERY = [
    {
        "id": "92Y006450",
        "name": "Siruba DL7200-BMI-16",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-BMI-16",
        "station": "Frente izquierdo",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFJ21739",
        "name": "Juki DDL-9000B-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-55",
        "station": "Frente izquierdo",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOFJOO308",
        "name": "Juki LBH-19905",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-19905",
        "station": "Frente izquierdo",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOEG00622",
        "name": "Juki LBH-17905",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Frente izquierdo",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GF00059",
        "name": "juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "Frente izquierdo",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "22054519172",
        "name": "Jack AGF-E",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Jack",
        "model": "AGF-E",
        "station": "Frente izquierdo",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "U914510036",
        "name": "Singer 591",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Singer",
        "model": "591",
        "station": "Frente Derecho",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK9981",
        "name": "Juki LK-1903B-5",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1903B-5",
        "station": "Frente Derecho",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3HE00346",
        "name": "juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "Frente Derecho",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "22054519169",
        "name": "Jack AGF-E",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Jack",
        "model": "AGF-E",
        "station": "Frente Derecho",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MA00105",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Frente Derecho",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUH12539",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Frente Derecho",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "LHOVD03110",
        "name": "Juki LH-1152-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "LH-1152-6",
        "station": "Frente Derecho",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "261568392",
        "name": "Durkooppader 261",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Durkooppader",
        "model": "261",
        "station": "Cuello",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y024962",
        "name": "Siruba DL7200-NMI-16",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-NMI-16",
        "station": "Cuello",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MA00102",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Cuello",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOHLO2174",
        "name": "Juki DDL-9000B-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-55",
        "station": "Cuello",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuello",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505849",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuello",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MA00103",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Cuello",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "7678866",
        "name": "Willcoy Gibbs 515-E32-430",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Willcoy Gibbs",
        "model": "515-E32-430",
        "station": "Cuello",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFM21206",
        "name": "Juki DDL-9000B-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-55",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFM21190",
        "name": "Juki DLL-9000B-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLL-9000B-55",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "R01431",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUJ0693",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNA36438",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOGE12276",
        "name": "Juki DDL-9000B-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-55",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "Q17319",
        "name": "Juki DDL-5550-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-5550-6",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "696",
        "name": "Epa 203",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Epa",
        "model": "203",
        "station": "Mangas",
        "operationType": "fusionar mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "373-Q52131",
        "name": "Juki MB-373",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "MB-373",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOMB00717",
        "name": "JUKI LBH-1790AN",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LBH-1790AN",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JH00038",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Ensamble",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505744",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505743",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021203",
        "name": "siruba DL7200NMI-16",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200NMI-16",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3HA00108",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MB00089",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Ensamble",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "V89015037",
        "name": "siruba DL7200BMI-16",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200BMI-16",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219LOOO422",
        "name": "siruba 7470-514M-3-24",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "siruba",
        "model": "7470-514M-3-24",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOKJ01676",
        "name": "Juki DDL-9000C",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000C",
        "station": "Ensamble",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y016110",
        "name": "siruba DL7200BMI-16",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200BMI-16",
        "station": "Ensamble",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MA00100",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Ensamble",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GF00094",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Ensamble",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00067",
        "name": "Juki DLN-9010A-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Ensamble",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "504223",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DKNUH06482",
        "name": "Juki DLN-5410-6",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1A00354",
        "name": "Juki LK-1900B-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1900B-55",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HJ02000",
        "name": "Juki LK-1900B-55",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1900B-55",
        "station": "Ensamble",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOEB00835",
        "name": "Juki LBH-17905",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Ensamble",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "M9569076",
        "name": "Juki 371U-2",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Juki",
        "model": "371U-2",
        "station": "Ensamble",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1H502005",
        "name": "juki LK-1903B",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "juki",
        "model": "LK-1903B",
        "station": "Ensamble",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "811393",
        "name": "Jack DDL-8700B-7",
        "area": "Linea del Sid",
        "status": "Operando",
        "brand": "Jack",
        "model": "DDL-8700B-7",
        "station": "Ensamble",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "BG1833615",
        "name": "U. SPECIAL 56500",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56500",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1289582",
        "name": "U. SPECIAL 56300",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA L.R",
        "operationType": "cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1184351",
        "name": "U. SPECIAL 56300",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA L.R",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "120288",
        "name": "U. SPECIAL 56300",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1169578",
        "name": "U. SPECIAL 56300",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA L.R",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1267625",
        "name": "U. SPECIAL 56300",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA L.R",
        "operationType": "cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1742855",
        "name": "U. SPECIAL 56300",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA L.R",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1771040",
        "name": "U. SPECIAL 56300",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA L.R",
        "operationType": "cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "586961",
        "name": "juki DDL-5550-6",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL-5550-6",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "T11311",
        "name": "juki DDL-5550-6",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL-5550-6",
        "station": "ESPALDA L.R",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "80BMF02066",
        "name": "Juki DDL9000C",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DDMF01948",
        "name": "Juki DDL9000C",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DDMF02063",
        "name": "Juki DDL9000C",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLTM11230",
        "name": "juki DDL-5550-6",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL-5550-6",
        "station": "ESPALDA L.R",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLTM11216",
        "name": "juki DDL-5550-6",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL-5550-6",
        "station": "ESPALDA L.R",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLUH15992",
        "name": "Juki DDL-5550-6",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-5550-6",
        "station": "ESPALDA L.R",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DDGG12294",
        "name": "Juki DDL9000C",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00353",
        "name": "Juki DDL9000A",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000A",
        "station": "ESPALDA L.R",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUHOG483",
        "name": "Juki DDLN-5410-6",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDLN-5410-6",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00135",
        "name": "Juki DLN-9010A-55",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "ESPALDA L.R",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89015176",
        "name": "SIRUBA DL7200",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200",
        "station": "ESPALDA L.R",
        "operationType": "plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNTHO1158",
        "name": "juki DLN5410-6",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "D26158495",
        "name": "DURKOPP 261",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "DURKOPP",
        "model": "261",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2615681399",
        "name": "DURKOPP 261",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "DURKOPP",
        "model": "261",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920406454",
        "name": "SIRUBA DL7200BMI-16",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200BMI-16",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "9204016154",
        "name": "SIRUBA DL7200BMI-16",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200BMI-16",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5410-6",
        "name": "Juki 585104",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "585104",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "261568414",
        "name": "DURKOPP 261",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "DURKOPP",
        "model": "261",
        "station": "ESPALDA L.R",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0409183",
        "name": "juki DDL900BB",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL900BB",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "92YDO6434",
        "name": "Juki DL7200",
        "area": "Espaldas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DL7200",
        "station": "ESPALDA L.R",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00066",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "PUÑO HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "261568411",
        "name": "DURKOPP ADLER 261",
        "area": "Hugo",
        "status": "Operando",
        "brand": "DURKOPP ADLER",
        "model": "261",
        "station": "PUÑO HUGO",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GF00068",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "PUÑO HUGO",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GC000302",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "PUÑO HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00129",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "EMSAMBLE HUGO",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5410-6-2",
        "name": "juki DLNVH12563",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLNVH12563",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3DD00226",
        "name": "juki DLN901055",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN901055",
        "station": "EMSAMBLE HUGO",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "3MITD00090",
        "name": "juki MH380",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "MH380",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2181006852",
        "name": "SIRUBA 747LD-514M",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747LD-514M",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219L000381",
        "name": "SIRUBA 747LD-514M",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747LD-514M",
        "station": "EMSAMBLE HUGO",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D36C00294",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L18007821",
        "name": "SIRUBA 747LD-514M",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747LD-514M",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018131",
        "name": "SIRUBA DL7200-NMI-16",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NMI-16",
        "station": "EMSAMBLE HUGO",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018136",
        "name": "SIRUBA DL7200-NMI-16",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NMI-16",
        "station": "EMSAMBLE HUGO",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JL00110",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "EMSAMBLE HUGO",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "3MITD00091",
        "name": "Juki MLT380",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "MLT380",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JL21761",
        "name": "Juki DDL9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000B-55",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "950159",
        "name": "SINGER 261",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SINGER",
        "model": "261",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "BBWBPD4SE00090",
        "name": "Juki DLN5490N-7",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN5490N-7",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00132",
        "name": "Juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "210MG00581",
        "name": "juki LHB1790AN",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "LHB1790AN",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LMF00080",
        "name": "juki LKI903BN",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "LKI903BN",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "6",
        "name": "ASCOLITE B55-15TWINHEAD",
        "area": "Hugo",
        "status": "Operando",
        "brand": "ASCOLITE",
        "model": "B55-15TWINHEAD",
        "station": "EMSAMBLE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "PTX-CT1-00028",
        "name": "TAJINA TEHX-C1218",
        "area": "Hugo",
        "status": "Operando",
        "brand": "TAJINA",
        "model": "TEHX-C1218",
        "station": "BORDADO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MZN-PL9-001033",
        "name": "BARUDAM BEXT-5150ICB11",
        "area": "Hugo",
        "status": "Operando",
        "brand": "BARUDAM",
        "model": "BEXT-5150ICB11",
        "station": "BORDADO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MZN-PL9-00833",
        "name": "BARUDAM BEXT-5150ICB11",
        "area": "Hugo",
        "status": "Operando",
        "brand": "BARUDAM",
        "model": "BEXT-5150ICB11",
        "station": "BORDADO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2205458982",
        "name": "JACK AGF-E",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JACK",
        "model": "AGF-E",
        "station": "CUELLOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "22054519315",
        "name": "JACK AGF-E",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JACK",
        "model": "AGF-E",
        "station": "CUELLOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DL-7200-NMI-16",
        "name": "SIRUBA 919Y024961",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "919Y024961",
        "station": "CUELLOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFJ21750",
        "name": "juki DDL9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000B-55",
        "station": "CUELLOS",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JH00055",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "CUELLOS",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89017203",
        "name": "SIRUBA DLN-7200-NMI-16",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DLN-7200-NMI-16",
        "station": "CUELLOS",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "504244",
        "name": "juki DLN-540-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-540-6",
        "station": "CUELLOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1MDO2297",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "CUELLOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "240933504952",
        "name": "SIRUBA DL7200-NMI-16",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NMI-16",
        "station": "CUELLOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00060",
        "name": "juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "CUELLOS",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "J715928",
        "name": "BROTHER MA4-U92-65",
        "area": "Hugo",
        "status": "Operando",
        "brand": "BROTHER",
        "model": "MA4-U92-65",
        "station": "CUELLOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1MD02297",
        "name": "JUKI LK1903BN",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK1903BN",
        "station": "FRENTES",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "24094504952",
        "name": "JACK JK-T179065-1-D",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JACK",
        "model": "JK-T179065-1-D",
        "station": "FRENTES",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOMF02060",
        "name": "JUKI DDL9000C",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL9000C",
        "station": "FRENTES",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y024967",
        "name": "SIRUBA DL7200-NMI-16",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NMI-16",
        "station": "CAMBIO DE MAQ.",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2DDYA07984",
        "name": "juki DDL9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000B-55",
        "station": "CAMBIO DE MAQ.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DO6F12280",
        "name": "juki DDL9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000B-55",
        "station": "ESPALDAS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLTH11216",
        "name": "juki DDL5550-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL5550-6",
        "station": "ESPALDAS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018133",
        "name": "SIRUBA DL7200-NMI-16",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NMI-16",
        "station": "ESPALDAS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "218K004511",
        "name": "SIRUBA 757KT-516M",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "757KT-516M",
        "station": "ESPALDAS",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DO6E12266",
        "name": "juki DDL-9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL-9000B-55",
        "station": "ESPALDAS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLAE25313",
        "name": "juki DDL-5550N-7",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL-5550N-7",
        "station": "ESPALDAS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MZNPL9-000269",
        "name": "juki DDL9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000B-55",
        "station": "MANGAS DE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00345",
        "name": "juki DLN9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9010A-55",
        "station": "MANGAS DE HUGO",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "PTX-PL1-001067",
        "name": "SIRUBA DL7200B-BM-I",
        "area": "Hugo",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200B-BM-I",
        "station": "MANGAS DE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFM21209",
        "name": "juki DDL9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000B-55",
        "station": "MANGAS DE HUGO",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFM21209-2",
        "name": "juki DDL9000B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000B-55",
        "station": "MANGAS DE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "211HJ02001",
        "name": "juki LK1903B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "LK1903B-55",
        "station": "MANGAS DE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "21DFG00615",
        "name": "juki LBH1790-5",
        "area": "Hugo",
        "status": "Operando",
        "brand": "juki",
        "model": "LBH1790-5",
        "station": "MANGAS DE HUGO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0EBOO833",
        "name": "Juki LBH-17905",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOEM00515",
        "name": "Juki LBH-17905",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505418",
        "name": "N/D N/D",
        "area": "Hugo",
        "status": "Operando",
        "brand": "N/D",
        "model": "N/D",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "M2NPL1-000202",
        "name": "Juki 5410-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00352",
        "name": "N/D N/D",
        "area": "Hugo",
        "status": "Operando",
        "brand": "N/D",
        "model": "N/D",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "515-E32-4030",
        "name": "JUKI DLN-9010",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505418-2",
        "name": "Willcox & Gibbs 355-5XS",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Willcox & Gibbs",
        "model": "355-5XS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNXA20771",
        "name": "JUKI DLN-52110-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-52110-6",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "506180",
        "name": "JUKI DLN-5410-7",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-7",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505740",
        "name": "Juki DLN-5410-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GCOO297",
        "name": "Juki DNL-5410-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DNL-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUH06481",
        "name": "Juki DLN-9010A",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "502225",
        "name": "Juki MA4-9265-5",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "MA4-9265-5",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00348",
        "name": "Juki DLN-5410-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "PTX-PL2-000115",
        "name": "Juki DLN-5410-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUH06479",
        "name": "Brother DLN-9010-ASS",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Brother",
        "model": "DLN-9010-ASS",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505054",
        "name": "Juki CP-311",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "CP-311",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00063",
        "name": "Juki DL7200-BM1",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DL7200-BM1",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "HG-074",
        "name": "Juki DLN-9010-ASS",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010-ASS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X40024468",
        "name": "LUNA PRESS CP-311",
        "area": "Hugo",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-311",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNVKL3075",
        "name": "Siruba DL-7200-BMI",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL-7200-BMI",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00347",
        "name": "JUKI DLN5410-6",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN5410-6",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "HG-078",
        "name": "Juki DLN-9010A-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOF521632",
        "name": "LUNA PRESS T323",
        "area": "Hugo",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "T323",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "261568514",
        "name": "JUKI DDL-9000B-SS",
        "area": "Hugo",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Cuellos",
        "operationType": "Sobre/cost. cuello",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "335-5X5",
        "name": "ADLER 261",
        "area": "Hugo",
        "status": "Operando",
        "brand": "ADLER",
        "model": "261",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "211HJ02638",
        "name": "Willcox & Gibbs 515-E32-450",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Willcox & Gibbs",
        "model": "515-E32-450",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "230772053",
        "name": "Juki LK-1903B-55",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1903B-55",
        "station": "Cuellos",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y024968",
        "name": "Siruba LBH5-17905",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Siruba",
        "model": "LBH5-17905",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOEG11921",
        "name": "Siruba DL7200",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JH00042",
        "name": "Juki DDL-9000",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOFK00200",
        "name": "Juki DLN-9010",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010",
        "station": "Cuellos",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HJO1996",
        "name": "Juki LBH-17905",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "HG-089",
        "name": "Juki LK-19031B",
        "area": "Hugo",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-19031B",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8L3NE00713",
        "name": "juki LH358A-7",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LH358A-7",
        "station": "CUELLOS Y PUÑOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505418-3",
        "name": "juki DLN5410-6",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "CUELLOS Y PUÑOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505150",
        "name": "juki DLN5410-6",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "CUELLOS Y PUÑOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00061",
        "name": "juki DLN-9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "CUELLOS Y PUÑOS",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505385",
        "name": "juki DLN5410-6",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "CUELLOS Y PUÑOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNTJ01534",
        "name": "juki DLN5410-6",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "CUELLOS Y PUÑOS",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1EG01994",
        "name": "juki LK-1903A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LK-1903A-55",
        "station": "CUELLOS Y PUÑOS",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LDFK00201",
        "name": "juki LBH-17905",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LBH-17905",
        "station": "CUELLOS Y PUÑOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "179095240",
        "name": "JACK T1790BK-IM",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "JACK",
        "model": "T1790BK-IM",
        "station": "CUELLOS Y PUÑOS",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "7607117",
        "name": "WILCOX 515-E32-420",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "WILCOX",
        "model": "515-E32-420",
        "station": "CUELLOS Y PUÑOS",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919YO21297",
        "name": "SIRUBA DL7200-NMI-16",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NMI-16",
        "station": "ESPALDA",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1782907",
        "name": "U. SPECIAL 56300",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ESPALDA",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFJ21717",
        "name": "Juki DDL9000B-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000B-55",
        "station": "ESPALDA",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1842000016",
        "name": "SIRUBA A5001",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "A5001",
        "station": "FRENTE DERECHO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "128361667",
        "name": "SIRUBA DL7000-NMI-13",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7000-NMI-13",
        "station": "FRENTE DERECHO",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1064843",
        "name": "U. SPECIAL 56300",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "FRENTE DERECHO",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1075770",
        "name": "U. SPECIAL 56300",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "FRENTE DERECHO",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2192000327",
        "name": "SIRUBA 747LD-514",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747LD-514",
        "station": "FRENTE IZQUIERO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "9194024966",
        "name": "SIRUBA DL7200",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200",
        "station": "FRENTE IZQUIERO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1299960",
        "name": "U. SPECIAL 54400",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "54400",
        "station": "FRENTE IZQUIERO",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MZN-PL1-000510",
        "name": "U. SPECIAL 54400",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "54400",
        "station": "FRENTE IZQUIERO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOEG00610",
        "name": "juki LBH17905",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LBH17905",
        "station": "FRENTE IZQUIERO",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D3JH00036",
        "name": "juki DLN-9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "FRENTE IZQUIERO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNWJL13010",
        "name": "juki DLN5410-6",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "FRENTE IZQUIERO",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOFM00513",
        "name": "juki 2BH1790-5",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "2BH1790-5",
        "station": "MANGA",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1MF00185",
        "name": "juki LK-1903BN",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LK-1903BN",
        "station": "MANGA",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GF00051",
        "name": "juki DLN-9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-9010A-55",
        "station": "MANGA",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505377",
        "name": "Juki LN5410-6",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "Juki",
        "model": "LN5410-6",
        "station": "MANGA",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLVL67713",
        "name": "juki DDL-5550-6",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL-5550-6",
        "station": "MANGA",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "K4518380",
        "name": "BROTHER MA4-V92",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "BROTHER",
        "model": "MA4-V92",
        "station": "ENSAMBLE",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "22054558118",
        "name": "JAK A6F-E",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "JAK",
        "model": "A6F-E",
        "station": "ENSAMBLE",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00126",
        "name": "juki DLN9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9010A-55",
        "station": "ENSAMBLE 1",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF-00059",
        "name": "juki DLN9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9010A-55",
        "station": "ENSAMBLE 1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF-00121",
        "name": "juki DLN9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9010A-55",
        "station": "ENSAMBLE 1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1389775",
        "name": "U. SPECIAL 56400",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56400",
        "station": "ENSAMBLE 1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1491104",
        "name": "U. SPECIAL 56400",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56400",
        "station": "ENSAMBLE 1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219L000392",
        "name": "SIRUBA 747514M-3",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747514M-3",
        "station": "ENSAMBLE 1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1502967290",
        "name": "JACK JK-T1900BJK",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "JACK",
        "model": "JK-T1900BJK",
        "station": "ENSAMBLE 1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1298434",
        "name": "U. SPECIAL 56300",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "ENSAMBLE 1",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8643023",
        "name": "WILLCOX 515-E32",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "WILLCOX",
        "model": "515-E32",
        "station": "ENSAMBLE 1",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8MOKA02803",
        "name": "juki M06716",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "M06716",
        "station": "ENSAMBLE 2",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00124",
        "name": "juki DLN9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9010A-55",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MA00107",
        "name": "juki DLN9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9010A-55",
        "station": "ENSAMBLE 2",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-2",
        "name": "juki MS-1190",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "MS-1190",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "3M8MF00043",
        "name": "juki MS-1190",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "MS-1190",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-3",
        "name": "juki DDL9000C",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000C",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOMDO5245",
        "name": "juki DDL9000C",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000C",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1MD0086",
        "name": "juki LK1903BN",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LK1903BN",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOFJ00030",
        "name": "juki LBH17905",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LBH17905",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1EH00026",
        "name": "juki LK1903-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "LK1903-55",
        "station": "ENSAMBLE 2",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L3MF001023",
        "name": "juki DLN9010A-55",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9010A-55",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOMDO5262",
        "name": "juki DDL9000C",
        "area": "M.T.M",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000C",
        "station": "ENSAMBLE 2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-4",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5406L5879",
        "name": "DURKOPP 540-100",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP",
        "model": "540-100",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-5",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-6",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219KOO2955",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-7",
        "name": "DURKOPP 540-100",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP",
        "model": "540-100",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-8",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-9",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-10",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-11",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-12",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5540606702",
        "name": "DURKOPP 546-100",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP",
        "model": "546-100",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-13",
        "name": "SIRUBA LBH-1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH-1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "540613508",
        "name": "DURKOPP 546-100",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP",
        "model": "546-100",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-14",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-15",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0E600620",
        "name": "Juki LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219KOO2716",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOF100159",
        "name": "Juki LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "170490450",
        "name": "JACK JKT1790BK",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "JKT1790BK",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "LBH-1790",
        "name": "JACK JK.140996620",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "JK.140996620",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOL000148",
        "name": "JACK JKT1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "JKT1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOM600502",
        "name": "Juki LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219KOO2681",
        "name": "SIRUBA LBH1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LBH1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1460195362",
        "name": "JACK JKT1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "JKT1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "176390516",
        "name": "JACK JKT1790",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "JKT1790",
        "station": "Delantero",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUL06513",
        "name": "juki DLN-5410-6",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-5410-6",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNAB36570",
        "name": "juki DLN-5410-7",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN-5410-7",
        "station": "Tomas pink",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018139",
        "name": "siruba DL7200",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200",
        "station": "Tomas pink",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021308",
        "name": "siruba DL7200",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200",
        "station": "Tomas pink",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUJ07127",
        "name": "juki DLN5410-6",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "Tomas pink",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505749",
        "name": "juki DLN5410-6",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNWC16144",
        "name": "juki DLN5410-6",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "Tomas pink",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y003814",
        "name": "siruba DL7200",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200",
        "station": "Tomas pink",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOWB03708",
        "name": "juki MH380",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "MH380",
        "station": "Tomas pink",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1589794",
        "name": "u. special 56400",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "u. special",
        "model": "56400",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1769336",
        "name": "u. special 56400",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "u. special",
        "model": "56400",
        "station": "Tomas pink",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFJ21531",
        "name": "Juki DDL9000",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000",
        "station": "Tomas pink",
        "operationType": "plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DONF02456",
        "name": "Juki DDL8000A",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL8000A",
        "station": "Tomas pink",
        "operationType": "plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JL00106",
        "name": "juki 9010",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "9010",
        "station": "Tomas pink",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOHH061221",
        "name": "juki DDL9000",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X890150921",
        "name": "siruba DL7200",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOF52696",
        "name": "juki DDL9000",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DL7200",
        "name": "siruba 92070161156",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "siruba",
        "model": "92070161156",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018117",
        "name": "siruba DL7200",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200",
        "station": "Tomas pink",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1761",
        "name": "juki 2207451653",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "2207451653",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L4EH00350",
        "name": "juki 9010",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "9010",
        "station": "Tomas pink",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00065",
        "name": "juki 9010",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "9010",
        "station": "Tomas pink",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "C8561106",
        "name": "Brother DB2-B791",
        "area": "Tomas Pink",
        "status": "Operando",
        "brand": "Brother",
        "model": "DB2-B791",
        "station": "Tomas pink",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "T06572",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505394",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505766",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5410-6-3",
        "name": "juki DNWT20212",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DNWT20212",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "502249",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505411",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505376",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUJ06944",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "904246",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MTP-010",
        "name": "juki 5410-6",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "5410-6",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "SINSERIE-16",
        "name": "Juki DDL9000C",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOH202171",
        "name": "Juki DDL9000C",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFJ21557",
        "name": "Juki DDL9000C",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "XDJ21552",
        "name": "juki DDL9000",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOOJ21607",
        "name": "juki DDL9000",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "DDL9000",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOOOG31633",
        "name": "siruba DL7200",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y003805",
        "name": "Juki DDL9000C",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000C",
        "station": "Ensamble #2",
        "operationType": "plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DO0611929",
        "name": "Juki DDL9000A",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000A",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DO0531013",
        "name": "Juki DDL9000",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89015099",
        "name": "Juki DDL9000",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL9000",
        "station": "Ensamble #2",
        "operationType": "plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5972956",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5921729",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5992808",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5950251",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5972208",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5972204",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5992825",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "3M8M100044",
        "name": "jki M51190",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "jki",
        "model": "M51190",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5924440",
        "name": "singer 592 761",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "592 761",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5001619",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "5924914",
        "name": "singer 261",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "singer",
        "model": "261",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "3M8R00032",
        "name": "juki M51190",
        "area": "Mangas Tomas Pink",
        "status": "Operando",
        "brand": "juki",
        "model": "M51190",
        "station": "Ensamble #2",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0FK00202",
        "name": "Juki LBH-1790S",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-1790S",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HJ02636",
        "name": "Juki LK-1903B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1903B-SS",
        "station": "Mangas",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "230772178",
        "name": "Siruba LBH5-1790S",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "LBH5-1790S",
        "station": "Mangas",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1DG00794",
        "name": "Juki LK-1903A-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1903A-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0FM00510",
        "name": "Juki LBH-1790S",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-1790S",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK01241",
        "name": "Juki LK-1903B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1903B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "502176",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D0XE02668",
        "name": "Juki DDL-9000SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D0XF01360",
        "name": "Juki DDL-9000SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNTH01107",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "502246",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018122",
        "name": "Siruba DL7200-NM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-NM1-16",
        "station": "Mangas",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNVG12194",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89017202",
        "name": "Siruba DL7200-NM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-NM1-16",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505298",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "TLNXA20794",
        "name": "Juki DLN-5410N-7",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410N-7",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNAB36468",
        "name": "Juki DLN-5410N-7",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410N-7",
        "station": "Mangas",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021310",
        "name": "Siruba DL7200-NM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-NM1-16",
        "station": "Mangas",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "504707",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "504773",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y024964",
        "name": "Siruba DL7200-NM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-NM1-16",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021296",
        "name": "Siruba DL7200-NM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-NM1-16",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUM08745",
        "name": "Juki DLN-5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00131",
        "name": "Juki DLN-9010A-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-SS",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y003869",
        "name": "Siruba DL7200-BM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-BM1-16",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0FJ21770",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0HL02173",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0FM21205",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLUH15973",
        "name": "Juki DDL-5550-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-5550-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0HH06117",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00068",
        "name": "Juki DLN-9010A-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "800FJ21704",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568405",
        "name": "Durkopp Adler 261",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Durkopp Adler",
        "model": "261",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y006443",
        "name": "Siruba DL7200-BM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-BM1-16",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568489",
        "name": "Durkopp Adler 261",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Durkopp Adler",
        "model": "261",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y006444",
        "name": "Siruba DL7200-BM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-BM1-16",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568515",
        "name": "Durkopp Adler 261",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Durkopp Adler",
        "model": "261",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0HL02172",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y006425",
        "name": "Siruba DL7200-BM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-BM1-16",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2A3AB00092",
        "name": "Juki AMS-210E",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "AMS-210E",
        "station": "Mangas",
        "operationType": "pegar etiqueta AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2A3AB00091",
        "name": "Juki AMS-210E",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "AMS-210E",
        "station": "Mangas",
        "operationType": "pegar etiqueta AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2A3AB00097",
        "name": "Juki AMS-210E",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "AMS-210E",
        "station": "Mangas",
        "operationType": "pegar etiqueta AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2A3DD00403",
        "name": "Juki AMS-210E",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "AMS-210E",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLTM11150",
        "name": "Juki DDL-5550-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-5550-6",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y003796",
        "name": "Siruba DL7200-BM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-BM1-16",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568412",
        "name": "Durkopp Adler 261",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Durkopp Adler",
        "model": "261",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0JA00218",
        "name": "Juki DDL-9000A-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000A-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "F2555672",
        "name": "Brother DB2-B791-413A",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Brother",
        "model": "DB2-B791-413A",
        "station": "Mangas",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "150696145.P",
        "name": "Jack T1900BSK",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Jack",
        "model": "T1900BSK",
        "station": "Mangas",
        "operationType": "Rematadora",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "150696149.P",
        "name": "Jack T1900BSK",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Jack",
        "model": "T1900BSK",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "150696163.P",
        "name": "Jack T1900BSK",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Jack",
        "model": "T1900BSK",
        "station": "Mangas",
        "operationType": "Rematadora",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "M12073",
        "name": "Taking 808",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Taking",
        "model": "808",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "M12072",
        "name": "Taking 808",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Taking",
        "model": "808",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2191000399",
        "name": "Siruba 747 LD",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "747 LD",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "L8526965",
        "name": "Brother LT2-B842-905",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Brother",
        "model": "LT2-B842-905",
        "station": "Mangas",
        "operationType": "plana doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0FM21192",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0EC11163",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GF00052",
        "name": "Juki DLN-9010A-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-SS",
        "station": "Mangas",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8D0FM21188",
        "name": "Juki DDL-9000B-SS",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y006431",
        "name": "Siruba DL7200-BM1-16",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200-BM1-16",
        "station": "Mangas",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568408",
        "name": "Durkopp Adler 261",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Durkopp Adler",
        "model": "261",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505383",
        "name": "Juki 5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505159",
        "name": "Juki 5410-6",
        "area": "Mangas",
        "status": "Operando",
        "brand": "Juki",
        "model": "5410-6",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D36600303",
        "name": "juki 9010",
        "area": "Mangas",
        "status": "Operando",
        "brand": "juki",
        "model": "9010",
        "station": "Mangas",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "535-329",
        "name": "Adler 971",
        "area": "Puños",
        "status": "Operando",
        "brand": "Adler",
        "model": "971",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "494",
        "name": "Adler 971",
        "area": "Puños",
        "status": "Operando",
        "brand": "Adler",
        "model": "971",
        "station": "Puños",
        "operationType": "Cerrar puño AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "410875",
        "name": "Adler 991",
        "area": "Puños",
        "status": "Operando",
        "brand": "Adler",
        "model": "991",
        "station": "Puños",
        "operationType": "Cerrar puño AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "3459",
        "name": "Adler 971",
        "area": "Puños",
        "status": "Operando",
        "brand": "Adler",
        "model": "971",
        "station": "Puños",
        "operationType": "Cerrar puño AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568494",
        "name": "Adler 261",
        "area": "Puños",
        "status": "Operando",
        "brand": "Adler",
        "model": "261",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GC00311",
        "name": "Juki DLN 9010A",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 9010A",
        "station": "Puños",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568401",
        "name": "Adler 261",
        "area": "Puños",
        "status": "Operando",
        "brand": "Adler",
        "model": "261",
        "station": "Puños",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFM21193",
        "name": "Juki DDL-9000 B",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000 B",
        "station": "Puños",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MZN-PL1-000425",
        "name": "Lunapress CP 21.5 A",
        "area": "Puños",
        "status": "Operando",
        "brand": "Lunapress",
        "model": "CP 21.5 A",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "98002",
        "name": "Lunapress CP 21.5 A",
        "area": "Puños",
        "status": "Operando",
        "brand": "Lunapress",
        "model": "CP 21.5 A",
        "station": "Puños",
        "operationType": "Planchar puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "99609",
        "name": "Mimi Industries CP 21.5 A",
        "area": "Puños",
        "status": "Operando",
        "brand": "Mimi Industries",
        "model": "CP 21.5 A",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "XS9018120",
        "name": "Siruba DL 7200-NM1",
        "area": "Puños",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200-NM1",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0M600579",
        "name": "Juki LBH 1790 AN",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH 1790 AN",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1MF01515",
        "name": "Juki LK1903BN",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK1903BN",
        "station": "Puños",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1MF00882",
        "name": "Juki LK-1903 BN",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1903 BN",
        "station": "Puños",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0M600584",
        "name": "Juki LBH 1790 AN",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH 1790 AN",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "140995055",
        "name": "Jack T190BK",
        "area": "Puños",
        "status": "Operando",
        "brand": "Jack",
        "model": "T190BK",
        "station": "Puños",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "140995956",
        "name": "Jack T190BK",
        "area": "Puños",
        "status": "Operando",
        "brand": "Jack",
        "model": "T190BK",
        "station": "Puños",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HC01999",
        "name": "Juki LK 1903",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK 1903",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0FJ00314",
        "name": "Juki LBH 1790 S",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH 1790 S",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0FM00204",
        "name": "Juki LBH 1790 S",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH 1790 S",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1FE00622",
        "name": "Juki LK 1903 AN",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK 1903 AN",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNTH01166",
        "name": "Juki DLN-5410-6",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOHL02177",
        "name": "Juki DDL-9000 B-SS",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000 B-SS",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "823NA00429",
        "name": "Juki LH-3528 A-7",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "LH-3528 A-7",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "JK584501-40",
        "name": "Jack 58450 I",
        "area": "Puños",
        "status": "Operando",
        "brand": "Jack",
        "model": "58450 I",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0225407",
        "name": "Pegasus EX2241-02",
        "area": "Puños",
        "status": "Operando",
        "brand": "Pegasus",
        "model": "EX2241-02",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "039678-7",
        "name": "Pegasus EX2241-02",
        "area": "Puños",
        "status": "Operando",
        "brand": "Pegasus",
        "model": "EX2241-02",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "152445",
        "name": "Pfaff 5616-96/99",
        "area": "Puños",
        "status": "Operando",
        "brand": "Pfaff",
        "model": "5616-96/99",
        "station": "Puños",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOEE31673",
        "name": "Juki DDL-9000 B-SS",
        "area": "Puños",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000 B-SS",
        "station": "Puños",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219L000409",
        "name": "Siruba 747LD-514M",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "747LD-514M",
        "station": "Ens-1",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-002",
        "name": "Willcox & Gibbs 515-E32-430",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Willcox & Gibbs",
        "model": "515-E32-430",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "000646",
        "name": "Brother MH4-V92-92-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Brother",
        "model": "MH4-V92-92-6",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8746218",
        "name": "Pegasus E32-434",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Pegasus",
        "model": "E32-434",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "208K004517",
        "name": "Siruba 757KI-516M",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "757KI-516M",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-006",
        "name": "Willcox & Gibbs 515-E32-430",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Willcox & Gibbs",
        "model": "515-E32-430",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1427192",
        "name": "Union Special 56300",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56300",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1622356",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1742833",
        "name": "Union Special 56300",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56300",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1088368",
        "name": "Union Special 56300",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56300",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1160779",
        "name": "Union Special 56300",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56300",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1756251",
        "name": "Union Special 56300",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56300",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1572795",
        "name": "Union Special 56300",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56300",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1111231",
        "name": "Union Special 56300",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56300",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOWM06452",
        "name": "Juki MH380",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "MH380",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOYL03378",
        "name": "Juki MH380",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "MH380",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1748164",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "150496327",
        "name": "Jack 8558W-1",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Jack",
        "model": "8558W-1",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1596864",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1262803",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "985592",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1854965",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1595609",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1742835",
        "name": "Union Special 56400",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Union Special",
        "model": "56400",
        "station": "Ens-1",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021309",
        "name": "Siruba DL7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "506206",
        "name": "Juki 5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "5410-6",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021295",
        "name": "Siruba DL7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GF00048",
        "name": "Juki DLN 9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 9010",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GF00046",
        "name": "Juki DLN 9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 9010",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "504767",
        "name": "Juki DLN5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN5410-6",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018144",
        "name": "Siruba DL7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNAB36586",
        "name": "Juki DLN 5410-7",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 5410-7",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021292",
        "name": "Siruba DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GC00309",
        "name": "Juki DLN 9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 9010",
        "station": "Ens-1",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00123",
        "name": "Juki DLN 9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 9010",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021299",
        "name": "Siruba DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018141",
        "name": "Siruba DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200",
        "station": "Ens-1",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "F2555680",
        "name": "Brother B 791",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Brother",
        "model": "B 791",
        "station": "Ens-1",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y024963",
        "name": "Siruba DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200",
        "station": "Ens-1",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021294",
        "name": "Siruba DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200",
        "station": "Ens-1",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505149",
        "name": "Juki DLN 5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 5410-6",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505400",
        "name": "Juki DLN 5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 5410-6",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y024967-2",
        "name": "Siruba DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200",
        "station": "Ens-1",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNTL02079",
        "name": "Juki DLN 5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN 5410-6",
        "station": "Ens-1",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018161",
        "name": "Siruba DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL 7200",
        "station": "Ens-1",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUMC01046",
        "name": "JUKI DLN-5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021306",
        "name": "SIRUBA DL7200-NM1-10",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NM1-10",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "380-T14155",
        "name": "JUKI MH-380",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MH-380",
        "station": "Cuellos",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOUE02961",
        "name": "JUKI MH-380",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MH-380",
        "station": "Cuellos",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOUE02987",
        "name": "JUKI MH-380",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MH-380",
        "station": "Cuellos",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOWK06122",
        "name": "JUKI MH-380",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MH-380",
        "station": "Cuellos",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "504545",
        "name": "ADLER 973",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "973",
        "station": "Cuellos",
        "operationType": "Cerrar cuello AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "503043",
        "name": "ADLER 973",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "973",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "458476",
        "name": "ADLER 973",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "973",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "418257",
        "name": "ADLER 973",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "973",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "519097",
        "name": "ADLER 973",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "973",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-057",
        "name": "LUNA PRESS CP-323-T",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323-T",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "534945",
        "name": "ADLER 396",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "396",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "444277",
        "name": "ADLER 396",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "396",
        "station": "Cuellos",
        "operationType": "Despuntar AUT.",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "3139/3",
        "name": "LUNA PRESS CP-323T",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323T",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "526376",
        "name": "ADLER 396",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "396",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-062",
        "name": "LUNA PRESS CP-323T",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323T",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "533921",
        "name": "ADLER 396",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "396",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-064",
        "name": "LUNA PRESS CP-323T",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323T",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "313597",
        "name": "LUNA PRESS CP-323S",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323S",
        "station": "Cuellos",
        "operationType": "planchar cuello",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2027",
        "name": "LUNA PRESS CP-311",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-311",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021307",
        "name": "SIRUBA DL7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFJ21611",
        "name": "JUKI DDL-9000B-SS",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3CF00054",
        "name": "JUKI DLN 9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN 9010",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021304",
        "name": "SIRUBA DL-7200-16",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL-7200-16",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3SF00057",
        "name": "JUKI DLN-9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "800FJ21742",
        "name": "JUKI DDL-9000B-SS",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021300",
        "name": "SIRUBA DL 7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL 7200",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505306",
        "name": "JUKI DLN 5410",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN 5410",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3FC00291",
        "name": "JUKI DLN 9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN 9010",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNWC16159",
        "name": "JUKI DLN 5410",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN 5410",
        "station": "Cuellos",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L0EBOO833-2",
        "name": "Juki LBH-17905",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOEM00515-2",
        "name": "Juki LBH-17905",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505418-4",
        "name": "N/D N/D",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "N/D",
        "model": "N/D",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "M2NPL1-000202-2",
        "name": "Juki 5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00352-2",
        "name": "N/D N/D",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "N/D",
        "model": "N/D",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "515-E32-4030-2",
        "name": "JUKI DLN-9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505418-5",
        "name": "Willcox & Gibbs 355-5XS",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Willcox & Gibbs",
        "model": "355-5XS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNXA20771-2",
        "name": "JUKI DLN-52110-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-52110-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "506180-2",
        "name": "JUKI DLN-5410-7",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-7",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505740-2",
        "name": "Juki DLN-5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3GCOO297-2",
        "name": "Juki DNL-5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DNL-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUH06481-2",
        "name": "Juki DLN-9010A",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "502225-2",
        "name": "Juki MA4-9265-5",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "MA4-9265-5",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00348-2",
        "name": "Juki DLN-5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "PTX-PL2-000115-2",
        "name": "Juki DLN-5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNUH06479-2",
        "name": "Brother DLN-9010-ASS",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Brother",
        "model": "DLN-9010-ASS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505054-2",
        "name": "Juki CP-311",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "CP-311",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3MF00063-2",
        "name": "Juki DL7200-BM1",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DL7200-BM1",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-095",
        "name": "Juki DLN-9010-ASS",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010-ASS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X40024468-2",
        "name": "LUNA PRESS CP-311",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-311",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNVKL3075-2",
        "name": "Siruba DL-7200-BMI",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL-7200-BMI",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3EH00347-2",
        "name": "JUKI DLN5410-6",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN5410-6",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-099",
        "name": "Juki DLN-9010A-55",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-55",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOF521632-2",
        "name": "LUNA PRESS T323",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "T323",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "261568514-2",
        "name": "JUKI DDL-9000B-SS",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "335-5X5-2",
        "name": "ADLER 261",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "ADLER",
        "model": "261",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "211HJ02638-2",
        "name": "Willcox & Gibbs 515-E32-450",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Willcox & Gibbs",
        "model": "515-E32-450",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "230772053-2",
        "name": "Juki LK-1903B-55",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-1903B-55",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y024968-2",
        "name": "Siruba LBH5-17905",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "LBH5-17905",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOEG11921-2",
        "name": "Siruba DL7200",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Siruba",
        "model": "DL7200",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JH00042-2",
        "name": "Juki DDL-9000",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOFK00200-2",
        "name": "Juki DLN-9010",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HJO1996-2",
        "name": "Juki LBH-17905",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "LBH-17905",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "ENS1-110",
        "name": "Juki LK-19031B",
        "area": "ENS-1",
        "status": "Operando",
        "brand": "Juki",
        "model": "LK-19031B",
        "station": "Cuellos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOHL02184",
        "name": "JUKI DDL-9000-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000-SS",
        "station": "Delanteros",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568488",
        "name": "DURKOPP ADLER 261",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP ADLER",
        "model": "261",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "22074515627",
        "name": "JACK A6F-E",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "A6F-E",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "22054519192",
        "name": "JACK A6F-E",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "A6F-E",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "22054518090",
        "name": "JACK A6F-E",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "A6F-E",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOHH06132",
        "name": "JUKI DDL-9000B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNAG38213",
        "name": "JUKI 5410",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "5410",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2204450126523",
        "name": "JACK A6F-E",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "A6F-E",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018107",
        "name": "SIRUBA DL7200-NM1-16",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NM1-16",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89018127",
        "name": "SIRUBA DL7200-NM1-16",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NM1-16",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOEG11902",
        "name": "JUKI DDL-9000B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Delanteros",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "951939",
        "name": "UNION SPECIAL 54400",
        "area": "Frentes",
        "status": "Operando",
        "brand": "UNION SPECIAL",
        "model": "54400",
        "station": "Delanteros",
        "operationType": "Multiaguja cadeneta",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1749360",
        "name": "UNION SPECIAL 54400",
        "area": "Frentes",
        "status": "Operando",
        "brand": "UNION SPECIAL",
        "model": "54400",
        "station": "Delanteros",
        "operationType": "Multiaguja cadeneta",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1763526",
        "name": "UNION SPECIAL 54400",
        "area": "Frentes",
        "status": "Operando",
        "brand": "UNION SPECIAL",
        "model": "54400",
        "station": "Delanteros",
        "operationType": "Multiaguja cadeneta",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1708994",
        "name": "UNION SPECIAL 54400",
        "area": "Frentes",
        "status": "Operando",
        "brand": "UNION SPECIAL",
        "model": "54400",
        "station": "Delanteros",
        "operationType": "Multiaguja cadeneta",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1319091",
        "name": "KANSAI DFB-1412 PTV-1",
        "area": "Frentes",
        "status": "Operando",
        "brand": "KANSAI",
        "model": "DFB-1412 PTV-1",
        "station": "Delanteros",
        "operationType": "Multiaguja cadeneta",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOEE31679",
        "name": "JUKI DDL-9000B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Delanteros",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568402",
        "name": "DURKOPP ADLER 261",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP ADLER",
        "model": "261",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568491",
        "name": "DURKOPP ADLER 261",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP ADLER",
        "model": "261",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOFM21196",
        "name": "JUKI DDL-9000B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Delanteros",
        "operationType": "Plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "218L007776",
        "name": "SIRUBA 747 LD-514M",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747 LD-514M",
        "station": "Delanteros",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8DOEC11154",
        "name": "JUKI DDL-9000B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Delanteros",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "0261568407",
        "name": "DURKOPP ADLER 261",
        "area": "Frentes",
        "status": "Operando",
        "brand": "DURKOPP ADLER",
        "model": "261",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89015017",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Frentes",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Delanteros",
        "operationType": "Plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "7036",
        "name": "AC. XL-75",
        "area": "Frentes",
        "status": "Operando",
        "brand": "AC.",
        "model": "XL-75",
        "station": "Delanteros",
        "operationType": "planchar bolsa",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "6806",
        "name": "AC. XL-75",
        "area": "Frentes",
        "status": "Operando",
        "brand": "AC.",
        "model": "XL-75",
        "station": "Delanteros",
        "operationType": "planchar bolsa",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "EM-027",
        "name": "LUNA PRESS CP-323T",
        "area": "Frentes",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323T",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "18101023217",
        "name": "JACK 58450J",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "58450J",
        "station": "Delanteros",
        "operationType": "plana doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "PL1-000432",
        "name": "BROTHER N/A",
        "area": "Frentes",
        "status": "Operando",
        "brand": "BROTHER",
        "model": "N/A",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1GG00380",
        "name": "JUKI LK-1900",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1900",
        "station": "Delanteros",
        "operationType": "rematadora",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1GD00242",
        "name": "JUKI LK-1900",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1900",
        "station": "Delanteros",
        "operationType": "rematadora",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "141295036",
        "name": "JACK T1900BSK",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JACK",
        "model": "T1900BSK",
        "station": "Delanteros",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK01140",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK00480",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK01138",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK00479",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK00476",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HJ01998",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK00477",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK00471",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HJ02642",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1HK01139",
        "name": "JUKI LK-1903B-SS",
        "area": "Frentes",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Delanteros",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOWK06119",
        "name": "juki MH380",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "MH380",
        "station": "Fuera de uso",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1735330",
        "name": "U. SPECIAL 56400",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56400",
        "station": "Fuera de uso",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOVL02852",
        "name": "juki MH380",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "MH380",
        "station": "Fuera de uso",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8MOKA027285",
        "name": "juki M06716",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "M06716",
        "station": "Fuera de uso",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1113662",
        "name": "U. SPECIAL 56300",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "Fuera de uso",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1389794",
        "name": "U. SPECIAL 56400",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56400",
        "station": "Fuera de uso",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOVA02173",
        "name": "juki MH380",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "MH380",
        "station": "Fuera de uso",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1606916",
        "name": "U. SPECIAL 56300",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "U. SPECIAL",
        "model": "56300",
        "station": "Fuera de uso",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1DH02003",
        "name": "juki LK1903A",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "LK1903A",
        "station": "Fuera de uso",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1DF01193",
        "name": "juki LK1903A",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "LK1903A",
        "station": "Fuera de uso",
        "operationType": "Botonera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "19083000699",
        "name": "jack JKI9270D",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "jack",
        "model": "JKI9270D",
        "station": "Fuera de uso",
        "operationType": "Codo cadeneta",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "504773-2",
        "name": "juki DLN9410-6",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN9410-6",
        "station": "Fuera de uso",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "17042011775",
        "name": "jack 58450-G",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "jack",
        "model": "58450-G",
        "station": "Fuera de uso",
        "operationType": "Plana doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2A3ZF00142",
        "name": "juki AMS-210E",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "AMS-210E",
        "station": "Fuera de uso",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "18101027927",
        "name": "jack 58450-J",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "jack",
        "model": "58450-J",
        "station": "Fuera de uso",
        "operationType": "plana doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNWC16158",
        "name": "juki DLN5410-6",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "juki",
        "model": "DLN5410-6",
        "station": "Fuera de uso",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X8915159",
        "name": "siruba DL7200BM1",
        "area": "Fuera de uso",
        "status": "Operando",
        "brand": "siruba",
        "model": "DL7200BM1",
        "station": "Fuera de uso",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2LOFK00203",
        "name": "JUKI LBH-1790 S",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LBH-1790 S",
        "station": "Desarrollo Producto",
        "operationType": "Ojalera",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2L1EB01520",
        "name": "JUKI LK-1903ASS",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903ASS",
        "station": "Desarrollo Producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "261568396",
        "name": "Dürkopp 261",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "Dürkopp",
        "model": "261",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "186147",
        "name": "Union Especial 54400 K",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "Union Especial",
        "model": "54400 K",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DDLUH15966",
        "name": "JUKI DDL-5550-6",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-5550-6",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "150696156.P",
        "name": "Jack T1900BSK",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "Jack",
        "model": "T1900BSK",
        "station": "Desarrollo de producto",
        "operationType": "Rematadora",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "501176",
        "name": "JUKI DLN-5410N-6",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410N-6",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "92QY006453",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1111255",
        "name": "Union Especial 56200",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "Union Especial",
        "model": "56200",
        "station": "Desarrollo de producto",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNAB36460",
        "name": "JUKI DLN-5410-6",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-6",
        "station": "Desarrollo de producto",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1169552",
        "name": "Union Especial 56300",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "Union Especial",
        "model": "56300",
        "station": "Desarrollo de producto",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "8MOKA02752",
        "name": "JUKI MO-6716S",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MO-6716S",
        "station": "Desarrollo de producto",
        "operationType": "Sorgete",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "505395",
        "name": "JUKI DLN-5410-6",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-6",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JH00056",
        "name": "JUKI DLN-9010A-SS",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010A-SS",
        "station": "Desarrollo de producto",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1742816",
        "name": "Union Especial 56400",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "Union Especial",
        "model": "56400",
        "station": "Desarrollo de producto",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "1467554",
        "name": "Union Especial 56400",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "Union Especial",
        "model": "56400",
        "station": "Desarrollo de producto",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "MHOBF03159",
        "name": "JUKI MH-380",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MH-380",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNTJ01540",
        "name": "JUKI DLN-5410-6",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-6",
        "station": "Desarrollo de producto",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "920Y003830",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Desarrollo de producto",
        "operationType": "plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "919Y021303",
        "name": "SIRUBA DL7200-BM1",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1",
        "station": "Desarrollo de producto",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "P67492",
        "name": "JUKI DDL-5550-6",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-5550-6",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "038RC00347",
        "name": "JUKI MS-1190M",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MS-1190M",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "2D3JH00031",
        "name": "JUKI DLN-9010A-SS",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010A-SS",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "DLNAB36469",
        "name": "JUKI DLN-5410-7",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-7",
        "station": "Desarrollo de producto",
        "operationType": "plana combinada",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "X89015008",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Desarrollo de producto",
        "operationType": "plana sencilla",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "219L000317",
        "name": "SIRUBA 747L-514M",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747L-514M",
        "station": "Desarrollo de producto",
        "operationType": "Sorgete 4 hilos",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "118K073603",
        "name": "SIRUBA C007KD-W322",
        "area": "Desarrollo de producto",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "C007KD-W322",
        "station": "Desarrollo de producto",
        "createdAt": "2026-07-06T20:57:42.033735Z"
    },
    {
        "id": "S04246",
        "name": "Juki DLN-5410-6",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410-6",
        "station": "ENS-2",
        "operationType": "plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2D3GC00303",
        "name": "Juki DLN-9010A-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-9010A-SS",
        "station": "ENS-2",
        "operationType": "plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8L3NA00429",
        "name": "Juki LH-3528A-7",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "LH-3528A-7",
        "station": "ENS-2",
        "operationType": "Plana doble aguja",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "DLNWL20212",
        "name": "Juki DLN-5410N-7",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DLN-5410N-7",
        "station": "ENS-2",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "141305",
        "name": "HOFFMAN P.R",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "HOFFMAN",
        "model": "P.R",
        "station": "ENS-2",
        "operationType": "Fusionar costados",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOHH06129",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "operationType": "plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOEG11929",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "operationType": "plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2DCXFC1351",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOEE31633",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "operationType": "plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOFJ21607",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "operationType": "plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOEC11196",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "operationType": "plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOFJ21552",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "operationType": "plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOHL02171",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "S992805",
        "name": "SINGER 261",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "SINGER",
        "model": "261",
        "station": "ENS-2",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "5972864",
        "name": "SINGER 261",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "SINGER",
        "model": "261",
        "station": "ENS-2",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOEE31013",
        "name": "Juki DDL-9000B-SS",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "DDL-9000B-SS",
        "station": "ENS-2",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "3M8K00032",
        "name": "Juki MS1190",
        "area": "ENS-2",
        "status": "Operando",
        "brand": "Juki",
        "model": "MS1190",
        "station": "ENS-2",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "228755422",
        "name": "SIRUBA LKS-1903AN-SS302",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "LKS-1903AN-SS302",
        "station": "Miselaneos",
        "operationType": "Botonera",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "919Y024965",
        "name": "SIRUBA DL7200-NM1-16",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NM1-16",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "MZN-PL1-000349",
        "name": "LUNA PRESS CP-323T",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323T",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "MZN-PL1-000563",
        "name": "LUNA PRESS CP-323T",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "LUNA PRESS",
        "model": "CP-323T",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "65563",
        "name": "NEW YORKER Oxford Industries, inc.",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "NEW YORKER",
        "model": "Oxford Industries, inc.",
        "station": "Miselaneos",
        "operationType": "planchar cuello",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "MZN-PL1-000352",
        "name": "NEW YORKER Oxford Industries, inc.",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "NEW YORKER",
        "model": "Oxford Industries, inc.",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "1262881",
        "name": "UNION SPECIAL 56300",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "UNION SPECIAL",
        "model": "56300",
        "station": "Miselaneos",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "919Y021356",
        "name": "SIRUBA DL7200B-BM1-17Q",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200B-BM1-17Q",
        "station": "Miselaneos",
        "operationType": "plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "X89018120",
        "name": "SIRUBA DL7200-NM1-16",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NM1-16",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOFJ21528",
        "name": "JUKI DDL-9000B-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Miselaneos",
        "operationType": "Plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "219L000397",
        "name": "SIRUBA 747LD 747LD-514M-3-24/VTE/DKLT1-1",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA 747LD",
        "model": "747LD-514M-3-24/VTE/DKLT1-1",
        "station": "Miselaneos",
        "operationType": "Sorgete",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOFM21187",
        "name": "JUKI DDL-9000B-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Miselaneos",
        "operationType": "Plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "218K004510",
        "name": "SIRUBA 757KT-516M-3-35/CT",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "757KT-516M-3-35/CT",
        "station": "Miselaneos",
        "operationType": "Sorgete",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "919Y021346",
        "name": "SIRUBA DL7200B-BM1-17Q",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200B-BM1-17Q",
        "station": "Miselaneos",
        "operationType": "Plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "PTX-PL3-000345",
        "name": "TRANSFER",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "TRANSFER",
        "model": "",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "19083000851",
        "name": "JACK JK-T9270D-12-2PL-Q-(1/4)",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JACK",
        "model": "JK-T9270D-12-2PL-Q-(1/4)",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "140197699",
        "name": "JACK JK-8558W-1",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JACK",
        "model": "JK-8558W-1",
        "station": "Miselaneos",
        "operationType": "cadeneta doble aguja",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "S914478",
        "name": "SINGER 261",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SINGER",
        "model": "261",
        "station": "Miselaneos",
        "operationType": "codo cadeneta",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "KS322857A",
        "name": "KANSAI SPECIAL FX4413PK-UTC",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "KANSAI SPECIAL",
        "model": "FX4413PK-UTC",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2L1FM00677",
        "name": "JUKI LK-1900AN-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1900AN-SS",
        "station": "Miselaneos",
        "operationType": "rematadora",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "DLNAB36592",
        "name": "JUKI DLN-5410N-7",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410N-7",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "92OY003865",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2MOVL00243",
        "name": "JUKI MO-6900",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MO-6900",
        "station": "Miselaneos",
        "operationType": "Sorgete",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "218L000798",
        "name": "SIRUBA 747LD-514M-3-24/VTE/DKLT1-1",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747LD-514M-3-24/VTE/DKLT1-1",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "923OY006463",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "219L000320",
        "name": "SIRUBA 747DL-514M-3-24/VTE/DKLT1-1",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747DL-514M-3-24/VTE/DKLT1-1",
        "station": "Miselaneos",
        "operationType": "Sorgete",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOGE12258",
        "name": "JUKI DDL-9000B-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Miselaneos",
        "operationType": "Plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2DLOFM00512",
        "name": "JUKI LBH-1790S",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LBH-1790S",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "22054518118",
        "name": "JACK A6F",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JACK",
        "model": "A6F",
        "station": "Miselaneos",
        "operationType": "plana combinada D/AR",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2D3MF00059",
        "name": "JUKI DLN-9010A-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010A-SS",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2D3MF00121",
        "name": "JUKI DLN-9010A-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010A-SS",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "1494104",
        "name": "UNION SPECIAL 53600",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "UNION SPECIAL",
        "model": "53600",
        "station": "Miselaneos",
        "operationType": "Cadeneta doble aguja",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "3M1D00090",
        "name": "JUKI MH-380",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "MH-380",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "218L007092",
        "name": "SIRUBA 747LD-514M-3-24/VTE/DKLT1-1",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747LD-514M-3-24/VTE/DKLT1-1",
        "station": "Miselaneos",
        "operationType": "Sorgete",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "219L000372",
        "name": "SIRUBA 747LD-514M-3-24/VTE/DKLT1-1",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747LD-514M-3-24/VTE/DKLT1-1",
        "station": "Miselaneos",
        "operationType": "Sorgete",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "92OY003824",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "211244",
        "name": "US L-7039-13",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "US",
        "model": "L-7039-13",
        "station": "Miselaneos",
        "operationType": "Cadeneta sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "911399",
        "name": "JUKI DDL-8700B-7",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-8700B-7",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8L3NA01239",
        "name": "JUKI LH-3528A-7",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LH-3528A-7",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "219L000402",
        "name": "SIRUBA 747DL-514M-3-24/VTE/DKLT1-1",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "747DL-514M-3-24/VTE/DKLT1-1",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "128361674",
        "name": "SIRUBA DL7200-NM1-13",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NM1-13",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "919Y021293",
        "name": "SIRUBA DL7200-NM1-16",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-NM1-16",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "0261568493",
        "name": "DURKOPP ADLER 261",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "DURKOPP ADLER",
        "model": "261",
        "station": "Miselaneos",
        "operationType": "Plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "92OY003815",
        "name": "SIRUBA DL7200-BM1-16",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "SIRUBA",
        "model": "DL7200-BM1-16",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "DLNVK13075",
        "name": "JUKI DLN-5410-6",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-5410-6",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "8DOFJ21632",
        "name": "JUKI DDL-9000B-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DDL-9000B-SS",
        "station": "Miselaneos",
        "operationType": "Plana sencilla",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "MZN-PL1-000463",
        "name": "WILLCOX & GIBBS 515-E32-450",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "WILLCOX & GIBBS",
        "model": "515-E32-450",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "G557876",
        "name": "BROTHER MA4-V92-92-6",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "BROTHER",
        "model": "MA4-V92-92-6",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2D3EH000348",
        "name": "JUKI DLN-9010A-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010A-SS",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2D3GC00297",
        "name": "JUKI DLN-9010A-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "DLN-9010A-SS",
        "station": "Miselaneos",
        "operationType": "Plana combinada",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2L1HJ02638",
        "name": "JUKI LK-1903B-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Miselaneos",
        "operationType": "Botonera",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    },
    {
        "id": "2L1HJ01996",
        "name": "JUKI LK-1903B-SS",
        "area": "Miselaneos",
        "status": "Operando",
        "brand": "JUKI",
        "model": "LK-1903B-SS",
        "station": "Miselaneos",
        "createdAt": "2026-08-10T00:00:00.000000Z"
    }
];
const DEFAULT_ORDERS = [];

// --- CATÁLOGO DE PIEZAS (datos importados desde Excel "Catalogo de piezas.xlsx") ---
const DEFAULT_PARTS = [
    { id: "part-30000003", name: "SCREW", partNumber: "0211-000937", price: 46.94, inventoryNumber: "30000003", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000010", name: "GUIA HILO", partNumber: "0540-100480", price: 342.83, inventoryNumber: "30000010", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000011", name: "BARRA DE AGUJA", partNumber: "0540-100580", price: 2558.44, inventoryNumber: "30000011", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000016", name: "SPRING", partNumber: "0540-150090", price: 231.71, inventoryNumber: "30000016", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000017", name: "HOOK", partNumber: "0540-150104", price: 10024.6, inventoryNumber: "30000017", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000018", name: "ENROLLADOR DE HILO", partNumber: "0540-170020", price: 1364.73, inventoryNumber: "30000018", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000024", name: "CILINDRO", partNumber: "0667-115350", price: 145.06, inventoryNumber: "30000024", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000035", name: "BOBINA", partNumber: "0540-150024", price: 4063.51, inventoryNumber: "30000035", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000037", name: "DEPOSIT", partNumber: "0540-350080", price: 565.6, inventoryNumber: "30000037", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000039", name: "GUARD PLATE", partNumber: "0540-350230", price: 262.93, inventoryNumber: "30000039", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000040", name: "KNIFE", partNumber: "0540-350290", price: 967.72, inventoryNumber: "30000040", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000041", name: "KNIFE", partNumber: "0540-350340", price: 474.78, inventoryNumber: "30000041", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000042", name: "CUCHILLA", partNumber: "0540-350350", price: 253.59, inventoryNumber: "30000042", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000046", name: "SPRING", partNumber: "667-110200", price: 106.81, inventoryNumber: "30000046", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000047", name: "BANDA", partNumber: "9130-220080", price: 263.24, inventoryNumber: "30000047", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000049", name: "SCREW", partNumber: "9203-002422", price: 19.46, inventoryNumber: "30000049", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000055", name: "MOTOR DC P/ENBOBINADOR", partNumber: "9800-560006", price: 1174.51, inventoryNumber: "30000055", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000058", name: "THREAD CLAMPING SHEET", partNumber: "0556-000894", price: 348.85, inventoryNumber: "30000058", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000068", name: "TIJERA COMPLETA", partNumber: "400-04255", price: 2411.38, inventoryNumber: "30000068", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000096", name: "BOBBIN CARRETEL", partNumber: "10111300", price: 11.7, inventoryNumber: "30000096", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000109", name: "SPRING", partNumber: "141-47805", price: 75.84, inventoryNumber: "30000109", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000110", name: "UÑA DE CLAMS", partNumber: "141-90458", price: 3422.68, inventoryNumber: "30000110", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000111", name: "UÑA DE CLAMS", partNumber: "141-90557", price: 3569.17, inventoryNumber: "30000111", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000114", name: "PIN", partNumber: "165-57209", price: 156.6, inventoryNumber: "30000114", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000127", name: "HOOK", partNumber: "B1818-280-000", price: 334.25, inventoryNumber: "30000127", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000128", name: "KNIFE", partNumber: "B2421-280-0A0", price: 544.91, inventoryNumber: "30000128", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000129", name: "KNIFE", partNumber: "B2424-280-000", price: 106.75, inventoryNumber: "30000129", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000130", name: "BUSHING", partNumber: "400-10441", price: 337.57, inventoryNumber: "30000130", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000131", name: "BUSHING", partNumber: "400-10442", price: 77.72, inventoryNumber: "30000131", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000132", name: "NEEDLE BAR", partNumber: "400-10573", price: 139.57, inventoryNumber: "30000132", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000135", name: "BOBBIN CASE", partNumber: "B1828-980-0BB", price: 302.16, inventoryNumber: "30000135", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000136", name: "SPRING", partNumber: "GBR01606000", price: 30.73, inventoryNumber: "30000136", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000139", name: "DC MOTOR", partNumber: "GBR108590A0", price: 3606.05, inventoryNumber: "30000139", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000144", name: "PLATE", partNumber: "MAZ15601000", price: 939.57, inventoryNumber: "30000144", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000145", name: "PLATE", partNumber: "MAZ15801000", price: 1466.05, inventoryNumber: "30000145", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000146", name: "BUTTON GUIDE", partNumber: "182-02408", price: 646.85, inventoryNumber: "30000146", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000147", name: "HULE", partNumber: "182-00501", price: 56.15, inventoryNumber: "30000147", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000149", name: "BUTTON CARRIER", partNumber: "165-57902", price: 1624.01, inventoryNumber: "30000149", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000150", name: "SEGURO", partNumber: "RE-0200000-K0", price: 4.54, inventoryNumber: "30000150", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000166", name: "PINS", partNumber: "229-12000", price: 0.0, inventoryNumber: "30000166", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000167", name: "SPRING", partNumber: "229-12109", price: 0.0, inventoryNumber: "30000167", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000170", name: "UPPER BUSHING", partNumber: "236-08003", price: 166.12, inventoryNumber: "30000170", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000171", name: "LOWER BUSHING", partNumber: "236-08102", price: 85.75, inventoryNumber: "30000171", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000172", name: "BUSHING", partNumber: "236-09001", price: 109.04, inventoryNumber: "30000172", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000173", name: "BARRA DE PRENSATELA", partNumber: "236-10207", price: 286.64, inventoryNumber: "30000173", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000177", name: "THREAD PICKERT", partNumber: "236-24257", price: 92.17, inventoryNumber: "30000177", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000180", name: "GUIA ARANA TREBOL", partNumber: "25873", price: 17.23, inventoryNumber: "30000180", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000185", name: "PICKER ASSY", partNumber: "400-36997", price: 46.91, inventoryNumber: "30000185", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000186", name: "PRENSSER BAR GUIDE BRAKET", partNumber: "400-86606", price: 88.71, inventoryNumber: "30000186", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000188", name: "SHOULDER SCREW", partNumber: "400-86664", price: 27.36, inventoryNumber: "30000188", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000191", name: "FINGER POS. HOLDER", partNumber: "400-89607", price: 741.61, inventoryNumber: "30000191", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000197", name: "KNIFE", partNumber: "D2406-555-DOH", price: 118.06, inventoryNumber: "30000197", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000201", name: "PRENSSER BAR", partNumber: "NB3F", price: 790.7, inventoryNumber: "30000201", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000209", name: "SCREW", partNumber: "SD-0460703-TP", price: 23.12, inventoryNumber: "30000209", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000212", name: "HINGE SCREW", partNumber: "229-08909", price: 15.11, inventoryNumber: "30000212", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000215", name: "SCREW", partNumber: "SS-7091110-TP", price: 7.42, inventoryNumber: "30000215", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000218", name: "PLATE", partNumber: "113-00308", price: 376.22, inventoryNumber: "30000218", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000219", name: "KNIFE", partNumber: "113-13053", price: 376.14, inventoryNumber: "30000219", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000223", name: "FEED DOG", partNumber: "D1609-415-B00", price: 256.28, inventoryNumber: "30000223", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000234", name: "NEEDLE BAR BOCK", partNumber: "170-120043", price: 3424.33, inventoryNumber: "30000234", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000245", name: "BRAZO", partNumber: "0196-000433", price: 2862.62, inventoryNumber: "30000245", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000253", name: "PARTS", partNumber: "296-00-144-0", price: 79.12, inventoryNumber: "30000253", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000262", name: "BLOCK", partNumber: "370-12-001-0", price: 2574.14, inventoryNumber: "30000262", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000271", name: "CRANK", partNumber: "396-12-017-0", price: 6195.82, inventoryNumber: "30000271", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000281", name: "BARRA DE AGUJA", partNumber: "0396-120404", price: 5331.76, inventoryNumber: "30000281", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000309", name: "SCREW", partNumber: "9203-313697", price: 18.24, inventoryNumber: "30000309", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000333", name: "CATCHS", partNumber: "971-44-013-0", price: 119.13, inventoryNumber: "30000333", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000336", name: "GUIA DE CUCHILLA", partNumber: "971-440190", price: 1218.86, inventoryNumber: "30000336", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000339", name: "SOPORTE", partNumber: "971-440230", price: 479.32, inventoryNumber: "30000339", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000340", name: "LAINA Z", partNumber: "971-440240", price: 401.92, inventoryNumber: "30000340", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000341", name: "NUT", partNumber: "971-440300", price: 952.02, inventoryNumber: "30000341", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000346", name: "COVER", partNumber: "971-440533", price: 1455.49, inventoryNumber: "30000346", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000371", name: "NUT", partNumber: "980-44-005-0", price: 830.33, inventoryNumber: "30000371", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000372", name: "CAMBIADOR DE PUNTADA", partNumber: "0980-450040", price: 3975.89, inventoryNumber: "30000372", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000378", name: "NUT", partNumber: "992-00-065-0", price: 448.98, inventoryNumber: "30000378", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000448", name: "TUBE LUBRICADOR", partNumber: "971-44-032-0", price: 846.64, inventoryNumber: "30000448", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000451", name: "BASE", partNumber: "971-150093", price: 5037.64, inventoryNumber: "30000451", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000478", name: "POLEA", partNumber: "170-150073", price: 4014.53, inventoryNumber: "30000478", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000491", name: "PALANCA TIRA HILO", partNumber: "0396-120083", price: 5869.43, inventoryNumber: "30000491", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000493", name: "PARTS", partNumber: "396-150080", price: 73.51, inventoryNumber: "30000493", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000510", name: "SUPPORT", partNumber: "396-241970", price: 942.98, inventoryNumber: "30000510", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000521", name: "GUIA", partNumber: "0396-243020", price: 450.55, inventoryNumber: "30000521", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000527", name: "PARTS", partNumber: "396-35-068-3", price: 2253.86, inventoryNumber: "30000527", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000531", name: "PLATO DE GUIA", partNumber: "0396-351160", price: 208.44, inventoryNumber: "30000531", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000549", name: "TORRINGTON BEARING", partNumber: "RCB-101416", price: 801.28, inventoryNumber: "30000549", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000555", name: "PARTS", partNumber: "396-12-007-3", price: 5543.55, inventoryNumber: "30000555", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000575", name: "CILINDRO", partNumber: "999-22-015-5/9700-231018", price: 2443.08, inventoryNumber: "30000575", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000581", name: "JOINT", partNumber: "396-35-113-0", price: 955.09, inventoryNumber: "30000581", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000595", name: "CRUZ PLASTICA", partNumber: "0396-105120", price: 691.18, inventoryNumber: "30000595", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000619", name: "NUT", partNumber: "9231-110037", price: 20.07, inventoryNumber: "30000619", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000650", name: "SCREW", partNumber: "992-01-243-0", price: 21.36, inventoryNumber: "30000650", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000676", name: "BANDA DE TIEMPO", partNumber: "0999-210928", price: 4454.16, inventoryNumber: "30000676", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000699", name: "ROLLERS", partNumber: "973-40-256-0", price: 696.97, inventoryNumber: "30000699", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000721", name: "SCREW", partNumber: "22526C", price: 45.6, inventoryNumber: "30000721", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000724", name: "SCREW", partNumber: "22559-G", price: 43.98, inventoryNumber: "30000724", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000762", name: "BLOCK", partNumber: "51236-G", price: 711.07, inventoryNumber: "30000762", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000773", name: "SPRING", partNumber: "51292-F-5", price: 383.15, inventoryNumber: "30000773", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000776", name: "PLATE", partNumber: "51324W", price: 3188.41, inventoryNumber: "30000776", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000788", name: "SPRING", partNumber: "51959-K", price: 0.0, inventoryNumber: "30000788", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000791", name: "EMPAQUE", partNumber: "52882-P", price: 0.0, inventoryNumber: "30000791", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000827", name: "LEVER", partNumber: "1200001", price: 440.92, inventoryNumber: "30000827", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000870", name: "BOBBIN CARRETEL", partNumber: "91-168144-05", price: 13.61, inventoryNumber: "30000870", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000972", name: "BIMBA STAINLESS", partNumber: "041-DP", price: 1107.88, inventoryNumber: "30000972", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000975", name: "BIMBA STAINLESS", partNumber: "092-P", price: 341.34, inventoryNumber: "30000975", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30000999", name: "YOKE SLIDE INSERT", partNumber: "B1235-373-000", price: 0.0, inventoryNumber: "30000999", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001004", name: "BALIN", partNumber: "B1246-372-000", price: 0.0, inventoryNumber: "30001004", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001011", name: "SPRING", partNumber: "B2017-372-000", price: 0.0, inventoryNumber: "30001011", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001013", name: "DRIVING PINS", partNumber: "B2020-372-000", price: 0.0, inventoryNumber: "30001013", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001015", name: "THREAD GUIDE", partNumber: "B2040-373-000", price: 0.0, inventoryNumber: "30001015", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001019", name: "FEED LEVER", partNumber: "B2510-372-000", price: 0.0, inventoryNumber: "30001019", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001024", name: "SCREW", partNumber: "B2553-372-000", price: 15.97, inventoryNumber: "30001024", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001032", name: "BASE", partNumber: "B2612-372-000", price: 0.0, inventoryNumber: "30001032", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001035", name: "SPRING", partNumber: "B2626-372-000", price: 0.0, inventoryNumber: "30001035", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001040", name: "CLIPPARD", partNumber: "CDR-24-10", price: 2694.79, inventoryNumber: "30001040", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001043", name: "NUT", partNumber: "NS-6150430-SP", price: 0.0, inventoryNumber: "30001043", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001047", name: "SCREW", partNumber: "SD-0600095-TH", price: 0.0, inventoryNumber: "30001047", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001048", name: "SCREW", partNumber: "SD-0640481-SP", price: 0.0, inventoryNumber: "30001048", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001050", name: "SCREW", partNumber: "SS-6152440-SP", price: 0.0, inventoryNumber: "30001050", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001051", name: "SCREW", partNumber: "SS-7080310-SP", price: 0.0, inventoryNumber: "30001051", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001053", name: "SCREW", partNumber: "SS-9120643-TP", price: 0.0, inventoryNumber: "30001053", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001054", name: "SCREW", partNumber: "SS-9621413-SP", price: 0.0, inventoryNumber: "30001054", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001058", name: "ELEMENT", partNumber: "001709", price: 7995.17, inventoryNumber: "30001058", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001060", name: "NEEDLE CLAMP 5MM", partNumber: "277028-920", price: 798.13, inventoryNumber: "30001060", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001074", name: "ELEMENT 2700W.", partNumber: "001710", price: 6258.98, inventoryNumber: "30001074", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001075", name: "ELEMENT 001711", partNumber: "240V.2215W", price: 5900.51, inventoryNumber: "30001075", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001101", name: "BIMBA STAINLESS", partNumber: "702-DXP", price: 4269.79, inventoryNumber: "30001101", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001105", name: "TIMER 100/240V.", partNumber: "H3CR-A8", price: 1700.0, inventoryNumber: "30001105", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001212", name: "OMRON PROGAMABLE CONTROL", partNumber: "CPM-1", price: 2075.0, inventoryNumber: "30001212", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001240", name: "SCREW", partNumber: "142403-001", price: 0.0, inventoryNumber: "30001240", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001261", name: "LEVAS", partNumber: "154582-001", price: 1086.81, inventoryNumber: "30001261", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001263", name: "COLLAR", partNumber: "154594-001", price: 19.09, inventoryNumber: "30001263", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001296", name: "KNIFE", partNumber: "S02637-001", price: 210.23, inventoryNumber: "30001296", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001298", name: "KNIFE", partNumber: "S02645-001", price: 437.17, inventoryNumber: "30001298", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001325", name: "NUT", partNumber: "021660-102", price: 0.0, inventoryNumber: "30001325", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001346", name: "STOP RING", partNumber: "048070-342", price: 0.0, inventoryNumber: "30001346", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001347", name: "SCREW", partNumber: "062680-512", price: 0.0, inventoryNumber: "30001347", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001348", name: "SCREW", partNumber: "062710-812", price: 0.0, inventoryNumber: "30001348", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001354", name: "POSTE DE TENSION", partNumber: "100398-001", price: 0.0, inventoryNumber: "30001354", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001355", name: "SCREW", partNumber: "100659-001", price: 0.0, inventoryNumber: "30001355", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001360", name: "CUCHILLA OJAL 1/2", partNumber: "107200-001", price: 20.3, inventoryNumber: "30001360", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001361", name: "CUTTER 7/16", partNumber: "107204-001", price: 242.34, inventoryNumber: "30001361", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001362", name: "KNIFE 5/8", partNumber: "107205-001", price: 17.24, inventoryNumber: "30001362", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001364", name: "SCREW", partNumber: "107404-001", price: 0.0, inventoryNumber: "30001364", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001369", name: "SCREW", partNumber: "115544-001", price: 0.0, inventoryNumber: "30001369", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001381", name: "SPRING", partNumber: "141283-001", price: 0.0, inventoryNumber: "30001381", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001382", name: "STOP CAM ASSY", partNumber: "141286-001", price: 0.0, inventoryNumber: "30001382", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001383", name: "CAP FOR STOP CAM", partNumber: "141289-001", price: 0.0, inventoryNumber: "30001383", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001386", name: "BUSHING", partNumber: "141337-001", price: 0.0, inventoryNumber: "30001386", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001389", name: "EJE", partNumber: "141369-001", price: 0.0, inventoryNumber: "30001389", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001390", name: "CAM ASSY", partNumber: "141389-001", price: 0.0, inventoryNumber: "30001390", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001395", name: "SCREW", partNumber: "141408-001", price: 0.0, inventoryNumber: "30001395", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001399", name: "GUIA", partNumber: "141446-001", price: 0.0, inventoryNumber: "30001399", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001400", name: "CUTTER LEVER", partNumber: "141467-001", price: 0.0, inventoryNumber: "30001400", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001402", name: "CUTTER HOLDER", partNumber: "141480-001", price: 0.0, inventoryNumber: "30001402", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001405", name: "JOINT", partNumber: "141492-001", price: 0.0, inventoryNumber: "30001405", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001410", name: "TIJERA", partNumber: "141509-001", price: 456.77, inventoryNumber: "30001410", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001411", name: "PINS", partNumber: "141511-001", price: 0.0, inventoryNumber: "30001411", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001412", name: "RESORTE PARA PRENSATELA", partNumber: "CSP1", price: 5.62, inventoryNumber: "30001412", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001413", name: "UPPER BLADES", partNumber: "141513-001", price: 85.36, inventoryNumber: "30001413", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001415", name: "THREAD SCISSOR GUIDE", partNumber: "141515-001", price: 0.0, inventoryNumber: "30001415", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001417", name: "STUD CREW", partNumber: "141535-001", price: 0.0, inventoryNumber: "30001417", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001418", name: "CUTTER", partNumber: "141541-001", price: 187.51, inventoryNumber: "30001418", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001419", name: "CUTTER", partNumber: "141543-001", price: 107.37, inventoryNumber: "30001419", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001420", name: "SCREW", partNumber: "141544-001", price: 0.0, inventoryNumber: "30001420", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001421", name: "SUJETADOR", partNumber: "141547-001", price: 0.0, inventoryNumber: "30001421", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001422", name: "CLUTCH CLAW", partNumber: "141548-001", price: 407.29, inventoryNumber: "30001422", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001423", name: "CLUTCH CLAW", partNumber: "141553-001", price: 142.06, inventoryNumber: "30001423", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001427", name: "LAINA", partNumber: "141608-001", price: 0.0, inventoryNumber: "30001427", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001428", name: "BOBBIN CASE", partNumber: "141610-001", price: 0.0, inventoryNumber: "30001428", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001429", name: "THREAD BREACAGE", partNumber: "141614-001", price: 0.0, inventoryNumber: "30001429", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001430", name: "GUIA", partNumber: "141628-001", price: 0.0, inventoryNumber: "30001430", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001435", name: "CUTTER", partNumber: "142416-001", price: 0.0, inventoryNumber: "30001435", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001436", name: "CUTTER", partNumber: "142419-001", price: 49.16, inventoryNumber: "30001436", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001437", name: "SCREW", partNumber: "142420-001", price: 0.0, inventoryNumber: "30001437", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001438", name: "STOP CAM", partNumber: "142734-001", price: 0.0, inventoryNumber: "30001438", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001442", name: "SPRING", partNumber: "142771-001", price: 0.0, inventoryNumber: "30001442", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001445", name: "OIL GAUGE", partNumber: "143715-001", price: 0.0, inventoryNumber: "30001445", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001454", name: "PLATO", partNumber: "145245-001", price: 0.0, inventoryNumber: "30001454", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001458", name: "SUJETADOR", partNumber: "146000-001", price: 0.0, inventoryNumber: "30001458", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001459", name: "SCREW", partNumber: "146001-001", price: 0.0, inventoryNumber: "30001459", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001460", name: "SCREW", partNumber: "146002-001", price: 0.0, inventoryNumber: "30001460", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001463", name: "SPRING", partNumber: "147639-001", price: 0.0, inventoryNumber: "30001463", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001470", name: "SCREW", partNumber: "149288-003", price: 0.0, inventoryNumber: "30001470", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001484", name: "LEVAS DE PARO", partNumber: "141602-009", price: 0.0, inventoryNumber: "30001484", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001489", name: "BAR", partNumber: "141554-001", price: 0.0, inventoryNumber: "30001489", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001492", name: "CLAMPING FOOT", partNumber: "150763-001", price: 0.0, inventoryNumber: "30001492", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001494", name: "NUT", partNumber: "021860-202", price: 0.0, inventoryNumber: "30001494", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001500", name: "SPRING", partNumber: "141581-001", price: 0.0, inventoryNumber: "30001500", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001501", name: "SPRING", partNumber: "142259-001", price: 0.0, inventoryNumber: "30001501", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001504", name: "PINS", partNumber: "141590-001", price: 0.0, inventoryNumber: "30001504", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001508", name: "SPRING", partNumber: "141338-001", price: 0.0, inventoryNumber: "30001508", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001687", name: "BIMBA STAINLESS", partNumber: "041-P", price: 899.53, inventoryNumber: "30001687", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001719", name: "SPACER", partNumber: "556-000456", price: 385.2, inventoryNumber: "30001719", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001720", name: "BUSHING", partNumber: "556-000457", price: 383.11, inventoryNumber: "30001720", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001730", name: "COUNTERSUNK SCREW", partNumber: "556-005055", price: 171.97, inventoryNumber: "30001730", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001800", name: "CARRETEL", partNumber: "0576-003338", price: 66.29, inventoryNumber: "30001800", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001833", name: "SCREW", partNumber: "9204-201648", price: 17.4, inventoryNumber: "30001833", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30001863", name: "BIMBA STAINLESS", partNumber: "124-DP", price: 1749.89, inventoryNumber: "30001863", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002001", name: "LOOPER", partNumber: "351161-010", price: 1484.85, inventoryNumber: "30002001", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002110", name: "BOBBIN CARRETEL", partNumber: "B1811-771-000/400-09148", price: 54.71, inventoryNumber: "30002110", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002112", name: "NEEDLE THREAD TRIMMER", partNumber: "B2001-771-0A0", price: 586.31, inventoryNumber: "30002112", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002138", name: "SCREW", partNumber: "SS-6060210-SP", price: 0.0, inventoryNumber: "30002138", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002144", name: "BLOCK", partNumber: "B1414-226-000", price: 36.38, inventoryNumber: "30002144", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002211", name: "FEED ADJUSTING JOINT", partNumber: "B1632-180-000", price: 0.0, inventoryNumber: "30002211", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002251", name: "SCREW", partNumber: "SS-2060310-SP", price: 11.54, inventoryNumber: "30002251", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002256", name: "SCREW", partNumber: "SS-6090670-TP", price: 8.01, inventoryNumber: "30002256", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002396", name: "LOOPER", partNumber: "121-20705", price: 142.29, inventoryNumber: "30002396", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002426", name: "LOOPER", partNumber: "3109300", price: 957.09, inventoryNumber: "30002426", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002547", name: "STOPPER", partNumber: "137-27102", price: 237.98, inventoryNumber: "30002547", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002549", name: "HOOK", partNumber: "137-29066", price: 2733.3, inventoryNumber: "30002549", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002551", name: "BOBBIN CASE", partNumber: "137-29769", price: 909.15, inventoryNumber: "30002551", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002553", name: "TRIMMER CONEC", partNumber: "137-31161", price: 902.28, inventoryNumber: "30002553", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002619", name: "NEEDLE BAR LINK", partNumber: "56354A", price: 513.97, inventoryNumber: "30002619", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002624", name: "SCREW", partNumber: "57840", price: 207.39, inventoryNumber: "30002624", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002636", name: "SCREW", partNumber: "28C", price: 27.36, inventoryNumber: "30002636", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002638", name: "BUSHING", partNumber: "51854-E", price: 520.46, inventoryNumber: "30002638", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002639", name: "BUSHING", partNumber: "51854-F", price: 667.42, inventoryNumber: "30002639", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002649", name: "SCREW", partNumber: "73A", price: 0.0, inventoryNumber: "30002649", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002653", name: "PINS", partNumber: "50J16", price: 0.0, inventoryNumber: "30002653", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002656", name: "LOOPER", partNumber: "51408-16", price: 949.17, inventoryNumber: "30002656", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002657", name: "LOOPER", partNumber: "51409", price: 1000.66, inventoryNumber: "30002657", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002659", name: "NEEDLE HOLDER", partNumber: "51418-16", price: 0.0, inventoryNumber: "30002659", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002668", name: "SCREW", partNumber: "22543A", price: 93.38, inventoryNumber: "30002668", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002677", name: "LOOPER", partNumber: "51409-C", price: 1210.13, inventoryNumber: "30002677", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002682", name: "CONNECTING ROD ASSY", partNumber: "56336-B", price: 2683.87, inventoryNumber: "30002682", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002683", name: "BUSHING", partNumber: "56336-C", price: 351.34, inventoryNumber: "30002683", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002685", name: "POSICIONADOR", partNumber: "56341-N", price: 4543.24, inventoryNumber: "30002685", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002688", name: "FELPA", partNumber: "56393-L", price: 45.34, inventoryNumber: "30002688", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002689", name: "FELPA", partNumber: "56393-W", price: 33.34, inventoryNumber: "30002689", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002692", name: "WELL NUT", partNumber: "660-313", price: 108.54, inventoryNumber: "30002692", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002700", name: "FEED DOG 51405", partNumber: "K-26", price: 950.73, inventoryNumber: "30002700", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002702", name: "LOOPER", partNumber: "51408-24", price: 669.84, inventoryNumber: "30002702", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002705", name: "NEEDLE BAR", partNumber: "51417D", price: 4968.65, inventoryNumber: "30002705", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002868", name: "CAPACITOR", partNumber: "220MFX50V", price: 158.7, inventoryNumber: "30002868", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002890", name: "CAPACITOR", partNumber: "470MFX16V", price: 18.0, inventoryNumber: "30002890", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002892", name: "CAPACITOR", partNumber: "470MFX35V", price: 158.7, inventoryNumber: "30002892", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002894", name: "CAPACITOR", partNumber: "470MFX63V", price: 115.0, inventoryNumber: "30002894", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002972", name: "RELAY DE ESTADO SOLIDO", partNumber: "MP240D4", price: 559.62, inventoryNumber: "30002972", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003019", name: "LOOPER", partNumber: "51908-B-9", price: 1393.5, inventoryNumber: "30003019", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003020", name: "LOOPER", partNumber: "51909-D-9", price: 1255.49, inventoryNumber: "30003020", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003030", name: "KNIFE", partNumber: "310-6", price: 543.75, inventoryNumber: "30003030", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003081", name: "BAR", partNumber: "11C12-56", price: 268.56, inventoryNumber: "30003081", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003082", name: "GEAR", partNumber: "11C12-58", price: 316.13, inventoryNumber: "30003082", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003083", name: "SHAFT", partNumber: "11C12-64", price: 0.0, inventoryNumber: "30003083", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003084", name: "SHAFT", partNumber: "11C12-92", price: 120.15, inventoryNumber: "30003084", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003087", name: "GEAR", partNumber: "142C1-7", price: 0.0, inventoryNumber: "30003087", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003088", name: "SHAFT", partNumber: "147C1-26", price: 0.0, inventoryNumber: "30003088", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003089", name: "RH SHAFT EXTENSION", partNumber: "147C1-28", price: 0.0, inventoryNumber: "30003089", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003090", name: "LEX SHAFT", partNumber: "147C1-29", price: 214.14, inventoryNumber: "30003090", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003091", name: "ROLLER", partNumber: "152C1-19", price: 292.99, inventoryNumber: "30003091", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003092", name: "INTERCUT LOCK", partNumber: "171C1-16", price: 0.0, inventoryNumber: "30003092", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003093", name: "PINS", partNumber: "17C15-106", price: 50.63, inventoryNumber: "30003093", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003098", name: "RUBBER PULLEY", partNumber: "209C1", price: 30.25, inventoryNumber: "30003098", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003107", name: "SPRING", partNumber: "34C1-20", price: 104.74, inventoryNumber: "30003107", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003108", name: "SPRING", partNumber: "34C10-107", price: 0.0, inventoryNumber: "30003108", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003111", name: "SPRING", partNumber: "34C10-179", price: 60.49, inventoryNumber: "30003111", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003112", name: "SPRING", partNumber: "34C10-45", price: 93.06, inventoryNumber: "30003112", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003117", name: "NUT FOR SCREW", partNumber: "4C2-112", price: 0.0, inventoryNumber: "30003117", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003119", name: "BLOCK", partNumber: "508C1-100", price: 570.55, inventoryNumber: "30003119", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003122", name: "PLUG", partNumber: "523C1-100", price: 684.73, inventoryNumber: "30003122", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003123", name: "GUIA", partNumber: "525C1-5", price: 0.0, inventoryNumber: "30003123", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003124", name: "ROLLERS", partNumber: "532C2-3", price: 1079.1, inventoryNumber: "30003124", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003127", name: "SCREW", partNumber: "54C4-32", price: 0.0, inventoryNumber: "30003127", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003128", name: "TOE ASSY", partNumber: "553C1-7", price: 1009.45, inventoryNumber: "30003128", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003132", name: "COLLAR LIWER", partNumber: "5C5-16", price: 175.61, inventoryNumber: "30003132", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003133", name: "PULLER DRIVER", partNumber: "602C1-7", price: 0.0, inventoryNumber: "30003133", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003134", name: "PULLER DRIVER", partNumber: "602C1-9", price: 776.94, inventoryNumber: "30003134", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003138", name: "GEAR", partNumber: "627C1-10", price: 932.1, inventoryNumber: "30003138", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003140", name: "SHAFT", partNumber: "65C6-75", price: 127.41, inventoryNumber: "30003140", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003141", name: "CONNECTING ROD ASSY", partNumber: "664C1-4", price: 509.33, inventoryNumber: "30003141", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003143", name: "SLIDE PULLEY RIHTG", partNumber: "712C1", price: 521.1, inventoryNumber: "30003143", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003144", name: "SLIDE PULLEY LEFT", partNumber: "712C1-1", price: 511.7, inventoryNumber: "30003144", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003145", name: "SHAFT", partNumber: "713C4-4", price: 2429.45, inventoryNumber: "30003145", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003146", name: "BRK SHOE", partNumber: "715C1-19", price: 0.0, inventoryNumber: "30003146", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003147", name: "DRIVE W/GEAR", partNumber: "716C1-12", price: 0.0, inventoryNumber: "30003147", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003148", name: "BALINERA", partNumber: "71C3-15", price: 0.0, inventoryNumber: "30003148", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003149", name: "RODILLO", partNumber: "728C1-5", price: 0.0, inventoryNumber: "30003149", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003151", name: "SHOE RINGHT", partNumber: "743C1-28", price: 932.25, inventoryNumber: "30003151", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003152", name: "SHOE LEFT", partNumber: "743C1-29", price: 932.25, inventoryNumber: "30003152", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003153", name: "PLATE", partNumber: "79C12-163", price: 0.0, inventoryNumber: "30003153", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003155", name: "SHOE COMPLETE", partNumber: "820C1-8", price: 914.77, inventoryNumber: "30003155", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003157", name: "GEAR", partNumber: "87C3-50", price: 0.0, inventoryNumber: "30003157", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003158", name: "GEAR", partNumber: "87C3-53", price: 932.59, inventoryNumber: "30003158", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003159", name: "ROLLERS", partNumber: "87C3-8", price: 658.51, inventoryNumber: "30003159", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003160", name: "GEAR", partNumber: "87C5-13", price: 0.0, inventoryNumber: "30003160", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003161", name: "BUSHING", partNumber: "90C4-29", price: 0.0, inventoryNumber: "30003161", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003162", name: "BUSHING", partNumber: "90C4-33", price: 0.0, inventoryNumber: "30003162", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003164", name: "BUSHING", partNumber: "90C4-42", price: 0.0, inventoryNumber: "30003164", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003166", name: "BUSHING", partNumber: "90C4-48", price: 0.0, inventoryNumber: "30003166", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003167", name: "BUSHING", partNumber: "90C4-58", price: 0.0, inventoryNumber: "30003167", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003168", name: "BUSHING", partNumber: "90C4-59", price: 0.0, inventoryNumber: "30003168", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003170", name: "BALINERA", partNumber: "90C6-46", price: 250.75, inventoryNumber: "30003170", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003202", name: "SCREW", partNumber: "SS1060210TP", price: 14.79, inventoryNumber: "30003202", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003215", name: "LOOPER", partNumber: "204072", price: 144.6, inventoryNumber: "30003215", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003219", name: "LOOPER", partNumber: "204702", price: 167.15, inventoryNumber: "30003219", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003242", name: "KNIFE", partNumber: "3100513", price: 991.49, inventoryNumber: "30003242", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003247", name: "BLADE LAINA", partNumber: "3100508", price: 35.58, inventoryNumber: "30003247", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003249", name: "BLADE LAINA MOVABLE", partNumber: "3100509", price: 31.34, inventoryNumber: "30003249", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003258", name: "LOOPER", partNumber: "277018", price: 633.05, inventoryNumber: "30003258", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003295", name: "TUBE GRAASE A", partNumber: "400-13640", price: 212.58, inventoryNumber: "30003295", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003296", name: "HOOK", partNumber: "400-14965", price: 1704.82, inventoryNumber: "30003296", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003300", name: "SHAFT 40004210", partNumber: "(401-41850)", price: 439.41, inventoryNumber: "30003300", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003306", name: "THREAD GUIDE", partNumber: "B1405-210-000", price: 194.57, inventoryNumber: "30003306", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003307", name: "BOBBIN CARRETEL", partNumber: "B1806-210-DOO", price: 186.32, inventoryNumber: "30003307", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003310", name: "KNIFE", partNumber: "B2421-210-AA0", price: 1315.79, inventoryNumber: "30003310", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003311", name: "KNIFE", partNumber: "B2424-210-000", price: 142.01, inventoryNumber: "30003311", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003316", name: "SCREW", partNumber: "SM-4030601-SN", price: 4.89, inventoryNumber: "30003316", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003318", name: "SCREW", partNumber: "SS-6121610-TP", price: 0.0, inventoryNumber: "30003318", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003319", name: "SCREW", partNumber: "SS-7090410-SP", price: 7.89, inventoryNumber: "30003319", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003364", name: "BLOCK", partNumber: "B1162A", price: 0.0, inventoryNumber: "30003364", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003365", name: "BLOCK", partNumber: "B1164A", price: 0.0, inventoryNumber: "30003365", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003366", name: "SPACER", partNumber: "B1166M", price: 0.0, inventoryNumber: "30003366", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003367", name: "SCREW", partNumber: "B1167M", price: 0.0, inventoryNumber: "30003367", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003373", name: "ELEMER", partNumber: "B8514", price: 0.0, inventoryNumber: "30003373", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003403", name: "PUMP ASSY.", partNumber: "8000-812-280", price: 8070.26, inventoryNumber: "30003403", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003417", name: "SENSOR DE TEMPERATURA", partNumber: "421-812-107-0", price: 4880.34, inventoryNumber: "30003417", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003447", name: "FLOW CONTROL", partNumber: "9710-920012", price: 990.91, inventoryNumber: "30003447", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003457", name: "SHARPENING STONE 03201/07022", partNumber: "", price: 609.45, inventoryNumber: "30003457", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003529", name: "REPAIR KIT", partNumber: "SRK-250AA", price: 1245.39, inventoryNumber: "30003529", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003562", name: "ROTATING ROD", partNumber: "182-06201", price: 585.79, inventoryNumber: "30003562", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003594", name: "BAND KNIFE BLADE 3/8X194", partNumber: "4920X10X0.45MM", price: 580.2, inventoryNumber: "30003594", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003699", name: "PLATE", partNumber: "B1109-415-H0B", price: 353.93, inventoryNumber: "30003699", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003726", name: "PRESSER FOOT 1/32", partNumber: "NS-P756", price: 3300.7, inventoryNumber: "30003726", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003738", name: "65185000 BEARING, BLADE", partNumber: "WC-009", price: 993.86, inventoryNumber: "30003738", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003743", name: "SHORT MAGNECTIC SEAM GUID", partNumber: "G20", price: 633.37, inventoryNumber: "30003743", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003745", name: "BELT", partNumber: "CR3-055", price: 2547.85, inventoryNumber: "30003745", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003746", name: "SCREW", partNumber: "F-0101", price: 183.0, inventoryNumber: "30003746", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003747", name: "PARTS", partNumber: "A-TL-110", price: 0.0, inventoryNumber: "30003747", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003748", name: "KNIFE", partNumber: "TL-257", price: 1106.27, inventoryNumber: "30003748", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003749", name: "BASE", partNumber: "66-1008-3-052", price: 0.0, inventoryNumber: "30003749", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003750", name: "BEARING", partNumber: "A-CR2-15", price: 0.0, inventoryNumber: "30003750", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003754", name: "SCREW", partNumber: "237", price: 0.0, inventoryNumber: "30003754", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003755", name: "BEARING", partNumber: "CR2-053", price: 5847.09, inventoryNumber: "30003755", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003756", name: "NUT", partNumber: "F-1001", price: 53.45, inventoryNumber: "30003756", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003757", name: "SCREW", partNumber: "F-1385", price: 0.0, inventoryNumber: "30003757", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003758", name: "PARTS", partNumber: "TL-259", price: 0.0, inventoryNumber: "30003758", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003759", name: "PARTS", partNumber: "VP-013", price: 0.0, inventoryNumber: "30003759", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003760", name: "BUSHING", partNumber: "WC-012", price: 0.0, inventoryNumber: "30003760", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003769", name: "SET OF GASKET", partNumber: "136.039/5", price: 0.0, inventoryNumber: "30003769", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003770", name: "BOBINA", partNumber: "15D5G2", price: 0.0, inventoryNumber: "30003770", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003771", name: "FUSIBLE", partNumber: "16AMP", price: 0.0, inventoryNumber: "30003771", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003773", name: "TARGETADEL MOTOR", partNumber: "1866", price: 0.0, inventoryNumber: "30003773", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003777", name: "NEEDLES 70/10", partNumber: "149X7", price: 786.33, inventoryNumber: "30003777", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003779", name: "NEEDLES 80/12", partNumber: "149X7", price: 665.08, inventoryNumber: "30003779", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003780", name: "NEEDLES 90/14 SUK", partNumber: "149X7", price: 665.09, inventoryNumber: "30003780", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003783", name: "NEEDLES 80/12", partNumber: "UY113", price: 924.4, inventoryNumber: "30003783", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003785", name: "NEEDLES 80/12", partNumber: "UY108", price: 0.0, inventoryNumber: "30003785", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003786", name: "NEEDLES 90/14", partNumber: "UY108", price: 114.11, inventoryNumber: "30003786", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003788", name: "NEEDLES 90/14", partNumber: "175X1", price: 0.0, inventoryNumber: "30003788", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003801", name: "SCREW", partNumber: "66-0003-2-000", price: 0.0, inventoryNumber: "30003801", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003802", name: "SHAFT SPINNER", partNumber: "66-1005-5-000", price: 0.0, inventoryNumber: "30003802", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003804", name: "HULES", partNumber: "66-1007-4-012", price: 0.0, inventoryNumber: "30003804", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003806", name: "PINS", partNumber: "66-7506-1-000", price: 0.0, inventoryNumber: "30003806", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003807", name: "ORING", partNumber: "C-2523-03", price: 0.0, inventoryNumber: "30003807", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003808", name: "PRESS SWITCH NC", partNumber: "21426N", price: 0.0, inventoryNumber: "30003808", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003809", name: "PRESS SWITCH N O", partNumber: "21837", price: 2971.55, inventoryNumber: "30003809", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003813", name: "SEAT", partNumber: "21992", price: 89.87, inventoryNumber: "30003813", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003814", name: "WIPER FELT", partNumber: "AP1050-5", price: 0.0, inventoryNumber: "30003814", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003816", name: "N. C. VALVE", partNumber: "15629", price: 0.0, inventoryNumber: "30003816", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003817", name: "RETAINING WASHER", partNumber: "21987", price: 0.0, inventoryNumber: "30003817", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003818", name: "O RING", partNumber: "21994", price: 34.51, inventoryNumber: "30003818", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003819", name: "GASKET", partNumber: "AP1850-21", price: 0.0, inventoryNumber: "30003819", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003820", name: "HOFF/NYR", partNumber: "26685", price: 0.0, inventoryNumber: "30003820", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003821", name: "BODY POPPET", partNumber: "26689", price: 0.0, inventoryNumber: "30003821", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003824", name: "STEM", partNumber: "21988", price: 364.94, inventoryNumber: "30003824", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003829", name: "PINS", partNumber: "66-0021-6-000", price: 0.0, inventoryNumber: "30003829", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003830", name: "BUSHING", partNumber: "66-0028-0-000", price: 0.0, inventoryNumber: "30003830", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003839", name: "NUT", partNumber: "66-0014-1-000", price: 0.0, inventoryNumber: "30003839", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003843", name: "CABLE", partNumber: "66-1601-1-002", price: 0.0, inventoryNumber: "30003843", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003844", name: "SCREW", partNumber: "66-1605-3-000", price: 0.0, inventoryNumber: "30003844", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003847", name: "SCREW", partNumber: "90129", price: 0.0, inventoryNumber: "30003847", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003848", name: "SCREW", partNumber: "16027", price: 0.0, inventoryNumber: "30003848", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003849", name: "NUT", partNumber: "66-0017-4-000", price: 0.0, inventoryNumber: "30003849", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003850", name: "BUSHING", partNumber: "66-0028-3-000", price: 0.0, inventoryNumber: "30003850", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003851", name: "SPRING", partNumber: "66-1013-7-010", price: 0.0, inventoryNumber: "30003851", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003853", name: "BASE", partNumber: "75044", price: 0.0, inventoryNumber: "30003853", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003855", name: "PUNTA", partNumber: "8605", price: 0.0, inventoryNumber: "30003855", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003856", name: "SPRING", partNumber: "16042", price: 0.0, inventoryNumber: "30003856", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003857", name: "SPRING", partNumber: "66-1604-3-000", price: 0.0, inventoryNumber: "30003857", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003858", name: "SCREW", partNumber: "66-7507-8-000", price: 0.0, inventoryNumber: "30003858", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003859", name: "SPRING", partNumber: "8465", price: 0.0, inventoryNumber: "30003859", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003860", name: "NUT", partNumber: "9794-1", price: 0.0, inventoryNumber: "30003860", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003861", name: "SCREW", partNumber: "66-1177-8-001", price: 0.0, inventoryNumber: "30003861", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003862", name: "WASHER", partNumber: "66-1611-6", price: 0.0, inventoryNumber: "30003862", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003863", name: "CORTADOR 32", partNumber: "", price: 0.0, inventoryNumber: "30003863", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003864", name: "PINS", partNumber: "32574", price: 0.0, inventoryNumber: "30003864", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003865", name: "NUT", partNumber: "66-0018-1-000", price: 0.0, inventoryNumber: "30003865", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003866", name: "LAINA", partNumber: "66-1615-1-000", price: 0.0, inventoryNumber: "30003866", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003869", name: "PORTA BOTTON", partNumber: "10064-01", price: 0.0, inventoryNumber: "30003869", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003870", name: "ORING", partNumber: "143551", price: 0.0, inventoryNumber: "30003870", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003872", name: "BASE", partNumber: "571", price: 0.0, inventoryNumber: "30003872", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003873", name: "LAINA", partNumber: "66-1183-8-000", price: 0.0, inventoryNumber: "30003873", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003874", name: "BASE", partNumber: "66-7514-0-000", price: 0.0, inventoryNumber: "30003874", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003875", name: "CUADRANTE", partNumber: "16921", price: 0.0, inventoryNumber: "30003875", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003877", name: "KIT VLV", partNumber: "94-391-260", price: 0.0, inventoryNumber: "30003877", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003881", name: "MAIN SWINTH", partNumber: "ES-85-124401", price: 0.0, inventoryNumber: "30003881", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003883", name: "DETECTOR", partNumber: "400-03499", price: 204.48, inventoryNumber: "30003883", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003884", name: "HOLDER GUIDE", partNumber: "D2426-282-C00", price: 0.0, inventoryNumber: "30003884", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003885", name: "NUT", partNumber: "4C1-189", price: 0.0, inventoryNumber: "30003885", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003886", name: "WASHER", partNumber: "12C15-53", price: 0.0, inventoryNumber: "30003886", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003887", name: "SEGURO", partNumber: "18C6-16", price: 0.0, inventoryNumber: "30003887", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003888", name: "SCREW", partNumber: "301C7-2", price: 23.66, inventoryNumber: "30003888", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003889", name: "SCREW", partNumber: "301C8-1", price: 0.0, inventoryNumber: "30003889", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003891", name: "WASHER", partNumber: "12C15-14", price: 0.0, inventoryNumber: "30003891", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003892", name: "SCREW", partNumber: "20C4-17", price: 47.07, inventoryNumber: "30003892", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003894", name: "NUT", partNumber: "4C1-190", price: 0.0, inventoryNumber: "30003894", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003896", name: "SCREW", partNumber: "309C12-2", price: 0.0, inventoryNumber: "30003896", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003897", name: "SPRING", partNumber: "34C10-146", price: 221.18, inventoryNumber: "30003897", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003898", name: "FELPA", partNumber: "191C1-38", price: 0.0, inventoryNumber: "30003898", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003899", name: "NUT", partNumber: "4C2-113", price: 0.0, inventoryNumber: "30003899", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003900", name: "PAD ASSEMBLY", partNumber: "727C1-6", price: 0.0, inventoryNumber: "30003900", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003901", name: "PIN WRIST", partNumber: "17C4-6", price: 0.0, inventoryNumber: "30003901", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003902", name: "PLUG OIL HOLE", partNumber: "54C4-35", price: 0.0, inventoryNumber: "30003902", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003905", name: "BASE", partNumber: "27999", price: 0.0, inventoryNumber: "30003905", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003906", name: "BASE", partNumber: "28000", price: 0.0, inventoryNumber: "30003906", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003907", name: "SCREW", partNumber: "308C14-1", price: 0.0, inventoryNumber: "30003907", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003908", name: "NUT", partNumber: "4C1-132", price: 0.0, inventoryNumber: "30003908", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003909", name: "NUT", partNumber: "4C2-91", price: 0.0, inventoryNumber: "30003909", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003911", name: "SCREW", partNumber: "20C12-122", price: 0.0, inventoryNumber: "30003911", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003912", name: "SCREW", partNumber: "309C15-5", price: 0.0, inventoryNumber: "30003912", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003913", name: "SCREW", partNumber: "4C2-85", price: 35.16, inventoryNumber: "30003913", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003915", name: "GUIDE", partNumber: "70C4-32", price: 151.62, inventoryNumber: "30003915", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003916", name: "KNIFE", partNumber: "CNB-3/16", price: 0.0, inventoryNumber: "30003916", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003917", name: "KNIFE", partNumber: "CNB-1/2", price: 0.0, inventoryNumber: "30003917", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003918", name: "KNIFE", partNumber: "CNB-1/8", price: 0.0, inventoryNumber: "30003918", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003919", name: "KNIFE", partNumber: "CNB-3/8", price: 0.0, inventoryNumber: "30003919", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003920", name: "SCREW", partNumber: "20C12-143", price: 0.0, inventoryNumber: "30003920", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003921", name: "SCREW", partNumber: "300C10-2", price: 32.24, inventoryNumber: "30003921", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003922", name: "SPRING", partNumber: "34C10-145", price: 182.18, inventoryNumber: "30003922", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003923", name: "BASE", partNumber: "766C1-1", price: 0.0, inventoryNumber: "30003923", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003924", name: "SCREW", partNumber: "1C13-27", price: 0.0, inventoryNumber: "30003924", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003925", name: "SCREW", partNumber: "302C10-4", price: 0.0, inventoryNumber: "30003925", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003927", name: "BEARING", partNumber: "90C6-33", price: 0.0, inventoryNumber: "30003927", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003928", name: "WASHER", partNumber: "12C15-30", price: 0.0, inventoryNumber: "30003928", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003929", name: "WASHER", partNumber: "12C15-74", price: 0.0, inventoryNumber: "30003929", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003930", name: "WASHER", partNumber: "12C15-91", price: 0.0, inventoryNumber: "30003930", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003932", name: "SPRING", partNumber: "34C1-57", price: 0.0, inventoryNumber: "30003932", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003933", name: "NUT", partNumber: "4C2-2", price: 0.0, inventoryNumber: "30003933", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003934", name: "TUBE OIL/EASTMAN", partNumber: "73C7-134", price: 0.0, inventoryNumber: "30003934", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003935", name: "SPREADER PIN", partNumber: "17C15-113", price: 0.0, inventoryNumber: "30003935", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003936", name: "PARTS", partNumber: "85C1-45", price: 115.24, inventoryNumber: "30003936", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003937", name: "FELPA", partNumber: "191C1-45", price: 0.0, inventoryNumber: "30003937", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003938", name: "SCREW", partNumber: "20C6-25", price: 0.0, inventoryNumber: "30003938", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003939", name: "TRIMMING BLADES", partNumber: "TX3", price: 0.0, inventoryNumber: "30003939", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003940", name: "SEGURO", partNumber: "18C6-26", price: 73.49, inventoryNumber: "30003940", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003941", name: "FELPA", partNumber: "191C1-21", price: 0.0, inventoryNumber: "30003941", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003942", name: "SCREW", partNumber: "20C12-134", price: 0.0, inventoryNumber: "30003942", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003943", name: "SCREW", partNumber: "24C4", price: 0.0, inventoryNumber: "30003943", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003944", name: "TERMINAL SLEEVE", partNumber: "47C3-20", price: 0.0, inventoryNumber: "30003944", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003945", name: "PLATE WIG", partNumber: "60C1-56", price: 0.0, inventoryNumber: "30003945", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003946", name: "BEARING SCREW SHAFT", partNumber: "90C4-51", price: 0.0, inventoryNumber: "30003946", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003947", name: "WASHER", partNumber: "12C1-24", price: 0.0, inventoryNumber: "30003947", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003948", name: "KNOB TURN", partNumber: "13C1-9", price: 0.0, inventoryNumber: "30003948", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003949", name: "FELPA", partNumber: "191C1-42", price: 0.0, inventoryNumber: "30003949", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003950", name: "SCREW", partNumber: "20C6-11", price: 0.0, inventoryNumber: "30003950", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003951", name: "SCREW", partNumber: "30C17-2", price: 0.0, inventoryNumber: "30003951", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003952", name: "PARTS", partNumber: "619C1-31", price: 0.0, inventoryNumber: "30003952", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003953", name: "BARRA", partNumber: "73C7-46", price: 0.0, inventoryNumber: "30003953", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003954", name: "WASHER", partNumber: "12C1-28", price: 0.0, inventoryNumber: "30003954", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003955", name: "GASKET", partNumber: "12C15-70", price: 0.0, inventoryNumber: "30003955", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003956", name: "SCREW", partNumber: "20C13-20", price: 0.0, inventoryNumber: "30003956", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003957", name: "SCREW", partNumber: "304C10-3", price: 0.0, inventoryNumber: "30003957", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003958", name: "NUT", partNumber: "4C1-149", price: 0.0, inventoryNumber: "30003958", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003959", name: "WHEEL EMERY ASSM 220", partNumber: "541C1-21", price: 402.86, inventoryNumber: "30003959", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003960", name: "BEARING", partNumber: "90C6-38", price: 0.0, inventoryNumber: "30003960", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003961", name: "BASE", partNumber: "97C3-35", price: 0.0, inventoryNumber: "30003961", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003966", name: "KNIFE SLIDE ASSM", partNumber: "643C1-42", price: 0.0, inventoryNumber: "30003966", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003967", name: "SCREW", partNumber: "713C4-6", price: 0.0, inventoryNumber: "30003967", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003968", name: "BARRA", partNumber: "73C7-48", price: 362.76, inventoryNumber: "30003968", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003969", name: "DISCO", partNumber: "80C1-59", price: 0.0, inventoryNumber: "30003969", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003970", name: "WASHER", partNumber: "12C15-93", price: 0.0, inventoryNumber: "30003970", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003971", name: "FELPA", partNumber: "191C1-43", price: 0.0, inventoryNumber: "30003971", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003972", name: "SCREW", partNumber: "20C5-12", price: 0.0, inventoryNumber: "30003972", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003973", name: "BUSHING SHOE", partNumber: "21C14-14", price: 0.0, inventoryNumber: "30003973", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003975", name: "OIL TUBE POLYURETHANE 73C7", partNumber: "203", price: 0.0, inventoryNumber: "30003975", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003976", name: "DISCO", partNumber: "80C1-61", price: 447.76, inventoryNumber: "30003976", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003978", name: "SCREW", partNumber: "10346", price: 0.0, inventoryNumber: "30003978", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003979", name: "FELT PAD", partNumber: "10381", price: 0.0, inventoryNumber: "30003979", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003980", name: "SCREW", partNumber: "10423", price: 0.0, inventoryNumber: "30003980", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003981", name: "PARTS", partNumber: "10428A", price: 0.0, inventoryNumber: "30003981", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003982", name: "STONE AND SPINDLE", partNumber: "25425", price: 0.0, inventoryNumber: "30003982", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003984", name: "SCREW", partNumber: "10304", price: 0.0, inventoryNumber: "30003984", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003986", name: "SCREW", partNumber: "10383", price: 0.0, inventoryNumber: "30003986", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003987", name: "LOCK SCREW", partNumber: "10433", price: 0.0, inventoryNumber: "30003987", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003989", name: "LAINA", partNumber: "10425", price: 0.0, inventoryNumber: "30003989", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003990", name: "SPRING", partNumber: "10391", price: 0.0, inventoryNumber: "30003990", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003991", name: "MICRO SWITH", partNumber: "10416", price: 0.0, inventoryNumber: "30003991", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003992", name: "SCREW", partNumber: "10311", price: 0.0, inventoryNumber: "30003992", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003993", name: "DISCO EXAGONAL", partNumber: "10312", price: 567.47, inventoryNumber: "30003993", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003994", name: "SHARPENING STONE", partNumber: "10378", price: 0.0, inventoryNumber: "30003994", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003995", name: "GEAR ASSEMBLY", partNumber: "10310", price: 0.0, inventoryNumber: "30003995", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003996", name: "COUNTER CUTTING BLADE", partNumber: "10341", price: 0.0, inventoryNumber: "30003996", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003997", name: "REAR FELT", partNumber: "10390", price: 0.0, inventoryNumber: "30003997", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30003999", name: "PLATE", partNumber: "B1103-380-K3/8", price: 4608.02, inventoryNumber: "30003999", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004000", name: "FEED GOG", partNumber: "B1613-380-F00", price: 0.0, inventoryNumber: "30004000", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004001", name: "FEEG GOD", partNumber: "B1613-380-K00", price: 2165.95, inventoryNumber: "30004001", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004002", name: "PLATE", partNumber: "B1103-380-F00", price: 0.0, inventoryNumber: "30004002", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004003", name: "SPRING", partNumber: "B1165-380-000", price: 0.0, inventoryNumber: "30004003", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004006", name: "PARTS", partNumber: "B2311-380-E00", price: 0.0, inventoryNumber: "30004006", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004008", name: "PLATE", partNumber: "B1103-380-B00", price: 0.0, inventoryNumber: "30004008", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004009", name: "PLATE", partNumber: "B1104-380-0A0", price: 0.0, inventoryNumber: "30004009", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004010", name: "PLATE", partNumber: "B1108-380-L00", price: 0.0, inventoryNumber: "30004010", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004011", name: "PRESSER FOOT", partNumber: "B1509-038-BB0", price: 0.0, inventoryNumber: "30004011", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004015", name: "SCREW", partNumber: "140390", price: 0.0, inventoryNumber: "30004015", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004017", name: "SCREW", partNumber: "416007", price: 0.0, inventoryNumber: "30004017", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004018", name: "SCREW", partNumber: "417396", price: 0.0, inventoryNumber: "30004018", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004019", name: "SCREW", partNumber: "545325", price: 0.0, inventoryNumber: "30004019", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004020", name: "LOOPERS", partNumber: "32820", price: 837.55, inventoryNumber: "30004020", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004021", name: "LOOPERS", partNumber: "32823", price: 558.33, inventoryNumber: "30004021", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004023", name: "ECCENTIC", partNumber: "105164", price: 0.0, inventoryNumber: "30004023", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004024", name: "FELPA", partNumber: "143646", price: 0.0, inventoryNumber: "30004024", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004027", name: "NUT", partNumber: "416009", price: 0.0, inventoryNumber: "30004027", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004028", name: "PLATE", partNumber: "143278", price: 0.0, inventoryNumber: "30004028", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004029", name: "GUIDE", partNumber: "143524", price: 0.0, inventoryNumber: "30004029", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004031", name: "PINS", partNumber: "26276", price: 0.0, inventoryNumber: "30004031", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004032", name: "SCREW", partNumber: "416052", price: 0.0, inventoryNumber: "30004032", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004033", name: "LOOPER CONNECTOR COMP.", partNumber: "103860C", price: 15835.46, inventoryNumber: "30004033", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004034", name: "PARTS", partNumber: "139196", price: 67.12, inventoryNumber: "30004034", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004035", name: "NUT", partNumber: "139533", price: 362.29, inventoryNumber: "30004035", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004036", name: "FEED GOD", partNumber: "149164", price: 0.0, inventoryNumber: "30004036", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004038", name: "SCREW", partNumber: "549084", price: 0.0, inventoryNumber: "30004038", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004040", name: "HINGE STUD", partNumber: "372827", price: 0.0, inventoryNumber: "30004040", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004041", name: "SCREW STUD", partNumber: "416017", price: 0.0, inventoryNumber: "30004041", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004042", name: "SCREW", partNumber: "416047", price: 0.0, inventoryNumber: "30004042", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004043", name: "SCREW", partNumber: "732", price: 8.75, inventoryNumber: "30004043", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004045", name: "NEEDLE GUARD", partNumber: "32381", price: 1243.87, inventoryNumber: "30004045", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004048", name: "ORING", partNumber: "143624", price: 0.0, inventoryNumber: "30004048", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004049", name: "PORTA AGUJA", partNumber: "372805016", price: 0.0, inventoryNumber: "30004049", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004052", name: "VIELA", partNumber: "416071", price: 0.0, inventoryNumber: "30004052", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004055", name: "SCREW", partNumber: "1047", price: 0.0, inventoryNumber: "30004055", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004056", name: "SEAM FOLDER CLAMP", partNumber: "121449", price: 0.0, inventoryNumber: "30004056", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004058", name: "SLIDE BLOCK", partNumber: "143450", price: 3166.62, inventoryNumber: "30004058", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004059", name: "SLIDE BOCK", partNumber: "143451", price: 860.86, inventoryNumber: "30004059", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004060", name: "SLIDE BLOCK", partNumber: "143458", price: 1248.34, inventoryNumber: "30004060", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004062", name: "LAINA", partNumber: "146805", price: 0.0, inventoryNumber: "30004062", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004063", name: "SCREW", partNumber: "416020", price: 0.0, inventoryNumber: "30004063", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004064", name: "SCREW", partNumber: "416055", price: 72.17, inventoryNumber: "30004064", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004066", name: "SCREW", partNumber: "416135", price: 69.28, inventoryNumber: "30004066", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004068", name: "NEEDLE GUARD", partNumber: "51210", price: 0.0, inventoryNumber: "30004068", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004069", name: "FEED GOD", partNumber: "139540-016", price: 0.0, inventoryNumber: "30004069", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004070", name: "SCRWEW", partNumber: "140393", price: 24.08, inventoryNumber: "30004070", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004071", name: "GASKET", partNumber: "143643", price: 0.0, inventoryNumber: "30004071", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004072", name: "ECCENTRICA", partNumber: "143644", price: 0.0, inventoryNumber: "30004072", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004073", name: "FILTRO", partNumber: "146657", price: 0.0, inventoryNumber: "30004073", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004074", name: "FEED GOD", partNumber: "22571012", price: 0.0, inventoryNumber: "30004074", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004075", name: "GEAR", partNumber: "267366", price: 0.0, inventoryNumber: "30004075", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004077", name: "SCREW", partNumber: "014680-4-22", price: 0.0, inventoryNumber: "30004077", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004079", name: "TEN DISC", partNumber: "10106", price: 0.0, inventoryNumber: "30004079", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004080", name: "PINS", partNumber: "12162", price: 0.0, inventoryNumber: "30004080", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004084", name: "BRECKET", partNumber: "416086", price: 0.0, inventoryNumber: "30004084", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004086", name: "PARTS", partNumber: "139519", price: 690.77, inventoryNumber: "30004086", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004087", name: "BUSHING", partNumber: "143486", price: 0.0, inventoryNumber: "30004087", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004088", name: "SPRING", partNumber: "143514", price: 30.8, inventoryNumber: "30004088", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004089", name: "SCREW", partNumber: "146057", price: 0.0, inventoryNumber: "30004089", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004090", name: "SCREW 1498", partNumber: "(830)", price: 0.0, inventoryNumber: "30004090", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004093", name: "SCREW", partNumber: "545361", price: 0.0, inventoryNumber: "30004093", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004095", name: "VIELA", partNumber: "121-23360", price: 0.0, inventoryNumber: "30004095", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004097", name: "GASKET", partNumber: "143435", price: 0.0, inventoryNumber: "30004097", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004101", name: "BLOCK", partNumber: "416030", price: 0.0, inventoryNumber: "30004101", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004102", name: "PARTS", partNumber: "416063", price: 0.0, inventoryNumber: "30004102", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004105", name: "SCREW", partNumber: "544306", price: 0.0, inventoryNumber: "30004105", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004106", name: "SCREW", partNumber: "549027", price: 0.0, inventoryNumber: "30004106", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004107", name: "BUSHING", partNumber: "143985", price: 0.0, inventoryNumber: "30004107", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004109", name: "SCREW", partNumber: "146132", price: 0.0, inventoryNumber: "30004109", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004111", name: "PARTS", partNumber: "416123", price: 0.0, inventoryNumber: "30004111", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004112", name: "SCREW", partNumber: "416144", price: 0.0, inventoryNumber: "30004112", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004113", name: "LAINA", partNumber: "107401-001", price: 0.0, inventoryNumber: "30004113", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004116", name: "BASE", partNumber: "152237-001", price: 0.0, inventoryNumber: "30004116", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004118", name: "PARTS", partNumber: "111237-001", price: 0.0, inventoryNumber: "30004118", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004119", name: "PARTS", partNumber: "141395-002", price: 0.0, inventoryNumber: "30004119", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004120", name: "SCREW", partNumber: "141399-001", price: 0.0, inventoryNumber: "30004120", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004121", name: "LUBRICANTE", partNumber: "148472-001", price: 0.0, inventoryNumber: "30004121", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004122", name: "BALIN", partNumber: "071095-250", price: 0.0, inventoryNumber: "30004122", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004123", name: "SPRING", partNumber: "141559-001", price: 0.0, inventoryNumber: "30004123", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004124", name: "LAINA", partNumber: "143749-001", price: 0.0, inventoryNumber: "30004124", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004125", name: "PARTS", partNumber: "147235-001", price: 0.0, inventoryNumber: "30004125", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004126", name: "LAINA", partNumber: "180720-001", price: 0.0, inventoryNumber: "30004126", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004127", name: "SPRING", partNumber: "100644-005", price: 0.0, inventoryNumber: "30004127", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004128", name: "SPRING", partNumber: "107681-001", price: 0.0, inventoryNumber: "30004128", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004129", name: "BUSHING", partNumber: "142373-000", price: 0.0, inventoryNumber: "30004129", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004130", name: "GUIA HILO", partNumber: "142735-001", price: 0.0, inventoryNumber: "30004130", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004131", name: "NUT", partNumber: "150556-001", price: 0.0, inventoryNumber: "30004131", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004132", name: "SCREW", partNumber: "014770-622", price: 0.0, inventoryNumber: "30004132", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004133", name: "WASHER", partNumber: "028680-242", price: 0.0, inventoryNumber: "30004133", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004134", name: "SCREW", partNumber: "112364-001", price: 0.0, inventoryNumber: "30004134", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004135", name: "SCREW", partNumber: "152904-001", price: 0.0, inventoryNumber: "30004135", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004136", name: "STOPPER", partNumber: "158969-001", price: 0.0, inventoryNumber: "30004136", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004137", name: "GASKET", partNumber: "141244-200", price: 0.0, inventoryNumber: "30004137", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004138", name: "BELT", partNumber: "141711-100", price: 0.0, inventoryNumber: "30004138", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004139", name: "SCREW", partNumber: "100360-003", price: 0.0, inventoryNumber: "30004139", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004140", name: "SCREW", partNumber: "111140-002", price: 0.0, inventoryNumber: "30004140", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004142", name: "MECHAS", partNumber: "140430-001", price: 0.0, inventoryNumber: "30004142", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004144", name: "SPRING", partNumber: "158971-001", price: 0.0, inventoryNumber: "30004144", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004145", name: "SCREW", partNumber: "100250-001", price: 0.0, inventoryNumber: "30004145", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004146", name: "SCREW", partNumber: "100402-001", price: 0.0, inventoryNumber: "30004146", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004147", name: "LAINA", partNumber: "141627-001", price: 0.0, inventoryNumber: "30004147", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004148", name: "PARTS", partNumber: "S01292-001", price: 0.0, inventoryNumber: "30004148", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004150", name: "SCREW", partNumber: "107678-101", price: 0.0, inventoryNumber: "30004150", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004151", name: "PARTS", partNumber: "146355-001", price: 0.0, inventoryNumber: "30004151", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004152", name: "CUTTER CAM", partNumber: "181250-001", price: 0.0, inventoryNumber: "30004152", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004153", name: "SCREW", partNumber: "111073-001", price: 0.0, inventoryNumber: "30004153", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004154", name: "SCREW", partNumber: "141282-001", price: 0.0, inventoryNumber: "30004154", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004156", name: "LAINA", partNumber: "144635-001", price: 0.0, inventoryNumber: "30004156", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004157", name: "KNIFE 3/8", partNumber: "151837-001", price: 287.06, inventoryNumber: "30004157", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004158", name: "SCREW", partNumber: "141465-001", price: 0.0, inventoryNumber: "30004158", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004159", name: "SCREW", partNumber: "501700-001", price: 0.0, inventoryNumber: "30004159", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004160", name: "PINS", partNumber: "100400-000", price: 0.0, inventoryNumber: "30004160", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004161", name: "SCREW", partNumber: "142359-001", price: 0.0, inventoryNumber: "30004161", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004162", name: "GUIA HILO", partNumber: "148053-101", price: 0.0, inventoryNumber: "30004162", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004163", name: "PARTS", partNumber: "152238-001", price: 0.0, inventoryNumber: "30004163", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004164", name: "SCREW", partNumber: "183038-001", price: 0.0, inventoryNumber: "30004164", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004165", name: "FEED DOG", partNumber: "51305W", price: 2136.59, inventoryNumber: "30004165", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004166", name: "WASHER", partNumber: "56350-G", price: 0.0, inventoryNumber: "30004166", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004167", name: "PARTS", partNumber: "56480", price: 0.0, inventoryNumber: "30004167", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004168", name: "SCREW", partNumber: "22548", price: 0.0, inventoryNumber: "30004168", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004169", name: "SCREW", partNumber: "22569-C", price: 0.0, inventoryNumber: "30004169", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004170", name: "WASHER N", partNumber: "39543", price: 0.0, inventoryNumber: "30004170", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004171", name: "NUT 56", partNumber: "", price: 50.99, inventoryNumber: "30004171", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004172", name: "PARTS", partNumber: "56744", price: 0.0, inventoryNumber: "30004172", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004174", name: "SCREW", partNumber: "22653L8", price: 0.0, inventoryNumber: "30004174", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004175", name: "SCREW", partNumber: "22894", price: 0.0, inventoryNumber: "30004175", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004177", name: "PARTS", partNumber: "56357-A", price: 0.0, inventoryNumber: "30004177", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004178", name: "PARTS", partNumber: "51959D", price: 0.0, inventoryNumber: "30004178", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004179", name: "GUARDA AGUJA", partNumber: "56425", price: 648.03, inventoryNumber: "30004179", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004181", name: "SCREW", partNumber: "22586R", price: 0.0, inventoryNumber: "30004181", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004182", name: "PINS", partNumber: "22864-A", price: 0.0, inventoryNumber: "30004182", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004183", name: "GASKET", partNumber: "52882AS", price: 0.0, inventoryNumber: "30004183", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004184", name: "GASKET", partNumber: "56382AX", price: 80.21, inventoryNumber: "30004184", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004185", name: "LOOPERS", partNumber: "51408-18", price: 0.0, inventoryNumber: "30004185", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004186", name: "HEAD COVER FELT", partNumber: "56382A", price: 0.0, inventoryNumber: "30004186", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004187", name: "FEEG GOD", partNumber: "K67662", price: 0.0, inventoryNumber: "30004187", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004188", name: "FEED GOD", partNumber: "51205A", price: 0.0, inventoryNumber: "30004188", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004189", name: "FEEG GOD", partNumber: "51405-16", price: 0.0, inventoryNumber: "30004189", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004190", name: "PLATE", partNumber: "51424-18", price: 0.0, inventoryNumber: "30004190", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004192", name: "NUT", partNumber: "12934A", price: 41.19, inventoryNumber: "30004192", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004193", name: "PARTS", partNumber: "29066B", price: 0.0, inventoryNumber: "30004193", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004194", name: "PARTS", partNumber: "35731A", price: 0.0, inventoryNumber: "30004194", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004196", name: "SCREW", partNumber: "22829", price: 0.0, inventoryNumber: "30004196", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004197", name: "SCREW", partNumber: "22894AA", price: 0.0, inventoryNumber: "30004197", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004198", name: "PARTS", partNumber: "56336D", price: 0.0, inventoryNumber: "30004198", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004199", name: "WASHER", partNumber: "660-113", price: 0.0, inventoryNumber: "30004199", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004200", name: "SCREW", partNumber: "T38", price: 0.0, inventoryNumber: "30004200", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004201", name: "PARTS", partNumber: "51147", price: 0.0, inventoryNumber: "30004201", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004202", name: "BARRA", partNumber: "51417C18", price: 0.0, inventoryNumber: "30004202", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004203", name: "PARTS", partNumber: "51892", price: 0.0, inventoryNumber: "30004203", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004204", name: "PARTS", partNumber: "56383AB", price: 0.0, inventoryNumber: "30004204", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004206", name: "SCREW", partNumber: "56330AJ", price: 0.0, inventoryNumber: "30004206", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004207", name: "WASHER", partNumber: "56382M", price: 0.0, inventoryNumber: "30004207", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004208", name: "HEAD RETURN OIL TUBE", partNumber: "56393T", price: 4228.4, inventoryNumber: "30004208", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004209", name: "OIL PUMP ASSM", partNumber: "59493A", price: 3556.36, inventoryNumber: "30004209", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004210", name: "SCREW", partNumber: "22874", price: 0.0, inventoryNumber: "30004210", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004211", name: "PRESSER FOOT", partNumber: "51340AC18", price: 0.0, inventoryNumber: "30004211", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004213", name: "WASHER", partNumber: "56390E", price: 0.0, inventoryNumber: "30004213", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004214", name: "SCREW", partNumber: "22564", price: 0.0, inventoryNumber: "30004214", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004215", name: "LAINA", partNumber: "52804A", price: 0.0, inventoryNumber: "30004215", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004216", name: "BUSHING", partNumber: "52942W", price: 0.0, inventoryNumber: "30004216", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004217", name: "SCREW", partNumber: "56330AG", price: 216.24, inventoryNumber: "30004217", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004219", name: "GUIDE", partNumber: "51959J", price: 0.0, inventoryNumber: "30004219", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004222", name: "BUSHING", partNumber: "51154E", price: 950.0, inventoryNumber: "30004222", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004223", name: "SCREW", partNumber: "51240D", price: 194.13, inventoryNumber: "30004223", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004224", name: "BUSHING", partNumber: "56354C", price: 950.0, inventoryNumber: "30004224", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004225", name: "SEGURO", partNumber: "21210A", price: 0.0, inventoryNumber: "30004225", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004226", name: "PRESSER FOOT", partNumber: "51230G", price: 0.0, inventoryNumber: "30004226", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004230", name: "PATS", partNumber: "56343-C", price: 0.0, inventoryNumber: "30004230", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004231", name: "SEGURO", partNumber: "048110-142", price: 0.0, inventoryNumber: "30004231", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004232", name: "KNIFE", partNumber: "159275-101", price: 0.0, inventoryNumber: "30004232", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004233", name: "TRIMMER", partNumber: "S19820-001", price: 0.0, inventoryNumber: "30004233", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004234", name: "BUSHING", partNumber: "S19840-001", price: 0.0, inventoryNumber: "30004234", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004235", name: "KNIFE", partNumber: "141510-101", price: 0.0, inventoryNumber: "30004235", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004236", name: "BUSHING", partNumber: "141538-001", price: 0.0, inventoryNumber: "30004236", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004237", name: "LENGTH FEED GUIDE", partNumber: "143743-001", price: 0.0, inventoryNumber: "30004237", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004238", name: "LAINA", partNumber: "145931-001", price: 0.0, inventoryNumber: "30004238", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004239", name: "SCREW", partNumber: "062761-012", price: 0.0, inventoryNumber: "30004239", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004240", name: "SCREW", partNumber: "101671-002", price: 0.0, inventoryNumber: "30004240", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004241", name: "SCREW", partNumber: "141604-001", price: 0.0, inventoryNumber: "30004241", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004242", name: "BALANCE", partNumber: "141620-001", price: 0.0, inventoryNumber: "30004242", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004243", name: "WASHER", partNumber: "142711-001", price: 0.0, inventoryNumber: "30004243", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004244", name: "WASHER", partNumber: "025350-332", price: 0.0, inventoryNumber: "30004244", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004245", name: "SCREW", partNumber: "062680-812", price: 0.0, inventoryNumber: "30004245", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004246", name: "GUIDE", partNumber: "141589-001", price: 0.0, inventoryNumber: "30004246", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004247", name: "NUT", partNumber: "13768", price: 0.0, inventoryNumber: "30004247", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004249", name: "BASE", partNumber: "16555", price: 0.0, inventoryNumber: "30004249", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004251", name: "BASE", partNumber: "11059", price: 0.0, inventoryNumber: "30004251", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004253", name: "VALVE", partNumber: "34ASR", price: 0.0, inventoryNumber: "30004253", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004254", name: "FITTING", partNumber: "10576", price: 0.0, inventoryNumber: "30004254", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004255", name: "VALVE", partNumber: "10858", price: 0.0, inventoryNumber: "30004255", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004256", name: "MICRO VALVE", partNumber: "SMTV-3", price: 0.0, inventoryNumber: "30004256", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004257", name: "WASHER", partNumber: "107153-001", price: 0.0, inventoryNumber: "30004257", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004258", name: "OIL FEEDING PIPE", partNumber: "142748-002", price: 0.0, inventoryNumber: "30004258", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004259", name: "NUT", partNumber: "142750-002", price: 0.0, inventoryNumber: "30004259", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004260", name: "SCREW", partNumber: "060670-612", price: 0.0, inventoryNumber: "30004260", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004261", name: "SCREW", partNumber: "062762-012", price: 0.0, inventoryNumber: "30004261", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004263", name: "SEGURO", partNumber: "048150-142", price: 0.0, inventoryNumber: "30004263", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004264", name: "SCREW", partNumber: "062660-712", price: 0.0, inventoryNumber: "30004264", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004265", name: "BEARING CAP", partNumber: "141279-001", price: 0.0, inventoryNumber: "30004265", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004266", name: "VINYL TUBE", partNumber: "141647-000", price: 0.0, inventoryNumber: "30004266", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004268", name: "TAPA", partNumber: "158999-100", price: 0.0, inventoryNumber: "30004268", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004269", name: "ADJUST COLLAR", partNumber: "S19837-001", price: 0.0, inventoryNumber: "30004269", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004270", name: "BASE", partNumber: "S19956-001", price: 0.0, inventoryNumber: "30004270", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004272", name: "SCREW", partNumber: "062670-512", price: 0.0, inventoryNumber: "30004272", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004273", name: "SCREW", partNumber: "109173-001", price: 0.0, inventoryNumber: "30004273", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004274", name: "STOPPERS", partNumber: "142667-101", price: 0.0, inventoryNumber: "30004274", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004275", name: "MICRO 3P", partNumber: "", price: 557.43, inventoryNumber: "30004275", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004276", name: "SCREW", partNumber: "118735-002", price: 0.0, inventoryNumber: "30004276", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004277", name: "BUSHING", partNumber: "142375-100", price: 0.0, inventoryNumber: "30004277", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004278", name: "SPRING", partNumber: "159094-001", price: 0.0, inventoryNumber: "30004278", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004279", name: "BASE", partNumber: "159159-001", price: 0.0, inventoryNumber: "30004279", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004281", name: "MECHAS", partNumber: "S19839-000", price: 0.0, inventoryNumber: "30004281", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004282", name: "SCREW", partNumber: "018680-522", price: 0.0, inventoryNumber: "30004282", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004283", name: "GASKET", partNumber: "117934-009", price: 0.0, inventoryNumber: "30004283", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004285", name: "SPRING", partNumber: "159078-001", price: 0.0, inventoryNumber: "30004285", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004286", name: "PARTS", partNumber: "S19826-001", price: 0.0, inventoryNumber: "30004286", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004287", name: "SCREW", partNumber: "018680-822", price: 0.0, inventoryNumber: "30004287", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004288", name: "HOOK", partNumber: "141307-901", price: 2328.55, inventoryNumber: "30004288", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004289", name: "BELT COVER STOPPER", partNumber: "158864-001", price: 0.0, inventoryNumber: "30004289", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004290", name: "LAINA", partNumber: "159270-201", price: 0.0, inventoryNumber: "30004290", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004291", name: "SCREW", partNumber: "062711-412", price: 0.0, inventoryNumber: "30004291", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004294", name: "SCREW", partNumber: "105451-001", price: 0.0, inventoryNumber: "30004294", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004295", name: "SPRING", partNumber: "118352-051", price: 0.0, inventoryNumber: "30004295", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004296", name: "HEAD HOOK", partNumber: "141256-001", price: 0.0, inventoryNumber: "30004296", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004297", name: "BUSHING", partNumber: "141464-001", price: 0.0, inventoryNumber: "30004297", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004298", name: "BUSHING", partNumber: "141539-001", price: 0.0, inventoryNumber: "30004298", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004299", name: "SPRING", partNumber: "100339-501", price: 0.0, inventoryNumber: "30004299", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004301", name: "LAINA", partNumber: "147317-001", price: 0.0, inventoryNumber: "30004301", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004304", name: "PRESSER FOOT", partNumber: "150768-001", price: 0.0, inventoryNumber: "30004304", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004305", name: "SCREW", partNumber: "014760-622", price: 0.0, inventoryNumber: "30004305", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004307", name: "SCREW", partNumber: "107126-001", price: 0.0, inventoryNumber: "30004307", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004308", name: "SCREW", partNumber: "060670-512", price: 0.0, inventoryNumber: "30004308", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004309", name: "BOBBIN CASE OPENER", partNumber: "112697-001", price: 0.0, inventoryNumber: "30004309", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004310", name: "SPRING", partNumber: "141471-001", price: 0.0, inventoryNumber: "30004310", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004311", name: "SPRING", partNumber: "141549-001", price: 0.0, inventoryNumber: "30004311", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004312", name: "SCREW", partNumber: "017782-512", price: 0.0, inventoryNumber: "30004312", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004313", name: "SCREW", partNumber: "115559-002", price: 0.0, inventoryNumber: "30004313", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004314", name: "NUT", partNumber: "141704-001", price: 0.0, inventoryNumber: "30004314", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004315", name: "SCREW", partNumber: "143716-001", price: 0.0, inventoryNumber: "30004315", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004317", name: "SCREW", partNumber: "100253-001", price: 0.0, inventoryNumber: "30004317", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004318", name: "LAINA", partNumber: "113-13103", price: 100.28, inventoryNumber: "30004318", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004320", name: "SCREW", partNumber: "151602-002", price: 0.0, inventoryNumber: "30004320", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004321", name: "GUIDE", partNumber: "141440-001", price: 0.0, inventoryNumber: "30004321", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004322", name: "HEAD HOOK PLATE", partNumber: "142312-001", price: 0.0, inventoryNumber: "30004322", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004323", name: "SPRING", partNumber: "148058-001", price: 0.0, inventoryNumber: "30004323", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004324", name: "TENSION", partNumber: "159805-001", price: 0.0, inventoryNumber: "30004324", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004325", name: "SCREW", partNumber: "141262-001", price: 0.0, inventoryNumber: "30004325", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004326", name: "SPRING", partNumber: "141333-001", price: 0.0, inventoryNumber: "30004326", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004327", name: "GUIDE", partNumber: "143748-001", price: 0.0, inventoryNumber: "30004327", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004328", name: "BASE", partNumber: "115558-002", price: 0.0, inventoryNumber: "30004328", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004329", name: "BASE", partNumber: "141466-001", price: 0.0, inventoryNumber: "30004329", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004330", name: "SCREW", partNumber: "141702-001", price: 0.0, inventoryNumber: "30004330", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004331", name: "ROLLER", partNumber: "156879-001", price: 0.0, inventoryNumber: "30004331", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004332", name: "BOBBIM WIMDER WHEEL", partNumber: "141609-006", price: 0.0, inventoryNumber: "30004332", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004333", name: "SCREW", partNumber: "145430-001", price: 0.0, inventoryNumber: "30004333", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004334", name: "SCREW", partNumber: "062710-616", price: 0.0, inventoryNumber: "30004334", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004335", name: "SPRING", partNumber: "141451-001", price: 0.0, inventoryNumber: "30004335", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004336", name: "STOP LEVER", partNumber: "141546-001", price: 0.0, inventoryNumber: "30004336", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004337", name: "SCREW", partNumber: "141605-001", price: 0.0, inventoryNumber: "30004337", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004339", name: "TENSION", partNumber: "148055-001", price: 0.0, inventoryNumber: "30004339", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004340", name: "SCREW", partNumber: "100526-003", price: 0.0, inventoryNumber: "30004340", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004341", name: "CARRETEL", partNumber: "112781-101", price: 0.0, inventoryNumber: "30004341", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004344", name: "KNIFE", partNumber: "148538-001", price: 0.0, inventoryNumber: "30004344", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004345", name: "FIXED KNIFE RINTH", partNumber: "149169-001", price: 0.0, inventoryNumber: "30004345", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004346", name: "SPRING", partNumber: "016000-408", price: 0.0, inventoryNumber: "30004346", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004348", name: "GASKET", partNumber: "114747-001", price: 0.0, inventoryNumber: "30004348", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004349", name: "LINK", partNumber: "181069-001", price: 0.0, inventoryNumber: "30004349", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004350", name: "PISTON", partNumber: "011-P", price: 927.46, inventoryNumber: "30004350", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004351", name: "PARTS", partNumber: "141462-001", price: 0.0, inventoryNumber: "30004351", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004352", name: "PARTS", partNumber: "141621-001", price: 0.0, inventoryNumber: "30004352", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004354", name: "PARTS", partNumber: "159014-101", price: 0.0, inventoryNumber: "30004354", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004358", name: "VARILLA", partNumber: "66-1013-9-002", price: 0.0, inventoryNumber: "30004358", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004359", name: "SPRING", partNumber: "66-1140-4-000", price: 0.0, inventoryNumber: "30004359", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004360", name: "WIRE TUBE", partNumber: "110-45804", price: 32.74, inventoryNumber: "30004360", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004362", name: "TAPA", partNumber: "113-00258", price: 0.0, inventoryNumber: "30004362", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004363", name: "PROXIMITY SWITCH", partNumber: "TL-W3MC1", price: 0.0, inventoryNumber: "30004363", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004364", name: "LIFT LEVER", partNumber: "113-01652", price: 0.0, inventoryNumber: "30004364", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004365", name: "SET SCREW", partNumber: "260-11908", price: 0.0, inventoryNumber: "30004365", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004366", name: "CORD ASSY", partNumber: "MAZ-025010B0", price: 0.0, inventoryNumber: "30004366", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004367", name: "SCREW", partNumber: "111-11507", price: 0.0, inventoryNumber: "30004367", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004368", name: "SCREW", partNumber: "SD-0650321-TP", price: 0.0, inventoryNumber: "30004368", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004369", name: "SCREW", partNumber: "SS-7701010-SP", price: 0.0, inventoryNumber: "30004369", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004371", name: "PHOTO SENSOR", partNumber: "HD-0005700-0A", price: 145.52, inventoryNumber: "30004371", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004372", name: "BASE", partNumber: "113-03302", price: 0.0, inventoryNumber: "30004372", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004373", name: "SREW", partNumber: "SS-9152130-CP", price: 0.0, inventoryNumber: "30004373", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004374", name: "PARTS", partNumber: "231-36005", price: 0.0, inventoryNumber: "30004374", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004375", name: "SPREADER", partNumber: "231-38209", price: 373.28, inventoryNumber: "30004375", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004376", name: "GASKET", partNumber: "110-24700", price: 105.62, inventoryNumber: "30004376", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004377", name: "BOMBA DEL ACIETE", partNumber: "229-23056", price: 526.37, inventoryNumber: "30004377", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004378", name: "KNEE LIFT ROD", partNumber: "110-24304", price: 12.3, inventoryNumber: "30004378", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004379", name: "SCREW", partNumber: "SS-7111120-SP", price: 0.0, inventoryNumber: "30004379", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004380", name: "WASHER", partNumber: "WP-0450801-SD", price: 0.0, inventoryNumber: "30004380", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004381", name: "ADJUSTING LINK", partNumber: "110-08802", price: 0.0, inventoryNumber: "30004381", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004384", name: "MECHA DE LUBRICACION", partNumber: "CQ-252000-000", price: 0.0, inventoryNumber: "30004384", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004385", name: "SCREW", partNumber: "SS-6110650-TP", price: 0.0, inventoryNumber: "30004385", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004386", name: "GASKET", partNumber: "110-02508", price: 0.0, inventoryNumber: "30004386", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004387", name: "GUIA HILO", partNumber: "110-18603", price: 0.0, inventoryNumber: "30004387", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004388", name: "RUBBER JOINT", partNumber: "110-21409", price: 22.16, inventoryNumber: "30004388", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004389", name: "LAINA", partNumber: "114-09802", price: 0.0, inventoryNumber: "30004389", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004390", name: "SCREW", partNumber: "SL-4041681-SF", price: 0.0, inventoryNumber: "30004390", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004391", name: "SCREW", partNumber: "SS-3090520-SP", price: 0.0, inventoryNumber: "30004391", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004392", name: "SCREW", partNumber: "SS-7120910-SP", price: 0.0, inventoryNumber: "30004392", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004393", name: "SPRING", partNumber: "TA-0800204-RO", price: 0.0, inventoryNumber: "30004393", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004394", name: "BUSHING", partNumber: "111-10707", price: 0.0, inventoryNumber: "30004394", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004396", name: "SCREW", partNumber: "SS-6081210-SP", price: 0.0, inventoryNumber: "30004396", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004397", name: "SCREW", partNumber: "SS-8150710-SP", price: 0.0, inventoryNumber: "30004397", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004398", name: "GASKET", partNumber: "110-00619", price: 132.02, inventoryNumber: "30004398", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004399", name: "BARRA", partNumber: "110-15005", price: 0.0, inventoryNumber: "30004399", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004401", name: "SELENOIDE", partNumber: "113-14754", price: 0.0, inventoryNumber: "30004401", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004402", name: "BELT COVER B", partNumber: "110-76809", price: 0.0, inventoryNumber: "30004402", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004403", name: "SPRING", partNumber: "111-10806", price: 0.0, inventoryNumber: "30004403", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004404", name: "GASKET", partNumber: "B1122-552-000", price: 0.0, inventoryNumber: "30004404", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004405", name: "SCREW", partNumber: "SS-1080510-SP", price: 0.0, inventoryNumber: "30004405", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004407", name: "PLATE", partNumber: "101-30300", price: 0.0, inventoryNumber: "30004407", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004408", name: "FELT", partNumber: "110-02904", price: 7.71, inventoryNumber: "30004408", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004409", name: "FELPA", partNumber: "B1226-552-000", price: 0.0, inventoryNumber: "30004409", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004410", name: "SCREW", partNumber: "SS-6621220-SP", price: 0.0, inventoryNumber: "30004410", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004411", name: "PARTS", partNumber: "111-10608", price: 0.0, inventoryNumber: "30004411", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004412", name: "LAINA", partNumber: "111-10905", price: 0.0, inventoryNumber: "30004412", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004413", name: "PARTS", partNumber: "113-15058", price: 0.0, inventoryNumber: "30004413", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004414", name: "LIFTING LEVER", partNumber: "113-01603", price: 56.61, inventoryNumber: "30004414", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004415", name: "TARGETAS ELECTRONICAS", partNumber: "M7301-301-0B0", price: 0.0, inventoryNumber: "30004415", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004416", name: "SHAFT BUSHING", partNumber: "110-04207", price: 0.0, inventoryNumber: "30004416", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004420", name: "SCREW", partNumber: "SS-6111010-SP", price: 6.43, inventoryNumber: "30004420", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004421", name: "PINS", partNumber: "110-09008", price: 0.0, inventoryNumber: "30004421", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004422", name: "SCREW", partNumber: "110-47354", price: 0.0, inventoryNumber: "30004422", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004423", name: "115 000 BUSCHING 229 06200", partNumber: "B1403", price: 149.27, inventoryNumber: "30004423", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004424", name: "PARTS", partNumber: "D2105-415-D00", price: 0.0, inventoryNumber: "30004424", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004425", name: "SCREW", partNumber: "SS-7112420-SP", price: 0.0, inventoryNumber: "30004425", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004426", name: "SCREW", partNumber: "110-23504", price: 0.0, inventoryNumber: "30004426", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004427", name: "WASHER", partNumber: "110-47305", price: 0.0, inventoryNumber: "30004427", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004428", name: "PARTS", partNumber: "M4007-110-0AA", price: 0.0, inventoryNumber: "30004428", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004429", name: "SCREW", partNumber: "SD-0500095-TH", price: 0.0, inventoryNumber: "30004429", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004430", name: "SCREW", partNumber: "SS-4701415-SD", price: 0.0, inventoryNumber: "30004430", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004431", name: "SCREW", partNumber: "SS-8151550-SP", price: 0.0, inventoryNumber: "30004431", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004432", name: "PARTS", partNumber: "110-20708", price: 0.0, inventoryNumber: "30004432", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004433", name: "GUIA HILO", partNumber: "110-91006", price: 97.95, inventoryNumber: "30004433", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004434", name: "GASKET", partNumber: "B1131-415-000", price: 0.0, inventoryNumber: "30004434", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004435", name: "BAR", partNumber: "MAV-02128000", price: 0.0, inventoryNumber: "30004435", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004436", name: "SCREW", partNumber: "SS-9090640-SP", price: 0.0, inventoryNumber: "30004436", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004438", name: "GUIA HILO", partNumber: "B1129-415-000", price: 0.0, inventoryNumber: "30004438", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004439", name: "FEED GOD", partNumber: "B1609-415-B00G", price: 0.0, inventoryNumber: "30004439", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004440", name: "KNIFE", partNumber: "D2404-555-B00", price: 0.0, inventoryNumber: "30004440", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004441", name: "GASKET", partNumber: "110-43205", price: 0.0, inventoryNumber: "30004441", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004442", name: "BUSHING FRONT", partNumber: "113-00902", price: 0.0, inventoryNumber: "30004442", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004443", name: "THEREAD GUIDE", partNumber: "113-02007/110-91006", price: 0.0, inventoryNumber: "30004443", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004445", name: "SCREW", partNumber: "SL-4043291-SP", price: 0.0, inventoryNumber: "30004445", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004446", name: "SCREW", partNumber: "110-40409", price: 98.7, inventoryNumber: "30004446", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004447", name: "THREAD TAKE UP LEVER", partNumber: "180-77503", price: 0.0, inventoryNumber: "30004447", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004449", name: "SCREW", partNumber: "SD-0490261-SP", price: 0.0, inventoryNumber: "30004449", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004450", name: "SCREW", partNumber: "SS-4111015-SP", price: 0.0, inventoryNumber: "30004450", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004451", name: "SCREW", partNumber: "SS-6120950-TP", price: 0.0, inventoryNumber: "30004451", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004453", name: "SPRING", partNumber: "110-18405", price: 0.0, inventoryNumber: "30004453", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004454", name: "SCREW", partNumber: "110-45002", price: 0.0, inventoryNumber: "30004454", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004455", name: "SOPORTE", partNumber: "111-00104", price: 0.0, inventoryNumber: "30004455", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004456", name: "SOPORTE", partNumber: "M-3111-301-000", price: 0.0, inventoryNumber: "30004456", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004457", name: "SCREW", partNumber: "SS-6090660-TP", price: 0.0, inventoryNumber: "30004457", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004458", name: "SOPORTE", partNumber: "TA-1250705-RO", price: 0.0, inventoryNumber: "30004458", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004459", name: "SOPORTE", partNumber: "110-47107", price: 0.0, inventoryNumber: "30004459", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004460", name: "PLATE", partNumber: "143175", price: 0.0, inventoryNumber: "30004460", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004463", name: "FEED GOD", partNumber: "B1613-490-FOD", price: 354.37, inventoryNumber: "30004463", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004464", name: "SCREW", partNumber: "MS-4020301-SC", price: 0.0, inventoryNumber: "30004464", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004465", name: "SCREW", partNumber: "113-01702", price: 0.0, inventoryNumber: "30004465", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004466", name: "TIRA HILO", partNumber: "159513101", price: 0.0, inventoryNumber: "30004466", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004467", name: "BASE", partNumber: "B1623-555-HA0-A", price: 0.0, inventoryNumber: "30004467", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004468", name: "SCREW", partNumber: "SS-6090540-SD", price: 0.0, inventoryNumber: "30004468", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004469", name: "GASKET", partNumber: "110-00304", price: 0.0, inventoryNumber: "30004469", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004470", name: "GREED REGALITING", partNumber: "110-00990", price: 0.0, inventoryNumber: "30004470", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004471", name: "LAINA", partNumber: "D2102-415-D00", price: 0.0, inventoryNumber: "30004471", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004472", name: "SCREW", partNumber: "SS-4110915-SP", price: 6.93, inventoryNumber: "30004472", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004473", name: "SCREW", partNumber: "SS-6660610-TP", price: 0.0, inventoryNumber: "30004473", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004474", name: "SCREW", partNumber: "SS-8660610-SP", price: 0.0, inventoryNumber: "30004474", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004475", name: "SOPORTE", partNumber: "TA-1250406-R0", price: 0.0, inventoryNumber: "30004475", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004476", name: "SOPORTE", partNumber: "TA-1250504-RO", price: 0.0, inventoryNumber: "30004476", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004477", name: "SPRING", partNumber: "110-45101/229-45505", price: 5.4, inventoryNumber: "30004477", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004479", name: "FEEG GOD", partNumber: "149021", price: 93.59, inventoryNumber: "30004479", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004481", name: "SCREW", partNumber: "SS-2110920-SP", price: 7.05, inventoryNumber: "30004481", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004482", name: "SCREW", partNumber: "SS-4080620-TP", price: 6.96, inventoryNumber: "30004482", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004483", name: "LAINA", partNumber: "110-01609", price: 0.0, inventoryNumber: "30004483", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004485", name: "SCREW", partNumber: "110-45309", price: 21.98, inventoryNumber: "30004485", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004486", name: "TENSION PARTS", partNumber: "110-72352", price: 119.5, inventoryNumber: "30004486", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004487", name: "PARTS", partNumber: "110-93804", price: 177.44, inventoryNumber: "30004487", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004490", name: "GUIA HILO", partNumber: "B1418-552-A00", price: 83.9, inventoryNumber: "30004490", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004491", name: "SCREW", partNumber: "SS-2110915-SP", price: 20.51, inventoryNumber: "30004491", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004492", name: "SCREW", partNumber: "SS-7080510-TP", price: 19.19, inventoryNumber: "30004492", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004493", name: "HOOK", partNumber: "110-38650", price: 827.91, inventoryNumber: "30004493", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004495", name: "BUSHING", partNumber: "111-11309", price: 0.0, inventoryNumber: "30004495", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004496", name: "THREAD GUIDE", partNumber: "B3319-704-L00", price: 0.0, inventoryNumber: "30004496", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004497", name: "SPRING", partNumber: "MAT-80113T00", price: 0.0, inventoryNumber: "30004497", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004498", name: "PARTS", partNumber: "113-03559", price: 0.0, inventoryNumber: "30004498", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004499", name: "FELP", partNumber: "113-07105", price: 24.84, inventoryNumber: "30004499", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004500", name: "412 000 OIL SCREW R 229 25002", partNumber: "B3514", price: 71.9, inventoryNumber: "30004500", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004501", name: "SCREW", partNumber: "SD-0550301-SP", price: 0.0, inventoryNumber: "30004501", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004502", name: "NEEDLE BAR", partNumber: "113-01009", price: 381.21, inventoryNumber: "30004502", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004504", name: "BASE PARA CUCHILLA", partNumber: "112-32105", price: 0.0, inventoryNumber: "30004504", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004506", name: "MECHAS", partNumber: "B1811-541-000", price: 0.0, inventoryNumber: "30004506", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004507", name: "OIL WICK", partNumber: "110-15906", price: 15.6, inventoryNumber: "30004507", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004508", name: "NEEDLE BARR", partNumber: "113-01108", price: 321.63, inventoryNumber: "30004508", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004509", name: "CARRETEL", partNumber: "B9117-051-000", price: 16.46, inventoryNumber: "30004509", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004510", name: "SCREW", partNumber: "SD-0640482-SP", price: 0.0, inventoryNumber: "30004510", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004511", name: "PARTS", partNumber: "113-12055", price: 292.99, inventoryNumber: "30004511", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004512", name: "LAINA", partNumber: "400-22323", price: 250.75, inventoryNumber: "30004512", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004513", name: "SCREW", partNumber: "SS-6090510-SP", price: 12.62, inventoryNumber: "30004513", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004514", name: "WASHER", partNumber: "WP-0820526-SD", price: 0.0, inventoryNumber: "30004514", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004516", name: "PINS", partNumber: "110-09107", price: 0.0, inventoryNumber: "30004516", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004517", name: "PINS", partNumber: "110-09206", price: 0.0, inventoryNumber: "30004517", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004519", name: "BUSHING", partNumber: "260-17707", price: 0.0, inventoryNumber: "30004519", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004520", name: "WASHER", partNumber: "WP-0480856-SP", price: 0.0, inventoryNumber: "30004520", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004521", name: "SELENOIDE", partNumber: "B2117-506-0A0", price: 0.0, inventoryNumber: "30004521", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004523", name: "WASHER", partNumber: "RO-0371801-00", price: 0.0, inventoryNumber: "30004523", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004524", name: "BUSHING", partNumber: "TA-0850604-RO", price: 0.0, inventoryNumber: "30004524", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004525", name: "SPRING", partNumber: "110-43700", price: 0.0, inventoryNumber: "30004525", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004526", name: "KNIFE", partNumber: "D2402-415-BA0", price: 0.0, inventoryNumber: "30004526", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004527", name: "SCREW", partNumber: "GAK-330400A0", price: 0.0, inventoryNumber: "30004527", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004528", name: "NUT", partNumber: "110-18900", price: 0.0, inventoryNumber: "30004528", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004529", name: "SCREW", partNumber: "SD-0641451-SP", price: 0.0, inventoryNumber: "30004529", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004530", name: "SCREW", partNumber: "SL-4030621-SS", price: 0.0, inventoryNumber: "30004530", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004531", name: "SCREW", partNumber: "SS-4150915-SP", price: 0.0, inventoryNumber: "30004531", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004532", name: "WASHER", partNumber: "110-06608", price: 0.0, inventoryNumber: "30004532", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004533", name: "SOPORTE", partNumber: "110-30202", price: 0.0, inventoryNumber: "30004533", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004534", name: "BRAZO", partNumber: "110-71800", price: 0.0, inventoryNumber: "30004534", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004535", name: "NUT", partNumber: "250-02908", price: 0.0, inventoryNumber: "30004535", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004536", name: "SCREW", partNumber: "SS-8090670-SP", price: 0.0, inventoryNumber: "30004536", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004537", name: "SPRING", partNumber: "B1136-350-000", price: 0.0, inventoryNumber: "30004537", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004538", name: "PINS", partNumber: "B1510-227-000", price: 0.0, inventoryNumber: "30004538", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004539", name: "BEARING", partNumber: "B1905-541-B00", price: 136.37, inventoryNumber: "30004539", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004540", name: "SCREW", partNumber: "SS-7090510-SP", price: 0.0, inventoryNumber: "30004540", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004542", name: "GASKET", partNumber: "113-00605", price: 0.0, inventoryNumber: "30004542", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004543", name: "SCREW", partNumber: "SD-0600271-SP", price: 0.0, inventoryNumber: "30004543", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004544", name: "SCREW", partNumber: "110-01500", price: 0.0, inventoryNumber: "30004544", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004546", name: "SPRING", partNumber: "111-02209", price: 0.0, inventoryNumber: "30004546", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004547", name: "GUIA", partNumber: "113-00407", price: 0.0, inventoryNumber: "30004547", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004548", name: "LOOPERS", partNumber: "D2030-481-C00", price: 0.0, inventoryNumber: "30004548", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004549", name: "RING", partNumber: "RE-0150000-K0", price: 0.0, inventoryNumber: "30004549", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004550", name: "SCREW", partNumber: "SS-6121840-SP", price: 0.0, inventoryNumber: "30004550", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004551", name: "WASHER", partNumber: "WS-0511302-KB", price: 0.0, inventoryNumber: "30004551", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004552", name: "GASKET", partNumber: "113-00506", price: 116.27, inventoryNumber: "30004552", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004553", name: "HINGE SCREW", partNumber: "SD-0790802-TP", price: 0.0, inventoryNumber: "30004553", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004554", name: "SCREW", partNumber: "SS-6090920-SP", price: 0.0, inventoryNumber: "30004554", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004556", name: "SCREW", partNumber: "SM-4051001-SB", price: 0.24, inventoryNumber: "30004556", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004558", name: "SCREW", partNumber: "SS-6121220-TP", price: 0.0, inventoryNumber: "30004558", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004559", name: "SELENOIDE", partNumber: "GAK-330500-B0", price: 0.0, inventoryNumber: "30004559", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004561", name: "PRESSER FOOT", partNumber: "B1509-038-FB0", price: 0.0, inventoryNumber: "30004561", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004562", name: "PRESSER FOOT", partNumber: "B1524-412-0B0", price: 64.95, inventoryNumber: "30004562", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004563", name: "PARTS", partNumber: "110-42652", price: 194.1, inventoryNumber: "30004563", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004564", name: "FELT B", partNumber: "113-07204", price: 28.6, inventoryNumber: "30004564", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004565", name: "THREAD GUIDE", partNumber: "B1114-226-000", price: 0.0, inventoryNumber: "30004565", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004567", name: "PARTS", partNumber: "D3213-555-DA0", price: 0.0, inventoryNumber: "30004567", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004568", name: "GUAGE DE 5/8", partNumber: "GAUGE5/8LH1152", price: 0.0, inventoryNumber: "30004568", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004569", name: "NUT", partNumber: "110-71701", price: 0.0, inventoryNumber: "30004569", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004570", name: "GUIA", partNumber: "113-05513", price: 0.0, inventoryNumber: "30004570", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004572", name: "NUT", partNumber: "NS-6110350-SP", price: 22.76, inventoryNumber: "30004572", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004573", name: "SCREW", partNumber: "SS-4110515-SP", price: 0.0, inventoryNumber: "30004573", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004577", name: "PLATE", partNumber: "147150", price: 10.4, inventoryNumber: "30004577", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004578", name: "FEED DOG", partNumber: "D1609-415-B0H", price: 313.83, inventoryNumber: "30004578", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004579", name: "NUT", partNumber: "NM-6043212-SB", price: 0.0, inventoryNumber: "30004579", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004580", name: "SCREW", partNumber: "SS-1120710-SP", price: 0.0, inventoryNumber: "30004580", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004581", name: "SPRING", partNumber: "110-91204", price: 0.0, inventoryNumber: "30004581", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004583", name: "WASHER", partNumber: "B3132-552-000", price: 0.0, inventoryNumber: "30004583", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004584", name: "SPRING", partNumber: "M2006-110-000", price: 0.0, inventoryNumber: "30004584", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004585", name: "SCREW", partNumber: "SD-0460702-TP", price: 0.0, inventoryNumber: "30004585", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004586", name: "WASHER", partNumber: "WP-1052000-SF", price: 0.0, inventoryNumber: "30004586", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004587", name: "PARTS", partNumber: "110-06756", price: 0.0, inventoryNumber: "30004587", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004588", name: "SPRING", partNumber: "112-17601", price: 0.0, inventoryNumber: "30004588", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004589", name: "FITTING", partNumber: "112-21504", price: 0.0, inventoryNumber: "30004589", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004590", name: "SPRING", partNumber: "229-07406", price: 28.64, inventoryNumber: "30004590", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004591", name: "PINS", partNumber: "MA0-12002000", price: 0.0, inventoryNumber: "30004591", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004592", name: "PINS", partNumber: "110-08901", price: 0.0, inventoryNumber: "30004592", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004593", name: "POSITIONING FINGER", partNumber: "229-16407", price: 0.0, inventoryNumber: "30004593", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004594", name: "PARTS", partNumber: "B1411-552-0A0", price: 0.0, inventoryNumber: "30004594", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004595", name: "BUSHING", partNumber: "B3111-126-000", price: 0.0, inventoryNumber: "30004595", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004596", name: "TENSION", partNumber: "B3126-012-000", price: 0.0, inventoryNumber: "30004596", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004597", name: "WASHER", partNumber: "B3136-415-000", price: 0.0, inventoryNumber: "30004597", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004598", name: "BUSHING", partNumber: "110-47255", price: 0.0, inventoryNumber: "30004598", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004599", name: "LAINA", partNumber: "110-76957", price: 0.0, inventoryNumber: "30004599", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004600", name: "FRAME ASSY", partNumber: "113-03567", price: 0.0, inventoryNumber: "30004600", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004601", name: "POSITTIONING 229 42502", partNumber: "110-38809", price: 140.84, inventoryNumber: "30004601", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004603", name: "SCREW", partNumber: "01-82-18", price: 0.0, inventoryNumber: "30004603", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004604", name: "SCREW", partNumber: "01-97-04", price: 0.0, inventoryNumber: "30004604", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004605", name: "SCREW", partNumber: "03-C-424", price: 0.0, inventoryNumber: "30004605", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004606", name: "NUT", partNumber: "03-C-430", price: 0.0, inventoryNumber: "30004606", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004608", name: "BUSHING", partNumber: "45139", price: 0.0, inventoryNumber: "30004608", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004609", name: "SCREW", partNumber: "03-C-415", price: 0.0, inventoryNumber: "30004609", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004610", name: "ELEMENT", partNumber: "03-C-427", price: 0.0, inventoryNumber: "30004610", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004611", name: "01 02 03 TAPA", partNumber: "2010203", price: 0.0, inventoryNumber: "30004611", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004612", name: "CONTROL", partNumber: "AY02510", price: 0.0, inventoryNumber: "30004612", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004613", name: "HANDLE GRIP", partNumber: "38353", price: 0.0, inventoryNumber: "30004613", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004614", name: "PARTS", partNumber: "T9813-070", price: 0.0, inventoryNumber: "30004614", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004615", name: "BASE", partNumber: "03-C-433", price: 0.0, inventoryNumber: "30004615", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004617", name: "BASE", partNumber: "03-C-434", price: 0.0, inventoryNumber: "30004617", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004619", name: "GRAPA", partNumber: "M9220", price: 0.0, inventoryNumber: "30004619", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004621", name: "SCREW", partNumber: "03-C-435", price: 0.0, inventoryNumber: "30004621", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004623", name: "MANGO", partNumber: "01-17-01", price: 0.0, inventoryNumber: "30004623", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004624", name: "PARTS", partNumber: "01-19-06", price: 0.0, inventoryNumber: "30004624", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004625", name: "SCREW", partNumber: "01-30-40", price: 0.0, inventoryNumber: "30004625", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004626", name: "SCREW", partNumber: "01-94-04", price: 0.0, inventoryNumber: "30004626", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004627", name: "VALVE SEAT", partNumber: "03-C-448", price: 0.0, inventoryNumber: "30004627", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004628", name: "NUT", partNumber: "03-C-409", price: 0.0, inventoryNumber: "30004628", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004629", name: "NUT", partNumber: "2012535", price: 0.0, inventoryNumber: "30004629", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004630", name: "SCREW", partNumber: "M8301", price: 0.0, inventoryNumber: "30004630", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004631", name: "THERMISTER", partNumber: "37956", price: 0.0, inventoryNumber: "30004631", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004632", name: "SCREW", partNumber: "01-95-11", price: 0.0, inventoryNumber: "30004632", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004634", name: "FILTRO", partNumber: "03-C-456", price: 0.0, inventoryNumber: "30004634", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004635", name: "PARTS", partNumber: "2012533", price: 0.0, inventoryNumber: "30004635", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004636", name: "WASHER", partNumber: "03-C-405", price: 0.0, inventoryNumber: "30004636", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004637", name: "SCREW", partNumber: "03-C-422", price: 0.0, inventoryNumber: "30004637", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004638", name: "SCREW", partNumber: "03-C-432", price: 0.0, inventoryNumber: "30004638", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004639", name: "SCREW", partNumber: "03-C-442", price: 0.0, inventoryNumber: "30004639", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004640", name: "SPRING", partNumber: "2012532", price: 0.0, inventoryNumber: "30004640", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004641", name: "ORING", partNumber: "01-14-24", price: 0.0, inventoryNumber: "30004641", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004642", name: "BUSHING", partNumber: "01-95-07M", price: 0.0, inventoryNumber: "30004642", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004643", name: "SCREW", partNumber: "03-C-428", price: 0.0, inventoryNumber: "30004643", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004644", name: "SCREW", partNumber: "111-02-2B", price: 0.0, inventoryNumber: "30004644", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004645", name: "ORING", partNumber: "01-16-CR", price: 0.0, inventoryNumber: "30004645", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004646", name: "GASKET", partNumber: "03-C-457", price: 0.0, inventoryNumber: "30004646", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004648", name: "SPRING", partNumber: "C-441-03", price: 0.0, inventoryNumber: "30004648", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004649", name: "PISTON", partNumber: "7502-G", price: 0.0, inventoryNumber: "30004649", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004650", name: "FITTING", partNumber: "7511", price: 0.0, inventoryNumber: "30004650", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004651", name: "BASE", partNumber: "7529", price: 0.0, inventoryNumber: "30004651", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004652", name: "PARTS", partNumber: "7540", price: 0.0, inventoryNumber: "30004652", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004653", name: "BLOCK", partNumber: "B1163A", price: 0.0, inventoryNumber: "30004653", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004654", name: "BASE", partNumber: "01-5513-01", price: 0.0, inventoryNumber: "30004654", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004655", name: "LAINA", partNumber: "01-7961-01", price: 0.0, inventoryNumber: "30004655", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004656", name: "NUT", partNumber: "028857-01", price: 0.0, inventoryNumber: "30004656", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004657", name: "KNIFE", partNumber: "10-1123-03", price: 0.0, inventoryNumber: "30004657", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004658", name: "SPRING", partNumber: "30-2428-01", price: 0.0, inventoryNumber: "30004658", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004659", name: "WASHER", partNumber: "30-2429-01", price: 0.0, inventoryNumber: "30004659", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004660", name: "SCREW", partNumber: "33-2104-02", price: 0.0, inventoryNumber: "30004660", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004661", name: "PISTON", partNumber: "1459", price: 0.0, inventoryNumber: "30004661", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004662", name: "BAR", partNumber: "7504", price: 0.0, inventoryNumber: "30004662", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004664", name: "MICRO", partNumber: "7542", price: 0.0, inventoryNumber: "30004664", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004666", name: "BASE", partNumber: "B9460A", price: 0.0, inventoryNumber: "30004666", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004667", name: "RESISTENCIA RESIS", partNumber: "", price: 2533.33, inventoryNumber: "30004667", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004668", name: "SCREW", partNumber: "01-3037-11", price: 0.0, inventoryNumber: "30004668", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004669", name: "SCREW", partNumber: "01-3077-01", price: 0.0, inventoryNumber: "30004669", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004670", name: "LAINA", partNumber: "01-5515-01", price: 0.0, inventoryNumber: "30004670", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004671", name: "SPRING", partNumber: "01-5573-01", price: 0.0, inventoryNumber: "30004671", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004672", name: "PINS", partNumber: "01-5897-01", price: 0.0, inventoryNumber: "30004672", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004673", name: "SCREW", partNumber: "01-6003-040", price: 0.0, inventoryNumber: "30004673", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004674", name: "SCREW", partNumber: "33-0304-06", price: 0.0, inventoryNumber: "30004674", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004675", name: "RING KNIFE", partNumber: "614-7", price: 0.0, inventoryNumber: "30004675", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004678", name: "BASE", partNumber: "7551", price: 0.0, inventoryNumber: "30004678", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004679", name: "CONTROL", partNumber: "7555", price: 0.0, inventoryNumber: "30004679", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004680", name: "HEAT CANOPY", partNumber: "37803", price: 0.0, inventoryNumber: "30004680", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004681", name: "VASOS", partNumber: "30-1085-01", price: 0.0, inventoryNumber: "30004681", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004682", name: "SCREW", partNumber: "01-3066-11", price: 0.0, inventoryNumber: "30004682", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004683", name: "BASE", partNumber: "01-5583-02", price: 0.0, inventoryNumber: "30004683", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004684", name: "SPRING", partNumber: "01-5848-01", price: 0.0, inventoryNumber: "30004684", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004685", name: "SCREW", partNumber: "33-0302-02", price: 0.0, inventoryNumber: "30004685", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004686", name: "SCREW", partNumber: "33-0304-05", price: 0.0, inventoryNumber: "30004686", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004687", name: "SCREW", partNumber: "33-0904-04", price: 0.0, inventoryNumber: "30004687", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004688", name: "SELENOIDE", partNumber: "7537", price: 0.0, inventoryNumber: "30004688", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004689", name: "PARTS", partNumber: "7573", price: 0.0, inventoryNumber: "30004689", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004690", name: "THERMOSTATAT WIRE", partNumber: "B1213A", price: 0.0, inventoryNumber: "30004690", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004691", name: "PARTS", partNumber: "7500", price: 0.0, inventoryNumber: "30004691", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004692", name: "NUT", partNumber: "7514", price: 0.0, inventoryNumber: "30004692", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004693", name: "BASE", partNumber: "B3098A", price: 0.0, inventoryNumber: "30004693", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004694", name: "BUSHING", partNumber: "01-1819-51", price: 0.0, inventoryNumber: "30004694", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004695", name: "NUT", partNumber: "01-3085-01", price: 0.0, inventoryNumber: "30004695", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004696", name: "BASE", partNumber: "01-5849-02", price: 0.0, inventoryNumber: "30004696", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004697", name: "KNIFE", partNumber: "01-5850-02", price: 0.0, inventoryNumber: "30004697", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004698", name: "SCREW", partNumber: "01-6003-035", price: 0.0, inventoryNumber: "30004698", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004699", name: "KNIFE", partNumber: "10-1122-03", price: 0.0, inventoryNumber: "30004699", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004700", name: "SCREW", partNumber: "30-2714-01", price: 0.0, inventoryNumber: "30004700", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004701", name: "SCREW", partNumber: "33-0302-04", price: 0.0, inventoryNumber: "30004701", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004702", name: "SCREW", partNumber: "8/32X5/8", price: 0.0, inventoryNumber: "30004702", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004703", name: "PRESSER FOOT", partNumber: "490360", price: 0.0, inventoryNumber: "30004703", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004706", name: "PRESSER FOOT", partNumber: "211-14", price: 89.66, inventoryNumber: "30004706", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004707", name: "PRESSER FOOT", partNumber: "SM20", price: 128.97, inventoryNumber: "30004707", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004708", name: "PRESSER FOOT", partNumber: "220", price: 58.92, inventoryNumber: "30004708", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004710", name: "PRESSER FOOT", partNumber: "23D", price: 148.99, inventoryNumber: "30004710", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004713", name: "PRESSER FOOT", partNumber: "S538", price: 186.55, inventoryNumber: "30004713", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004715", name: "PRESSER FOOT 212", partNumber: "CR1/8", price: 66.31, inventoryNumber: "30004715", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004716", name: "PRESSER FOOT", partNumber: "21R", price: 76.79, inventoryNumber: "30004716", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004718", name: "PRESSER FOOT", partNumber: "22L1/32", price: 75.41, inventoryNumber: "30004718", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004719", name: "CARRETEL", partNumber: "418046", price: 19.34, inventoryNumber: "30004719", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004721", name: "PRESSER FOOT", partNumber: "210", price: 61.5, inventoryNumber: "30004721", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004723", name: "PRESSER FOOT", partNumber: "12463HR1/32", price: 0.0, inventoryNumber: "30004723", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004724", name: "PRESSER FOOT", partNumber: "12463LH1/16", price: 85.34, inventoryNumber: "30004724", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004725", name: "PRESSER FOOT", partNumber: "12463LH1/32", price: 117.89, inventoryNumber: "30004725", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004728", name: "PRESSER FOOT", partNumber: "213", price: 79.56, inventoryNumber: "30004728", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004729", name: "PRESSER FOOD", partNumber: "S539", price: 116.65, inventoryNumber: "30004729", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004731", name: "PRESSER FOOT", partNumber: "231", price: 0.0, inventoryNumber: "30004731", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004734", name: "SCREW", partNumber: "50129", price: 0.0, inventoryNumber: "30004734", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004735", name: "SWITCH", partNumber: "053223-002", price: 0.0, inventoryNumber: "30004735", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004736", name: "CONTROL", partNumber: "300031-001", price: 0.0, inventoryNumber: "30004736", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004737", name: "MICRO", partNumber: "50-225A", price: 0.0, inventoryNumber: "30004737", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004738", name: "CONTROL", partNumber: "T15D", price: 0.0, inventoryNumber: "30004738", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004739", name: "PARTS", partNumber: "118661-021", price: 0.0, inventoryNumber: "30004739", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004740", name: "VALVE", partNumber: "120970-003", price: 0.0, inventoryNumber: "30004740", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004743", name: "NUT", partNumber: "16194", price: 0.0, inventoryNumber: "30004743", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004744", name: "BEARING", partNumber: "243", price: 0.0, inventoryNumber: "30004744", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004745", name: "SWITCH", partNumber: "616", price: 0.0, inventoryNumber: "30004745", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004746", name: "DISC RETAINER", partNumber: "16030", price: 0.0, inventoryNumber: "30004746", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004747", name: "SLIDE BAR ASS", partNumber: "16036", price: 0.0, inventoryNumber: "30004747", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004748", name: "PARTS", partNumber: "16065", price: 0.0, inventoryNumber: "30004748", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004749", name: "SCREW", partNumber: "324", price: 0.0, inventoryNumber: "30004749", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004750", name: "BASE", partNumber: "16059", price: 0.0, inventoryNumber: "30004750", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004751", name: "PARTS", partNumber: "16063", price: 0.0, inventoryNumber: "30004751", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004752", name: "BASE", partNumber: "16088", price: 0.0, inventoryNumber: "30004752", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004753", name: "NUT", partNumber: "173", price: 0.0, inventoryNumber: "30004753", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004754", name: "PINS", partNumber: "205", price: 0.0, inventoryNumber: "30004754", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004755", name: "PINS", partNumber: "651", price: 0.0, inventoryNumber: "30004755", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004756", name: "PARTS", partNumber: "16082", price: 0.0, inventoryNumber: "30004756", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004757", name: "SCREW", partNumber: "654", price: 0.0, inventoryNumber: "30004757", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004758", name: "PARTS", partNumber: "16080", price: 0.0, inventoryNumber: "30004758", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004759", name: "SHOE", partNumber: "16121", price: 0.0, inventoryNumber: "30004759", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004760", name: "LAINA", partNumber: "16158", price: 0.0, inventoryNumber: "30004760", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004761", name: "SPRING", partNumber: "10111", price: 0.0, inventoryNumber: "30004761", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004762", name: "LAINA", partNumber: "16055", price: 0.0, inventoryNumber: "30004762", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004763", name: "SPRING", partNumber: "16165", price: 0.0, inventoryNumber: "30004763", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004764", name: "RETAINER", partNumber: "260", price: 0.0, inventoryNumber: "30004764", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004766", name: "SCREW 40", partNumber: "", price: 0.0, inventoryNumber: "30004766", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004767", name: "SCREW 85", partNumber: "", price: 0.0, inventoryNumber: "30004767", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004768", name: "SELENOIDE", partNumber: "627", price: 0.0, inventoryNumber: "30004768", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004769", name: "WASHER", partNumber: "150", price: 0.0, inventoryNumber: "30004769", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004770", name: "VAN WEISE GAER", partNumber: "16196", price: 0.0, inventoryNumber: "30004770", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004771", name: "SCREW", partNumber: "138", price: 0.0, inventoryNumber: "30004771", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004772", name: "LAINA", partNumber: "16032", price: 0.0, inventoryNumber: "30004772", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004773", name: "LAINA", partNumber: "16087", price: 0.0, inventoryNumber: "30004773", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004774", name: "LAINA", partNumber: "16159", price: 0.0, inventoryNumber: "30004774", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004775", name: "SCREW", partNumber: "455", price: 0.0, inventoryNumber: "30004775", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004776", name: "SCWITCH", partNumber: "16160", price: 0.0, inventoryNumber: "30004776", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004777", name: "PINS", partNumber: "229", price: 0.0, inventoryNumber: "30004777", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004778", name: "CAPASITOR", partNumber: "314", price: 0.0, inventoryNumber: "30004778", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004779", name: "LEVER", partNumber: "66-1607-7-003", price: 0.0, inventoryNumber: "30004779", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004780", name: "BASE", partNumber: "10097", price: 0.0, inventoryNumber: "30004780", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004781", name: "BASE", partNumber: "16029", price: 0.0, inventoryNumber: "30004781", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004782", name: "STRIPERS", partNumber: "16033", price: 0.0, inventoryNumber: "30004782", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004783", name: "BASE", partNumber: "16037", price: 0.0, inventoryNumber: "30004783", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004784", name: "CONECTOR", partNumber: "16075", price: 0.0, inventoryNumber: "30004784", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004785", name: "RELAY", partNumber: "610", price: 66.0, inventoryNumber: "30004785", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004786", name: "DIODO", partNumber: "633", price: 0.0, inventoryNumber: "30004786", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004787", name: "BASE", partNumber: "16031", price: 0.0, inventoryNumber: "30004787", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004788", name: "SCREW", partNumber: "16086", price: 0.0, inventoryNumber: "30004788", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004789", name: "PIN SOCKERT", partNumber: "272", price: 0.0, inventoryNumber: "30004789", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004790", name: "SELENOIDE", partNumber: "446", price: 0.0, inventoryNumber: "30004790", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004791", name: "SCREW 61", partNumber: "", price: 0.0, inventoryNumber: "30004791", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004792", name: "SCREW", partNumber: "137", price: 0.0, inventoryNumber: "30004792", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004793", name: "SCREW", partNumber: "240", price: 0.0, inventoryNumber: "30004793", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004794", name: "PLUG", partNumber: "273", price: 1025.32, inventoryNumber: "30004794", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004795", name: "SCREW", partNumber: "42008", price: 0.0, inventoryNumber: "30004795", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004796", name: "RESISTOR", partNumber: "506", price: 0.0, inventoryNumber: "30004796", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004797", name: "RELAY", partNumber: "609", price: 0.0, inventoryNumber: "30004797", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004798", name: "MICRO SWITCH", partNumber: "617", price: 0.0, inventoryNumber: "30004798", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004799", name: "RESISTENCIA", partNumber: "659", price: 0.0, inventoryNumber: "30004799", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004800", name: "PINS", partNumber: "1075", price: 0.0, inventoryNumber: "30004800", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004801", name: "PINS", partNumber: "16041", price: 0.0, inventoryNumber: "30004801", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004802", name: "PIN BLOK", partNumber: "16061", price: 0.0, inventoryNumber: "30004802", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004803", name: "DEPRESOR", partNumber: "16173", price: 0.0, inventoryNumber: "30004803", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004804", name: "SENSOR", partNumber: "1779", price: 0.0, inventoryNumber: "30004804", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004806", name: "SCREW", partNumber: "266", price: 0.0, inventoryNumber: "30004806", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004807", name: "SCREW 41", partNumber: "", price: 0.0, inventoryNumber: "30004807", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004808", name: "PLATE", partNumber: "16083", price: 0.0, inventoryNumber: "30004808", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004809", name: "RETENEDOR", partNumber: "16167", price: 0.0, inventoryNumber: "30004809", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004810", name: "BUSHING", partNumber: "16174", price: 0.0, inventoryNumber: "30004810", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004811", name: "BASE", partNumber: "16028", price: 0.0, inventoryNumber: "30004811", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004812", name: "PARTS", partNumber: "16034", price: 0.0, inventoryNumber: "30004812", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004813", name: "PARTS", partNumber: "16035", price: 0.0, inventoryNumber: "30004813", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004814", name: "SPRING", partNumber: "16044", price: 0.0, inventoryNumber: "30004814", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004815", name: "PUNCH BLOCK", partNumber: "16026", price: 0.0, inventoryNumber: "30004815", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004816", name: "GEAR", partNumber: "15305A", price: 0.0, inventoryNumber: "30004816", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004817", name: "SCREW", partNumber: "239521F", price: 0.0, inventoryNumber: "30004817", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004818", name: "SCREW", partNumber: "29480ALS", price: 776.21, inventoryNumber: "30004818", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004820", name: "ISULATOR", partNumber: "51295A", price: 66.2, inventoryNumber: "30004820", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004821", name: "INSULATOR", partNumber: "51295B", price: 131.11, inventoryNumber: "30004821", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004822", name: "PLATE", partNumber: "51305A", price: 0.0, inventoryNumber: "30004822", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004823", name: "NEEDLE BARR", partNumber: "51817A", price: 3258.41, inventoryNumber: "30004823", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004824", name: "THD EYELET", partNumber: "54259", price: 0.0, inventoryNumber: "30004824", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004825", name: "PLATE", partNumber: "C54224A4-16", price: 0.0, inventoryNumber: "30004825", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004829", name: "PARTS", partNumber: "51292-A", price: 0.0, inventoryNumber: "30004829", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004832", name: "PARTS", partNumber: "54244P", price: 0.0, inventoryNumber: "30004832", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004833", name: "BASE T", partNumber: "54278", price: 0.0, inventoryNumber: "30004833", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004834", name: "SCREW", partNumber: "22894-J", price: 0.0, inventoryNumber: "30004834", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004836", name: "PARTS", partNumber: "52222", price: 0.0, inventoryNumber: "30004836", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004837", name: "BASE", partNumber: "54280-A", price: 0.0, inventoryNumber: "30004837", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004839", name: "SPRING", partNumber: "29480KP", price: 0.0, inventoryNumber: "30004839", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004840", name: "LAINA", partNumber: "36264B", price: 0.0, inventoryNumber: "30004840", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004841", name: "PIN", partNumber: "50-458BLK", price: 0.0, inventoryNumber: "30004841", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004842", name: "WASHER", partNumber: "54249-D", price: 0.0, inventoryNumber: "30004842", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004844", name: "GUIA HILO", partNumber: "54458-12", price: 0.0, inventoryNumber: "30004844", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004845", name: "NEEDLE HOLDER", partNumber: "59218-9-16", price: 0.0, inventoryNumber: "30004845", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004846", name: "SCREW", partNumber: "11B", price: 0.0, inventoryNumber: "30004846", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004847", name: "WASHER", partNumber: "51216N", price: 0.0, inventoryNumber: "30004847", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004849", name: "GASKET", partNumber: "56382C", price: 80.35, inventoryNumber: "30004849", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004850", name: "NEEDLE GUARD", partNumber: "51725", price: 0.0, inventoryNumber: "30004850", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004851", name: "LOOPERS HOLDER", partNumber: "54485A", price: 169.63, inventoryNumber: "30004851", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004852", name: "PARTS", partNumber: "21375BB", price: 0.0, inventoryNumber: "30004852", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004853", name: "PACT", partNumber: "51134", price: 0.0, inventoryNumber: "30004853", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004854", name: "NUT", partNumber: "51292-C", price: 0.0, inventoryNumber: "30004854", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004855", name: "OIL GA", partNumber: "56394C", price: 0.0, inventoryNumber: "30004855", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004857", name: "5129 2F 1 SPRING F2", partNumber: "51292", price: 0.0, inventoryNumber: "30004857", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004859", name: "TAKE UP WIRE", partNumber: "54270", price: 0.0, inventoryNumber: "30004859", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004860", name: "GEAR C", partNumber: "54275", price: 0.0, inventoryNumber: "30004860", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004861", name: "NEEDLE LEVER", partNumber: "56350-A", price: 0.0, inventoryNumber: "30004861", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004862", name: "PRENSATELA", partNumber: "K67661", price: 0.0, inventoryNumber: "30004862", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004863", name: "BASE DE PRENSATELA", partNumber: "16126", price: 0.0, inventoryNumber: "30004863", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004865", name: "SCREW", partNumber: "22839", price: 0.0, inventoryNumber: "30004865", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004866", name: "WASHER", partNumber: "28577", price: 0.0, inventoryNumber: "30004866", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004867", name: "PRENSSER FOOT", partNumber: "51420K-24", price: 1056.98, inventoryNumber: "30004867", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004869", name: "DRIVING ARM", partNumber: "54244B", price: 0.0, inventoryNumber: "30004869", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004870", name: "ORING", partNumber: "54275D", price: 0.0, inventoryNumber: "30004870", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004871", name: "SCREW", partNumber: "12986B", price: 0.0, inventoryNumber: "30004871", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004872", name: "NUT", partNumber: "54871", price: 0.0, inventoryNumber: "30004872", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004873", name: "PORTA AGUJA", partNumber: "8118-64", price: 0.0, inventoryNumber: "30004873", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004874", name: "BUSHING", partNumber: "PP15N", price: 0.0, inventoryNumber: "30004874", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004875", name: "SCREW", partNumber: "22569B", price: 0.0, inventoryNumber: "30004875", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004876", name: "WASHER", partNumber: "39592-AK", price: 0.0, inventoryNumber: "30004876", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004877", name: "SCREW", partNumber: "477", price: 0.0, inventoryNumber: "30004877", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004878", name: "GASKET", partNumber: "51282-Z", price: 143.06, inventoryNumber: "30004878", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004879", name: "GUIDE", partNumber: "56316C", price: 472.19, inventoryNumber: "30004879", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004880", name: "SCREW", partNumber: "22504-A", price: 0.0, inventoryNumber: "30004880", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004883", name: "SCREW", partNumber: "22892-D", price: 0.0, inventoryNumber: "30004883", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004884", name: "SCREW", partNumber: "22894-L", price: 0.0, inventoryNumber: "30004884", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004885", name: "WASHER", partNumber: "51235-G", price: 0.0, inventoryNumber: "30004885", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004886", name: "BUSHING", partNumber: "51254-A", price: 0.0, inventoryNumber: "30004886", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004887", name: "SPRING", partNumber: "53787", price: 0.0, inventoryNumber: "30004887", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004888", name: "THREAD EYELET", partNumber: "54158A", price: 253.22, inventoryNumber: "30004888", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004890", name: "SCREW", partNumber: "22863C", price: 0.0, inventoryNumber: "30004890", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004892", name: "FEED GOD", partNumber: "54205A-12-12", price: 0.0, inventoryNumber: "30004892", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004894", name: "PLATE", partNumber: "54224-A-12-12", price: 0.0, inventoryNumber: "30004894", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004896", name: "THEREAD GUIDE", partNumber: "56958A", price: 356.53, inventoryNumber: "30004896", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004898", name: "SCREW", partNumber: "51294R", price: 0.0, inventoryNumber: "30004898", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004899", name: "BARR", partNumber: "54242B-12-12", price: 545.82, inventoryNumber: "30004899", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004900", name: "RETAINER RING", partNumber: "660-215", price: 0.0, inventoryNumber: "30004900", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004901", name: "SCREW", partNumber: "22542A", price: 0.0, inventoryNumber: "30004901", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004902", name: "SCREW", partNumber: "25CC", price: 0.0, inventoryNumber: "30004902", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004903", name: "PRENSATELA", partNumber: "51730-64", price: 0.0, inventoryNumber: "30004903", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004904", name: "PRESSER FOOT", partNumber: "54420-12-12", price: 0.0, inventoryNumber: "30004904", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004905", name: "LOOPERS THREAD", partNumber: "54492D", price: 0.0, inventoryNumber: "30004905", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004906", name: "SCREW", partNumber: "605A", price: 0.0, inventoryNumber: "30004906", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004907", name: "SCREW 87", partNumber: "", price: 17.69, inventoryNumber: "30004907", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004908", name: "SCREW", partNumber: "22652B8", price: 0.0, inventoryNumber: "30004908", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004910", name: "BASE", partNumber: "51770-56", price: 0.0, inventoryNumber: "30004910", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004912", name: "PINS PLUNGER", partNumber: "59444J", price: 0.0, inventoryNumber: "30004912", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004913", name: "WASHER", partNumber: "8372A", price: 0.0, inventoryNumber: "30004913", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004915", name: "GUIDE", partNumber: "GBR-0131800C", price: 48.73, inventoryNumber: "30004915", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004916", name: "LAINA", partNumber: "GBR-0134700A", price: 0.0, inventoryNumber: "30004916", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004917", name: "PARTS", partNumber: "GBR-01414000", price: 0.0, inventoryNumber: "30004917", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004918", name: "BUTTUN STOPPER", partNumber: "GBR-01440000", price: 0.0, inventoryNumber: "30004918", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004919", name: "BUTTUN STANDING", partNumber: "GBR-01441000", price: 0.0, inventoryNumber: "30004919", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004920", name: "SPRING", partNumber: "GBR-01110000", price: 0.0, inventoryNumber: "30004920", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004921", name: "BOTTON CARRIER", partNumber: "GBR-01152CA0", price: 0.0, inventoryNumber: "30004921", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004922", name: "BOTTON CARRIER", partNumber: "GBR-01152FA0", price: 0.0, inventoryNumber: "30004922", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004924", name: "BASE", partNumber: "GBR-013120A0", price: 0.0, inventoryNumber: "30004924", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004925", name: "HANDLE", partNumber: "B2515-372-000", price: 0.0, inventoryNumber: "30004925", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004927", name: "ORING", partNumber: "RO-6465701-00", price: 0.0, inventoryNumber: "30004927", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004928", name: "SCREW", partNumber: "SS-3090610-SP", price: 0.0, inventoryNumber: "30004928", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004929", name: "LAINA", partNumber: "B2556-372-000", price: 0.0, inventoryNumber: "30004929", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004932", name: "SELENOIDE", partNumber: "GBR-01240000A", price: 0.0, inventoryNumber: "30004932", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004933", name: "SCREW", partNumber: "SS-7150940-SP", price: 0.0, inventoryNumber: "30004933", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004936", name: "THREAD TAKE UP COVER", partNumber: "S33001109", price: 0.0, inventoryNumber: "30004936", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004937", name: "SPRING", partNumber: "GBR-01126000-A", price: 0.0, inventoryNumber: "30004937", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004938", name: "GUIA", partNumber: "GBR-01319000", price: 0.0, inventoryNumber: "30004938", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004939", name: "SELECTOR PLATE", partNumber: "GBR-01423S00", price: 0.0, inventoryNumber: "30004939", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004940", name: "SELECTOR PLATE", partNumber: "GBR-01424000", price: 0.0, inventoryNumber: "30004940", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004941", name: "OIL SEAL", partNumber: "GBR-01535000", price: 0.0, inventoryNumber: "30004941", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004942", name: "JOW LEVER", partNumber: "B2555-372-RAA", price: 0.0, inventoryNumber: "30004942", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004943", name: "SCREW", partNumber: "GBR-01173000", price: 0.0, inventoryNumber: "30004943", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004944", name: "SCREW", partNumber: "GBR-01359000", price: 0.0, inventoryNumber: "30004944", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004945", name: "BOTTON CARRIER", partNumber: "GBR-01152PA0", price: 0.0, inventoryNumber: "30004945", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004946", name: "NUT", partNumber: "GBR-01175000", price: 0.0, inventoryNumber: "30004946", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004947", name: "GUIA", partNumber: "GBR-01601000A", price: 106.96, inventoryNumber: "30004947", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004948", name: "GBR BUSCHING 182 00709", partNumber: "01160000", price: 0.0, inventoryNumber: "30004948", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004949", name: "SOLENOID ARM A", partNumber: "GAK-33011000", price: 454.57, inventoryNumber: "30004949", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004950", name: "WIPER LINK", partNumber: "MAZ-02504000", price: 0.0, inventoryNumber: "30004950", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004952", name: "PARTS", partNumber: "B2548-372-000", price: 0.0, inventoryNumber: "30004952", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004953", name: "LAINA", partNumber: "B2556-372-R00", price: 0.0, inventoryNumber: "30004953", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004954", name: "LADDER CHAIN", partNumber: "GBR-01260000", price: 127.67, inventoryNumber: "30004954", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004955", name: "GUIA PLASTICA", partNumber: "MAZ-02508000", price: 0.0, inventoryNumber: "30004955", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004957", name: "BUTTON CARRIER", partNumber: "GBR-01152DA0", price: 0.0, inventoryNumber: "30004957", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004958", name: "TENSION PULLEY", partNumber: "GBR-015010-BO", price: 0.0, inventoryNumber: "30004958", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004959", name: "SCREW", partNumber: "B2549-372-R00", price: 90.83, inventoryNumber: "30004959", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004960", name: "BUTTON CLAMP JAW LEVER LF", partNumber: "B2555-372-RA0", price: 0.0, inventoryNumber: "30004960", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004961", name: "ROTATING", partNumber: "GBR-01143A00", price: 0.0, inventoryNumber: "30004961", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004962", name: "BOTTON CARRIER", partNumber: "GBR-01152EA0", price: 0.0, inventoryNumber: "30004962", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004963", name: "SPRING", partNumber: "GBR-01352000", price: 0.0, inventoryNumber: "30004963", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004965", name: "PRENSATELA", partNumber: "36465-3/16", price: 0.0, inventoryNumber: "30004965", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004966", name: "BASE PRENSATELA", partNumber: "445033", price: 0.0, inventoryNumber: "30004966", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004967", name: "SOPORTE", partNumber: "BR2-35", price: 0.0, inventoryNumber: "30004967", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004968", name: "SPRING", partNumber: "BR4-40", price: 0.0, inventoryNumber: "30004968", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004969", name: "BASE", partNumber: "BR9-26", price: 0.0, inventoryNumber: "30004969", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004970", name: "SCREW", partNumber: "BR6-2", price: 0.0, inventoryNumber: "30004970", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004974", name: "SCREW", partNumber: "BR9-5", price: 0.0, inventoryNumber: "30004974", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004978", name: "PARTS", partNumber: "BR9-29", price: 0.0, inventoryNumber: "30004978", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004979", name: "SCREW", partNumber: "BR9-4", price: 0.0, inventoryNumber: "30004979", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004980", name: "GASKET", partNumber: "GAK-33031000", price: 0.0, inventoryNumber: "30004980", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004982", name: "SCREW", partNumber: "310-5", price: 0.0, inventoryNumber: "30004982", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004984", name: "SCREW", partNumber: "BR9-3", price: 0.0, inventoryNumber: "30004984", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004985", name: "PARTS", partNumber: "BR6-38/39", price: 0.0, inventoryNumber: "30004985", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004986", name: "GUIDE", partNumber: "BR9-9", price: 0.0, inventoryNumber: "30004986", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004989", name: "GUIDE", partNumber: "GBR-01348000", price: 0.0, inventoryNumber: "30004989", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004992", name: "SEGURO", partNumber: "BR9-27", price: 0.0, inventoryNumber: "30004992", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004993", name: "PINS", partNumber: "GBR-01155000", price: 28.99, inventoryNumber: "30004993", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004994", name: "SHUTTER GUIDE", partNumber: "GBR-01311000", price: 0.0, inventoryNumber: "30004994", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004995", name: "SCREW", partNumber: "SAB3-32", price: 0.0, inventoryNumber: "30004995", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004996", name: "SCREW", partNumber: "SD-0500301-SP", price: 36.01, inventoryNumber: "30004996", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004997", name: "PARTS", partNumber: "BR11-24", price: 0.0, inventoryNumber: "30004997", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30004999", name: "PINS", partNumber: "BR9-21", price: 0.0, inventoryNumber: "30004999", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005000", name: "LAINA", partNumber: "BR9-22", price: 0.0, inventoryNumber: "30005000", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005001", name: "NUT", partNumber: "BR9-28", price: 0.0, inventoryNumber: "30005001", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005002", name: "PARTS", partNumber: "BR9-6", price: 0.0, inventoryNumber: "30005002", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005003", name: "SELECTOR DE BOTTON", partNumber: "GBR-011423000", price: 0.0, inventoryNumber: "30005003", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005004", name: "BLOCK TENSION", partNumber: "GBR-01315000", price: 0.0, inventoryNumber: "30005004", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005005", name: "GUIDE", partNumber: "GBR-0131800B", price: 0.0, inventoryNumber: "30005005", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005007", name: "PRENSATELA", partNumber: "36465.25", price: 0.0, inventoryNumber: "30005007", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005008", name: "GEAR", partNumber: "BR4-25", price: 0.0, inventoryNumber: "30005008", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005009", name: "SEGURO", partNumber: "BR4-38", price: 0.0, inventoryNumber: "30005009", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005010", name: "BRAZO", partNumber: "BR9-23", price: 0.0, inventoryNumber: "30005010", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005011", name: "SCREW", partNumber: "M4X10", price: 0.0, inventoryNumber: "30005011", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005012", name: "PUST BOTTON", partNumber: "SAB6-84", price: 0.0, inventoryNumber: "30005012", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005013", name: "PRENSATELA", partNumber: "211-15", price: 0.0, inventoryNumber: "30005013", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005014", name: "PARTS", partNumber: "BR6-7/8", price: 0.0, inventoryNumber: "30005014", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005015", name: "BASE", partNumber: "BR9-11", price: 0.0, inventoryNumber: "30005015", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005016", name: "PARTS", partNumber: "BR9-2", price: 0.0, inventoryNumber: "30005016", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005017", name: "SPRING", partNumber: "BR2-12", price: 0.0, inventoryNumber: "30005017", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005018", name: "SCREW", partNumber: "BR9-10", price: 0.0, inventoryNumber: "30005018", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005019", name: "POEN LEVER", partNumber: "B2548-372-R00A", price: 0.0, inventoryNumber: "30005019", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005020", name: "BEARING", partNumber: "BR4-31", price: 0.0, inventoryNumber: "30005020", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005021", name: "NUT", partNumber: "BR6-22", price: 0.0, inventoryNumber: "30005021", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005022", name: "SEAL FOR NEEDLE", partNumber: "GBR-01169000", price: 0.0, inventoryNumber: "30005022", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005023", name: "BOTTON CARRIER", partNumber: "BR12-27A4X2.4", price: 0.0, inventoryNumber: "30005023", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005024", name: "PARTS", partNumber: "BR4-30", price: 0.0, inventoryNumber: "30005024", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005025", name: "PARTS", partNumber: "BR8-20", price: 0.0, inventoryNumber: "30005025", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005026", name: "BOTTON CARRIER", partNumber: "BR12-27A4X2.6", price: 0.0, inventoryNumber: "30005026", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005027", name: "SCREW", partNumber: "BR2-31", price: 0.0, inventoryNumber: "30005027", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005028", name: "SCREW", partNumber: "BR9-19", price: 0.0, inventoryNumber: "30005028", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005029", name: "SCREW", partNumber: "BR9-30", price: 0.0, inventoryNumber: "30005029", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005030", name: "SCREW", partNumber: "BR9-31", price: 0.0, inventoryNumber: "30005030", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005031", name: "SCREW", partNumber: "1055", price: 0.0, inventoryNumber: "30005031", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005032", name: "GASKET", partNumber: "2019904", price: 0.0, inventoryNumber: "30005032", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005033", name: "PLATE", partNumber: "2108470", price: 0.0, inventoryNumber: "30005033", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005034", name: "SCREW", partNumber: "2285", price: 0.0, inventoryNumber: "30005034", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005035", name: "KNIFE", partNumber: "201121A", price: 143.05, inventoryNumber: "30005035", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005036", name: "ORING", partNumber: "206431", price: 0.0, inventoryNumber: "30005036", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005037", name: "LOOPERS", partNumber: "210357", price: 177.86, inventoryNumber: "30005037", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005038", name: "SPRING", partNumber: "210751", price: 0.0, inventoryNumber: "30005038", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005039", name: "LAINA", partNumber: "211898", price: 0.0, inventoryNumber: "30005039", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005040", name: "SCREW", partNumber: "2902", price: 0.0, inventoryNumber: "30005040", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005041", name: "BUSHING", partNumber: "3056", price: 0.0, inventoryNumber: "30005041", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005042", name: "PORTA AGUJA", partNumber: "210273", price: 326.56, inventoryNumber: "30005042", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005043", name: "FEED DOG", partNumber: "2104450", price: 0.0, inventoryNumber: "30005043", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005045", name: "SPRING", partNumber: "211388", price: 0.0, inventoryNumber: "30005045", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005046", name: "SCREW", partNumber: "54870", price: 0.0, inventoryNumber: "30005046", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005047", name: "NUT", partNumber: "5526", price: 0.0, inventoryNumber: "30005047", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005048", name: "NUT", partNumber: "208447", price: 0.0, inventoryNumber: "30005048", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005049", name: "SCREW", partNumber: "5118", price: 0.0, inventoryNumber: "30005049", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005050", name: "NUT", partNumber: "5353", price: 0.0, inventoryNumber: "30005050", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005051", name: "SCREW", partNumber: "5376", price: 0.0, inventoryNumber: "30005051", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005052", name: "WASHER", partNumber: "201185", price: 0.0, inventoryNumber: "30005052", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005053", name: "COLLAR", partNumber: "208029", price: 0.0, inventoryNumber: "30005053", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005054", name: "GUIDE ASSY", partNumber: "2106910", price: 0.0, inventoryNumber: "30005054", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005055", name: "BASE", partNumber: "2116360", price: 0.0, inventoryNumber: "30005055", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005056", name: "KHIFE", partNumber: "301036", price: 0.0, inventoryNumber: "30005056", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005058", name: "GASKET", partNumber: "104560", price: 0.0, inventoryNumber: "30005058", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005059", name: "WASHER", partNumber: "202286", price: 0.0, inventoryNumber: "30005059", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005060", name: "SCREW", partNumber: "5483", price: 0.0, inventoryNumber: "30005060", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005064", name: "TUBO", partNumber: "210208", price: 0.0, inventoryNumber: "30005064", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005065", name: "SCREW", partNumber: "51170", price: 0.0, inventoryNumber: "30005065", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005066", name: "LAINA", partNumber: "208531", price: 0.0, inventoryNumber: "30005066", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005067", name: "SCREW", partNumber: "2193", price: 8.03, inventoryNumber: "30005067", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005068", name: "SCREW", partNumber: "5094", price: 0.0, inventoryNumber: "30005068", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005069", name: "GASKET A", partNumber: "204052", price: 0.0, inventoryNumber: "30005069", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005070", name: "GASKET", partNumber: "210002", price: 0.0, inventoryNumber: "30005070", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005071", name: "GASKET", partNumber: "210009", price: 0.0, inventoryNumber: "30005071", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005072", name: "GASKET", partNumber: "210220", price: 0.0, inventoryNumber: "30005072", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005073", name: "SCREW", partNumber: "2906", price: 0.0, inventoryNumber: "30005073", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005074", name: "FEED DOG", partNumber: "2104940", price: 1233.55, inventoryNumber: "30005074", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005075", name: "FEED DOG", partNumber: "210581", price: 1407.82, inventoryNumber: "30005075", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005076", name: "STOPERS", partNumber: "210682", price: 0.0, inventoryNumber: "30005076", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005077", name: "SCREW", partNumber: "5053", price: 0.0, inventoryNumber: "30005077", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005078", name: "SCREW", partNumber: "5084", price: 0.0, inventoryNumber: "30005078", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005080", name: "PLATE", partNumber: "E851", price: 0.0, inventoryNumber: "30005080", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005081", name: "SCREW", partNumber: "1209196", price: 0.0, inventoryNumber: "30005081", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005082", name: "BASE", partNumber: "208625", price: 0.0, inventoryNumber: "30005082", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005084", name: "SCREW", partNumber: "5486", price: 0.0, inventoryNumber: "30005084", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005085", name: "SCREW", partNumber: "117520", price: 0.0, inventoryNumber: "30005085", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005087", name: "NUT", partNumber: "3044", price: 0.0, inventoryNumber: "30005087", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005089", name: "GASKET", partNumber: "2081680", price: 0.0, inventoryNumber: "30005089", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005090", name: "GASKET", partNumber: "2083420", price: 0.0, inventoryNumber: "30005090", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005091", name: "GASKET", partNumber: "2084810", price: 0.0, inventoryNumber: "30005091", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005092", name: "WASHER", partNumber: "201191", price: 0.0, inventoryNumber: "30005092", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005093", name: "PARTS", partNumber: "2013410", price: 0.0, inventoryNumber: "30005093", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005095", name: "GASKET", partNumber: "323-663-038", price: 0.0, inventoryNumber: "30005095", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005096", name: "SCREW", partNumber: "5088", price: 0.0, inventoryNumber: "30005096", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005097", name: "FILTRO", partNumber: "2013380", price: 0.0, inventoryNumber: "30005097", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005098", name: "PARTS", partNumber: "210685", price: 0.0, inventoryNumber: "30005098", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005099", name: "KNIFE", partNumber: "301035", price: 0.0, inventoryNumber: "30005099", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005100", name: "OIL SPLASH JOINT", partNumber: "200136", price: 0.0, inventoryNumber: "30005100", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005101", name: "SPRING", partNumber: "208913", price: 23.95, inventoryNumber: "30005101", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005103", name: "LAINA", partNumber: "210353", price: 0.0, inventoryNumber: "30005103", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005104", name: "GARKET", partNumber: "210586", price: 0.0, inventoryNumber: "30005104", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005105", name: "SCREW", partNumber: "1229", price: 0.0, inventoryNumber: "30005105", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005106", name: "SCREW", partNumber: "1234", price: 0.0, inventoryNumber: "30005106", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005107", name: "WASHER", partNumber: "137906", price: 0.0, inventoryNumber: "30005107", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005108", name: "SCREW", partNumber: "1457", price: 0.0, inventoryNumber: "30005108", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005109", name: "LOOPERS", partNumber: "2049900", price: 0.0, inventoryNumber: "30005109", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005110", name: "LAINA", partNumber: "210260", price: 0.0, inventoryNumber: "30005110", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005111", name: "SPRING", partNumber: "210306", price: 0.0, inventoryNumber: "30005111", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005112", name: "BASE", partNumber: "210683", price: 0.0, inventoryNumber: "30005112", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005113", name: "LAINA", partNumber: "210749", price: 0.0, inventoryNumber: "30005113", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005114", name: "BUSHING", partNumber: "210750", price: 0.0, inventoryNumber: "30005114", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005115", name: "SCREW", partNumber: "4009-1", price: 0.0, inventoryNumber: "30005115", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005116", name: "SCREW", partNumber: "5113", price: 0.0, inventoryNumber: "30005116", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005118", name: "GUIA", partNumber: "204096", price: 0.0, inventoryNumber: "30005118", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005119", name: "SPRING", partNumber: "204324", price: 0.0, inventoryNumber: "30005119", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005120", name: "FILTRO", partNumber: "206233", price: 0.0, inventoryNumber: "30005120", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005121", name: "NEEDLE GUAD", partNumber: "209009", price: 0.0, inventoryNumber: "30005121", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005122", name: "STOPERS", partNumber: "210308", price: 0.0, inventoryNumber: "30005122", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005124", name: "SPRING", partNumber: "167077", price: 0.0, inventoryNumber: "30005124", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005125", name: "TENSION", partNumber: "210319", price: 0.0, inventoryNumber: "30005125", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005126", name: "WASHER", partNumber: "210930", price: 0.0, inventoryNumber: "30005126", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005127", name: "WASHER", partNumber: "211301", price: 0.0, inventoryNumber: "30005127", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005128", name: "SCREW", partNumber: "52920", price: 0.0, inventoryNumber: "30005128", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005129", name: "BUSHING", partNumber: "208448", price: 0.0, inventoryNumber: "30005129", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005130", name: "NUT", partNumber: "210167", price: 0.0, inventoryNumber: "30005130", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005131", name: "BUSHING", partNumber: "210180", price: 0.0, inventoryNumber: "30005131", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005132", name: "PINS", partNumber: "210240", price: 0.0, inventoryNumber: "30005132", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005133", name: "PINS", partNumber: "210326", price: 0.0, inventoryNumber: "30005133", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005134", name: "PARTS", partNumber: "313051", price: 0.0, inventoryNumber: "30005134", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005139", name: "PUST BOTTON", partNumber: "D48", price: 0.0, inventoryNumber: "30005139", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005140", name: "RELAY", partNumber: "R4R", price: 0.0, inventoryNumber: "30005140", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005142", name: "TEMP FUSE", partNumber: "421-812-104-0", price: 3775.05, inventoryNumber: "30005142", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005143", name: "RELAY", partNumber: "AT4119", price: 0.0, inventoryNumber: "30005143", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005144", name: "VALVE REGULATOR F2", partNumber: "", price: 0.0, inventoryNumber: "30005144", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005146", name: "SELENIDE VALVE V2", partNumber: "", price: 0.0, inventoryNumber: "30005146", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005147", name: "SPRING 4N", partNumber: "", price: 0.0, inventoryNumber: "30005147", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005148", name: "SPING", partNumber: "520", price: 0.0, inventoryNumber: "30005148", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005149", name: "SELENOIDE V1", partNumber: "", price: 0.0, inventoryNumber: "30005149", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005151", name: "CONTROL TERMOSTATO", partNumber: "7534", price: 0.0, inventoryNumber: "30005151", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005152", name: "CONDENSADOR", partNumber: "675", price: 0.0, inventoryNumber: "30005152", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005153", name: "RELAY", partNumber: "677", price: 275.0, inventoryNumber: "30005153", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005154", name: "RESISTENCIA", partNumber: "678", price: 0.0, inventoryNumber: "30005154", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005155", name: "ELECTRO VALVE", partNumber: "804", price: 0.0, inventoryNumber: "30005155", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005156", name: "PARTS", partNumber: "817", price: 0.0, inventoryNumber: "30005156", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005157", name: "VALVE HOLDER", partNumber: "818", price: 0.0, inventoryNumber: "30005157", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005158", name: "ALAMBRE", partNumber: "825", price: 0.0, inventoryNumber: "30005158", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005159", name: "GUIDE", partNumber: "847", price: 0.0, inventoryNumber: "30005159", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005160", name: "KNIFE BAR SUPPORT SHAFT", partNumber: "400-80415", price: 391.39, inventoryNumber: "30005160", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005161", name: "NEEDLE BAR", partNumber: "401-42704", price: 475.71, inventoryNumber: "30005161", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005164", name: "129 LOOPER DERECHO 129 40557", partNumber: "40508", price: 1859.47, inventoryNumber: "30005164", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005165", name: "LOOPER", partNumber: "129-41456", price: 1842.71, inventoryNumber: "30005165", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005167", name: "NEEDLE HOLE GUIDE", partNumber: "MAZ-16021000", price: 0.0, inventoryNumber: "30005167", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005168", name: "REAR NEEDLE HOLDER", partNumber: "129-42306", price: 0.0, inventoryNumber: "30005168", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005169", name: "NEEDLE GUAR", partNumber: "129-42504", price: 0.0, inventoryNumber: "30005169", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005171", name: "PIN ASSM", partNumber: "B1209-019-0A0", price: 145.55, inventoryNumber: "30005171", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005175", name: "NEEDLE BAR", partNumber: "D1401M1YC0A", price: 0.0, inventoryNumber: "30005175", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005177", name: "SCREW", partNumber: "SS-6090910-TP", price: 0.0, inventoryNumber: "30005177", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005179", name: "WIPER THREAD SPRING", partNumber: "400-09860", price: 85.29, inventoryNumber: "30005179", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005180", name: "THREAD TRIMMER BASE", partNumber: "400-10526", price: 0.0, inventoryNumber: "30005180", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005184", name: "CABLE SENSOR", partNumber: "400-05732", price: 0.0, inventoryNumber: "30005184", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005187", name: "BUTTON CARRIER Q", partNumber: "1659-0507", price: 1885.33, inventoryNumber: "30005187", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005188", name: "ROTATING ROD", partNumber: "182-06201", price: 0.0, inventoryNumber: "30005188", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005190", name: "SELENOI", partNumber: "400-06261", price: 6694.03, inventoryNumber: "30005190", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005191", name: "SCREW", partNumber: "802", price: 0.0, inventoryNumber: "30005191", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005192", name: "SPRING", partNumber: "819", price: 0.0, inventoryNumber: "30005192", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005193", name: "NUT", partNumber: "840", price: 0.0, inventoryNumber: "30005193", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005194", name: "SEGURO", partNumber: "843", price: 0.0, inventoryNumber: "30005194", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005195", name: "TAKE UP THREAD", partNumber: "139-22208", price: 0.0, inventoryNumber: "30005195", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005196", name: "BALIN", partNumber: "820", price: 0.0, inventoryNumber: "30005196", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005197", name: "SPRING", partNumber: "822", price: 0.0, inventoryNumber: "30005197", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005198", name: "WASHER", partNumber: "841", price: 0.0, inventoryNumber: "30005198", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005199", name: "PINS 13", partNumber: "", price: 0.0, inventoryNumber: "30005199", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005200", name: "ELECTRO VALVE", partNumber: "607", price: 0.0, inventoryNumber: "30005200", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005201", name: "PARTS", partNumber: "814", price: 0.0, inventoryNumber: "30005201", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005202", name: "PARTS", partNumber: "828", price: 0.0, inventoryNumber: "30005202", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005203", name: "BALINES", partNumber: "892", price: 0.0, inventoryNumber: "30005203", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005204", name: "PARTS", partNumber: "CM11-13", price: 0.0, inventoryNumber: "30005204", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005205", name: "SWITCH", partNumber: "400-03496", price: 0.0, inventoryNumber: "30005205", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005207", name: "BOTE", partNumber: "639", price: 0.0, inventoryNumber: "30005207", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005208", name: "FIXED KNIFE", partNumber: "05-429", price: 0.0, inventoryNumber: "30005208", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005209", name: "KNIFE", partNumber: "05-447", price: 0.0, inventoryNumber: "30005209", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005210", name: "KNIFE", partNumber: "05-548", price: 0.0, inventoryNumber: "30005210", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005211", name: "KNIFE", partNumber: "05-549", price: 0.0, inventoryNumber: "30005211", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005212", name: "BT TRIMMER", partNumber: "400-04311", price: 1094.6, inventoryNumber: "30005212", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005213", name: "BUSHING", partNumber: "140288-001", price: 0.0, inventoryNumber: "30005213", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005214", name: "KNIFE", partNumber: "152680-001", price: 0.0, inventoryNumber: "30005214", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005215", name: "DRIVER", partNumber: "152681-201", price: 0.0, inventoryNumber: "30005215", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005216", name: "PARTS", partNumber: "143445-001", price: 0.0, inventoryNumber: "30005216", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005217", name: "PARTS", partNumber: "152677-001", price: 0.0, inventoryNumber: "30005217", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005218", name: "SCREW", partNumber: "018063-022", price: 0.0, inventoryNumber: "30005218", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005219", name: "WASHER", partNumber: "025350-132", price: 0.0, inventoryNumber: "30005219", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005220", name: "PARTS", partNumber: "152682-001", price: 0.0, inventoryNumber: "30005220", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005221", name: "WASHER", partNumber: "152877-001", price: 0.0, inventoryNumber: "30005221", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005222", name: "WASHER", partNumber: "142628-001", price: 0.0, inventoryNumber: "30005222", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005223", name: "NUT", partNumber: "152705-101", price: 0.0, inventoryNumber: "30005223", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005224", name: "GUIA HILO", partNumber: "152890-001", price: 0.0, inventoryNumber: "30005224", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005225", name: "LAINA", partNumber: "152897-101", price: 0.0, inventoryNumber: "30005225", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005226", name: "WASHERS", partNumber: "153219-001", price: 0.0, inventoryNumber: "30005226", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005227", name: "WASHER", partNumber: "153220-001", price: 0.0, inventoryNumber: "30005227", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005228", name: "WASHER", partNumber: "156340-100", price: 0.0, inventoryNumber: "30005228", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005229", name: "SCREW", partNumber: "062660-412", price: 0.0, inventoryNumber: "30005229", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005230", name: "SCREW", partNumber: "144458-001", price: 0.0, inventoryNumber: "30005230", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005231", name: "SCREW", partNumber: "152875-001", price: 0.0, inventoryNumber: "30005231", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005232", name: "PLASTIC", partNumber: "153098-000", price: 0.0, inventoryNumber: "30005232", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005233", name: "SCREW", partNumber: "153222-001", price: 0.0, inventoryNumber: "30005233", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005234", name: "SCREW", partNumber: "100032-001", price: 0.0, inventoryNumber: "30005234", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005235", name: "PINS", partNumber: "153357-001", price: 0.0, inventoryNumber: "30005235", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005236", name: "BUSHING", partNumber: "153597-005", price: 0.0, inventoryNumber: "30005236", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005237", name: "LAINA", partNumber: "152679-001", price: 0.0, inventoryNumber: "30005237", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005238", name: "RUBBER", partNumber: "152847-009", price: 0.0, inventoryNumber: "30005238", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005239", name: "SPRING", partNumber: "152878-001", price: 0.0, inventoryNumber: "30005239", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005240", name: "LAINA", partNumber: "154664-001", price: 0.0, inventoryNumber: "30005240", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005241", name: "PARTS", partNumber: "156154-001", price: 0.0, inventoryNumber: "30005241", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005242", name: "PARTS", partNumber: "536691-001", price: 0.0, inventoryNumber: "30005242", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005243", name: "RUBBER", partNumber: "120448-001", price: 0.0, inventoryNumber: "30005243", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005244", name: "BASE", partNumber: "151920-001", price: 0.0, inventoryNumber: "30005244", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005245", name: "BASE", partNumber: "152989-001", price: 0.0, inventoryNumber: "30005245", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005246", name: "WASHER", partNumber: "153596-001", price: 0.0, inventoryNumber: "30005246", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005247", name: "PINS", partNumber: "502878-000", price: 0.0, inventoryNumber: "30005247", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005248", name: "WASHER", partNumber: "025800-332", price: 0.0, inventoryNumber: "30005248", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005249", name: "SEGURO", partNumber: "048110-145", price: 0.0, inventoryNumber: "30005249", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005250", name: "WASHER", partNumber: "151892-001", price: 0.0, inventoryNumber: "30005250", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005251", name: "PARTS", partNumber: "152906-101", price: 0.0, inventoryNumber: "30005251", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005252", name: "KNIFE", partNumber: "152981-001", price: 0.0, inventoryNumber: "30005252", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005253", name: "NKIFE", partNumber: "B2703-377-0A0", price: 0.0, inventoryNumber: "30005253", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005254", name: "CUSHING RUBBER", partNumber: "115018-001", price: 0.0, inventoryNumber: "30005254", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005255", name: "RUBBER", partNumber: "151890-000", price: 0.0, inventoryNumber: "30005255", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005256", name: "PARTS", partNumber: "151895-000", price: 0.0, inventoryNumber: "30005256", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005257", name: "PARTS", partNumber: "152891-001", price: 0.0, inventoryNumber: "30005257", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005258", name: "SCREW", partNumber: "013761-412", price: 0.0, inventoryNumber: "30005258", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005259", name: "ORING", partNumber: "081008-070", price: 0.0, inventoryNumber: "30005259", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005260", name: "NUT", partNumber: "150554-002", price: 0.0, inventoryNumber: "30005260", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005261", name: "PINS", partNumber: "152236-001", price: 0.0, inventoryNumber: "30005261", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005262", name: "SCREW", partNumber: "153598-101", price: 0.0, inventoryNumber: "30005262", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005263", name: "SPRING", partNumber: "154788-001", price: 0.0, inventoryNumber: "30005263", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005264", name: "ESTRELLA", partNumber: "490468", price: 0.0, inventoryNumber: "30005264", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005265", name: "SCREW", partNumber: "101706-001", price: 0.0, inventoryNumber: "30005265", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005266", name: "SCREW", partNumber: "115012-002", price: 0.0, inventoryNumber: "30005266", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005267", name: "LAINA", partNumber: "152841-209", price: 0.0, inventoryNumber: "30005267", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005268", name: "LAINA", partNumber: "152848-001", price: 0.0, inventoryNumber: "30005268", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005269", name: "SOPORTE", partNumber: "152868-009", price: 0.0, inventoryNumber: "30005269", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005270", name: "PARTS", partNumber: "152986-001", price: 0.0, inventoryNumber: "30005270", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005271", name: "PARTS", partNumber: "156085-001", price: 0.0, inventoryNumber: "30005271", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005272", name: "PARTS", partNumber: "156086-001", price: 0.0, inventoryNumber: "30005272", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005273", name: "WASHER", partNumber: "203684-001", price: 0.0, inventoryNumber: "30005273", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005274", name: "PINS", partNumber: "151948-001", price: 0.0, inventoryNumber: "30005274", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005275", name: "LAINA", partNumber: "156206-001", price: 0.0, inventoryNumber: "30005275", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005276", name: "BUSHING", partNumber: "218020-001", price: 0.0, inventoryNumber: "30005276", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005277", name: "GEAR", partNumber: "153397-001", price: 0.0, inventoryNumber: "30005277", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005278", name: "GEAR", partNumber: "153410-000", price: 0.0, inventoryNumber: "30005278", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005279", name: "SPRING", partNumber: "104525-001", price: 0.0, inventoryNumber: "30005279", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005280", name: "SCREW", partNumber: "153208-002", price: 0.0, inventoryNumber: "30005280", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005281", name: "SCREW", partNumber: "017680-512", price: 0.0, inventoryNumber: "30005281", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005282", name: "SCREW", partNumber: "145318-001", price: 0.0, inventoryNumber: "30005282", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005283", name: "WASHER", partNumber: "152699-001", price: 0.0, inventoryNumber: "30005283", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005284", name: "BUSHING", partNumber: "152914-001", price: 0.0, inventoryNumber: "30005284", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005285", name: "PINS ROLLER", partNumber: "153352-001", price: 0.0, inventoryNumber: "30005285", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005286", name: "SCREW", partNumber: "62670512", price: 0.0, inventoryNumber: "30005286", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005287", name: "CODOS", partNumber: "90054", price: 0.0, inventoryNumber: "30005287", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005288", name: "VALVE", partNumber: "91165B", price: 0.0, inventoryNumber: "30005288", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005289", name: "VALVE", partNumber: "91606-C", price: 0.0, inventoryNumber: "30005289", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005290", name: "SWITH", partNumber: "92830", price: 0.0, inventoryNumber: "30005290", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005291", name: "ELEMENT", partNumber: "234C1-84", price: 0.0, inventoryNumber: "30005291", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005292", name: "TENSION", partNumber: "P661016", price: 0.0, inventoryNumber: "30005292", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005293", name: "BARRA", partNumber: "P661199", price: 0.0, inventoryNumber: "30005293", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005297", name: "RECOJEDOR DE HILO", partNumber: "0540-350370", price: 485.19, inventoryNumber: "30005297", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005299", name: "FRONT ROLLER SHAFT", partNumber: "11C2-30", price: 0.0, inventoryNumber: "30005299", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005300", name: "SCREW", partNumber: "301C8-6", price: 0.0, inventoryNumber: "30005300", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005301", name: "SCREW", partNumber: "305C8-4", price: 0.0, inventoryNumber: "30005301", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005302", name: "SHEAR PLATE", partNumber: "726C1-17", price: 703.7, inventoryNumber: "30005302", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005303", name: "DISCO", partNumber: "80C1-147", price: 225.44, inventoryNumber: "30005303", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005304", name: "BRUSH CAP", partNumber: "86C7-42", price: 0.0, inventoryNumber: "30005304", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005305", name: "WICKING FELT", partNumber: "191C1-37", price: 0.0, inventoryNumber: "30005305", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005306", name: "KNIFE GEAR ASSY", partNumber: "524C1-11", price: 0.0, inventoryNumber: "30005306", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005307", name: "WHEEL EMERY", partNumber: "541C1-24", price: 0.0, inventoryNumber: "30005307", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005309", name: "FOOT REGT", partNumber: "68C3-6", price: 0.0, inventoryNumber: "30005309", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005310", name: "BRUSH W/SPRING", partNumber: "708C1-15", price: 399.22, inventoryNumber: "30005310", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005311", name: "KNIFE GEAR", partNumber: "87C7-43", price: 0.0, inventoryNumber: "30005311", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005312", name: "SOCKET FEMALE", partNumber: "440-000-037-0", price: 0.0, inventoryNumber: "30005312", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005314", name: "BANDA", partNumber: "0396-341880", price: 964.05, inventoryNumber: "30005314", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005315", name: "RESORTE", partNumber: "0973-450440", price: 89.38, inventoryNumber: "30005315", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005316", name: "RESORTE", partNumber: "0973-461620", price: 93.57, inventoryNumber: "30005316", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005317", name: "CILINDRO", partNumber: "999-220724", price: 3328.67, inventoryNumber: "30005317", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005321", name: "PERNO DE TOPE", partNumber: "973-401350", price: 413.65, inventoryNumber: "30005321", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005322", name: "BANDA", partNumber: "999-210928", price: 4562.81, inventoryNumber: "30005322", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005329", name: "SCREW", partNumber: "9203-311811", price: 90.51, inventoryNumber: "30005329", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005335", name: "SCREW", partNumber: "KX250080", price: 0.0, inventoryNumber: "30005335", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005336", name: "SCREW", partNumber: "KX270010", price: 0.0, inventoryNumber: "30005336", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005337", name: "BANDA", partNumber: "P700038", price: 0.0, inventoryNumber: "30005337", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005339", name: "PARTS", partNumber: "A9052028", price: 0.0, inventoryNumber: "30005339", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005340", name: "LAINA", partNumber: "AT270160", price: 0.0, inventoryNumber: "30005340", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005341", name: "KNIFE", partNumber: "KC220642", price: 0.0, inventoryNumber: "30005341", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005342", name: "SCREW", partNumber: "KC270970", price: 0.0, inventoryNumber: "30005342", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005343", name: "PINS", partNumber: "P642501", price: 0.0, inventoryNumber: "30005343", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005344", name: "LAINA", partNumber: "P661087", price: 0.0, inventoryNumber: "30005344", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005345", name: "PARTS", partNumber: "99128R", price: 0.0, inventoryNumber: "30005345", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005348", name: "PINS", partNumber: "99807", price: 0.0, inventoryNumber: "30005348", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005349", name: "NKIFE", partNumber: "903151", price: 0.0, inventoryNumber: "30005349", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005350", name: "WASHER", partNumber: "A9013066", price: 0.0, inventoryNumber: "30005350", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005351", name: "LAINA", partNumber: "AT270180", price: 0.0, inventoryNumber: "30005351", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005352", name: "KNIFE", partNumber: "KN270952", price: 0.0, inventoryNumber: "30005352", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005353", name: "NKIFE", partNumber: "KN270961", price: 0.0, inventoryNumber: "30005353", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005354", name: "SCREW", partNumber: "P413535", price: 0.0, inventoryNumber: "30005354", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005355", name: "BASE", partNumber: "P641503", price: 0.0, inventoryNumber: "30005355", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005356", name: "SPRING", partNumber: "P661054", price: 0.0, inventoryNumber: "30005356", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005357", name: "LAINA", partNumber: "P700152", price: 0.0, inventoryNumber: "30005357", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005359", name: "NEEDLE STOP PLATE", partNumber: "54418A", price: 0.0, inventoryNumber: "30005359", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005361", name: "BASE", partNumber: "21375BQ", price: 0.0, inventoryNumber: "30005361", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005362", name: "NEEDLE BAR", partNumber: "51217C", price: 1182.9, inventoryNumber: "30005362", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005363", name: "THREAD PLATE", partNumber: "56380", price: 404.75, inventoryNumber: "30005363", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005366", name: "BUSHING", partNumber: "54278V", price: 0.0, inventoryNumber: "30005366", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005367", name: "PARTS", partNumber: "56423", price: 0.0, inventoryNumber: "30005367", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005368", name: "SCREW", partNumber: "22868D", price: 0.0, inventoryNumber: "30005368", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005369", name: "PORTA AGUJA", partNumber: "51418K24", price: 1544.12, inventoryNumber: "30005369", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005370", name: "SCREW", partNumber: "56330AF", price: 0.0, inventoryNumber: "30005370", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005372", name: "SPRING", partNumber: "39173A", price: 0.0, inventoryNumber: "30005372", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005373", name: "NUT", partNumber: "63494-F", price: 0.0, inventoryNumber: "30005373", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005374", name: "WASHER", partNumber: "63494-G", price: 0.0, inventoryNumber: "30005374", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005375", name: "SCREW", partNumber: "22785", price: 0.0, inventoryNumber: "30005375", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005376", name: "KNIFE", partNumber: "56343-E", price: 0.0, inventoryNumber: "30005376", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005377", name: "PLATE", partNumber: "C51324F", price: 0.0, inventoryNumber: "30005377", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005378", name: "PRESSER FOOT", partNumber: "51220J", price: 3773.97, inventoryNumber: "30005378", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005379", name: "SCREW 28", partNumber: "", price: 0.0, inventoryNumber: "30005379", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005380", name: "THOAT PLATE", partNumber: "51424K26", price: 0.0, inventoryNumber: "30005380", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005381", name: "PULEY F", partNumber: "52921B", price: 0.0, inventoryNumber: "30005381", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005382", name: "NUT", partNumber: "54285C", price: 200.06, inventoryNumber: "30005382", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005385", name: "NUT", partNumber: "269", price: 0.0, inventoryNumber: "30005385", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005387", name: "FEED GOG", partNumber: "54205A9-16", price: 0.0, inventoryNumber: "30005387", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005388", name: "RETAINER HOLDER", partNumber: "54242B9-16", price: 0.0, inventoryNumber: "30005388", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005389", name: "THOAT PLATE", partNumber: "54224A9-16", price: 0.0, inventoryNumber: "30005389", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005390", name: "PARTS", partNumber: "54274L", price: 0.0, inventoryNumber: "30005390", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005391", name: "WASHER", partNumber: "54274N", price: 0.0, inventoryNumber: "30005391", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005392", name: "GEAR", partNumber: "61439-T", price: 0.0, inventoryNumber: "30005392", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005393", name: "BUSHING", partNumber: "FP5127AA", price: 0.0, inventoryNumber: "30005393", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005394", name: "SCREW H", partNumber: "22875", price: 0.0, inventoryNumber: "30005394", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005395", name: "LOOPERS", partNumber: "54208A", price: 1586.64, inventoryNumber: "30005395", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005396", name: "ORING", partNumber: "660-202", price: 0.0, inventoryNumber: "30005396", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005397", name: "SCREW 98", partNumber: "", price: 0.0, inventoryNumber: "30005397", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005398", name: "THOAD PLATE", partNumber: "51424AD16", price: 2074.04, inventoryNumber: "30005398", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005399", name: "PARTS", partNumber: "51430D", price: 1037.85, inventoryNumber: "30005399", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005400", name: "BARR", partNumber: "56517B16", price: 1549.42, inventoryNumber: "30005400", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005401", name: "SCREW 89", partNumber: "", price: 0.0, inventoryNumber: "30005401", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005403", name: "SCREW", partNumber: "22801", price: 0.0, inventoryNumber: "30005403", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005404", name: "TENSION PAST", partNumber: "51492", price: 0.0, inventoryNumber: "30005404", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005405", name: "LOOP RETAINER", partNumber: "54211A", price: 802.7, inventoryNumber: "30005405", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005406", name: "SCREW 88", partNumber: "", price: 0.0, inventoryNumber: "30005406", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005407", name: "SCREW", partNumber: "J87J", price: 0.0, inventoryNumber: "30005407", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005408", name: "CORE", partNumber: "15465F", price: 428.33, inventoryNumber: "30005408", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005409", name: "SCREW", partNumber: "22799B", price: 76.08, inventoryNumber: "30005409", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005412", name: "NUT 18", partNumber: "", price: 0.0, inventoryNumber: "30005412", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005413", name: "SCREW", partNumber: "22757", price: 0.0, inventoryNumber: "30005413", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005414", name: "SCREW", partNumber: "22799T", price: 0.0, inventoryNumber: "30005414", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005416", name: "PLATE", partNumber: "51424K-24", price: 916.73, inventoryNumber: "30005416", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005417", name: "PARTS", partNumber: "51745", price: 819.54, inventoryNumber: "30005417", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005418", name: "WASHER", partNumber: "51849C", price: 0.0, inventoryNumber: "30005418", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005419", name: "OIL TUBE", partNumber: "54293A", price: 0.0, inventoryNumber: "30005419", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005421", name: "SCREW", partNumber: "75C", price: 0.0, inventoryNumber: "30005421", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005422", name: "SCREW", partNumber: "HA61D", price: 0.0, inventoryNumber: "30005422", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005423", name: "SCREW", partNumber: "22525A", price: 34.55, inventoryNumber: "30005423", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005424", name: "PINS PLUNGER", partNumber: "50458BLK", price: 0.0, inventoryNumber: "30005424", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005426", name: "LAINA", partNumber: "54264C", price: 0.0, inventoryNumber: "30005426", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005427", name: "WASHER", partNumber: "54274P", price: 0.0, inventoryNumber: "30005427", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005428", name: "NUT", partNumber: "11638M", price: 0.0, inventoryNumber: "30005428", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005429", name: "PARTS", partNumber: "29192V", price: 3018.2, inventoryNumber: "30005429", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005430", name: "BUSHING", partNumber: "54278U", price: 0.0, inventoryNumber: "30005430", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005431", name: "SCREW 95", partNumber: "", price: 0.0, inventoryNumber: "30005431", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005432", name: "SCREW", partNumber: "97A", price: 0.0, inventoryNumber: "30005432", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005433", name: "LOOPERS HOLDER", partNumber: "54285B", price: 1026.75, inventoryNumber: "30005433", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005434", name: "GUALDA AGUJA", partNumber: "56325", price: 890.18, inventoryNumber: "30005434", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005435", name: "BUSHING", partNumber: "56390", price: 950.0, inventoryNumber: "30005435", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005436", name: "BUSHING", partNumber: "56390-G", price: 0.0, inventoryNumber: "30005436", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005437", name: "WASHER", partNumber: "660-223", price: 0.0, inventoryNumber: "30005437", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005438", name: "WASHER", partNumber: "51250V", price: 0.0, inventoryNumber: "30005438", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005439", name: "PARTS", partNumber: "51757B", price: 0.0, inventoryNumber: "30005439", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005440", name: "THREAD EYELET", partNumber: "54458A-9", price: 0.0, inventoryNumber: "30005440", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005443", name: "NEEDLE GUARD", partNumber: "51725-C", price: 0.0, inventoryNumber: "30005443", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005444", name: "1ARTS", partNumber: "CCP-1/2", price: 0.0, inventoryNumber: "30005444", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005447", name: "SCREW", partNumber: "22894G", price: 0.0, inventoryNumber: "30005447", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005448", name: "PRESURRE SPRING", partNumber: "54244H", price: 0.0, inventoryNumber: "30005448", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005449", name: "THEAD ELELET 9", partNumber: "54458C", price: 0.0, inventoryNumber: "30005449", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005450", name: "WASHER", partNumber: "6042A", price: 0.0, inventoryNumber: "30005450", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005451", name: "BLANK", partNumber: "27484BLK", price: 0.0, inventoryNumber: "30005451", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005453", name: "SCREW", partNumber: "15489B", price: 0.0, inventoryNumber: "30005453", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005454", name: "SCREW", partNumber: "22768", price: 30.84, inventoryNumber: "30005454", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005455", name: "SCREW", partNumber: "22845B", price: 44.38, inventoryNumber: "30005455", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005459", name: "THREAD EYELET", partNumber: "54459A9", price: 0.0, inventoryNumber: "30005459", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005460", name: "THD FING SCREW", partNumber: "719", price: 0.0, inventoryNumber: "30005460", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005461", name: "SCREW 93", partNumber: "", price: 0.0, inventoryNumber: "30005461", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005462", name: "PULLER DRIVE", partNumber: "29105AD", price: 0.0, inventoryNumber: "30005462", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005463", name: "PULLER DRIVE", partNumber: "29126DE", price: 0.0, inventoryNumber: "30005463", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005464", name: "NEEDLE PLATE", partNumber: "51424-16", price: 0.0, inventoryNumber: "30005464", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005465", name: "LOOPERS", partNumber: "51909-C", price: 0.0, inventoryNumber: "30005465", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005466", name: "WASHER F", partNumber: "51250", price: 0.0, inventoryNumber: "30005466", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005467", name: "LOOPRES", partNumber: "51708", price: 0.0, inventoryNumber: "30005467", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005468", name: "PARTS", partNumber: "54223A", price: 0.0, inventoryNumber: "30005468", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005469", name: "GEAR", partNumber: "51493BP", price: 0.0, inventoryNumber: "30005469", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005470", name: "PRESSER FOOT", partNumber: "51720-56", price: 0.0, inventoryNumber: "30005470", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005471", name: "PARTS", partNumber: "51770-68", price: 0.0, inventoryNumber: "30005471", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005472", name: "FELPA", partNumber: "666-149", price: 0.0, inventoryNumber: "30005472", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005473", name: "PARTS", partNumber: "51770-80", price: 0.0, inventoryNumber: "30005473", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005474", name: "PARTS", partNumber: "51818-16-64-16", price: 0.0, inventoryNumber: "30005474", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005475", name: "BUSHING E", partNumber: "56341", price: 0.0, inventoryNumber: "30005475", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005477", name: "SCREW", partNumber: "22729C", price: 0.0, inventoryNumber: "30005477", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005478", name: "FEED DOG", partNumber: "51705-64", price: 0.0, inventoryNumber: "30005478", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005479", name: "GUIA", partNumber: "51772-56", price: 0.0, inventoryNumber: "30005479", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005480", name: "LOOPERS", partNumber: "51809", price: 0.0, inventoryNumber: "30005480", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005481", name: "PLATE", partNumber: "51824-16-64-16", price: 0.0, inventoryNumber: "30005481", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005482", name: "FEED DOG", partNumber: "51805-16-64-16", price: 0.0, inventoryNumber: "30005482", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005484", name: "LOOPER HOLDER", partNumber: "15465", price: 0.0, inventoryNumber: "30005484", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005485", name: "SCREW", partNumber: "25B", price: 0.0, inventoryNumber: "30005485", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005486", name: "PARTS", partNumber: "512336", price: 0.0, inventoryNumber: "30005486", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005487", name: "LOOPERS", partNumber: "51808A", price: 0.0, inventoryNumber: "30005487", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005488", name: "STOP PLATE", partNumber: "51833A", price: 0.0, inventoryNumber: "30005488", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005489", name: "SCREW", partNumber: "25C", price: 0.0, inventoryNumber: "30005489", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005490", name: "GUARDA AGUJA", partNumber: "51825CA", price: 0.0, inventoryNumber: "30005490", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005491", name: "AIR CYLINDER FOR BLABE", partNumber: "C27", price: 8554.5, inventoryNumber: "30005491", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005495", name: "PISTON", partNumber: "096-NR", price: 0.0, inventoryNumber: "30005495", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005496", name: "PISTON", partNumber: "121-DP", price: 0.0, inventoryNumber: "30005496", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005498", name: "PISTON", partNumber: "D-74512-A-5", price: 0.0, inventoryNumber: "30005498", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005499", name: "PISTON", partNumber: "SRR-10-3", price: 0.0, inventoryNumber: "30005499", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005506", name: "VARILLA DE PEDAL", partNumber: "TBV-110LH", price: 1119.19, inventoryNumber: "30005506", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005507", name: "VALVE", partNumber: "1957", price: 0.0, inventoryNumber: "30005507", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005509", name: "CHUMACERA", partNumber: "1090", price: 0.0, inventoryNumber: "30005509", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005514", name: "CHUMACERA", partNumber: "FXS203", price: 0.0, inventoryNumber: "30005514", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005515", name: "KIT DE SELLOS SRKQE", partNumber: "", price: 292.2, inventoryNumber: "30005515", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005517", name: "BUTTOM", partNumber: "23793", price: 0.0, inventoryNumber: "30005517", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005521", name: "ELECTRO VALVE", partNumber: "614B11111CA", price: 0.0, inventoryNumber: "30005521", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005522", name: "LOOP POSITION FINGER", partNumber: "B1234-372-000", price: 0.0, inventoryNumber: "30005522", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005523", name: "CLAMP SLIDE BLOOK", partNumber: "B1406-372-000", price: 0.0, inventoryNumber: "30005523", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005524", name: "ECCENTRIC CAM ASS", partNumber: "B4405-372-0A0", price: 0.0, inventoryNumber: "30005524", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005525", name: "NUT", partNumber: "NS-6680410-SP", price: 0.0, inventoryNumber: "30005525", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005526", name: "PARTS", partNumber: "B2025-372-0A0", price: 0.0, inventoryNumber: "30005526", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005527", name: "BARRA", partNumber: "B2501-372-000", price: 0.0, inventoryNumber: "30005527", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005528", name: "WASHER", partNumber: "WP-0751576-SD", price: 0.0, inventoryNumber: "30005528", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005529", name: "TENSION", partNumber: "B2015-372-0A0", price: 0.0, inventoryNumber: "30005529", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005530", name: "BUSHING", partNumber: "B2502-372-000", price: 0.0, inventoryNumber: "30005530", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005531", name: "BUSHING", partNumber: "B2503-372-000", price: 0.0, inventoryNumber: "30005531", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005532", name: "372 000 CROSSWISE 260 24703", partNumber: "B2526", price: 0.0, inventoryNumber: "30005532", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005533", name: "SCREW", partNumber: "SD-0680271-SP", price: 0.0, inventoryNumber: "30005533", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005534", name: "WASHER", partNumber: "WP-0612056-SD", price: 0.0, inventoryNumber: "30005534", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005535", name: "CONNECTING LINK", partNumber: "B2404-373-R00", price: 0.0, inventoryNumber: "30005535", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005536", name: "SCREW", partNumber: "B2638-372-000", price: 0.0, inventoryNumber: "30005536", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005537", name: "SCREW", partNumber: "SS-8701042-TP", price: 0.0, inventoryNumber: "30005537", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005538", name: "372 000 STOP MOTTIO 260 28407", partNumber: "B2614", price: 0.0, inventoryNumber: "30005538", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005539", name: "BEARING", partNumber: "B1243-372-000", price: 0.0, inventoryNumber: "30005539", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005540", name: "BASE", partNumber: "B2519-372-000", price: 0.0, inventoryNumber: "30005540", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005541", name: "PARTS", partNumber: "CS-079072A-TN", price: 0.0, inventoryNumber: "30005541", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005542", name: "SCREW", partNumber: "SD-0640702-SP", price: 0.0, inventoryNumber: "30005542", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005543", name: "SCREW", partNumber: "SD-0790311-TP", price: 0.0, inventoryNumber: "30005543", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005544", name: "SCREW", partNumber: "SS-8110710-TP", price: 0.0, inventoryNumber: "30005544", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005545", name: "SCREW", partNumber: "SS-8701782-TP", price: 0.0, inventoryNumber: "30005545", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005546", name: "SPRING", partNumber: "B1205-372-000", price: 0.0, inventoryNumber: "30005546", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005547", name: "KIT BEARING", partNumber: "B1215-372-B00", price: 0.0, inventoryNumber: "30005547", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005548", name: "SPRING", partNumber: "B2609-372-000", price: 0.0, inventoryNumber: "30005548", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005550", name: "NUT", partNumber: "NS-6680320-SP", price: 0.0, inventoryNumber: "30005550", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005551", name: "SCREW", partNumber: "SS-6110480-SP", price: 0.0, inventoryNumber: "30005551", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005553", name: "PARTS", partNumber: "B2024-372-000", price: 0.0, inventoryNumber: "30005553", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005554", name: "BUSHING", partNumber: "B2406-372-000", price: 0.0, inventoryNumber: "30005554", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005555", name: "SCREW", partNumber: "B2544-372-000", price: 0.0, inventoryNumber: "30005555", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005556", name: "PINS", partNumber: "B2610-372-000", price: 0.0, inventoryNumber: "30005556", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005558", name: "NUT", partNumber: "NS-6110310-SP", price: 0.0, inventoryNumber: "30005558", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005559", name: "SCREW", partNumber: "SD-0402001-TP", price: 0.0, inventoryNumber: "30005559", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005561", name: "WASHER", partNumber: "B1214-372-000", price: 0.0, inventoryNumber: "30005561", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005562", name: "BUSHING", partNumber: "B1402-372-000", price: 0.0, inventoryNumber: "30005562", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005563", name: "PARTS", partNumber: "B2409-372-000", price: 0.0, inventoryNumber: "30005563", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005564", name: "SCREW", partNumber: "SD-0600401-SP", price: 0.0, inventoryNumber: "30005564", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005565", name: "SCREW", partNumber: "SS-9151160-SP", price: 0.0, inventoryNumber: "30005565", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005566", name: "WASHER", partNumber: "WP-0650876-SD", price: 0.0, inventoryNumber: "30005566", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005567", name: "BUSHING", partNumber: "B1403-372-000", price: 0.0, inventoryNumber: "30005567", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005568", name: "SCREW", partNumber: "SD-0641321-TP", price: 0.0, inventoryNumber: "30005568", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005569", name: "SCREW", partNumber: "SD-0641322-TP", price: 0.0, inventoryNumber: "30005569", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005570", name: "SCREW", partNumber: "SS-8110410-TP", price: 0.0, inventoryNumber: "30005570", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005571", name: "WASHER", partNumber: "B1411-372-A00", price: 0.0, inventoryNumber: "30005571", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005574", name: "NUT", partNumber: "NS-6090310-SP", price: 0.0, inventoryNumber: "30005574", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005575", name: "SCREW", partNumber: "SS-2090510-SP", price: 0.0, inventoryNumber: "30005575", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005576", name: "SCREW", partNumber: "SS-7110340-SP", price: 0.0, inventoryNumber: "30005576", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005577", name: "NUT", partNumber: "SS-8090540-SP", price: 0.0, inventoryNumber: "30005577", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005578", name: "WASHER", partNumber: "WP-0450000-SD", price: 0.0, inventoryNumber: "30005578", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005579", name: "DRIVE PULLEY", partNumber: "B1208-372-000", price: 0.0, inventoryNumber: "30005579", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005580", name: "LOOPERS", partNumber: "B1239-372-000", price: 0.0, inventoryNumber: "30005580", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005581", name: "LEVER", partNumber: "B-2636-372-000", price: 0.0, inventoryNumber: "30005581", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005582", name: "SCREW", partNumber: "B2521-372-000", price: 0.0, inventoryNumber: "30005582", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005583", name: "SCREW", partNumber: "SM-6083042-CH", price: 0.0, inventoryNumber: "30005583", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005584", name: "SCREW", partNumber: "SS-8660512-TP", price: 0.0, inventoryNumber: "30005584", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005585", name: "SCREW", partNumber: "SS-9080410-SP", price: 0.0, inventoryNumber: "30005585", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005587", name: "SPRING", partNumber: "D9317-762-TOO", price: 0.0, inventoryNumber: "30005587", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005588", name: "SPRING", partNumber: "MAZ-02507-000", price: 0.0, inventoryNumber: "30005588", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005589", name: "SCREW", partNumber: "SS-5060310-SP", price: 4.59, inventoryNumber: "30005589", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005590", name: "WASHER", partNumber: "B2557-280-00B", price: 0.0, inventoryNumber: "30005590", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005591", name: "BUTTON CLAMP", partNumber: "B2557-372-000", price: 0.0, inventoryNumber: "30005591", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005592", name: "SCREW", partNumber: "SS-6111210-SP", price: 5.93, inventoryNumber: "30005592", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005593", name: "SPRING WASHER", partNumber: "WS-0650389-SP", price: 0.0, inventoryNumber: "30005593", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005594", name: "WASHER", partNumber: "260-03905", price: 0.0, inventoryNumber: "30005594", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005595", name: "LOOPER COVER", partNumber: "B1118-372-000", price: 0.0, inventoryNumber: "30005595", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005597", name: "PARTS", partNumber: "B2546-372-000", price: 0.0, inventoryNumber: "30005597", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005598", name: "SCREW", partNumber: "SS-9151630-CP", price: 0.0, inventoryNumber: "30005598", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005601", name: "BASE", partNumber: "B1242-372-000", price: 0.0, inventoryNumber: "30005601", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005602", name: "KNIFE", partNumber: "B2406-373-0A0", price: 0.0, inventoryNumber: "30005602", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005603", name: "KNIFE", partNumber: "B2410-373-000", price: 74.23, inventoryNumber: "30005603", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005605", name: "WASHER", partNumber: "B2606-373-000", price: 0.0, inventoryNumber: "30005605", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005606", name: "TENSION DISC", partNumber: "B3148-123-000", price: 0.0, inventoryNumber: "30005606", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005608", name: "372 000 BUSCHING 260 20305", partNumber: "B2028", price: 0.0, inventoryNumber: "30005608", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005609", name: "372 000 FEED STUD 260 23408", partNumber: "B2509", price: 0.0, inventoryNumber: "30005609", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005610", name: "SCREW", partNumber: "B2007-372-000", price: 0.0, inventoryNumber: "30005610", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005611", name: "PARTS", partNumber: "B3102-372-000", price: 0.0, inventoryNumber: "30005611", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005612", name: "372 000 SPRING 260 20404", partNumber: "B2029", price: 0.0, inventoryNumber: "30005612", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005615", name: "PARTS", partNumber: "B2518-372-00A", price: 0.0, inventoryNumber: "30005615", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005616", name: "THREAD TENSION", partNumber: "B3104-481-000", price: 0.0, inventoryNumber: "30005616", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005617", name: "BALIN", partNumber: "B1203-372-000", price: 0.0, inventoryNumber: "30005617", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005618", name: "DESLIZANTE", partNumber: "B1235-372-000", price: 0.0, inventoryNumber: "30005618", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005619", name: "NIPPER BAR BEARING", partNumber: "B2005-372-000", price: 0.0, inventoryNumber: "30005619", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005620", name: "WASHER", partNumber: "B2607-372-000", price: 0.0, inventoryNumber: "30005620", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005621", name: "SPRING", partNumber: "B2616-372-000", price: 12.71, inventoryNumber: "30005621", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005622", name: "CUSHION", partNumber: "B4420-373-000", price: 0.0, inventoryNumber: "30005622", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005623", name: "SCREW", partNumber: "SS-9151420-TP", price: 0.0, inventoryNumber: "30005623", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005624", name: "BAIL JOINT ECCENTRIC", partNumber: "B1416-372-0A0", price: 0.0, inventoryNumber: "30005624", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005625", name: "SCREW", partNumber: "B2508-372-000", price: 0.0, inventoryNumber: "30005625", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005626", name: "SCREW", partNumber: "SS-1110710-SP", price: 0.0, inventoryNumber: "30005626", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005628", name: "NEEDLE BAR", partNumber: "B1401-373-N00", price: 0.0, inventoryNumber: "30005628", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005629", name: "NUT", partNumber: "B1415-352-000", price: 0.0, inventoryNumber: "30005629", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005631", name: "PULLEY INSERTET", partNumber: "B1204-372-000", price: 0.0, inventoryNumber: "30005631", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005632", name: "PARTS", partNumber: "B2530-372-0A0", price: 0.0, inventoryNumber: "30005632", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005633", name: "SNAP RING", partNumber: "B2541-372-000", price: 7.34, inventoryNumber: "30005633", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005634", name: "BUTTON CLAMP", partNumber: "B2555-372-000", price: 0.0, inventoryNumber: "30005634", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005635", name: "SCREW", partNumber: "SS-4080610-SP", price: 0.0, inventoryNumber: "30005635", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005636", name: "BASE", partNumber: "B1211-372-000", price: 0.0, inventoryNumber: "30005636", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005637", name: "BASE", partNumber: "B2524-372-000", price: 0.0, inventoryNumber: "30005637", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005638", name: "SCREW", partNumber: "B2615-372-000", price: 0.0, inventoryNumber: "30005638", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005639", name: "LAINA", partNumber: "B4122-522-000", price: 0.0, inventoryNumber: "30005639", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005640", name: "NUT", partNumber: "NS-6090530-SP", price: 0.0, inventoryNumber: "30005640", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005641", name: "SEGURO", partNumber: "RE-0320000-K0", price: 0.0, inventoryNumber: "30005641", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005642", name: "SCREW", partNumber: "SM-4040601-SN", price: 0.0, inventoryNumber: "30005642", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005643", name: "WASHER", partNumber: "WP-0621036-SP", price: 0.0, inventoryNumber: "30005643", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005644", name: "372 000 260 25205", partNumber: "B2540", price: 0.0, inventoryNumber: "30005644", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005645", name: "OIL ADJUSTING COLLAR", partNumber: "B1215-552-000", price: 0.0, inventoryNumber: "30005645", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005646", name: "STOP MOTION DISC", partNumber: "B2611-372-000", price: 0.0, inventoryNumber: "30005646", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005647", name: "NUT", partNumber: "B3125-012-000", price: 0.0, inventoryNumber: "30005647", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005648", name: "TENSION 229-45802", partNumber: "B3214-047-000", price: 22.5, inventoryNumber: "30005648", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005649", name: "MICRO", partNumber: "D-2119-555-000", price: 0.0, inventoryNumber: "30005649", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005650", name: "SCREW", partNumber: "SS-5110810-SP", price: 0.0, inventoryNumber: "30005650", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005651", name: "WASHER", partNumber: "WS-0410002-KR", price: 0.0, inventoryNumber: "30005651", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005652", name: "GUIA HILO", partNumber: "B2038-372-000", price: 0.0, inventoryNumber: "30005652", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005653", name: "BUTTON CLAMP", partNumber: "B2559-372-000", price: 0.0, inventoryNumber: "30005653", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005654", name: "TENSION", partNumber: "D-3161-555-BA0", price: 0.0, inventoryNumber: "30005654", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005656", name: "SCREW", partNumber: "SD-0640241-SP", price: 0.0, inventoryNumber: "30005656", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005657", name: "PINS", partNumber: "B1147-555-000", price: 0.0, inventoryNumber: "30005657", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005658", name: "SCREW", partNumber: "B1521-555-000", price: 0.0, inventoryNumber: "30005658", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005659", name: "NIPPER PULLING", partNumber: "B2037-372-000", price: 0.0, inventoryNumber: "30005659", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005662", name: "SCREW", partNumber: "SD-0791271-SP", price: 0.0, inventoryNumber: "30005662", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005663", name: "SCREW", partNumber: "SS-7090620-TP", price: 0.0, inventoryNumber: "30005663", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005664", name: "SCREW", partNumber: "SS-7110350-SP", price: 0.0, inventoryNumber: "30005664", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005665", name: "WASHER", partNumber: "WP-0510516-SD", price: 0.0, inventoryNumber: "30005665", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005666", name: "SPRING WASHER", partNumber: "WS-0441040-KP", price: 0.0, inventoryNumber: "30005666", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005667", name: "SIDE COVER HINGE", partNumber: "B1110-372-000", price: 0.0, inventoryNumber: "30005667", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005668", name: "PARTS", partNumber: "B4412-373-000", price: 0.0, inventoryNumber: "30005668", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005669", name: "PINS", partNumber: "B1106-372-000", price: 0.0, inventoryNumber: "30005669", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005670", name: "PINS", partNumber: "B1106-372-0A0", price: 0.0, inventoryNumber: "30005670", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005672", name: "SCREW PINS", partNumber: "B2605-373-000", price: 0.0, inventoryNumber: "30005672", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005673", name: "THROAT PLATE", partNumber: "B1241-373-000", price: 0.0, inventoryNumber: "30005673", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005674", name: "NUT", partNumber: "NM-6060001-SD", price: 0.0, inventoryNumber: "30005674", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005675", name: "SCREW", partNumber: "SM-6030602-SD", price: 0.0, inventoryNumber: "30005675", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005676", name: "WASHER", partNumber: "WP-0320500-SF", price: 2.45, inventoryNumber: "30005676", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005677", name: "WASHER", partNumber: "WP-0330500-0E", price: 0.0, inventoryNumber: "30005677", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005678", name: "WASHER", partNumber: "WP-0430800-SF", price: 0.54, inventoryNumber: "30005678", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005679", name: "YOKE SLIDE", partNumber: "260-13607", price: 0.0, inventoryNumber: "30005679", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005680", name: "GASKET", partNumber: "B1522-552-000", price: 0.0, inventoryNumber: "30005680", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005681", name: "SUPPURT", partNumber: "B2410-372-000", price: 0.0, inventoryNumber: "30005681", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005682", name: "LENGTHWISE FEED", partNumber: "B2511-372-0A0", price: 0.0, inventoryNumber: "30005682", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005683", name: "INDICATOR SPRING CONECTIN", partNumber: "B2513-372-000A", price: 0.0, inventoryNumber: "30005683", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005684", name: "STITCH DIAL", partNumber: "113-26204", price: 100.21, inventoryNumber: "30005684", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005689", name: "PARTS", partNumber: "B-2031-372-0A0", price: 0.0, inventoryNumber: "30005689", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005690", name: "PARTS", partNumber: "B2618-372-0A0", price: 0.0, inventoryNumber: "30005690", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005691", name: "SCREW", partNumber: "SM-6065002-SD", price: 0.0, inventoryNumber: "30005691", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005692", name: "WASHER", partNumber: "WP-0851846-SC", price: 0.0, inventoryNumber: "30005692", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005693", name: "GASKET", partNumber: "14475", price: 0.0, inventoryNumber: "30005693", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005694", name: "NEEDLE GUIDE", partNumber: "B1212-373-000", price: 0.0, inventoryNumber: "30005694", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005695", name: "POSICIONADOR", partNumber: "B1236-372-000", price: 0.0, inventoryNumber: "30005695", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005696", name: "PINS", partNumber: "B2608-372-000", price: 0.0, inventoryNumber: "30005696", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005698", name: "SCREW", partNumber: "SD-0640961-SP", price: 0.0, inventoryNumber: "30005698", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005700", name: "WASHER", partNumber: "WP-0371026-SD", price: 0.0, inventoryNumber: "30005700", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005701", name: "TENSION", partNumber: "B2016-372-0A0", price: 0.0, inventoryNumber: "30005701", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005702", name: "NUT", partNumber: "B2035-372-000", price: 0.0, inventoryNumber: "30005702", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005703", name: "PARTS", partNumber: "B2640-372-000", price: 0.0, inventoryNumber: "30005703", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005704", name: "TENSION", partNumber: "B3109-372-0A0", price: 0.0, inventoryNumber: "30005704", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005705", name: "NUT", partNumber: "NM-6040001-SC", price: 0.0, inventoryNumber: "30005705", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005706", name: "SCREW", partNumber: "SD-0641324-TP", price: 326.52, inventoryNumber: "30005706", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005707", name: "GASKET", partNumber: "TA-1250804-RO", price: 0.0, inventoryNumber: "30005707", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005708", name: "WASHER", partNumber: "WP-0621026-SP", price: 0.0, inventoryNumber: "30005708", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005709", name: "PINS", partNumber: "B-4416-372-000", price: 0.0, inventoryNumber: "30005709", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005710", name: "BUSHING", partNumber: "B-4417-372-000", price: 0.0, inventoryNumber: "30005710", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005711", name: "LAINA", partNumber: "B2422-372-000", price: 0.0, inventoryNumber: "30005711", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005712", name: "PARTS", partNumber: "B2564-372-000", price: 0.0, inventoryNumber: "30005712", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005713", name: "WASHER", partNumber: "WP-0621016-SP", price: 0.0, inventoryNumber: "30005713", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005714", name: "PARTS", partNumber: "B1202-372-000", price: 0.0, inventoryNumber: "30005714", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005715", name: "VIELA", partNumber: "B2505-373-000", price: 0.0, inventoryNumber: "30005715", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005716", name: "PARTS", partNumber: "D2506-373-L-A", price: 0.0, inventoryNumber: "30005716", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005717", name: "PARTS", partNumber: "D2506-373-L00", price: 0.0, inventoryNumber: "30005717", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005718", name: "PARTS", partNumber: "B1119-373-000", price: 0.0, inventoryNumber: "30005718", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005719", name: "PARTS", partNumber: "B1407-372-000", price: 0.0, inventoryNumber: "30005719", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005720", name: "BASE", partNumber: "B2405-373-000", price: 0.0, inventoryNumber: "30005720", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005721", name: "SCREW", partNumber: "SS-7150740-SP", price: 0.0, inventoryNumber: "30005721", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005722", name: "SCREW", partNumber: "SS-9151740-CP", price: 0.0, inventoryNumber: "30005722", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005723", name: "372 000 STOP MOTION 260 02907", partNumber: "B2604", price: 0.0, inventoryNumber: "30005723", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005725", name: "LENGTHWISE", partNumber: "B2563-372-0A0", price: 0.0, inventoryNumber: "30005725", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005726", name: "SCREW", partNumber: "SD-0550181-SP", price: 0.0, inventoryNumber: "30005726", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005727", name: "SCREW", partNumber: "SS-7110710-SP", price: 0.0, inventoryNumber: "30005727", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005733", name: "POWER JACK", partNumber: "PJ-145G", price: 2613.67, inventoryNumber: "30005733", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005734", name: "TIMING BELT", partNumber: "0170-150180", price: 614.63, inventoryNumber: "30005734", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005736", name: "SPRING", partNumber: "0271-000275", price: 45.07, inventoryNumber: "30005736", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005737", name: "BEARING HOUSING", partNumber: "0396-100554", price: 3783.8, inventoryNumber: "30005737", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005745", name: "FEED DOG", partNumber: "0396-210370", price: 2948.98, inventoryNumber: "30005745", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005747", name: "GUIDE", partNumber: "0396-243043", price: 1108.24, inventoryNumber: "30005747", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005749", name: "TIMING BELT", partNumber: "0396-341880", price: 849.5, inventoryNumber: "30005749", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005750", name: "THREADPULL KNIFE", partNumber: "0396-350690", price: 1712.22, inventoryNumber: "30005750", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005754", name: "NEEDLE GUARD", partNumber: "0971-150150", price: 2102.44, inventoryNumber: "30005754", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005755", name: "DRIVER", partNumber: "0971-440130", price: 112.2, inventoryNumber: "30005755", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005756", name: "UPPER KNIFE", partNumber: "0971-440860", price: 2617.53, inventoryNumber: "30005756", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005757", name: "LOWER KNIFE", partNumber: "0971-440870", price: 1090.69, inventoryNumber: "30005757", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005760", name: "SEALING RING", partNumber: "0998-851150", price: 200.54, inventoryNumber: "30005760", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005764", name: "SCREW", partNumber: "9203-311811", price: 74.2, inventoryNumber: "30005764", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005765", name: "CILINDER", partNumber: "9700-102350", price: 2368.11, inventoryNumber: "30005765", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005766", name: "TAPE BEARING", partNumber: "0196-000490", price: 1023.88, inventoryNumber: "30005766", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005767", name: "CYLINDER SCREW", partNumber: "0211-000919", price: 173.2, inventoryNumber: "30005767", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005773", name: "EPROM", partNumber: "M2732A-4F1", price: 672.43, inventoryNumber: "30005773", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005775", name: "Bushing", partNumber: "372799", price: 414.81, inventoryNumber: "30005775", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005776", name: "Upper Knife", partNumber: "0973-450420", price: 427.91, inventoryNumber: "30005776", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005777", name: "ENGRANAJE", partNumber: "0577-140040", price: 1363.22, inventoryNumber: "30005777", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005778", name: "timing belt", partNumber: "9130-221150", price: 560.17, inventoryNumber: "30005778", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005779", name: "Plate", partNumber: "210845", price: 0.0, inventoryNumber: "30005779", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005781", name: "Crank Assembly", partNumber: "FP29105AK", price: 5193.87, inventoryNumber: "30005781", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005782", name: "Screw", partNumber: "416139", price: 0.0, inventoryNumber: "30005782", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005784", name: "WORM GEAR", partNumber: "10315", price: 1584.36, inventoryNumber: "30005784", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005785", name: "SHARPENING ASSEMBLY", partNumber: "10370", price: 1024.2, inventoryNumber: "30005785", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005787", name: "BASE PLATE", partNumber: "10345", price: 847.15, inventoryNumber: "30005787", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005788", name: "BRUSH CAP", partNumber: "10413", price: 219.63, inventoryNumber: "30005788", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005792", name: "AIR CILYNDER", partNumber: "G011376", price: 1408.31, inventoryNumber: "30005792", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005793", name: "KIT DE SELLOS", partNumber: "RKCC07SK36", price: 2364.71, inventoryNumber: "30005793", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005794", name: "KIT DE SELLOS", partNumber: "RKCC07SK32", price: 2342.23, inventoryNumber: "30005794", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005795", name: "FOOT LEVER", partNumber: "683C1-17", price: 399.5, inventoryNumber: "30005795", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005796", name: "PART US", partNumber: "5424B12-12", price: 4988.18, inventoryNumber: "30005796", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005797", name: "NEEDLE BAR", partNumber: "110-35003", price: 247.2, inventoryNumber: "30005797", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005798", name: "SCREW", partNumber: "SS-4120915-SP", price: 9.01, inventoryNumber: "30005798", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005799", name: "FEED CROS PLATE", partNumber: "182-01962", price: 3206.34, inventoryNumber: "30005799", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005811", name: "RUBBER PLUNGER", partNumber: "D2468555B00", price: 48.88, inventoryNumber: "30005811", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005813", name: "HOULDER SCDREW", partNumber: "SD0400506TP", price: 138.06, inventoryNumber: "30005813", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005825", name: "KNIFE 7/16", partNumber: "107204-001", price: 17.95, inventoryNumber: "30005825", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005830", name: "SCREW", partNumber: "10347", price: 18.04, inventoryNumber: "30005830", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005831", name: "SCREW", partNumber: "10333", price: 65.84, inventoryNumber: "30005831", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005833", name: "HEAD FAN MOTTOR", partNumber: "400-05403", price: 1827.3, inventoryNumber: "30005833", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005842", name: "PRENSATELA PARA ZIPPER", partNumber: "P363", price: 17.33, inventoryNumber: "30005842", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005893", name: "GANCHO", partNumber: "0396-150814", price: 5445.38, inventoryNumber: "30005893", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005894", name: "BOBBIN CARRETEL", partNumber: "296-152820", price: 186.45, inventoryNumber: "30005894", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005895", name: "GARFIO", partNumber: "0370-150380", price: 3429.2, inventoryNumber: "30005895", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005898", name: "MAGNET LED LIGHT", partNumber: "55-LED-16MM", price: 267.42, inventoryNumber: "30005898", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005899", name: "CYLINDER ASSY HEAVY DUTY", partNumber: "A-CR2-251", price: 11923.69, inventoryNumber: "30005899", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005905", name: "LEVER", partNumber: "400-21933", price: 29.7, inventoryNumber: "30005905", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005911", name: "NEEDLE BAR B", partNumber: "400-00221", price: 364.3, inventoryNumber: "30005911", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005913", name: "DLPP", partNumber: "215-83", price: 5242.59, inventoryNumber: "30005913", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005915", name: "DLPP215-104", partNumber: "DLPP215-104", price: 3321.52, inventoryNumber: "30005915", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005916", name: "DLPP", partNumber: "215-106/107", price: 2395.01, inventoryNumber: "30005916", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005919", name: "OIL TANK ASM", partNumber: "400-04164", price: 299.24, inventoryNumber: "30005919", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005925", name: "LEVER", partNumber: "400-23022", price: 37.48, inventoryNumber: "30005925", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005926", name: "SCREW", partNumber: "SM-405125-SP", price: 4.71, inventoryNumber: "30005926", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005927", name: "NEEDLE BAR GUIDE", partNumber: "229-06309", price: 40.11, inventoryNumber: "30005927", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005933", name: "SPRING", partNumber: "154595-001", price: 40.92, inventoryNumber: "30005933", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005934", name: "STOP RING", partNumber: "048060-342", price: 3.45, inventoryNumber: "30005934", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005935", name: "SCREW", partNumber: "SM-4051055-SP", price: 4.71, inventoryNumber: "30005935", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005939", name: "BEARING", partNumber: "SB-1080023-00", price: 233.75, inventoryNumber: "30005939", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005941", name: "SHUTTLE CHECK MARK a", partNumber: "400-14964", price: 2132.31, inventoryNumber: "30005941", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005945", name: "SAB6-167", partNumber: "SAB6-167", price: 2251.6, inventoryNumber: "30005945", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005947", name: "SAB2-48/53", partNumber: "SAB2-48/53", price: 11326.21, inventoryNumber: "30005947", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005948", name: "PRESSER FOOT", partNumber: "161782NS-1/4", price: 7253.7, inventoryNumber: "30005948", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005951", name: "KIT DE SELLOS", partNumber: "SRK125A", price: 669.2, inventoryNumber: "30005951", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005956", name: "BOBBIN CARRETEL", partNumber: "B1805-210-A00", price: 107.36, inventoryNumber: "30005956", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005957", name: "WORK CLAMP FOOT COMPLETE", partNumber: "B2590-210-DA0", price: 2050.82, inventoryNumber: "30005957", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005961", name: "CILINDRO", partNumber: "9700-100095", price: 3045.8, inventoryNumber: "30005961", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005962", name: "PORTACUCHILLA", partNumber: "0971-441213", price: 6589.15, inventoryNumber: "30005962", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005963", name: "CILINDRO", partNumber: "9700-212019", price: 3939.81, inventoryNumber: "30005963", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005964", name: "ANILLO DE RETENCION", partNumber: "9352-000100", price: 17.27, inventoryNumber: "30005964", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005974", name: "FEED DOG", partNumber: "51205R", price: 510.76, inventoryNumber: "30005974", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005977", name: "LOOPERS HOLDERS", partNumber: "273513-92", price: 2538.07, inventoryNumber: "30005977", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005979", name: "LOOPERS", partNumber: "32824", price: 1123.21, inventoryNumber: "30005979", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005980", name: "LOOPERS", partNumber: "32821", price: 1105.28, inventoryNumber: "30005980", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005982", name: "PRESSER FOOT 1/4", partNumber: "21492016", price: 4248.01, inventoryNumber: "30005982", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005983", name: "FEED DOG", partNumber: "139049-1/4", price: 1451.77, inventoryNumber: "30005983", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005984", name: "PLATE FOR SINGER 261", partNumber: "139543-1/4", price: 2068.33, inventoryNumber: "30005984", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005985", name: "NEEDLE CLAMP 1/4", partNumber: "139116-8-SEK", price: 2987.44, inventoryNumber: "30005985", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005988", name: "PRESSER FOOT", partNumber: "214", price: 86.7, inventoryNumber: "30005988", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005989", name: "LOWER KNIFE", partNumber: "12257267", price: 2218.03, inventoryNumber: "30005989", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005991", name: "HEATING ELEMENT", partNumber: "AST-04349", price: 6262.71, inventoryNumber: "30005991", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005992", name: "HEATING ELEMENT", partNumber: "AST-04350", price: 6692.58, inventoryNumber: "30005992", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005993", name: "UPPER ROLLER ASTEC 4524", partNumber: "AST-16918", price: 107154.42, inventoryNumber: "30005993", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30005995", name: "BOBBIN SPRING", partNumber: "262-61602", price: 9.29, inventoryNumber: "30005995", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006002", name: "TAPING PRESSER FOOT", partNumber: "14661514", price: 2747.25, inventoryNumber: "30006002", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006021", name: "SPRING RIGHT", partNumber: "MAZ-15509000", price: 97.8, inventoryNumber: "30006021", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006030", name: "MOTOR ASSY T AXIS", partNumber: "A-CR3-152-50", price: 60786.5, inventoryNumber: "30006030", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006032", name: "RUBBER PAD HOLDER DLPP", partNumber: "2015-105", price: 2427.19, inventoryNumber: "30006032", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006045", name: "BORNERA 1.5MM", partNumber: "", price: 50.93, inventoryNumber: "30006045", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006046", name: "PANTALLA PANASONIC", partNumber: "GT02", price: 8948.0, inventoryNumber: "30006046", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006082", name: "THREAD GUIDE", partNumber: "400-10574", price: 30.27, inventoryNumber: "30006082", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006088", name: "WHASER", partNumber: "WP-1703001-SC", price: 11.57, inventoryNumber: "30006088", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006089", name: "SCREW FOR 261", partNumber: "504048", price: 14.32, inventoryNumber: "30006089", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006090", name: "SCREW", partNumber: "SM-1040601-SC", price: 18.64, inventoryNumber: "30006090", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006091", name: "TUBO", partNumber: "113-07352", price: 130.02, inventoryNumber: "30006091", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006092", name: "BT PULLER B", partNumber: "400-22322", price: 330.72, inventoryNumber: "30006092", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006094", name: "DRIVING SEGMENT", partNumber: "0396-351713", price: 3107.91, inventoryNumber: "30006094", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006095", name: "BEARING RING", partNumber: "0396-351380", price: 3736.87, inventoryNumber: "30006095", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006099", name: "THEADED PIN", partNumber: "0992-012430", price: 20.87, inventoryNumber: "30006099", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006119", name: "PULLER FOR JUKI PL/P5535", partNumber: "LH-1152", price: 22393.11, inventoryNumber: "30006119", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006127", name: "PRENSSER FOOT 5/16", partNumber: "12463RH", price: 46.57, inventoryNumber: "30006127", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006131", name: "BRACKET", partNumber: "CP-215-31-A1", price: 1157.33, inventoryNumber: "30006131", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006132", name: "BRACKET", partNumber: "CP-215-31-A3", price: 1543.11, inventoryNumber: "30006132", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006141", name: "SCREW", partNumber: "9203-112764", price: 182.67, inventoryNumber: "30006141", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006143", name: "SEWING HOOK TEFLON KF220710", partNumber: "MK-5", price: 1700.81, inventoryNumber: "30006143", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006144", name: "BOBBIN CASE KF221020", partNumber: "4B19-S6-BA", price: 374.99, inventoryNumber: "30006144", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006145", name: "BOBBIN W/KNURL ON AXLE CARRETEL", partNumber: "KF220530", price: 76.54, inventoryNumber: "30006145", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006146", name: "FIXED KNIFE ZQ6 SJ270040", partNumber: "MK-5", price: 504.72, inventoryNumber: "30006146", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006147", name: "MOVING KNIFE ZQ6 SJ270030", partNumber: "MK-5", price: 1863.63, inventoryNumber: "30006147", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006148", name: "TAKE UP LEVER ASSY", partNumber: "QK230590", price: 449.6, inventoryNumber: "30006148", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006149", name: "PRESSER FOOT ZQ-B/C", partNumber: "QK230561", price: 957.93, inventoryNumber: "30006149", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006150", name: "NEEDLE BAR ASSY", partNumber: "QK230451", price: 897.76, inventoryNumber: "30006150", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006152", name: "BOBINA", partNumber: "P413830", price: 1820.79, inventoryNumber: "30006152", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006153", name: "FAJAS DE MOVIMIENTO VERTICAL", partNumber: "P710040", price: 4866.17, inventoryNumber: "30006153", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006156", name: "CYLINDER WITH FINGER CLPP", partNumber: "H72", price: 11946.09, inventoryNumber: "30006156", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006161", name: "LOWER KNIFE SUPPORT", partNumber: "3100514", price: 26.84, inventoryNumber: "30006161", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006162", name: "SCREW", partNumber: "110030", price: 11.3, inventoryNumber: "30006162", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006163", name: "SCREW", partNumber: "110025", price: 12.96, inventoryNumber: "30006163", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006164", name: "SCREW", partNumber: "110024", price: 12.96, inventoryNumber: "30006164", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006165", name: "SCREW", partNumber: "110023", price: 11.31, inventoryNumber: "30006165", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006166", name: "UPPER KNIFE GUIDE", partNumber: "3100507", price: 101.72, inventoryNumber: "30006166", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006167", name: "CLAMP SRING PRESSER HOLDER", partNumber: "3100510", price: 26.85, inventoryNumber: "30006167", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006168", name: "THREAD CLAMP ADJUSTING", partNumber: "3100511", price: 88.06, inventoryNumber: "30006168", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006169", name: "SCREW", partNumber: "110034", price: 11.3, inventoryNumber: "30006169", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006170", name: "LOWER KNIFE CARRIER SUPPORT", partNumber: "3100516", price: 26.84, inventoryNumber: "30006170", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006171", name: "PARTS", partNumber: "130005", price: 12.96, inventoryNumber: "30006171", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006172", name: "BUTTON RISING BAR ASM", partNumber: "141-46757", price: 481.31, inventoryNumber: "30006172", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006191", name: "SEM PUMPE EINZ", partNumber: "423-058-036-0", price: 1012.36, inventoryNumber: "30006191", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006193", name: "BUTTON CARRIER", partNumber: "165-90705", price: 1238.37, inventoryNumber: "30006193", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006203", name: "UPPER KNIFE", partNumber: "0973-461610", price: 459.64, inventoryNumber: "30006203", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006204", name: "TAPON", partNumber: "0667-110080", price: 57.6, inventoryNumber: "30006204", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006205", name: "SELLO", partNumber: "9742-300140", price: 190.43, inventoryNumber: "30006205", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006215", name: "SCREW", partNumber: "110027", price: 16.43, inventoryNumber: "30006215", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006216", name: "PRESSER FOOT CHIP", partNumber: "3107311", price: 196.91, inventoryNumber: "30006216", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006217", name: "GUIDE", partNumber: "3101321", price: 82.16, inventoryNumber: "30006217", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006218", name: "SCREW", partNumber: "110038", price: 15.26, inventoryNumber: "30006218", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006219", name: "GUIDE", partNumber: "3101320", price: 82.16, inventoryNumber: "30006219", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006220", name: "SPRING", partNumber: "3107303", price: 42.26, inventoryNumber: "30006220", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006221", name: "SPRING", partNumber: "3107304", price: 42.26, inventoryNumber: "30006221", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006246", name: "PIEZA PLASTICA", partNumber: "0540-350190", price: 280.62, inventoryNumber: "30006246", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006247", name: "VALVULA", partNumber: "9710-021010", price: 2722.86, inventoryNumber: "30006247", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006253", name: "PRESSER GUIDE BAR", partNumber: "236-10306", price: 15.43, inventoryNumber: "30006253", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006255", name: "FRONT_BEARING", partNumber: "401-50011", price: 401.9, inventoryNumber: "30006255", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006262", name: "OIL WICK SUPPORT ASM,", partNumber: "236-29256", price: 191.52, inventoryNumber: "30006262", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006263", name: "UPPER ROLLERS", partNumber: "P2515", price: 562.04, inventoryNumber: "30006263", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006280", name: "CAPACITOR", partNumber: "100UFX25V", price: 115.0, inventoryNumber: "30006280", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006281", name: "BUSHING", partNumber: "B1403-380-000", price: 233.68, inventoryNumber: "30006281", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006282", name: "NEEDLE BARR", partNumber: "B-1401-380-000", price: 238.64, inventoryNumber: "30006282", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006288", name: "SCREW 3/32-56", partNumber: "SS-7060310-SP", price: 10.62, inventoryNumber: "30006288", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006289", name: "SCREW FOR SINGER", partNumber: "141553", price: 17.06, inventoryNumber: "30006289", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006299", name: "RUBBER RING", partNumber: "RO-0982401-00", price: 8.71, inventoryNumber: "30006299", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006303", name: "RUBBER PLUNGER", partNumber: "D2468-555-B00", price: 49.58, inventoryNumber: "30006303", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006304", name: "WASHER", partNumber: "WP-1703001-SC", price: 11.7, inventoryNumber: "30006304", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006305", name: "PLUNGER ARM PIN", partNumber: "229-62906", price: 96.11, inventoryNumber: "30006305", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006309", name: "FITTED PART BUSHING", partNumber: "FP56190", price: 270.16, inventoryNumber: "30006309", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006311", name: "ROCKING BASE", partNumber: "400-00281", price: 2707.82, inventoryNumber: "30006311", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006321", name: "LOPPER SUPERIOR", partNumber: "118-88104", price: 385.2, inventoryNumber: "30006321", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006322", name: "PIEZA DEL PRENSATELA", partNumber: "0396-222363", price: 3785.53, inventoryNumber: "30006322", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006330", name: "THROAT PLATE", partNumber: "B1103-380-L00", price: 3037.91, inventoryNumber: "30006330", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006331", name: "NEEDLE CLAMP ASM 1/2", partNumber: "B1406-038-LA0", price: 1308.4, inventoryNumber: "30006331", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006332", name: "PRESSER FOOT ASM 1/2", partNumber: "B1509-038-LBB", price: 1419.56, inventoryNumber: "30006332", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006333", name: "FEED DOG", partNumber: "B1613-380-L00", price: 2570.55, inventoryNumber: "30006333", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006334", name: "REAR MOVING NEEDLE GUARD", partNumber: "B2311-380-L00", price: 1277.41, inventoryNumber: "30006334", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006337", name: "LOOPER (LEFT)", partNumber: "B2030-380-000", price: 1945.15, inventoryNumber: "30006337", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006338", name: "LOOPER (RIGHT)", partNumber: "B2031-380-000", price: 1948.39, inventoryNumber: "30006338", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006339", name: "BED SLIDE ASM.", partNumber: "B1104-380-LA0", price: 308.56, inventoryNumber: "30006339", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006345", name: "NEEDLE HOLE GUIDE", partNumber: "401-62662", price: 808.0, inventoryNumber: "30006345", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006366", name: "57890B", partNumber: "FP57890B", price: 1318.86, inventoryNumber: "30006366", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006369", name: "DISCO", partNumber: "0556-001525", price: 120.34, inventoryNumber: "30006369", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006377", name: "HOOK FLOP", partNumber: "0557-150010", price: 3700.85, inventoryNumber: "30006377", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006378", name: "CYLINDER", partNumber: "9700-101100", price: 1803.61, inventoryNumber: "30006378", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006380", name: "SHAFT", partNumber: "0970-402073", price: 3177.74, inventoryNumber: "30006380", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006389", name: "FEED BAR", partNumber: "143448", price: 10143.09, inventoryNumber: "30006389", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006390", name: "SREW FOR LDA", partNumber: "416138", price: 34.15, inventoryNumber: "30006390", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006393", name: "SCREW", partNumber: "SS-6580752TP", price: 22.52, inventoryNumber: "30006393", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006394", name: "FIXING KNIFE", partNumber: "401-62660", price: 632.1, inventoryNumber: "30006394", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006413", name: "OIL AMOUNT ADJUSTING PIN", partNumber: "B1213-552-0A0A", price: 267.93, inventoryNumber: "30006413", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006414", name: "OIL RETURM TUBE", partNumber: "B3526-552-0A0", price: 43.77, inventoryNumber: "30006414", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006415", name: "ADJUSTING PIN - 110-03001", partNumber: "119-03900", price: 26.63, inventoryNumber: "30006415", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006416", name: "RUBBER RING", partNumber: "RO-0291801-00", price: 8.95, inventoryNumber: "30006416", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006427", name: "SCREW REPL 400-04185", partNumber: "400-04182", price: 961.04, inventoryNumber: "30006427", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006434", name: "PULLER FOR UNION SPECIAL 56300", partNumber: "PS-S1-US5", price: 19636.47, inventoryNumber: "30006434", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006435", name: "UPPER TAPE FEEDER", partNumber: "TFU-16-3", price: 10261.4, inventoryNumber: "30006435", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006437", name: "PRESER FOOT", partNumber: "31358HN", price: 28.27, inventoryNumber: "30006437", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006442", name: "NEEDLE PLATE 5MM", partNumber: "2107970", price: 1146.24, inventoryNumber: "30006442", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006443", name: "MAIN FEED DOG COM", partNumber: "210574-BF0", price: 1194.02, inventoryNumber: "30006443", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006444", name: "DIFF FEED DOG", partNumber: "210445-BF0", price: 1064.4, inventoryNumber: "30006444", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006445", name: "THREAD GUIDE", partNumber: "143570", price: 132.48, inventoryNumber: "30006445", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006446", name: "SCREW", partNumber: "140180", price: 30.75, inventoryNumber: "30006446", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006448", name: "SCREW 8MM", partNumber: "1175-2", price: 9.22, inventoryNumber: "30006448", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006449", name: "SCREW", partNumber: "54920", price: 9.45, inventoryNumber: "30006449", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006463", name: "BR SENSOR ASM", partNumber: "GBR-108410B0", price: 11445.58, inventoryNumber: "30006463", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006469", name: "LOOPER (#26)", partNumber: "210365", price: 166.31, inventoryNumber: "30006469", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006476", name: "UPPER ROLLER", partNumber: "P5515", price: 710.98, inventoryNumber: "30006476", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006477", name: "LOWER ROLLER", partNumber: "P3022", price: 1582.73, inventoryNumber: "30006477", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006478", name: "MOTOR KNOB", partNumber: "165-61904", price: 79.02, inventoryNumber: "30006478", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006482", name: "TIMING BELT", partNumber: "400-04169", price: 1449.18, inventoryNumber: "30006482", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006483", name: "WORM WHEEL", partNumber: "165-62001", price: 2312.82, inventoryNumber: "30006483", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006484", name: "WORM GEAR", partNumber: "165-62100", price: 584.47, inventoryNumber: "30006484", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006499", name: "DC MOTOR ASM", partNumber: "GBR-108550A0", price: 1819.15, inventoryNumber: "30006499", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006503", name: "NEEDLE CLAMP 3/16", partNumber: "139116-3/16", price: 673.03, inventoryNumber: "30006503", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006504", name: "FEED DOG 3/16 SEK", partNumber: "122571-6-", price: 2030.52, inventoryNumber: "30006504", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006508", name: "SPRING HOOK", partNumber: "GBR-01607000", price: 43.52, inventoryNumber: "30006508", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006509", name: "NUT 1/8-44", partNumber: "NS-6080210-SP", price: 6.43, inventoryNumber: "30006509", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006510", name: "PARTS", partNumber: "292-02692", price: 7261.14, inventoryNumber: "30006510", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006511", name: "BANDA DE TIEMPO", partNumber: "0091-002140", price: 1529.29, inventoryNumber: "30006511", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006512", name: "SCREW", partNumber: "7119", price: 114.94, inventoryNumber: "30006512", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006513", name: "THREAD GUIDE", partNumber: "2750300", price: 133.52, inventoryNumber: "30006513", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006525", name: "BUSHING, NEEDLE BAR UPPER", partNumber: "416112", price: 1308.67, inventoryNumber: "30006525", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006537", name: "GUIDE BUSHING", partNumber: "0971-440120", price: 2955.46, inventoryNumber: "30006537", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006538", name: "ROTARY THEREAD TAKE", partNumber: "0971-110040", price: 1357.48, inventoryNumber: "30006538", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006540", name: "PRESSER FOOT", partNumber: "0980-401810", price: 1660.13, inventoryNumber: "30006540", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006541", name: "SCREW", partNumber: "90191000", price: 279.15, inventoryNumber: "30006541", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006559", name: "TIJERA DE CORTE", partNumber: "0540-350273", price: 5993.01, inventoryNumber: "30006559", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006560", name: "BANDA DE TIEMPO", partNumber: "0091-002140", price: 2251.49, inventoryNumber: "30006560", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006561", name: "TOPE DE GOMA", partNumber: "0570-001197", price: 183.16, inventoryNumber: "30006561", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006566", name: "RACING PF-RB BELT PULLERS", partNumber: "", price: 23448.19, inventoryNumber: "30006566", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006571", name: "SCREW", partNumber: "0531-000473", price: 30.48, inventoryNumber: "30006571", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006572", name: "SOPORTE DE GANCHO", partNumber: "0971-150163", price: 4075.1, inventoryNumber: "30006572", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006573", name: "PLATE", partNumber: "0971-200013", price: 1274.26, inventoryNumber: "30006573", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006576", name: "HANDLE", partNumber: "421-312-550-0", price: 3009.65, inventoryNumber: "30006576", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006577", name: "CABLE SET", partNumber: "4325-095555", price: 6390.53, inventoryNumber: "30006577", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006578", name: "DISCO", partNumber: "80C1-149", price: 624.32, inventoryNumber: "30006578", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006582", name: "TORNILLO DE 24MM PARA BASTIDOR", partNumber: "FR9024MM", price: 167.47, inventoryNumber: "30006582", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006612", name: "GUIA HILO", partNumber: "0170-110253", price: 4021.52, inventoryNumber: "30006612", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006617", name: "BUSHING", partNumber: "0196-000440", price: 792.54, inventoryNumber: "30006617", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006624", name: "POLEA", partNumber: "0973-404383", price: 19296.64, inventoryNumber: "30006624", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006628", name: "PERNO", partNumber: "0396-121000", price: 31.71, inventoryNumber: "30006628", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006635", name: "THROAT PLATE", partNumber: "0971-200014", price: 8099.93, inventoryNumber: "30006635", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006636", name: "SCREW", partNumber: "9201-112447", price: 18.32, inventoryNumber: "30006636", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006638", name: "LINK SUPPORTING PLATE", partNumber: "D2572M1YC0F", price: 95.13, inventoryNumber: "30006638", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006639", name: "SCREW", partNumber: "SS-9091010-SP", price: 47.58, inventoryNumber: "30006639", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006658", name: "DISK STOPPER SP", partNumber: "400-10513", price: 16.05, inventoryNumber: "30006658", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006665", name: "PRESSER FOOT", partNumber: "17-896", price: 850.79, inventoryNumber: "30006665", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006670", name: "PANEL CABLE ASSY", partNumber: "400-30983", price: 1858.86, inventoryNumber: "30006670", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006680", name: "PRENSATELA P705", partNumber: "1/16X1/2", price: 2490.05, inventoryNumber: "30006680", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006682", name: "FORK", partNumber: "0170-110360", price: 1583.37, inventoryNumber: "30006682", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006689", name: "DYNAMO STATOR", partNumber: "229-37965", price: 1157.32, inventoryNumber: "30006689", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006711", name: "SCREW", partNumber: "400-82078", price: 19.23, inventoryNumber: "30006711", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006712", name: "SLIDE BLOCK", partNumber: "139046", price: 1245.16, inventoryNumber: "30006712", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006713", name: "NEEDLE BAR CONNEC. LINK ASM", partNumber: "416122", price: 1270.71, inventoryNumber: "30006713", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006714", name: "TAKE UP COMP", partNumber: "416128", price: 4248.18, inventoryNumber: "30006714", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006715", name: "BUSHING, NEEDLE BAR LOWER", partNumber: "372799", price: 511.25, inventoryNumber: "30006715", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006716", name: "ACEITE", partNumber: "R32", price: 331.7, inventoryNumber: "30006716", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006723", name: "BLADE 1/4 X 3/8", partNumber: "", price: 9105.6, inventoryNumber: "30006723", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006728", name: "HEADING ELEMENT 10KW 220V", partNumber: "292-04165", price: 36606.77, inventoryNumber: "30006728", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006729", name: "TERMOSTATO PARA PLANCHA DE GRAVEDAD", partNumber: "", price: 250.17, inventoryNumber: "30006729", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006731", name: "SENSOR BANNER", partNumber: "Q12AB6LV", price: 6313.25, inventoryNumber: "30006731", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006732", name: "TROLLEYBAR", partNumber: "TBS430T", price: 5149.28, inventoryNumber: "30006732", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006733", name: "WORK ATTACHMENT EXTREMELY SMAL", partNumber: "182-56008", price: 84.36, inventoryNumber: "30006733", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006758", name: "SEK THROAD PLATE FOR SINGER", partNumber: "122572-6-6", price: 2728.32, inventoryNumber: "30006758", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006762", name: "CUÑA", partNumber: "0971-440063", price: 1331.41, inventoryNumber: "30006762", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006763", name: "DISC", partNumber: "0971-440360", price: 663.67, inventoryNumber: "30006763", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006764", name: "CAJA DE BALINERA", partNumber: "0971-440380", price: 3588.12, inventoryNumber: "30006764", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006766", name: "NUT", partNumber: "0971-200060", price: 1333.55, inventoryNumber: "30006766", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006767", name: "ROTARY THREAD TAKE", partNumber: "0170-110040", price: 30.53, inventoryNumber: "30006767", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006768", name: "BALIN", partNumber: "9129-020100", price: 128.54, inventoryNumber: "30006768", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006769", name: "SCREW", partNumber: "9205-102168", price: 18.32, inventoryNumber: "30006769", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006770", name: "GUIDE", partNumber: "0971-440190", price: 1450.74, inventoryNumber: "30006770", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006772", name: "PORTA CUCHILLA", partNumber: "0971-440153", price: 5980.94, inventoryNumber: "30006772", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006782", name: "SENSOR DOCK", partNumber: "165-60302", price: 3803.23, inventoryNumber: "30006782", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006783", name: "HOOK SLEEVE", partNumber: "137-29660", price: 970.18, inventoryNumber: "30006783", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006784", name: "FEED DOG", partNumber: "51405AD12", price: 1688.12, inventoryNumber: "30006784", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006786", name: "FEEDER BOWL", partNumber: "165-77009", price: 4833.99, inventoryNumber: "30006786", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006788", name: "SCREW", partNumber: "SS-4110815-SP", price: 15.89, inventoryNumber: "30006788", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006790", name: "SCREW", partNumber: "SM-4040801-SN", price: 3.71, inventoryNumber: "30006790", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006791", name: "SELECTOR PLATE", partNumber: "165-77504", price: 242.56, inventoryNumber: "30006791", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006794", name: "WASHER", partNumber: "WP-0531000-SC", price: 4.91, inventoryNumber: "30006794", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006800", name: "DJFP", partNumber: "SAB2-7", price: 58.91, inventoryNumber: "30006800", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006801", name: "DJFP", partNumber: "SAB2-104", price: 4.91, inventoryNumber: "30006801", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006804", name: "ROLLER", partNumber: "0971-440470", price: 2491.68, inventoryNumber: "30006804", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006842", name: "TENSION COMPLETA", partNumber: "400-88958", price: 127.8, inventoryNumber: "30006842", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006849", name: "MODULO DE RELAY", partNumber: "24VDC", price: 2250.0, inventoryNumber: "30006849", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006858", name: "THRUST WASHER", partNumber: "56390H", price: 53.25, inventoryNumber: "30006858", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006859", name: "PILOT RING", partNumber: "56390J", price: 50.8, inventoryNumber: "30006859", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006860", name: "THRUST BRG", partNumber: "660-665", price: 83.19, inventoryNumber: "30006860", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006861", name: "FUENTE DE VDC DE 3AMP DE SALIDA", partNumber: "12-24", price: 1808.98, inventoryNumber: "30006861", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006866", name: "PRESSER FOOT", partNumber: "118-76166", price: 551.03, inventoryNumber: "30006866", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006886", name: "KNIFE SOL ASM", partNumber: "400-04381", price: 7978.37, inventoryNumber: "30006886", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006889", name: "SCREW", partNumber: "SM-8050602-TP", price: 4.93, inventoryNumber: "30006889", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006896", name: "FD ECC ASSEMBLY", partNumber: "29476NM080", price: 2881.91, inventoryNumber: "30006896", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006897", name: "0296-000330", partNumber: "0296-000330", price: 44.95, inventoryNumber: "30006897", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006898", name: "MOTOR", partNumber: "9800-180006", price: 13887.85, inventoryNumber: "30006898", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006908", name: "SCREW", partNumber: "SS-6151220-TP", price: 18.42, inventoryNumber: "30006908", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006910", name: "SCREW", partNumber: "9205-102838", price: 18.21, inventoryNumber: "30006910", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006911", name: "SCREW", partNumber: "556-005056", price: 47.24, inventoryNumber: "30006911", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006912", name: "PIEDRA ALILAR CUCHILLA CORTAR  ENTRELELA", partNumber: "", price: 2161.05, inventoryNumber: "30006912", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006914", name: "SCREW", partNumber: "SL-4030881-SC", price: 4.93, inventoryNumber: "30006914", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006916", name: "SELENOID", partNumber: "400-86663", price: 2018.98, inventoryNumber: "30006916", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006935", name: "SCREW", partNumber: "SM-7030550-TP", price: 7.56, inventoryNumber: "30006935", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006936", name: "NEEDLE BAR", partNumber: "400-04215", price: 1323.47, inventoryNumber: "30006936", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006940", name: "BLOQUE DE VALVULAS", partNumber: "1000-540PVB", price: 16671.55, inventoryNumber: "30006940", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006942", name: "DISCO", partNumber: "9357-000070", price: 0.74, inventoryNumber: "30006942", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006943", name: "ARANDELA", partNumber: "0296-000510", price: 0.8, inventoryNumber: "30006943", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006945", name: "SENSOR INDUCTIVO 24 VDC NPN", partNumber: "", price: 875.0, inventoryNumber: "30006945", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006946", name: "SCREW", partNumber: "SM-6040650-TP", price: 4.93, inventoryNumber: "30006946", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006948", name: "PRESSER FOOT", partNumber: "0396-221123", price: 1880.59, inventoryNumber: "30006948", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006950", name: "BLOQUE DESLIZANTE", partNumber: "0296-000410", price: 1401.32, inventoryNumber: "30006950", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006953", name: "CONNECTING LINK S93", partNumber: "5600003", price: 578.99, inventoryNumber: "30006953", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006955", name: "BLADE GUIDE S93", partNumber: "5600007", price: 1452.89, inventoryNumber: "30006955", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006969", name: "SHAFT NUT", partNumber: "400-10522", price: 3.62, inventoryNumber: "30006969", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006974", name: "SCREW", partNumber: "SS-9110543-CP", price: 16.85, inventoryNumber: "30006974", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006977", name: "FACE PLACE", partNumber: "0540-100053", price: 816.74, inventoryNumber: "30006977", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006978", name: "SCREW", partNumber: "9204-201037", price: 17.4, inventoryNumber: "30006978", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006988", name: "NEEDLE BAR BUSHING", partNumber: "229-06101", price: 148.09, inventoryNumber: "30006988", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006989", name: "NEEDLE BAR BUSHING", partNumber: "229-06200", price: 161.08, inventoryNumber: "30006989", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006991", name: "NUT M8", partNumber: "NM-6080003-SC", price: 12.62, inventoryNumber: "30006991", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30006992", name: "CUSION", partNumber: "400-04384", price: 88.1, inventoryNumber: "30006992", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007008", name: "VALVULA TERMOSTATICA", partNumber: "02250087-457", price: 46036.98, inventoryNumber: "30007008", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007013", name: "SCREW", partNumber: "SM-4040655-SP", price: 4.93, inventoryNumber: "30007013", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007014", name: "MODULO DE RELAY 8 ESPACIOS", partNumber: "", price: 729.62, inventoryNumber: "30007014", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007022", name: "ARANDELA", partNumber: "0998-881060", price: 19.48, inventoryNumber: "30007022", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007023", name: "SCREW", partNumber: "0994-041488", price: 19.48, inventoryNumber: "30007023", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007027", name: "COVER CAP", partNumber: "165-68909", price: 423.14, inventoryNumber: "30007027", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007028", name: "SCREW", partNumber: "SM-8040602-TP", price: 4.93, inventoryNumber: "30007028", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007029", name: "NEEDLE BEARING", partNumber: "165-62308", price: 142.75, inventoryNumber: "30007029", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007037", name: "SENSOR BOTONERA AUTOMATICA", partNumber: "GX-F8A", price: 2150.0, inventoryNumber: "30007037", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007038", name: "SENSOR KEYENCE FS CON FIBRA OPTICA", partNumber: "N10", price: 8550.0, inventoryNumber: "30007038", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007055", name: "PINS", partNumber: "9305-001270", price: 18.26, inventoryNumber: "30007055", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007056", name: "BALL BUSH", partNumber: "0999-230229", price: 1897.81, inventoryNumber: "30007056", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007059", name: "CONNECTING ROD", partNumber: "3100301", price: 555.6, inventoryNumber: "30007059", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007060", name: "THREAD EYELET", partNumber: "3200048", price: 87.21, inventoryNumber: "30007060", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007062", name: "UPPER SHAFT JOINT", partNumber: "31000283", price: 467.82, inventoryNumber: "30007062", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007063", name: "SPREADER HOLDER", partNumber: "3100308", price: 468.06, inventoryNumber: "30007063", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007064", name: "SPREADER", partNumber: "3509320", price: 574.49, inventoryNumber: "30007064", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007065", name: "WASHER", partNumber: "110538", price: 4.19, inventoryNumber: "30007065", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007066", name: "NUT", partNumber: "110334", price: 14.29, inventoryNumber: "30007066", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007068", name: "THREAD TAKE UP", partNumber: "3200049", price: 120.99, inventoryNumber: "30007068", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007069", name: "SCREW", partNumber: "110009", price: 12.32, inventoryNumber: "30007069", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007070", name: "SCREW", partNumber: "110013", price: 4.69, inventoryNumber: "30007070", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007071", name: "SCREW", partNumber: "110004", price: 12.32, inventoryNumber: "30007071", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007072", name: "ORNAMENTAL THREAD EYELET", partNumber: "93365", price: 23.9, inventoryNumber: "30007072", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007073", name: "SCREW", partNumber: "110031", price: 12.32, inventoryNumber: "30007073", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007074", name: "SCREW", partNumber: "1101228", price: 9.63, inventoryNumber: "30007074", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007075", name: "SCREW", partNumber: "1101900", price: 19.26, inventoryNumber: "30007075", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007076", name: "SPREADER ROCKING ARM", partNumber: "63051", price: 632.7, inventoryNumber: "30007076", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007077", name: "SREADER BARR", partNumber: "63053", price: 886.76, inventoryNumber: "30007077", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007078", name: "SPREADER BAR BUSH RING", partNumber: "63056", price: 23.74, inventoryNumber: "30007078", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007079", name: "SPREADER BAR BUSH COLLAR", partNumber: "63057", price: 116.03, inventoryNumber: "30007079", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007080", name: "DRIVER ASM", partNumber: "400-11512", price: 1877.44, inventoryNumber: "30007080", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007082", name: "CROCHET LOOPERS", partNumber: "P351161010", price: 1637.99, inventoryNumber: "30007082", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007084", name: "FERRULE DISC", partNumber: "165-68404", price: 174.75, inventoryNumber: "30007084", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007086", name: "SPRING", partNumber: "165-53208", price: 347.13, inventoryNumber: "30007086", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007091", name: "PHOTO SENSOR", partNumber: "HD-00036000A", price: 926.12, inventoryNumber: "30007091", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007105", name: "PISTON FESTO", partNumber: "DSNU16X80", price: 3618.46, inventoryNumber: "30007105", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007108", name: "CAPASITOR", partNumber: "2200MF/25V", price: 45.0, inventoryNumber: "30007108", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007109", name: "CAPACITOR", partNumber: "3300MFX25V", price: 48.0, inventoryNumber: "30007109", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007119", name: "CACHER TAJIMA", partNumber: "SS-C-210", price: 358.45, inventoryNumber: "30007119", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007142", name: "LOWER LOOPERS", partNumber: "11999307", price: 469.39, inventoryNumber: "30007142", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007143", name: "LOWER LOOPERS", partNumber: "11999802", price: 709.55, inventoryNumber: "30007143", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007159", name: "CAJA DE CAMBIO LU-933", partNumber: "LU-933-J1B-ORG", price: 3480.58, inventoryNumber: "30007159", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007171", name: "CUCHILLA CIRCULAR", partNumber: "RS-50-7", price: 936.99, inventoryNumber: "30007171", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007173", name: "PRESSER SPRING REGURATOR ASM", partNumber: "400-37359", price: 46.8, inventoryNumber: "30007173", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007183", name: "TRANSISTOR REGULADOR", partNumber: "LM7812", price: 105.0, inventoryNumber: "30007183", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007193", name: "ADJUSTING SCREW", partNumber: "229-07505/229-07554", price: 39.73, inventoryNumber: "30007193", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007194", name: "RUBBER SHEET", partNumber: "2405860", price: 234.0, inventoryNumber: "30007194", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007199", name: "MOTOR JACK TRIFASICO", partNumber: "", price: 3373.26, inventoryNumber: "30007199", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007272", name: "HEXAGONAL NUT", partNumber: "9231-000387", price: 17.4, inventoryNumber: "30007272", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007273", name: "WASHER", partNumber: "9330-900117", price: 17.4, inventoryNumber: "30007273", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007274", name: "UNDER LOOPER", partNumber: "S20626001", price: 773.61, inventoryNumber: "30007274", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007275", name: "BOQUILLA PARA PISTOLA DE CALOR", partNumber: "", price: 1565.22, inventoryNumber: "30007275", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007276", name: "CHAIN STITCH LOOPER", partNumber: "S20653001", price: 453.59, inventoryNumber: "30007276", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007277", name: "PLTR SPARE MP FEEDER", partNumber: "694500566", price: 11276.06, inventoryNumber: "30007277", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007279", name: "THREAD TRIMMER KNIFE", partNumber: "401-84951", price: 498.8, inventoryNumber: "30007279", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007281", name: "VALVE REACTOR", partNumber: "9710-920016", price: 446.76, inventoryNumber: "30007281", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007283", name: "DRIVE", partNumber: "QK230121C", price: 1595.0, inventoryNumber: "30007283", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007284", name: "SPING UPPER", partNumber: "QK230460", price: 600.0, inventoryNumber: "30007284", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007286", name: "HIGH WATER LEVEL", partNumber: "292-MBJ-37/292RBPH", price: 5440.47, inventoryNumber: "30007286", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007287", name: "ELECTRODO", partNumber: "423-651-013-0-", price: 2878.86, inventoryNumber: "30007287", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007291", name: "PEDAL SENSOR BASE", partNumber: "400-42130", price: 78.47, inventoryNumber: "30007291", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007301", name: "SCREW", partNumber: "SM-5041055-SN", price: 12.25, inventoryNumber: "30007301", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007304", name: "TENSION ADJUSTINN SCREW", partNumber: "101-10609", price: 68.97, inventoryNumber: "30007304", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007305", name: "TENSION SPRING SCREW", partNumber: "101-10500", price: 19.67, inventoryNumber: "30007305", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007306", name: "HEXAGONAL BOLT", partNumber: "SM-9040700-SP", price: 12.23, inventoryNumber: "30007306", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007308", name: "TIMING BELT", partNumber: "9130-202190", price: 375.7, inventoryNumber: "30007308", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007313", name: "PULLEY", partNumber: "151930-3-01", price: 1971.91, inventoryNumber: "30007313", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007314", name: "OVER LOOPER", partNumber: "S20428-001", price: 948.16, inventoryNumber: "30007314", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007316", name: "NEEDLE PLATE-5", partNumber: "S19185-001", price: 1998.7, inventoryNumber: "30007316", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007317", name: "PRESSER FOOT ASEMBLY", partNumber: "S19334-001", price: 3792.88, inventoryNumber: "30007317", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007329", name: "FEED DOG", partNumber: "118-8400", price: 180.17, inventoryNumber: "30007329", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007330", name: "FEED DOG", partNumber: "121-73308", price: 202.98, inventoryNumber: "30007330", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007337", name: "DUST COVER", partNumber: "0170-150270", price: 133.33, inventoryNumber: "30007337", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007338", name: "GASKET", partNumber: "0171-150290", price: 297.64, inventoryNumber: "30007338", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007339", name: "RING", partNumber: "0998-863460", price: 160.6, inventoryNumber: "30007339", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007340", name: "SEALING RING", partNumber: "0998-850810", price: 694.72, inventoryNumber: "30007340", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007341", name: "CONNECTING ROD", partNumber: "165-50204", price: 229.33, inventoryNumber: "30007341", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007347", name: "FIXED KNIFE", partNumber: "MAT03505000", price: 1849.81, inventoryNumber: "30007347", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007348", name: "MOVING KNIFE", partNumber: "MAT03506000", price: 936.52, inventoryNumber: "30007348", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007349", name: "E-RING 3", partNumber: "RE0300000K0", price: 4.74, inventoryNumber: "30007349", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007350", name: "WASHER", partNumber: "WP-0450000SD", price: 23.26, inventoryNumber: "30007350", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007351", name: "SPRING", partNumber: "MAT03509000", price: 22.53, inventoryNumber: "30007351", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007352", name: "KNIFE DRIVING RINK PIECE", partNumber: "MAT03510000", price: 51.46, inventoryNumber: "30007352", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007353", name: "SCREW", partNumber: "SS-8080610-SP", price: 8.3, inventoryNumber: "30007353", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007354", name: "SCREW", partNumber: "SS-1060610-SP", price: 8.3, inventoryNumber: "30007354", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007356", name: "POWER CAM STOPPER", partNumber: "151941-301", price: 161.98, inventoryNumber: "30007356", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007358", name: "AGUJAS 130/705 H WING", partNumber: "A100", price: 471.46, inventoryNumber: "30007358", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007359", name: "POWER CAM STOPPER A", partNumber: "151940-001", price: 1049.41, inventoryNumber: "30007359", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007366", name: "LOOPER", partNumber: "204431", price: 477.3, inventoryNumber: "30007366", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007383", name: "HANDLING DEVICE KNIFE", partNumber: "401-72487", price: 409.84, inventoryNumber: "30007383", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007385", name: "THREAD TRIMMER KNIFE", partNumber: "401-72486", price: 144.16, inventoryNumber: "30007385", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007390", name: "DC MOTOR", partNumber: "GBR-108590A0", price: 3602.46, inventoryNumber: "30007390", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007391", name: "LOCK SHAFT", partNumber: "182-13504", price: 106.52, inventoryNumber: "30007391", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007392", name: "PRENSATELA DE POLICARBONATO", partNumber: "39520L-18G9N", price: 4688.35, inventoryNumber: "30007392", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007397", name: "NEEDLE BAR BOBBIN THREAD GUIDE", partNumber: "137-06403", price: 239.72, inventoryNumber: "30007397", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007401", name: "MAGNET", partNumber: "0999-201517", price: 2833.41, inventoryNumber: "30007401", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007402", name: "SHOULDER SCDREW", partNumber: "SD-0400506-TP", price: 138.06, inventoryNumber: "30007402", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007403", name: "SQUARE BLOCK", partNumber: "400-06315", price: 246.0, inventoryNumber: "30007403", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007409", name: "INTERRUPTOR BIPOLAR DE", partNumber: "10AMP", price: 100.0, inventoryNumber: "30007409", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007413", name: "VALVULA NEOMATICA OJAL INDEXER", partNumber: "", price: 1790.0, inventoryNumber: "30007413", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007415", name: "ELECTROVALVULA SMS", partNumber: "SYJ3343-5", price: 3679.0, inventoryNumber: "30007415", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007428", name: "LOOPER", partNumber: "19-433", price: 210.2, inventoryNumber: "30007428", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007430", name: "MOUSE PARA GERBER", partNumber: "", price: 43184.17, inventoryNumber: "30007430", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007431", name: "DISC", partNumber: "0053-000350", price: 18.33, inventoryNumber: "30007431", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007432", name: "RETAINER RING", partNumber: "9352-000080", price: 16.34, inventoryNumber: "30007432", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007434", name: "WHASHER 8", partNumber: "025080232", price: 5.79, inventoryNumber: "30007434", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007435", name: "NUT", partNumber: "150553002", price: 13.98, inventoryNumber: "30007435", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007436", name: "MOTOR", partNumber: "G007575", price: 6714.12, inventoryNumber: "30007436", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007444", name: "PULLEY ASSEMBLY", partNumber: "416121", price: 4841.7, inventoryNumber: "30007444", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007445", name: "LOOPERS", partNumber: "KM203-K", price: 444.78, inventoryNumber: "30007445", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007447", name: "SHOULDER SCREW", partNumber: "0992-123100", price: 215.45, inventoryNumber: "30007447", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007448", name: "OIL TUBE CLAPM", partNumber: "51294P", price: 244.64, inventoryNumber: "30007448", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007449", name: "OIL FELT", partNumber: "666-214", price: 38.95, inventoryNumber: "30007449", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007450", name: "COLLAR", partNumber: "21212", price: 43.14, inventoryNumber: "30007450", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007451", name: "FELT DISC", partNumber: "666-209", price: 44.35, inventoryNumber: "30007451", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007452", name: "FELT PLUG", partNumber: "666-201", price: 29.89, inventoryNumber: "30007452", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007464", name: "PLATE ORANGE 3MM", partNumber: "0805-410840", price: 634.99, inventoryNumber: "30007464", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007465", name: "HOOK", partNumber: "0271-150124", price: 2156.98, inventoryNumber: "30007465", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007467", name: "BOBBIN", partNumber: "0204-000230A", price: 31.53, inventoryNumber: "30007467", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007469", name: "THREAD PIN", partNumber: "9205-103948", price: 42.69, inventoryNumber: "30007469", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007470", name: "SCREW", partNumber: "9203-312411", price: 16.74, inventoryNumber: "30007470", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007486", name: "PRESSER FOOT", partNumber: "161782NS-3/16", price: 8476.49, inventoryNumber: "30007486", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007502", name: "CIRCUITO INTEGRADO", partNumber: "MIC5800", price: 455.0, inventoryNumber: "30007502", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007506", name: "CYLINDER DOUBLE", partNumber: "9700-212011", price: 5341.1, inventoryNumber: "30007506", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007507", name: "CYLINDER DOUBLE", partNumber: "9700-212008", price: 4818.35, inventoryNumber: "30007507", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007509", name: "VALVE", partNumber: "9710-044010", price: 969.07, inventoryNumber: "30007509", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007510", name: "NEEDLE BAR", partNumber: "0271-120104", price: 1642.54, inventoryNumber: "30007510", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007511", name: "NEEDLE BAR BUSHING", partNumber: "0211-000376", price: 532.47, inventoryNumber: "30007511", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007512", name: "NEEDLE BAR BUSHING", partNumber: "0211-000381", price: 216.72, inventoryNumber: "30007512", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007513", name: "TRIMING BELT", partNumber: "0806-402760", price: 15355.7, inventoryNumber: "30007513", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007514", name: "CYLINDER DOUBLE", partNumber: "0999-220824", price: 3620.48, inventoryNumber: "30007514", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007515", name: "BALL PIVOT", partNumber: "0806-401730", price: 1537.94, inventoryNumber: "30007515", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007516", name: "PRESSER SPRING", partNumber: "0806-402630", price: 192.7, inventoryNumber: "30007516", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007517", name: "FLANGE BUSH", partNumber: "0806-401740", price: 1116.14, inventoryNumber: "30007517", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007518", name: "SPRING RING", partNumber: "9357-200109", price: 26.45, inventoryNumber: "30007518", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007519", name: "PCB", partNumber: "9850-806002", price: 17821.84, inventoryNumber: "30007519", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007521", name: "SWITCH MAGNET", partNumber: "9815-555001", price: 1901.98, inventoryNumber: "30007521", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007522", name: "EXTRACTOR DE AIRE", partNumber: "1000-124BFAN4.5", price: 321.81, inventoryNumber: "30007522", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007524", name: "PULLER FOR UNION SPECIAL 56300", partNumber: "PL-S1-US5", price: 20767.11, inventoryNumber: "30007524", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007526", name: "SENSOR", partNumber: "1000-971", price: 8695.98, inventoryNumber: "30007526", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007529", name: "PLATE", partNumber: "129-23405", price: 3428.44, inventoryNumber: "30007529", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007530", name: "FEED DOG", partNumber: "129-32307", price: 2080.81, inventoryNumber: "30007530", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007531", name: "PRESSER FOOT", partNumber: "129-27752", price: 4320.0, inventoryNumber: "30007531", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007532", name: "NEEDLE CLAMP", partNumber: "129-25954", price: 1460.24, inventoryNumber: "30007532", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007540", name: "NEEBLE PROTECT", partNumber: "0971-150113", price: 4064.16, inventoryNumber: "30007540", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007541", name: "PADDLE", partNumber: "G010644", price: 1364.36, inventoryNumber: "30007541", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007561", name: "PRESSER FOOT 1/8", partNumber: "17-478-1", price: 1419.12, inventoryNumber: "30007561", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007562", name: "FEED DOG", partNumber: "15-480", price: 1655.66, inventoryNumber: "30007562", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007563", name: "NEEDLE PLATE", partNumber: "14-480", price: 3010.3, inventoryNumber: "30007563", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007564", name: "SPREDER HOLDER 1/8", partNumber: "18-480", price: 863.12, inventoryNumber: "30007564", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007565", name: "LOOPER HOLDER", partNumber: "19-414", price: 1258.92, inventoryNumber: "30007565", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007568", name: "AMORTIGUADOR", partNumber: "AC2525", price: 1250.0, inventoryNumber: "30007568", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007569", name: "SCREW", partNumber: "SS-5820540-SP", price: 39.89, inventoryNumber: "30007569", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007570", name: "DIFF FEED DOG", partNumber: "2104920", price: 1151.11, inventoryNumber: "30007570", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007571", name: "MAIN FEED DOG", partNumber: "2105790", price: 1302.74, inventoryNumber: "30007571", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007575", name: "SE42 VARIABLE SPEED PULLER CW", partNumber: "SE42", price: 29212.32, inventoryNumber: "30007575", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007576", name: "SCREW", partNumber: "SM-6030802-TP", price: 5.88, inventoryNumber: "30007576", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007577", name: "SENSOR PLATE", partNumber: "400-04386", price: 257.39, inventoryNumber: "30007577", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007578", name: "SCREW", partNumber: "SL-4031091-SC", price: 4.16, inventoryNumber: "30007578", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007579", name: "COLLAR", partNumber: "139-26308", price: 153.85, inventoryNumber: "30007579", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007580", name: "SLIDE ROLLER", partNumber: "400-19551", price: 161.39, inventoryNumber: "30007580", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007581", name: "PBL ROLLER SHAFT", partNumber: "400-04286", price: 315.73, inventoryNumber: "30007581", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007582", name: "MOSFET", partNumber: "J20A10M", price: 300.0, inventoryNumber: "30007582", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007583", name: "MOSFET", partNumber: "K3148", price: 300.0, inventoryNumber: "30007583", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007585", name: "RESISTENCIA", partNumber: "Q-F472K", price: 350.0, inventoryNumber: "30007585", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007587", name: "PLUG", partNumber: "ERS-53P", price: 797.12, inventoryNumber: "30007587", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007588", name: "FIXED KNIFE", partNumber: "BYL-LU1711", price: 156.15, inventoryNumber: "30007588", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007589", name: "THREAD PARTING PLATE", partNumber: "BYL-LU1264", price: 136.81, inventoryNumber: "30007589", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007590", name: "KNIFE", partNumber: "BYL-LU1701D", price: 381.85, inventoryNumber: "30007590", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007592", name: "FEED DOG", partNumber: "BYL-D1701", price: 50.09, inventoryNumber: "30007592", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007601", name: "SLIDING SQUARE", partNumber: "0170-110310", price: 904.21, inventoryNumber: "30007601", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007602", name: "KNIFE CARRIER", partNumber: "0971-440163", price: 2359.84, inventoryNumber: "30007602", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007603", name: "CLAMPING BLOCK", partNumber: "0971-440210", price: 1492.34, inventoryNumber: "30007603", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007604", name: "SHOULDER BOLT", partNumber: "0973-401350", price: 1142.68, inventoryNumber: "30007604", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007605", name: "OIL RESEVOIR TOP", partNumber: "56382H", price: 30.62, inventoryNumber: "30007605", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007614", name: "LOOPER", partNumber: "LP227-K", price: 244.68, inventoryNumber: "30007614", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007615", name: "COVER SHEET", partNumber: "0971-140220", price: 1093.74, inventoryNumber: "30007615", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007616", name: "SUNK SCREW", partNumber: "9203-313052", price: 17.75, inventoryNumber: "30007616", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007617", name: "REGULATING BOW", partNumber: "0370-110060", price: 417.09, inventoryNumber: "30007617", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007618", name: "SCREW", partNumber: "0992-000327", price: 29.33, inventoryNumber: "30007618", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007620", name: "CLAMPING DISC", partNumber: "0370-110070", price: 364.33, inventoryNumber: "30007620", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007621", name: "TENSION WASHER", partNumber: "0081-001180", price: 617.0, inventoryNumber: "30007621", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007622", name: "COURTRSUNK SCREW", partNumber: "0992-007137", price: 113.15, inventoryNumber: "30007622", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007623", name: "DISC", partNumber: "0894-450348", price: 17.78, inventoryNumber: "30007623", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007625", name: "PIN", partNumber: "0995-190138", price: 17.75, inventoryNumber: "30007625", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007627", name: "TENSION PLATE", partNumber: "0170-110014", price: 1929.64, inventoryNumber: "30007627", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007628", name: "EPROM BROTHER EP ROM", partNumber: "KE434C", price: 4899.34, inventoryNumber: "30007628", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007640", name: "PRESSER FOOT 3MM", partNumber: "208508", price: 306.2, inventoryNumber: "30007640", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007654", name: "SCREW M6", partNumber: "SM-6062002-TP", price: 8.54, inventoryNumber: "30007654", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007656", name: "SMALL CLAMP JAW LEVER ASM", partNumber: "MAZ155080B0", price: 2671.46, inventoryNumber: "30007656", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007657", name: "SMALL CLAMP JAW LEVER ASM", partNumber: "MAZ155070B0", price: 2671.03, inventoryNumber: "30007657", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007660", name: "LINK", partNumber: "G010641", price: 375.0, inventoryNumber: "30007660", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007664", name: "BANDA DE MOVIMIENTO", partNumber: "400-04199", price: 950.43, inventoryNumber: "30007664", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007684", name: "SERVO MOTOR GERBER", partNumber: "SGMAV-02A3A61", price: 44643.94, inventoryNumber: "30007684", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007694", name: "MOSFET", partNumber: "BUZ73A-H1-15", price: 130.0, inventoryNumber: "30007694", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007697", name: "MOSFET", partNumber: "BUZ73A-H0-14", price: 130.0, inventoryNumber: "30007697", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007698", name: "MOSFET", partNumber: "BUZ73A-H1-23", price: 130.0, inventoryNumber: "30007698", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007699", name: "MOSFET", partNumber: "BUZ73A-H1-23", price: 130.0, inventoryNumber: "30007699", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007700", name: "MOSFET", partNumber: "BUZ73A-V951", price: 130.0, inventoryNumber: "30007700", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007701", name: "MOSFET", partNumber: "35100", price: 130.0, inventoryNumber: "30007701", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007703", name: "THREAD TRIMMER SOLENOID ASM", partNumber: "401-06930", price: 1146.73, inventoryNumber: "30007703", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007704", name: "CILINDRO", partNumber: "314-D", price: 2389.64, inventoryNumber: "30007704", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007706", name: "VALVULA CLIPPARD", partNumber: "MTV-4", price: 829.9, inventoryNumber: "30007706", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007713", name: "RULER STOP SEAT", partNumber: "229-02605", price: 34.16, inventoryNumber: "30007713", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007715", name: "BOLT, STUD", partNumber: "0170-110140", price: 1231.47, inventoryNumber: "30007715", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007716", name: "GUIDE ROLLER", partNumber: "0971-430080", price: 475.92, inventoryNumber: "30007716", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007717", name: "CYLINDER DOUBLE", partNumber: "9700-231015", price: 2984.19, inventoryNumber: "30007717", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007718", name: "REDUCING NIPPLE", partNumber: "9792-001030", price: 89.94, inventoryNumber: "30007718", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007722", name: "FEED ADJUSTING SPRING", partNumber: "400-86737", price: 30.5, inventoryNumber: "30007722", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007732", name: "MOTOR ALTO TORQUE 12V", partNumber: "25RPM", price: 588.0, inventoryNumber: "30007732", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007766", name: "TRANSISTOR", partNumber: "C3496", price: 275.0, inventoryNumber: "30007766", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007768", name: "REGULADOR", partNumber: "AN78M18", price: 350.0, inventoryNumber: "30007768", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007769", name: "CIRCUITO INTEGRADO", partNumber: "74LS08-CI", price: 300.0, inventoryNumber: "30007769", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007770", name: "COMPARADOR", partNumber: "393-CI", price: 300.0, inventoryNumber: "30007770", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007771", name: "CIRCUITO INTEGRADO", partNumber: "74LS44-CI", price: 300.0, inventoryNumber: "30007771", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007772", name: "CIRCUITO INTEGRADO", partNumber: "74LS138-CI", price: 300.0, inventoryNumber: "30007772", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007773", name: "CIRCUITO INTEGRADO", partNumber: "74LS06-CI", price: 300.0, inventoryNumber: "30007773", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007774", name: "CIRCUITO INTEGRADO", partNumber: "74LS07-CI", price: 300.0, inventoryNumber: "30007774", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007775", name: "CIRCUITO INTEGRADO", partNumber: "SSC95275-CI", price: 325.0, inventoryNumber: "30007775", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007776", name: "NEEDLE LEVER CONNECTING ROD FRONT", partNumber: "56316", price: 1579.13, inventoryNumber: "30007776", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007777", name: "NUT", partNumber: "51216P", price: 119.39, inventoryNumber: "30007777", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007780", name: "SELENID UNIT", partNumber: "110-43353", price: 1480.43, inventoryNumber: "30007780", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007783", name: "CAPACITOR", partNumber: "1200MF/250V", price: 378.0, inventoryNumber: "30007783", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007784", name: "CAPACITOR", partNumber: "4700MF/100V", price: 400.0, inventoryNumber: "30007784", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007785", name: "CAPACITOR", partNumber: "1800MF/50V", price: 208.0, inventoryNumber: "30007785", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007790", name: "VALVE 4-WAY MAV-4D", partNumber: "V00350-0029", price: 1074.98, inventoryNumber: "30007790", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007791", name: "NUT", partNumber: "43266", price: 111.6, inventoryNumber: "30007791", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007792", name: "GUIDE", partNumber: "51491C", price: 94.02, inventoryNumber: "30007792", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007793", name: "TENSION POST", partNumber: "56392E", price: 188.28, inventoryNumber: "30007793", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007794", name: "TENSION DISC", partNumber: "109", price: 50.3, inventoryNumber: "30007794", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007795", name: "THREAD TENSION SPRING", partNumber: "56392F", price: 250.61, inventoryNumber: "30007795", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007796", name: "TEN NUT BEIGE", partNumber: "39592Z", price: 130.89, inventoryNumber: "30007796", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007797", name: "SCREW", partNumber: "22598C", price: 179.97, inventoryNumber: "30007797", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007798", name: "WASHER", partNumber: "80557", price: 39.8, inventoryNumber: "30007798", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007806", name: "PRESSER FOOT 5/16 TELA PESADA", partNumber: "STH-316L", price: 3668.73, inventoryNumber: "30007806", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007818", name: "SHOE/ZAPATA", partNumber: "257-020-060-0", price: 674.09, inventoryNumber: "30007818", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007819", name: "BASE", partNumber: "141-46302", price: 812.99, inventoryNumber: "30007819", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007820", name: "BASE PRESSER PLATE", partNumber: "141-90300", price: 211.28, inventoryNumber: "30007820", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007821", name: "BUTTON GUIDE FOOT", partNumber: "MAZ-16522000", price: 1277.02, inventoryNumber: "30007821", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007822", name: "CLAMP PELEASE LINK ASM", partNumber: "MAZ-088270A0", price: 1302.91, inventoryNumber: "30007822", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007823", name: "E-RING 7", partNumber: "RE-0700000-K0", price: 6.37, inventoryNumber: "30007823", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007830", name: "SCREW 3/16-32 L=13.5", partNumber: "SS-9621413-SP", price: 16.87, inventoryNumber: "30007830", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007831", name: "WASHER 5X10.5X1", partNumber: "WP-0501016-SD", price: 5.13, inventoryNumber: "30007831", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007835", name: "BEARING", partNumber: "0971-440350", price: 2703.2, inventoryNumber: "30007835", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007836", name: "OIL WICK", partNumber: "0296-310950", price: 72.64, inventoryNumber: "30007836", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007837", name: "ELEMENT", partNumber: "GBR-10793000", price: 9198.62, inventoryNumber: "30007837", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007838", name: "THOROAD PLATE", partNumber: "0396-200830", price: 2041.54, inventoryNumber: "30007838", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007841", name: "BELT", partNumber: "G007476", price: 1121.86, inventoryNumber: "30007841", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007845", name: "CARTONCILLO", partNumber: "C-80", price: 94.0, inventoryNumber: "30007845", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007846", name: "LINK", partNumber: "LU253", price: 49.52, inventoryNumber: "30007846", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007847", name: "THREAD TENSION ASM.", partNumber: "236-26054", price: 134.04, inventoryNumber: "30007847", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007859", name: "POTENCIOMETRO 5K", partNumber: "", price: 517.5, inventoryNumber: "30007859", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007862", name: "FOOT/US56900", partNumber: "56920R-9-GEN", price: 6186.2, inventoryNumber: "30007862", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007868", name: "BASE MOVIMIENTO SIGSAG", partNumber: "400-04209", price: 823.59, inventoryNumber: "30007868", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007888", name: "SET DE TEMPLE PARA PEGAR BOLSA", partNumber: "", price: 1851.09, inventoryNumber: "30007888", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007904", name: "BUTTON A", partNumber: "B-2401-373-0B0", price: 3088.07, inventoryNumber: "30007904", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007906", name: "BUTTON FOOT", partNumber: "B-2447-372-0A0", price: 482.5, inventoryNumber: "30007906", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007911", name: "HOOK HOUSING", partNumber: "55-0371-150314", price: 99255.77, inventoryNumber: "30007911", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007918", name: "BUSHING", partNumber: "B-1402-019-000", price: 309.11, inventoryNumber: "30007918", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007920", name: "NEEDLE BAR", partNumber: "B-1401-019-000", price: 304.74, inventoryNumber: "30007920", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007921", name: "RUBBER RING", partNumber: "RO-0922702-00", price: 8.6, inventoryNumber: "30007921", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007922", name: "COMPUTER WE6 UW50 P/2/3/4", partNumber: "F37054-OOP", price: 49421.98, inventoryNumber: "30007922", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007924", name: "VALVE", partNumber: "A-CR3-211", price: 22375.22, inventoryNumber: "30007924", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007927", name: "BUTTON CLAP", partNumber: "MAZ-166070BO", price: 1824.34, inventoryNumber: "30007927", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007950", name: "THROAT PLATE TRIMS", partNumber: "400-25503", price: 2043.08, inventoryNumber: "30007950", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007951", name: "NEEDLE CLAM ASM 1", partNumber: "101-48955", price: 1257.87, inventoryNumber: "30007951", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007953", name: "PRESSER FOOT ASM", partNumber: "226-41757", price: 1624.53, inventoryNumber: "30007953", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007954", name: "ASSY SLIDE PLATE 1 C", partNumber: "400-25249", price: 148.53, inventoryNumber: "30007954", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007955", name: "ASSY SLIDE PLATE R C", partNumber: "400-25239", price: 131.56, inventoryNumber: "30007955", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007958", name: "SCREW", partNumber: "SM-6051402-TP", price: 4.79, inventoryNumber: "30007958", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007963", name: "CLAMPING RING", partNumber: "0971-440250", price: 2682.85, inventoryNumber: "30007963", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007964", name: "SCREW", partNumber: "9202-002377", price: 17.75, inventoryNumber: "30007964", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007982", name: "CLIPS", partNumber: "165-71903", price: 112.15, inventoryNumber: "30007982", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007983", name: "SPRING", partNumber: "34C10-57", price: 216.42, inventoryNumber: "30007983", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007984", name: "PRESSER FOOT", partNumber: "P778-L", price: 2957.82, inventoryNumber: "30007984", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007994", name: "SCREW", partNumber: "151283", price: 43.38, inventoryNumber: "30007994", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007995", name: "AGUJA 110/18", partNumber: "UY108", price: 2088.58, inventoryNumber: "30007995", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008019", name: "PLATE", partNumber: "101-33304", price: 1730.11, inventoryNumber: "30008019", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008038", name: "NEEDLE CLAMP 3/8", partNumber: "B1406-038-KA0", price: 2763.59, inventoryNumber: "30008038", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008040", name: "REAR MOVING NEEDLE GUARD", partNumber: "B2311-380-H00", price: 1548.76, inventoryNumber: "30008040", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008047", name: "PRESSER FOOT 3/8", partNumber: "P37", price: 3576.96, inventoryNumber: "30008047", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008048", name: "TIMER MANUAL", partNumber: "MA-T51-WH", price: 19877.87, inventoryNumber: "30008048", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008049", name: "NFM-N TEFLON PLATED NEEDLE PLATE", partNumber: "", price: 1023.75, inventoryNumber: "30008049", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008053", name: "BELT", partNumber: "564715", price: 1679.0, inventoryNumber: "30008053", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008080", name: "KNIFE BAR DRIVING", partNumber: "400-04219", price: 566.01, inventoryNumber: "30008080", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008089", name: "TENSION SPRING", partNumber: "226-12402", price: 84.72, inventoryNumber: "30008089", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008090", name: "OIL SEAL", partNumber: "236-20206", price: 58.0, inventoryNumber: "30008090", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008101", name: "LOOPERS", partNumber: "129-41407", price: 1199.45, inventoryNumber: "30008101", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008102", name: "LIANA DE BOBINA BOTONERA", partNumber: "NBL101", price: 13.57, inventoryNumber: "30008102", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008104", name: "SINGLE NEEDLE SHIRT YOKE", partNumber: "F213-SET", price: 4246.61, inventoryNumber: "30008104", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008107", name: "ADJUSTABLE GUIDE", partNumber: "P784", price: 5678.61, inventoryNumber: "30008107", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008109", name: "COLLAR ATTACHMENT PRESSER FOOT", partNumber: "P786", price: 4197.23, inventoryNumber: "30008109", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008110", name: "PRESSER FOOT FOR COLLAR BAND", partNumber: "P787-5", price: 2320.82, inventoryNumber: "30008110", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008111", name: "FLEXIBLE GUIDE", partNumber: "A646", price: 3774.84, inventoryNumber: "30008111", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008112", name: "A647-1 +", partNumber: "AAFT018-1-SET", price: 10493.08, inventoryNumber: "30008112", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008117", name: "SHUTER PLATE ASM", partNumber: "165-67166", price: 2057.44, inventoryNumber: "30008117", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008123", name: "KIT SHARPENER TOOLS", partNumber: "820C2", price: 2433.31, inventoryNumber: "30008123", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008124", name: "INSTALLING SHAFT", partNumber: "141-41402", price: 46.63, inventoryNumber: "30008124", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008127", name: "BUTTON CLAMP SPRING", partNumber: "B2561-372-000", price: 51.67, inventoryNumber: "30008127", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008128", name: "HINGR SCREW", partNumber: "SD-0550303-TP", price: 144.44, inventoryNumber: "30008128", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008129", name: "SCREW 9/64", partNumber: "SS-7091480-SP", price: 25.23, inventoryNumber: "30008129", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008133", name: "HOOK", partNumber: "182-27603", price: 943.35, inventoryNumber: "30008133", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008143", name: "SCREW", partNumber: "SM-6041202-TP", price: 6.42, inventoryNumber: "30008143", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008144", name: "HOLDER BRACKET", partNumber: "GBR-25004000", price: 553.02, inventoryNumber: "30008144", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008158", name: "RUBBER ORING", partNumber: "236-36301", price: 23.52, inventoryNumber: "30008158", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008166", name: "ASTAS SHIRT BOTTOM HEMMING SIZE", partNumber: "P1022-8", price: 61897.0, inventoryNumber: "30008166", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008177", name: "CONTROL UNIT B-C DRIVE CONT", partNumber: "22-550-00-30", price: 18654.15, inventoryNumber: "30008177", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008179", name: "JAC PLASTIC WHEEL", partNumber: "808104", price: 3162.28, inventoryNumber: "30008179", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008187", name: "PISTON NCMC", partNumber: "106-1200C", price: 2153.99, inventoryNumber: "30008187", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008191", name: "CIRCUIT WERKES HIBRID/AUTO COUPLER", partNumber: "", price: 26150.49, inventoryNumber: "30008191", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008198", name: "PICK-UP INSTALLING BASE", partNumber: "141-46104", price: 830.74, inventoryNumber: "30008198", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008200", name: "HINGE PLATE", partNumber: "139520", price: 692.98, inventoryNumber: "30008200", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008201", name: "LOOPERS INFERIOR", partNumber: "KL-202-K-SIR", price: 344.56, inventoryNumber: "30008201", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008202", name: "SCREW", partNumber: "SK241-SIR", price: 8.77, inventoryNumber: "30008202", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008203", name: "SCREW", partNumber: "SK230-SIR", price: 8.77, inventoryNumber: "30008203", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008205", name: "SCREW", partNumber: "SK229-SIR", price: 8.77, inventoryNumber: "30008205", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008206", name: "CAST-OFF WIRE", partNumber: "B2218-481-000", price: 103.99, inventoryNumber: "30008206", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008208", name: "BOBINA JACK DOBLE AGUJA", partNumber: "58420J", price: 458.04, inventoryNumber: "30008208", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008217", name: "BALL BEARING", partNumber: "9120-030084", price: 826.82, inventoryNumber: "30008217", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008219", name: "PRESSER FOOT", partNumber: "P609-A", price: 8165.23, inventoryNumber: "30008219", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008220", name: "THREAD GUIDE COMB", partNumber: "KN201-A", price: 169.09, inventoryNumber: "30008220", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008221", name: "NEEDLE PLATE", partNumber: "E5364KM", price: 422.48, inventoryNumber: "30008221", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008222", name: "FEED DOG", partNumber: "H356KA-E", price: 693.43, inventoryNumber: "30008222", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008224", name: "SCREW", partNumber: "SK257", price: 2.99, inventoryNumber: "30008224", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008236", name: "OIL TANK", partNumber: "400-86749", price: 631.97, inventoryNumber: "30008236", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008237", name: "OIL EXIT CAP", partNumber: "400-13595", price: 10.45, inventoryNumber: "30008237", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008239", name: "PINS", partNumber: "G10643", price: 1128.49, inventoryNumber: "30008239", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008241", name: "CUTTING BLOCK", partNumber: "0578-003244", price: 1602.4, inventoryNumber: "30008241", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008248", name: "PRESSER FOOT DE 3/8", partNumber: "B1509-038-KB0", price: 2306.24, inventoryNumber: "30008248", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008249", name: "CAM COVER ASM", partNumber: "B1108-380-HA0", price: 437.59, inventoryNumber: "30008249", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008251", name: "HEATING ELEMENT SHORT", partNumber: "423-656-004-0", price: 6325.56, inventoryNumber: "30008251", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008254", name: "RADIAL BALL BEARING", partNumber: "SB-1080004-00", price: 100.28, inventoryNumber: "30008254", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008257", name: "RODO REENCAUCHADO PARA FUSIONADORA", partNumber: "4536", price: 19076.85, inventoryNumber: "30008257", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008258", name: "BASS BARB FITTING 1/8", partNumber: "11752-4", price: 285.71, inventoryNumber: "30008258", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008259", name: "BRASS TUBE FITTING 1/4", partNumber: "AAF-40", price: 77.92, inventoryNumber: "30008259", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008260", name: "CLIPPAR AIR PILOT ACTUADOR", partNumber: "MPA-3", price: 310.56, inventoryNumber: "30008260", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008264", name: "FIXED", partNumber: "KS201", price: 339.83, inventoryNumber: "30008264", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008268", name: "THREAD TAKE UP ASM", partNumber: "400-04178", price: 4868.11, inventoryNumber: "30008268", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008269", name: "NEEDLE GUARD", partNumber: "B2311-382-000", price: 1332.65, inventoryNumber: "30008269", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008270", name: "NUT", partNumber: "NM-6020001-CP", price: 4.44, inventoryNumber: "30008270", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008273", name: "NEEDLE BAR CONNECTION ASM", partNumber: "B1411-481-0A0", price: 387.68, inventoryNumber: "30008273", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008276", name: "THREAD TAKE UP ASM", partNumber: "400-80072", price: 4894.9, inventoryNumber: "30008276", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008277", name: "NDL CRANK SHAFT", partNumber: "400-83369", price: 597.39, inventoryNumber: "30008277", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008278", name: "MODULO SD 4 MEDI MONOFASICO", partNumber: "", price: 2400.0, inventoryNumber: "30008278", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008281", name: "SCREW", partNumber: "87-017", price: 50.11, inventoryNumber: "30008281", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008282", name: "ROLLER SHAFT", partNumber: "400-86748", price: 78.17, inventoryNumber: "30008282", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008290", name: "KIT DE SELLO SULLAIR", partNumber: "LS-60", price: 30982.5, inventoryNumber: "30008290", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008299", name: "FIXING KNIFE", partNumber: "139-34708", price: 179.67, inventoryNumber: "30008299", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008300", name: "DRIVING KNIFE", partNumber: "139-34500", price: 274.85, inventoryNumber: "30008300", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008301", name: "BOBBIN THREAD PULLER", partNumber: "139-34807", price: 175.89, inventoryNumber: "30008301", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008302", name: "BOBBN THREAD GUIDE", partNumber: "139-34609", price: 196.22, inventoryNumber: "30008302", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008304", name: "AIR CYLINDER", partNumber: "G005301", price: 1745.91, inventoryNumber: "30008304", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008313", name: "THREAD TAKE-UP", partNumber: "B1901-481-000-A", price: 154.28, inventoryNumber: "30008313", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008314", name: "THREAD TAKE-UP", partNumber: "125-12025", price: 104.08, inventoryNumber: "30008314", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008316", name: "SCISSORS", partNumber: "0540-35024", price: 4881.95, inventoryNumber: "30008316", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008318", name: "WIPER LINK", partNumber: "141-47607", price: 915.0, inventoryNumber: "30008318", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008319", name: "BRAZO DE BUGIN", partNumber: "BPB-2025", price: 4145.0, inventoryNumber: "30008319", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008322", name: "MAZ-15515000", partNumber: "MAZ-15515000", price: 553.83, inventoryNumber: "30008322", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008323", name: "FEED GOD", partNumber: "B1609-415-A00", price: 576.24, inventoryNumber: "30008323", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008328", name: "KNIFE DRIVING ASSY", partNumber: "401-142163", price: 2680.34, inventoryNumber: "30008328", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008337", name: "AGUJA 134 75/11", partNumber: "DPX5", price: 39.59, inventoryNumber: "30008337", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008341", name: "KIT DE SELLOS", partNumber: "QM/6020/00", price: 6916.49, inventoryNumber: "30008341", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008342", name: "CONTROL CAM", partNumber: "396-350683", price: 10204.33, inventoryNumber: "30008342", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008346", name: "PRESSER FOOT", partNumber: "223", price: 39.32, inventoryNumber: "30008346", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008351", name: "HOOK DE BORDADORA TAJIMA", partNumber: "", price: 1037.9, inventoryNumber: "30008351", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008352", name: "RESORTE PARA LIMPIAR HEBRA", partNumber: "SS-G-099", price: 154.0, inventoryNumber: "30008352", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008353", name: "TORNILLO DE AGUJA", partNumber: "S-2824", price: 32.0, inventoryNumber: "30008353", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008354", name: "FELPA", partNumber: "SS-C-195", price: 93.0, inventoryNumber: "30008354", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008355", name: "HULES DE 3 AGUJEROS", partNumber: "SS-C-181-2", price: 76.0, inventoryNumber: "30008355", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008356", name: "HULE DE 3 AGUJEROS", partNumber: "SS-C-181-2", price: 47.0, inventoryNumber: "30008356", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008357", name: "BUSHING PLASTICOS", partNumber: "SS-C-317", price: 14.0, inventoryNumber: "30008357", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008358", name: "HLE PARA PRESSER FOOT", partNumber: "SS-C-308", price: 13.0, inventoryNumber: "30008358", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008359", name: "CUCHILLA", partNumber: "AC051600000", price: 975.0, inventoryNumber: "30008359", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008360", name: "CUCHILLA", partNumber: "AC051700000", price: 1028.0, inventoryNumber: "30008360", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008361", name: "HULE DE BARRA", partNumber: "SS-C-311", price: 63.0, inventoryNumber: "30008361", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008365", name: "LAINA", partNumber: "BS-D-353", price: 180.0, inventoryNumber: "30008365", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008371", name: "BUTTON CLAMP", partNumber: "MAZ-166080B0", price: 1742.29, inventoryNumber: "30008371", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008374", name: "RODO VULCANIZADO DIAMETRO 1 X 3 LARGO", partNumber: "", price: 1400.0, inventoryNumber: "30008374", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008375", name: "RODO ACERO INOXIDABLE MOLETEADO DIAMETRO", partNumber: "", price: 800.0, inventoryNumber: "30008375", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008378", name: "RESORTE PARA SELENOIDE DE CALDERA", partNumber: "", price: 40.0, inventoryNumber: "30008378", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008380", name: "SCREW 136", partNumber: "DCYP9736", price: 6.89, inventoryNumber: "30008380", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008393", name: "TENSION WIRE ROPE", partNumber: "BYL-991004034", price: 211.94, inventoryNumber: "30008393", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008394", name: "SHOLDER SCREW JUKI", partNumber: "401-45614", price: 38.62, inventoryNumber: "30008394", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008396", name: "VALVULA 3/8", partNumber: "DXTP25481157", price: 321.23, inventoryNumber: "30008396", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008398", name: "BTW SPACER", partNumber: "262-61206", price: 26.74, inventoryNumber: "30008398", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008403", name: "FEED DOG", partNumber: "149009", price: 267.93, inventoryNumber: "30008403", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008404", name: "NEEDLE PLATE", partNumber: "143402", price: 267.93, inventoryNumber: "30008404", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008408", name: "PRENSATELA 2.0MM", partNumber: "CR20", price: 50.17, inventoryNumber: "30008408", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008409", name: "PLATE PARA BRDADORA", partNumber: "BS-0-221", price: 554.0, inventoryNumber: "30008409", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30002414", name: "CARRETEL PARA BORDADORA", partNumber: "IE18358", price: 67.75, inventoryNumber: "30002414", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30007778", name: "BANDA INDUSTRIAL", partNumber: "1595-5M-15", price: 2038.28, inventoryNumber: "30007778", description: "", createdAt: "2026-08-24T00:00:00.000Z" },
    { id: "part-30008317", name: "PISTON", partNumber: "35P1A-S020MS-0140", price: 7367.84, inventoryNumber: "30008317", description: "", createdAt: "2026-08-24T00:00:00.000Z" }
];

// Load or Seed localState (Caché local inicial)
let state = {
    machinery: JSON.parse(localStorage.getItem("monzini_machinery")) || DEFAULT_MACHINERY,
    orders: JSON.parse(localStorage.getItem("monzini_orders")) || DEFAULT_ORDERS,
    parts: JSON.parse(localStorage.getItem("monzini_parts")) || DEFAULT_PARTS,
    mechanicTelegram: JSON.parse(localStorage.getItem("monzini_mechanic_telegram")) || {},
    backupTelegram: JSON.parse(localStorage.getItem("monzini_backup_telegram")) || {},
    unlockedReports: false
};

// Si la caché local tiene pocos elementos (ej. solo datos de prueba antiguos)
// y la base de datos de Excel tiene toda la maquinaria, forzar la carga de la base de datos.
if (state.machinery.length < 10 && DEFAULT_MACHINERY.length > 500) {
    state.machinery = DEFAULT_MACHINERY;
    localStorage.setItem("monzini_machinery", JSON.stringify(state.machinery));
} else if (state.machinery.length === 0) {
    state.machinery = DEFAULT_MACHINERY;
    localStorage.setItem("monzini_machinery", JSON.stringify(state.machinery));
}
if (state.orders.length === 0) {
    state.orders = DEFAULT_ORDERS;
    localStorage.setItem("monzini_orders", JSON.stringify(state.orders));
}
if (!state.parts || state.parts.length === 0) {
    state.parts = DEFAULT_PARTS;
    localStorage.setItem("monzini_parts", JSON.stringify(state.parts));
}

// --- STATE MANAGEMENT HELPERS & SYNC ENGINE ---
function saveMachinery() {
    localStorage.setItem("monzini_machinery", JSON.stringify(state.machinery));
    syncStateToCloud();
}

function saveOrders() {
    localStorage.setItem("monzini_orders", JSON.stringify(state.orders));
    syncStateToCloud();
}

function saveParts() {
    localStorage.setItem("monzini_parts", JSON.stringify(state.parts));
    syncStateToCloud();
}

function saveMechanicTelegram() {
    localStorage.setItem("monzini_mechanic_telegram", JSON.stringify(state.mechanicTelegram));
    syncStateToCloud();
}

function saveBackupTelegram() {
    localStorage.setItem("monzini_backup_telegram", JSON.stringify(state.backupTelegram || {}));
    syncStateToCloud();
}

// Envía un mensaje de Telegram a un chat_id específico. Función de bajo nivel, reutilizable.
// No bloquea la interfaz: si falla (bot no configurado, sin chat ID, sin internet), solo lo avisa en consola.
async function sendTelegramMessage(chatId, mensaje) {
    if (!TELEGRAM_BOT_TOKEN) return; // Alertas de Telegram desactivadas (token vacío)
    if (!chatId) return;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: mensaje,
                parse_mode: "HTML"
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error("Error enviando mensaje de Telegram:", errText);
        }
    } catch (err) {
        console.error("Error de red enviando mensaje de Telegram:", err);
    }
}

// Envía una alerta de incidencia por Telegram al mecánico asignado, y además
// manda una copia de respaldo a cada persona de la lista de respaldo (si tiene Chat ID configurado).
// Si el mecánico asignado es también una de las personas de respaldo, no se le duplica el mensaje.
async function sendTelegramAlert(mechanicName, mensaje) {
    if (!TELEGRAM_BOT_TOKEN) return; // Alertas de Telegram desactivadas (token vacío)
    if (!mechanicName) return;

    const chatId = state.mechanicTelegram && state.mechanicTelegram[mechanicName];
    if (!chatId) {
        console.warn(`No hay Chat ID de Telegram configurado para "${mechanicName}". La alerta no se envió.`);
    } else {
        sendTelegramMessage(chatId, mensaje);
    }

    // Copia de respaldo para cada persona de la lista de respaldo, evitando duplicar
    // el mensaje si esa persona es justo el mecánico asignado (mismo Chat ID).
    if (!state.backupTelegram) return;
    const mensajeCopia = `📋 <b>Copia de respaldo</b> (mecánico: ${mechanicName})\n\n${mensaje}`;
    BACKUP_LIST.forEach(backupName => {
        const backupChatId = state.backupTelegram[backupName];
        if (!backupChatId) return;
        if (chatId && backupChatId === chatId) return; // evita duplicar al propio mecánico asignado
        sendTelegramMessage(backupChatId, mensajeCopia);
    });
}

// Actualiza el indicador visual de la barra superior
function updateSyncBadge(status, text) {
    const badge = document.getElementById("sync-status-badge");
    if (!badge) return;

    badge.className = "sync-badge";
    let iconHTML = "";
    
    if (status === "loading") {
        badge.classList.add("sync-loading");
        iconHTML = `<i data-lucide="refresh-cw" class="animate-spin" style="width:16px;height:16px;"></i>`;
    } else if (status === "success") {
        badge.classList.add("sync-success");
        iconHTML = `<i data-lucide="cloud-lightning" style="width:16px;height:16px;"></i>`;
    } else {
        badge.classList.add("sync-warning");
        iconHTML = `<i data-lucide="cloud-off" style="width:16px;height:16px;"></i>`;
    }

    badge.innerHTML = `${iconHTML}<span id="sync-status-text">${text}</span>`;
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Carga el estado desde Firebase
async function loadStateFromCloud() {
    if (!CONFIG_DATABASE_URL) {
        updateSyncBadge("warning", "Modo Local");
        return;
    }

    updateSyncBadge("loading", "Conectando...");
    try {
        if (firebaseAuthReady) { await firebaseAuthReady; }
        const cleanUrl = CONFIG_DATABASE_URL.replace(/\/$/, "");
        const response = await fetch(buildAuthedDbUrl(`${cleanUrl}/monzini.json`));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data) {
            state.machinery = data.machinery || [];
            state.orders = data.orders || [];
            state.parts = data.parts || DEFAULT_PARTS;
            state.mechanicTelegram = data.mechanicTelegram || {};
            state.backupTelegram = data.backupTelegram || {};
            
            // Sincronizar respaldo en local storage
            localStorage.setItem("monzini_machinery", JSON.stringify(state.machinery));
            localStorage.setItem("monzini_orders", JSON.stringify(state.orders));
            localStorage.setItem("monzini_parts", JSON.stringify(state.parts));
            localStorage.setItem("monzini_mechanic_telegram", JSON.stringify(state.mechanicTelegram));
            localStorage.setItem("monzini_backup_telegram", JSON.stringify(state.backupTelegram));
            updateSyncBadge("success", "Sincronizado");
        } else {
            // Si la base de datos de la nube está vacía, subir el estado local actual solo si hay datos,
            // de lo contrario, inicializar con los valores por defecto
            if (state.machinery.length > 0 || state.orders.length > 0 || state.parts.length > 0) {
                await syncStateToCloud();
            } else {
                state.machinery = DEFAULT_MACHINERY;
                state.orders = DEFAULT_ORDERS;
                state.parts = DEFAULT_PARTS;
                await syncStateToCloud();
            }
        }
    } catch (err) {
        console.error("Error cargando de la base de datos cloud, usando local storage:", err);
        updateSyncBadge("warning", "Local (Offline)");
    }
}

// Guarda el estado en Firebase
async function syncStateToCloud() {
    if (!CONFIG_DATABASE_URL) {
        updateSyncBadge("warning", "Modo Local");
        return { ok: false, reason: "Sin CONFIG_DATABASE_URL configurado" };
    }

    updateSyncBadge("loading", "Guardando...");
    try {
        if (firebaseAuthReady) { await firebaseAuthReady; }
        const cleanUrl = CONFIG_DATABASE_URL.replace(/\/$/, "");
        const response = await fetch(buildAuthedDbUrl(`${cleanUrl}/monzini.json`), {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                machinery: state.machinery,
                orders: state.orders,
                parts: state.parts,
                mechanicTelegram: state.mechanicTelegram || {},
                backupTelegram: state.backupTelegram || {}
            })
        });

        if (!response.ok) {
            let bodyText = "";
            try { bodyText = await response.text(); } catch (e) {}
            throw new Error(`HTTP ${response.status} ${response.statusText}${bodyText ? " - " + bodyText : ""}`);
        }
        updateSyncBadge("success", "Sincronizado");
        return { ok: true };
    } catch (err) {
        console.error("Error guardando en la base de datos cloud:", err);
        updateSyncBadge("warning", "Local (Error subida)");
        return { ok: false, reason: err.message || String(err) };
    }
}

// Forzar una sincronización manual al hacer clic en el botón
async function forceSync() {
    await loadStateFromCloud();
    const activeNavItem = document.querySelector(".nav-item.active");
    if (activeNavItem) {
        const currentPage = activeNavItem.getAttribute("data-page");
        navigateToPage(currentPage);
    } else {
        navigateToPage("dashboard");
    }
}

// --- SOUND EFFECTS (Web Audio API Synthesizer) ---
function playScannerBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch beep
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
        console.warn("Navegador bloqueó el sintetizador de audio preliminar.", e);
    }
}

// --- UI UTILITIES ---
function formatDate(isoString) {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// Convierte un Date a sus componentes de hora de Honduras (America/Tegucigalpa),
// sin importar la zona horaria configurada en el dispositivo del usuario.
function toHondurasDate(d) {
    const s = d.toLocaleString("en-US", { timeZone: "America/Tegucigalpa" });
    return new Date(s);
}

// Días puntuales que normalmente no son laborales (ej. un domingo) pero SÍ se trabajan.
// Formato "AAAA-MM-DD" (hora de Honduras). Ejemplo:
// "2026-10-04": { startH: 7, startM: 0, endH: 16, endM: 30 }
const EXTRA_WORKDAYS = {};

// Devuelve la ventana de horario laboral (inicio/fin) para un día dado, en hora de Honduras.
// Lunes a Jueves: 7:00 AM - 4:30 PM. Viernes: 7:00 AM - 3:30 PM.
// Sábado: 7:00 AM - 4:30 PM. Domingo: cerrado (null), salvo que esté en EXTRA_WORKDAYS.
function getBusinessWindowForDay(dateHN) {
    const day = dateHN.getDay(); // 0=Domingo, 6=Sábado
    const y = dateHN.getFullYear(), m = dateHN.getMonth(), dt = dateHN.getDate();

    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(dt).padStart(2, "0")}`;
    const extra = EXTRA_WORKDAYS[key];
    if (extra) {
        return {
            start: new Date(y, m, dt, extra.startH, extra.startM, 0, 0),
            end: new Date(y, m, dt, extra.endH, extra.endM, 0, 0)
        };
    }

    if (day === 0) return null; // Domingo cerrado
    const start = new Date(y, m, dt, 7, 0, 0, 0);
    // Viernes cierra 3:30 PM; el resto (Lunes-Jueves y Sábado) cierra 4:30 PM
    const end = (day === 5) ? new Date(y, m, dt, 15, 30, 0, 0) : new Date(y, m, dt, 16, 30, 0, 0);
    return { start, end };
}

// Calcula las horas de inactividad reales de una orden, contando SOLO tiempo dentro
// del horario laboral de la fábrica (L-J 7:00am-4:30pm, V 7:00am-3:30pm, S 7:00am-4:30pm).
// El tiempo fuera de horario y los domingos no se acumulan.
function calculateDiffHours(startIso, endIso) {
    if (!startIso || !endIso) return "--";
    const start = toHondurasDate(new Date(startIso));
    const end = toHondurasDate(new Date(endIso));
    if (end <= start) return "0.0";

    let totalMs = 0;
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const lastDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    while (cursor <= lastDay) {
        const window = getBusinessWindowForDay(cursor);
        if (window) {
            const overlapStart = window.start > start ? window.start : start;
            const overlapEnd = window.end < end ? window.end : end;
            if (overlapEnd > overlapStart) {
                totalMs += (overlapEnd - overlapStart);
            }
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    return (totalMs / (1000 * 60 * 60)).toFixed(1);
}

// --- CHART GENERATION (Chart.js) ---
let priorityChart = null;

function renderDashboardCharts() {
    const canvas = document.getElementById("chart-priority");
    if (!canvas) return;

    // Count priorities of active orders
    const activeOrders = state.orders.filter(o => o.status !== "Resuelto");
    const counts = { Baja: 0, Media: 0, Alta: 0, Crítica: 0 };
    activeOrders.forEach(o => {
        if (counts[o.priority] !== undefined) {
            counts[o.priority]++;
        }
    });

    if (priorityChart) {
        priorityChart.destroy();
    }

    const ctx = canvas.getContext("2d");
    priorityChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Baja", "Media", "Alta", "Crítica"],
            datasets: [{
                data: [counts.Baja, counts.Media, counts.Alta, counts.Crítica],
                backgroundColor: [
                    "rgba(6, 182, 212, 0.75)",  // Cyan
                    "rgba(251, 191, 36, 0.75)",  // Yellow
                    "rgba(249, 115, 22, 0.75)",  // Orange
                    "rgba(244, 63, 94, 0.75)"    // Red
                ],
                borderColor: [
                    "#080c14",
                    "#080c14",
                    "#080c14",
                    "#080c14"
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#94a3b8",
                        font: {
                            family: "'Inter', sans-serif",
                            size: 11
                        },
                        padding: 15
                    }
                }
            },
            cutout: "70%"
        }
    });
}
// --- SISTEMA DE CÁMARA CORREGIDO CON IDS REALES ---
let html5QrcodeScanner = null;
let isScanning = false;

function initCameraScanner() {
    // Usamos el ID real de tu HTML: "camera-source-select"
    const cameraSelect = document.getElementById("camera-source-select");
    if (!cameraSelect) return;

    cameraSelect.innerHTML = '<option value="">Cargando dispositivos...</option>';

    const errorBox = document.getElementById("scanner-camera-error");
    if (errorBox) errorBox.style.display = "none";

    // Comprobación temprana: getUserMedia requiere un contexto seguro (https o localhost)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        cameraSelect.innerHTML = '<option value="">No disponible en este contexto</option>';
        if (errorBox) {
            errorBox.style.display = "flex";
            const msgEl = errorBox.querySelector("p");
            if (msgEl) msgEl.textContent = "Tu navegador no permite el acceso a la cámara aquí. Esto pasa si la página no se sirve por https:// o http://localhost. Usa la simulación abajo mientras tanto.";
        }
        return;
    }

    // Pedimos permisos al navegador
    navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
            // Apagamos el stream de prueba inmediato para liberar el lente
            stream.getTracks().forEach(track => track.stop());

            // Listamos las cámaras con la librería
            Html5Qrcode.getCameras()
                .then((devices) => {
                    cameraSelect.innerHTML = ""; 

                    if (devices && devices.length > 0) {
                        devices.forEach((device, index) => {
                            const opt = document.createElement("option");
                            opt.value = device.id;
                            opt.text = device.label || `Cámara ${index + 1}`;
                            cameraSelect.appendChild(opt);
                        });

                        cameraSelect.onchange = (e) => {
                            const selectedId = e.target.value;
                            if (selectedId) {
                                stopScanning().then(() => startScanning(selectedId));
                            } else {
                                stopScanning();
                            }
                        };

                        // Retraso seguro antes de encender la primera cámara
                        setTimeout(() => {
                            cameraSelect.value = devices[0].id;
                            startScanning(devices[0].id);
                        }, 400);

                    } else {
                        cameraSelect.innerHTML = '<option value="">No se detectaron cámaras</option>';
                        if (errorBox) {
                            errorBox.style.display = "flex";
                            const msgEl = errorBox.querySelector("p");
                            if (msgEl) msgEl.textContent = "No se detectó ninguna cámara conectada a este dispositivo. Verifica que esté conectada y que el sistema operativo le dé permiso al navegador.";
                        }
                    }
                })
                .catch((err) => {
                    console.error("Error al listar cámaras:", err);
                    cameraSelect.innerHTML = '<option value="">Error de hardware</option>';
                    if (errorBox) {
                        errorBox.style.display = "flex";
                        const msgEl = errorBox.querySelector("p");
                        if (msgEl) msgEl.textContent = `Error al listar cámaras: ${err.message || err}. Usa la simulación abajo mientras tanto.`;
                    }
                });
        })
        .catch((err) => {
            console.error("Permiso denegado:", err);
            cameraSelect.innerHTML = '<option value="">Sin permiso de cámara</option>';
            if (errorBox) {
                errorBox.style.display = "flex";
                const msgEl = errorBox.querySelector("p");
                if (msgEl) {
                    let hint = "Otorga permiso de cámara al navegador para este sitio (icono de candado en la barra de direcciones).";
                    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                        hint = "No se encontró ninguna cámara en este dispositivo/navegador.";
                    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                        hint = "La cámara ya está siendo usada por otra aplicación (Zoom, Teams, otra pestaña, etc.). Ciérrala e inténtalo de nuevo.";
                    } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                        hint = "Bloqueaste el permiso de cámara para este sitio. Actívalo desde el icono de candado en la barra de direcciones.";
                    }
                    msgEl.textContent = `${err.name || 'Error'}: ${hint}`;
                }
            }
        });
}

function startScanning(cameraId) {
    // Usamos el contenedor real de tu HTML: "scanner-reader"
    const container = document.getElementById("scanner-reader");
    if (!container) return;

    if (isScanning) return;

    if (!html5QrcodeScanner) {
        html5QrcodeScanner = new Html5Qrcode("scanner-reader");
    }

    const config = {
        fps: 10,
        qrbox: (width, height) => {
            const minElem = Math.min(width, height);
            const boxSize = Math.floor(minElem * 0.65);
            return { width: boxSize, height: boxSize };
        }
    };

    isScanning = true;
    
    setTimeout(() => {
        html5QrcodeScanner.start(
            cameraId,
            config,
            (decodedText) => {
                handleBarcodeFound(decodedText);
            },
            (errorMessage) => {
                // Captura silenciosa de cuadros
            }
        ).then(() => {
            // Cámara encendida correctamente: ocultar mensaje de error y ajustar botones
            const errorBox = document.getElementById("scanner-camera-error");
            if (errorBox) errorBox.style.display = "none";
            const startBtn = document.getElementById("start-camera-btn");
            const stopBtn = document.getElementById("stop-camera-btn");
            if (startBtn) startBtn.style.display = "none";
            if (stopBtn) stopBtn.style.display = "flex";
        }).catch((err) => {
            console.warn("Fallo al levantar transmisión:", err);
            isScanning = false;
            const errorBox = document.getElementById("scanner-camera-error");
            if (errorBox) {
                errorBox.style.display = "flex";
                const msgEl = errorBox.querySelector("p");
                if (msgEl) {
                    msgEl.textContent = `No se pudo encender la cámara (${err.name || 'Error'}: ${err.message || err}). Verifica que ninguna otra aplicación la esté usando, o usa la simulación abajo.`;
                }
            }
        });
    }, 200);
}

function stopScanning() {
    return new Promise((resolve) => {
        const startBtn = document.getElementById("start-camera-btn");
        const stopBtn = document.getElementById("stop-camera-btn");
        if (startBtn) startBtn.style.display = "flex";
        if (stopBtn) stopBtn.style.display = "none";

        if (html5QrcodeScanner && isScanning) {
            html5QrcodeScanner.stop()
                .then(() => {
                    isScanning = false;
                    const container = document.getElementById("scanner-reader");
                    if (container) container.innerHTML = ""; 
                    resolve(true);
                })
                .catch((err) => {
                    console.error("Error al apagar hardware:", err);
                    isScanning = false;
                    resolve(false);
                });
        } else {
            resolve(true);
        }
    });
}
function handleBarcodeFound(barcodeText) {
    playScannerBeep();
    stopScanning();
    showMachineInfo(barcodeText.trim());
}

// Construye y abre el modal de información de la máquina (usado tanto al escanear un QR
// como desde el botón "Información de la Máquina" en el catálogo de Maquinaria).
function showMachineInfo(machineId) {
    // Check if machine exists
    const machine = state.machinery.find(m => m.id.toLowerCase() === machineId.toLowerCase());

    const codeDisplay = document.getElementById("scanned-code-text");
    const nameDisplay = document.getElementById("scanned-machine-name");
    const areaDisplay = document.getElementById("scanned-machine-area");
    const specsDisplay = document.getElementById("scanned-machine-specs");
    const statusDisplay = document.getElementById("scanned-machine-status");

    codeDisplay.textContent = machineId;

    if (machine) {
        nameDisplay.textContent = machine.name;
        areaDisplay.textContent = machine.area;
        specsDisplay.textContent = `${machine.brand || 'Genérica'} / ${machine.model || 'N/A'}${machine.operationType ? ' — Operación: ' + machine.operationType : ''}`;
        
        statusDisplay.textContent = machine.status;
        statusDisplay.className = `badge badge-status-${machine.status.split(' ')[0]}`; // Safe classing

        // Hook shortcut button
        const orderBtn = document.getElementById("btn-scanner-create-order");
        orderBtn.onclick = () => {
            // Select in orders form and go there
            document.getElementById("order-machine-id").value = machine.id;
            closeModal("scanner-success-modal");
            navigateToPage("orders");
        };
        orderBtn.style.display = "inline-flex";

        renderMachineHistory(machine.id);
    } else {
        nameDisplay.textContent = "CÓDIGO NO REGISTRADO";
        areaDisplay.textContent = "N/A";
        specsDisplay.textContent = "N/A";
        statusDisplay.textContent = "Inexistente";
        statusDisplay.className = "badge badge-status-Fuera";
        
        document.getElementById("btn-scanner-create-order").style.display = "none";

        renderMachineHistory(null);
    }

    openModal("scanner-success-modal");
}

// Construye el historial de operaciones (órdenes de trabajo) de una maquinaria específica
// y lo pinta dentro del modal de escaneo, más reciente primero.
function renderMachineHistory(machineId) {
    const container = document.getElementById("scanned-machine-history");
    if (!container) return;

    if (!machineId) {
        container.innerHTML = `<div class="history-empty-state">Escanea una maquinaria registrada para ver su historial.</div>`;
        return;
    }

    const history = state.orders
        .filter(o => o.machineId === machineId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (history.length === 0) {
        container.innerHTML = `<div class="history-empty-state">Esta maquinaria aún no tiene órdenes de trabajo registradas.</div>`;
        return;
    }

    container.innerHTML = history.map(o => {
        const priorityClass = o.priority === "Crítica" ? "is-critical" : (o.priority === "Alta" ? "is-high" : "");

        const dateLabel = o.status === "Resuelto" && o.resolvedAt
            ? `Resuelto: ${new Date(o.resolvedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`
            : `Abierto: ${new Date(o.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}`;

        const statusLabel = o.status === "Resuelto"
            ? `<span class="badge badge-status-Operando" style="font-size:9px;">Resuelto</span>`
            : `<span class="badge badge-status-Mantenimiento" style="font-size:9px;">${o.status}</span>`;

        return `
            <div class="history-item ${priorityClass}">
                <div class="history-item-header">
                    <span class="history-item-date">${dateLabel}</span>
                    ${statusLabel}
                </div>
                <div class="history-item-desc">${o.description || 'Sin descripción'}</div>
                <div class="history-item-mechanic">Mecánico: ${o.mechanic || 'No asignado'} · Prioridad: ${o.priority || 'N/A'}</div>
                ${o.observations ? `<div class="history-item-obs">"${o.observations}"</div>` : ''}
            </div>
        `;
    }).join('');
}

// --- DYNAMIC RENDERING ENGINES ---

// Update navigation titles
function updateHeaderTitle(pageId) {
    const titleEl = document.getElementById("current-section-title");
    const subtitleEl = document.getElementById("current-section-subtitle");

    switch(pageId) {
        case "dashboard":
            titleEl.textContent = "Dashboard General";
            subtitleEl.textContent = "Resumen del estado operativo de maquinaria y alertas abiertas.";
            break;
        case "machinery":
            titleEl.textContent = "Catálogo de Maquinaria";
            subtitleEl.textContent = "Visualiza y administra el inventario de maquinaria y códigos QR.";
            break;
        case "parts":
            titleEl.textContent = "Catálogo de Piezas";
            subtitleEl.textContent = "Inventario de repuestos y piezas disponibles para mantenimiento.";
            break;
        case "scanner":
            titleEl.textContent = "Lector de Código QR";
            subtitleEl.textContent = "Escanea la placa física de la maquinaria para gestionar incidentes.";
            break;
        case "orders":
            titleEl.textContent = "Panel de Órdenes de Trabajo";
            subtitleEl.textContent = "Administra las tareas de reparación y actualiza sus observaciones.";
            break;
        case "reports":
            titleEl.textContent = "Módulo de Reportes de Calidad";
            subtitleEl.textContent = "Área reservada para el Jefe de Departamento. Bitácora de casos cerrados.";
            break;
    }
}

// Render Dashboard
function populateDashboard() {
    // Stats Calculations
    const totalMac = state.machinery.length;
    const activeAlerts = state.orders.filter(o => o.status === "Pendiente").length;
    const progressOrders = state.orders.filter(o => o.status === "En Proceso").length;
    const closedCount = state.orders.filter(o => o.status === "Resuelto").length;
    const totalOrders = state.orders.length;
    
    // Compliance Rate
    const compliance = totalOrders > 0 ? Math.round((closedCount / totalOrders) * 100) : 100;

    document.getElementById("stat-total-machinery").textContent = totalMac;
    document.getElementById("stat-active-alerts").textContent = activeAlerts;
    document.getElementById("stat-pending-orders").textContent = progressOrders;
    document.getElementById("stat-compliance-rate").textContent = `${compliance}%`;
    document.getElementById("stat-resolved-count").textContent = `${closedCount} cerrados`;

    // Machine Status Breakdown
    const operandoCount = state.machinery.filter(m => m.status === "Operando").length;
    const mantenimientoCount = state.machinery.filter(m => m.status === "Mantenimiento").length;
    const fueraCount = state.machinery.filter(m => m.status === "Fuera de Servicio" || (m.status || "").toLowerCase().includes("fuera")).length;
    document.getElementById("stat-status-operando").textContent = operandoCount;
    document.getElementById("stat-status-mantenimiento").textContent = mantenimientoCount;
    document.getElementById("stat-status-fuera").textContent = fueraCount;

    // Sidebar indicator update
    document.getElementById("orders-badge-count").textContent = activeAlerts + progressOrders;

    // Alert Feed (Dashboard Log)
    const feedContainer = document.getElementById("dashboard-alert-feed");
    feedContainer.innerHTML = "";

    const activeList = state.orders
        .filter(o => o.status !== "Resuelto")
        .sort((a,b) => {
            // Sort by priority rank
            const ranks = { "Crítica": 4, "Alta": 3, "Media": 2, "Baja": 1 };
            return (ranks[b.priority] || 0) - (ranks[a.priority] || 0);
        });

    if (activeList.length === 0) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <i data-lucide="check-circle" class="text-success"></i>
                <p>¡Todo en orden! No hay alertas activas en este momento.</p>
            </div>
        `;
    } else {
        activeList.forEach(o => {
            const machine = state.machinery.find(m => m.id === o.machineId) || { name: "Maquinaria Desconocida", id: o.machineId };
            
            const div = document.createElement("div");
            div.className = `feed-item priority-${o.priority}`;
            
            let obsHtml = "";
            if (o.observations && o.observations.trim() !== "") {
                obsHtml = `<div class="feed-observations"><strong>Obs:</strong> ${o.observations}</div>`;
            }

            div.innerHTML = `
                <div class="feed-item-left">
                    <div class="feed-title">
                        <span class="feed-machine-name">${machine.name}</span>
                        <span class="feed-machine-id">${machine.id}</span>
                        <span class="feed-badge badge-priority-${o.priority}">${o.priority}</span>
                    </div>
                    <p class="feed-description">${o.description}</p>
                    ${obsHtml}
                    <div class="feed-meta">
                        <span class="feed-time"><i data-lucide="clock" style="width:12px;height:12px"></i> ${formatDate(o.createdAt)}</span>
                        <span class="feed-mechanic"><i data-lucide="wrench" style="width:12px;height:12px"></i> Asignado: ${o.mechanic}</span>
                    </div>
                </div>
                <div class="feed-item-right">
                    <button class="btn btn-warning btn-sm" onclick="openOrderActions('${o.id}')">Gestionar</button>
                    <span class="badge badge-status-${o.status.split(' ')[0]}">${o.status}</span>
                </div>
            `;
            feedContainer.appendChild(div);
        });
    }

    renderDashboardCharts();
    lucide.createIcons();
}

// Render Catalog Maquinaria
// Llena dinámicamente el filtro de departamentos con las áreas que realmente existen
// en la maquinaria cargada (state.machinery), en vez de una lista fija en el HTML.
// Así el filtro nunca se desincroniza aunque cambien o se agreguen departamentos.
function populateAreaFilterOptions() {
    const select = document.getElementById("machine-filter-area");
    if (!select) return;

    const currentValue = select.value || "all";
    const uniqueAreas = [...new Set(state.machinery.map(m => m.area).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'es'));

    select.innerHTML = `<option value="all">Todos los departamentos</option>` +
        uniqueAreas.map(area => `<option value="${area}">${area}</option>`).join('');

    // Conservar la selección previa si sigue existiendo
    if ([...select.options].some(o => o.value === currentValue)) {
        select.value = currentValue;
    }
}

// Genera un PNG (data URL) del QR de un código, usando la misma librería QRCode.js
// que ya usa el sistema para renderizar los QR en las tarjetas de maquinaria.
function generateQrDataUrl(text) {
    return new Promise((resolve) => {
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "fixed";
        tempDiv.style.left = "-9999px";
        document.body.appendChild(tempDiv);

        new QRCode(tempDiv, {
            text: text,
            width: 200,
            height: 200,
            colorDark: "#0b111e",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        // QRCode.js dibuja en un <canvas> (o en un <img> como respaldo); esperamos
        // un instante a que termine de renderizar antes de leer el resultado.
        setTimeout(() => {
            const canvas = tempDiv.querySelector("canvas");
            const img = tempDiv.querySelector("img");
            let dataUrl = null;
            if (canvas) {
                dataUrl = canvas.toDataURL("image/png");
            } else if (img && img.src) {
                dataUrl = img.src;
            }
            document.body.removeChild(tempDiv);
            resolve(dataUrl);
        }, 20);
    });
}

// Genera e imprime las etiquetas QR de la maquinaria, usando exactamente los mismos
// códigos (m.id) que tu sistema ya usa para identificar cada máquina al escanear.
// Respeta el filtro de búsqueda/área que tengas activo en la pantalla de Maquinaria,
// así puedes imprimir todo el catálogo o solo un departamento a la vez.
async function printMachineryQRLabels() {
    const searchQuery = document.getElementById("machine-search-input")?.value || "";
    const areaFilter = document.getElementById("machine-filter-area")?.value || "all";
    const q = searchQuery.toLowerCase();

    const filtered = state.machinery.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(q) ||
                              m.id.toLowerCase().includes(q) ||
                              (m.brand && m.brand.toLowerCase().includes(q)) ||
                              (m.model && m.model.toLowerCase().includes(q));
        const matchesArea = areaFilter === "all" || m.area === areaFilter;
        return matchesSearch && matchesArea;
    });

    if (filtered.length === 0) {
        alert("No hay máquinas que coincidan con el filtro/búsqueda actual para imprimir.");
        return;
    }

    // Abrimos la ventana INMEDIATAMENTE (de forma síncrona, en el mismo clic) para que
    // el navegador no la trate como un pop-up no solicitado. Si esperamos a generar los
    // QR primero y recién ahí abrimos la ventana, Chrome/Firefox la bloquean.
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Tu navegador bloqueó la ventana de impresión. Permite ventanas emergentes para este sitio (ícono en la barra de direcciones) e inténtalo de nuevo.");
        return;
    }
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head><meta charset="UTF-8"><title>Etiquetas QR - Monzini Mecánica</title></head>
        <body style="font-family:Arial,sans-serif;padding:40px;color:#555;">
            <p>Generando ${filtered.length} etiquetas QR, un momento...</p>
        </body>
        </html>
    `);

    const btn = document.getElementById("print-qr-labels-btn");
    const originalHtml = btn ? btn.innerHTML : null;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>Generando ${filtered.length} etiquetas...</span>`;
    }

    const labels = [];
    for (const m of filtered) {
        const dataUrl = await generateQrDataUrl(m.id);
        labels.push({ id: m.id, name: m.name || "", area: m.area || "" });
        labels[labels.length - 1].dataUrl = dataUrl;
    }

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
    }

    if (printWindow.closed) {
        alert("La ventana de impresión se cerró antes de terminar. Intenta de nuevo.");
        return;
    }

    const labelsHtml = labels.map(l => `
        <div class="qr-label">
            <img src="${l.dataUrl}" alt="QR ${l.id}">
            <div class="qr-label-text">
                <div class="qr-label-id">${l.id}</div>
                ${l.name ? `<div class="qr-label-name">${l.name}</div>` : ""}
                ${l.area ? `<div class="qr-label-area">${l.area}</div>` : ""}
            </div>
        </div>
    `).join("");

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
        <meta charset="UTF-8">
        <title>Etiquetas QR - Monzini Mecánica</title>
        <style>
            @page { margin: 12mm; }
            * { box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 18px; color: #1c2024; }
            .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
            .toolbar button { padding: 10px 18px; font-size: 13.5px; font-weight: 700; border: none; border-radius: 6px; background: #d98e2c; color: #1c2024; cursor: pointer; }
            .toolbar select { padding: 8px; font-size: 13px; border-radius: 6px; border: 1px solid #ccc; }
            .count { font-size: 13px; color: #555; }
            .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .qr-label { border: 1.4px dashed #999; border-radius: 6px; padding: 8px; display: flex; align-items: center; gap: 8px; break-inside: avoid; page-break-inside: avoid; }
            .qr-label img { width: 62px; height: 62px; flex: none; }
            .qr-label-text { min-width: 0; }
            .qr-label-id { font-family: 'Consolas', monospace; font-weight: 800; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .qr-label-name { font-size: 10.5px; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .qr-label-area { font-size: 9px; color: #a8681a; text-transform: uppercase; font-weight: 700; margin-top: 1px; }
            @media print { .toolbar { display: none; } }
        </style>
        </head>
        <body>
            <div class="toolbar">
                <div class="count">${labels.length} etiquetas — códigos QR tomados en vivo de tu sistema</div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <select id="colSelect" onchange="document.querySelector('.sheet').style.gridTemplateColumns = 'repeat(' + this.value + ', 1fr)'">
                        <option value="2">2 columnas</option>
                        <option value="3" selected>3 columnas</option>
                        <option value="4">4 columnas</option>
                        <option value="5">5 columnas</option>
                    </select>
                    <button onclick="window.print()">🖨️ Imprimir</button>
                </div>
            </div>
            <div class="sheet">${labelsHtml}</div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function populateMachinery(filterSearch = "", filterArea = "all") {
    const container = document.getElementById("machinery-cards-container");
    container.innerHTML = "";

    const filtered = state.machinery.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(filterSearch.toLowerCase()) || 
                              m.id.toLowerCase().includes(filterSearch.toLowerCase()) || 
                              (m.brand && m.brand.toLowerCase().includes(filterSearch.toLowerCase())) ||
                              (m.model && m.model.toLowerCase().includes(filterSearch.toLowerCase()));
        const matchesArea = filterArea === "all" || m.area === filterArea;
        return matchesSearch && matchesArea;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1">
                <i data-lucide="info"></i>
                <p>No se encontraron máquinas que coincidan con la búsqueda.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(m => {
        const card = document.createElement("div");
        card.className = "machine-card";
        
        card.innerHTML = `
            <div class="machine-card-header">
                <div>
                    <h3>${m.name}</h3>
                    <span class="machine-id-tag">${m.id}</span>
                </div>
                <span class="machine-status-badge badge-status-${m.status.split(' ')[0]}">${m.status}</span>
            </div>
            <div class="machine-card-body">
                <div class="machine-info-specs">
                    <div class="spec-item">
                        <span>Área</span>
                        <span>${m.area}</span>
                    </div>
                    <div class="spec-item">
                        <span>Marca</span>
                        <span>${m.brand || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span>Modelo</span>
                        <span>${m.model || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span>Tipo de Operación</span>
                        <span>${m.operationType || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span>Registro</span>
                        <span>${new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div class="machine-barcode-area">
                    <div id="qr-canvas-${m.id}" class="qr-render-box"></div>
                    <span class="machine-barcode-label">${m.id}</span>
                </div>
            </div>
            <div class="machine-card-footer" style="display: flex; flex-direction: column; gap: 8px;">
                <button class="btn btn-secondary" style="width: 100%;" onclick="showMachineInfo('${m.id}')">
                    <i data-lucide="info"></i>
                    <span>Información de la Máquina</span>
                </button>
                <div style="display: flex; gap: 8px;">
                    <button class="btn btn-warning" style="flex: 1;" onclick="createOrderShortcut('${m.id}')">
                        <i data-lucide="alert-triangle"></i>
                        <span>Levantar Alerta</span>
                    </button>
                    <button class="btn btn-secondary" style="padding: 0 12px;" onclick="openEditMachineModal('${m.id}')" title="Editar Máquina">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn btn-danger" style="padding: 0 12px; background-color: #dc2626; border-color: #dc2626; color: #fff;" onclick="deleteMachine('${m.id}')" title="Eliminar Máquina">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);

        // Render QR Code
        const qrContainer = document.getElementById(`qr-canvas-${m.id}`);
        if (qrContainer && typeof QRCode !== "undefined") {
            qrContainer.innerHTML = "";
            new QRCode(qrContainer, {
                text: m.id,
                width: 90,
                height: 90,
                colorDark: "#0b111e",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        } else if (qrContainer) {
            console.warn("La librería QRCode no está disponible. Verifica tu conexión a internet.");
        }
    });

    lucide.createIcons();
}

// --- CATÁLOGO DE PIEZAS ---

function populateParts(filterSearch = "") {
    const container = document.getElementById("parts-cards-container");
    if (!container) return;
    container.innerHTML = "";

    const filtered = (state.parts || []).filter(p => {
        const q = filterSearch.toLowerCase();
        return p.name.toLowerCase().includes(q) ||
               p.partNumber.toLowerCase().includes(q) ||
               (p.inventoryNumber && p.inventoryNumber.toLowerCase().includes(q)) ||
               (p.description && p.description.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1">
                <i data-lucide="package-x"></i>
                <p>No se encontraron piezas que coincidan con la búsqueda.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement("div");
        card.className = "machine-card part-card";

        const priceFormatted = p.price != null
            ? `L ${Number(p.price).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : 'N/A';

        card.innerHTML = `
            <div class="machine-card-header">
                <div>
                    <h3>${p.name}</h3>
                    <span class="machine-id-tag">${p.partNumber}</span>
                </div>
            </div>
            <div class="machine-card-body">
                <div class="machine-info-specs">
                    <div class="spec-item">
                        <span>N° de Parte</span>
                        <span>${p.partNumber}</span>
                    </div>
                    <div class="spec-item">
                        <span>Precio Unitario</span>
                        <span class="part-price-value">${priceFormatted}</span>
                    </div>
                    <div class="spec-item">
                        <span>N° de Inventario</span>
                        <span style="font-weight:700; font-size:1.1em;">${p.inventoryNumber || 'N/A'}</span>
                    </div>
                    <div class="spec-item">
                        <span>Registrado</span>
                        <span>${new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
                ${p.description ? `<div class="part-description-box">${p.description}</div>` : ''}
            </div>
            <div class="machine-card-footer" style="display: flex; gap: 8px;">
                <button class="btn btn-warning" style="flex: 1;" onclick="openEditPartModal('${p.id}')">
                    <i data-lucide="pencil"></i>
                    <span>Editar</span>
                </button>
                <button class="btn btn-danger" style="padding: 0 14px; background-color: #dc2626; border-color: #dc2626; color: #fff;" onclick="deletePart('${p.id}')" title="Eliminar Pieza">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        container.appendChild(card);
    });

    lucide.createIcons();
}

function resetPartModalToAddMode() {
    document.getElementById("part-modal-title").textContent = "Registrar Nueva Pieza";
    document.getElementById("btn-submit-part-modal").textContent = "Registrar Pieza";
    document.getElementById("edit-part-original-id").value = "";
}

function openEditPartModal(partId) {
    const part = (state.parts || []).find(p => p.id === partId);
    if (!part) return;

    document.getElementById("part-modal-title").textContent = "Editar Pieza";
    document.getElementById("btn-submit-part-modal").textContent = "Guardar Cambios";
    document.getElementById("edit-part-original-id").value = part.id;
    document.getElementById("new-part-name").value = part.name || "";
    document.getElementById("new-part-number").value = part.partNumber || "";
    document.getElementById("new-part-price").value = part.price != null ? part.price : "";
    document.getElementById("new-part-inventory").value = part.inventoryNumber || "";
    document.getElementById("new-part-description").value = part.description || "";

    openModal("add-part-modal");
}

// Abre el modal de maquinaria en modo edición, precargando los datos actuales.
// Útil especialmente para corregir el departamento de máquinas que se
// agregaron manualmente con las opciones viejas (Corte/Costura/etc.)
// Regresa el modal de maquinaria a su estado normal de "Agregar Nueva" después
// de editar o cancelar, para que no quede atascado en modo edición.
function resetMachineModalToAddMode() {
    document.getElementById("machine-modal-title").textContent = "Registrar Nueva Maquinaria";
    document.getElementById("btn-submit-machine-modal").textContent = "Registrar Máquina";
    document.getElementById("edit-machine-original-id").value = "";
    const idInput = document.getElementById("new-machine-id");
    idInput.readOnly = false;

    // Quitar cualquier opción temporal de área inválida que se haya agregado durante una edición
    const areaSelect = document.getElementById("new-machine-area");
    [...areaSelect.options].forEach(o => {
        if (o.textContent.includes("departamento no válido")) {
            o.remove();
        }
    });
}

function openEditMachineModal(machineId) {
    const machine = state.machinery.find(m => m.id === machineId);
    if (!machine) return;

    document.getElementById("machine-modal-title").textContent = "Editar Maquinaria";
    document.getElementById("btn-submit-machine-modal").textContent = "Guardar Cambios";
    document.getElementById("edit-machine-original-id").value = machine.id;

    const idInput = document.getElementById("new-machine-id");
    idInput.value = machine.id;
    idInput.readOnly = true; // El ID es la llave única usada en órdenes; no se cambia al editar

    document.getElementById("new-machine-name").value = machine.name || "";
    document.getElementById("new-machine-brand").value = machine.brand || "";
    document.getElementById("new-machine-model").value = machine.model || "";
    document.getElementById("new-machine-status").value = machine.status || "Operando";
    document.getElementById("new-machine-operation-type").value = machine.operationType || "";

    const areaSelect = document.getElementById("new-machine-area");
    // Si el área actual no está en la lista (ej. "Corte" viejo), la agregamos temporalmente
    // para que se vea reflejada y el usuario la pueda corregir conscientemente.
    if (machine.area && ![...areaSelect.options].some(o => o.value === machine.area)) {
        const opt = document.createElement("option");
        opt.value = machine.area;
        opt.textContent = `${machine.area} (departamento no válido, corrígelo)`;
        areaSelect.appendChild(opt);
    }
    areaSelect.value = machine.area || "";

    openModal("add-machine-modal");
}

function createOrderShortcut(machineId) {
    document.getElementById("order-machine-id").value = machineId;
    navigateToPage("orders");
}

// Render Work Orders Board
function populateWorkOrders() {
    const listPending = document.getElementById("list-pending-orders");
    const listProgress = document.getElementById("list-progress-orders");

    listPending.innerHTML = "";
    listProgress.innerHTML = "";

    let countPending = 0;
    let countProgress = 0;

    state.orders.forEach(o => {
        if (o.status === "Resuelto") return;

        const machine = state.machinery.find(m => m.id === o.machineId) || { name: "Maquinaria Desconocida" };
        
        const card = document.createElement("div");
        card.className = "board-card";
        card.onclick = () => openOrderActions(o.id);

        let obsHtml = "";
        if (o.observations && o.observations.trim() !== "") {
            obsHtml = `<div class="board-card-obs"><strong>Obs:</strong> ${o.observations}</div>`;
        }

        card.innerHTML = `
            <div class="board-card-header">
                <span class="board-card-title">${machine.name}</span>
                <span class="feed-badge badge-priority-${o.priority}">${o.priority}</span>
            </div>
            <p class="board-card-desc">${o.description}</p>
            ${obsHtml}
            <div class="board-card-footer">
                <span class="board-card-meta"><i data-lucide="user" style="width:11px;height:11px"></i> ${o.mechanic}</span>
                <span class="board-card-meta"><i data-lucide="clock" style="width:11px;height:11px"></i> ${new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
            ${o.enteredBy ? `<div class="board-card-meta" style="margin-top:4px;"><i data-lucide="user-check" style="width:11px;height:11px"></i> Ingresado por: ${o.enteredBy}</div>` : ""}
        `;

        if (o.status === "Pendiente") {
            listPending.appendChild(card);
            countPending++;
        } else if (o.status === "En Proceso") {
            listProgress.appendChild(card);
            countProgress++;
        }
    });

    document.getElementById("count-pending-list").textContent = countPending;
    document.getElementById("count-progress-list").textContent = countProgress;

    // Seeding Dropdowns
    const selectMachine = document.getElementById("order-machine-id");
    const selectedVal = selectMachine.value;
    selectMachine.innerHTML = '<option value="" disabled selected>Seleccione la maquinaria...</option>';
    
    state.machinery.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = `${m.name} [${m.id}] - ${m.area}`;
        selectMachine.appendChild(opt);
    });

    if (selectedVal) selectMachine.value = selectedVal;

    lucide.createIcons();
}

// --- CIERRE DE ORDEN CON CAMBIO DE REPUESTO ---
let pendingCloseOrderId = null;   // Orden que está en proceso de cierre
let selectedChangedParts = [];    // [{ partId, name, partNumber, qty }]

function openPartSelectionModal() {
    selectedChangedParts = [];
    document.getElementById("part-change-search-input").value = "";
    renderPartSearchResults("");
    renderSelectedChangedParts();
    openModal("select-changed-parts-modal");
}

function renderPartSearchResults(query) {
    const container = document.getElementById("part-change-search-results");
    if (!container) return;

    const q = query.toLowerCase();
    const results = (state.parts || []).filter(p => {
        if (q === "") return false; // No mostrar el catálogo completo hasta que se busque algo
        return p.name.toLowerCase().includes(q) ||
               p.partNumber.toLowerCase().includes(q) ||
               (p.inventoryNumber && p.inventoryNumber.toLowerCase().includes(q));
    }).slice(0, 15);

    if (q === "") {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9em; padding: 4px 0;">Escribe el nombre, número de pieza o número de inventario para buscar en el catálogo...</p>`;
        return;
    }

    if (results.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9em; padding: 4px 0;">No se encontraron piezas que coincidan con "${query}".</p>`;
        return;
    }

    container.innerHTML = results.map(p => {
        const priceFormatted = p.price != null
            ? `L ${Number(p.price).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : 'N/A';
        return `
            <div class="part-search-result-item">
                <div class="part-result-info">
                    <strong>${p.name}</strong>
                    <small>${p.partNumber} · ${priceFormatted}</small>
                </div>
                <button type="button" class="btn btn-primary" style="padding: 6px 12px;" onclick="addChangedPart('${p.id}')">
                    <i data-lucide="plus"></i>
                    <span>Agregar</span>
                </button>
            </div>
        `;
    }).join("");

    lucide.createIcons();
}

function addChangedPart(partId) {
    const part = state.parts.find(p => p.id === partId);
    if (!part) return;

    const existing = selectedChangedParts.find(sp => sp.partId === partId);
    if (existing) {
        existing.qty += 1;
    } else {
        selectedChangedParts.push({
            partId: part.id,
            name: part.name,
            partNumber: part.partNumber,
            qty: 1,
            unitPrice: part.price != null ? Number(part.price) : 0
        });
    }
    renderSelectedChangedParts();
}

function updateChangedPartQty(partId, qty) {
    const sp = selectedChangedParts.find(sp => sp.partId === partId);
    const part = state.parts.find(p => p.id === partId);
    if (!sp || !part) return;

    let newQty = parseInt(qty, 10);
    if (isNaN(newQty) || newQty < 1) newQty = 1;
    sp.qty = newQty;
    renderSelectedChangedParts();
}

function removeChangedPart(partId) {
    selectedChangedParts = selectedChangedParts.filter(sp => sp.partId !== partId);
    renderSelectedChangedParts();
}

function renderSelectedChangedParts() {
    const container = document.getElementById("part-change-selected-list");
    if (!container) return;

    if (selectedChangedParts.length === 0) {
        container.innerHTML = `<p class="empty-selected-parts-msg" style="color: var(--text-muted); font-size: 0.9em;">Aún no has agregado ninguna pieza.</p>`;
        return;
    }

    container.innerHTML = selectedChangedParts.map(sp => {
        const subtotal = (sp.unitPrice || 0) * sp.qty;
        const subtotalFormatted = `L ${subtotal.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return `
        <div class="part-selected-item">
            <div class="part-result-info">
                <strong>${sp.name}</strong>
                <small>${sp.partNumber} · Subtotal: ${subtotalFormatted}</small>
            </div>
            <input type="number" min="1" class="form-control input-dark part-selected-qty-input" value="${sp.qty}" onchange="updateChangedPartQty('${sp.partId}', this.value)">
            <button type="button" class="btn btn-danger" style="padding: 6px 10px;" onclick="removeChangedPart('${sp.partId}')" title="Quitar pieza">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
    `;
    }).join("");

    lucide.createIcons();
}

// Cierra definitivamente la orden de trabajo, ya con la decisión de repuestos resuelta
function finalizeCloseOrder(orderId, usedParts) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    order.status = "Resuelto";
    order.resolvedAt = new Date().toISOString();
    order.usedParts = (usedParts || []).map(p => ({
        partId: p.partId, name: p.name, partNumber: p.partNumber, qty: p.qty,
        unitPrice: p.unitPrice != null ? Number(p.unitPrice) : 0
    }));

    // Re-evaluate machinery status
    // If there are no other active warnings or outages on this machine, return status to "Operando"
    const otherActiveOnMachine = state.orders.some(o => o.machineId === order.machineId && o.status !== "Resuelto" && o.id !== orderId);
    if (!otherActiveOnMachine) {
        const machine = state.machinery.find(m => m.id === order.machineId);
        if (machine) {
            machine.status = "Operando";
            saveMachinery();
        }
    }

    saveOrders();
    populateWorkOrders();
    populateDashboard();
    if (document.getElementById("parts-cards-container")) {
        populateParts();
    }
}

// --- ORDER ACTION ACTIONS AND MODALS ---
function openOrderActions(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const machine = state.machinery.find(m => m.id === order.machineId) || { name: "Desconocida" };

    document.getElementById("modal-order-id").value = order.id;
    document.getElementById("modal-machine-name").textContent = machine.name;
    document.getElementById("modal-machine-id-text").textContent = order.machineId;
    document.getElementById("modal-defect-desc").textContent = order.description;
    document.getElementById("modal-assigned-mechanic").textContent = order.mechanic;
    document.getElementById("modal-entered-by").textContent = order.enteredBy || "N/A";
    
    const statusBadge = document.getElementById("modal-status-badge");
    statusBadge.textContent = order.status;
    statusBadge.className = `badge badge-status-${order.status.split(' ')[0]}`;

    document.getElementById("modal-observations-input").value = order.observations || "";

    // Mostrar piezas cambiadas, si las hubo
    const usedPartsLine = document.getElementById("modal-used-parts-line");
    const usedPartsText = document.getElementById("modal-used-parts-text");
    if (order.usedParts && order.usedParts.length > 0) {
        usedPartsText.textContent = order.usedParts.map(p => {
            const cost = (p.unitPrice || 0) * p.qty;
            return `${p.name} (${p.partNumber}) x${p.qty} - L ${cost.toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
        }).join(", ");
        usedPartsLine.style.display = "block";
    } else {
        usedPartsLine.style.display = "none";
    }

    // Toggle button views depending on status
    const btnProgress = document.getElementById("btn-modal-progress");
    const btnResolve = document.getElementById("btn-modal-resolve");

    if (order.status === "Pendiente") {
        btnProgress.style.display = "inline-flex";
        btnResolve.style.display = "none";
    } else if (order.status === "En Proceso") {
        btnProgress.style.display = "none";
        btnResolve.style.display = "inline-flex";
    } else {
        btnProgress.style.display = "none";
        btnResolve.style.display = "none";
    }

    openModal("observations-modal");
}

// --- MODAL UTILS ---
function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

// --- CONFIRMACIÓN CON PIN DE JEFE (usada para agregar/editar/eliminar maquinaria) ---
// Muestra el mismo teclado de PIN que la sección de Reportes y, si el PIN ingresado
// coincide con BOSS_PIN, ejecuta la función `onConfirm` que se le pase.
let pendingPinConfirmCallback = null;

function requestBossPinConfirmation(message, onConfirm) {
    pendingPinConfirmCallback = onConfirm;
    document.getElementById("confirm-pin-message").textContent =
        message || "Ingresa el PIN de jefe de área para confirmar este cambio.";
    document.getElementById("confirm-pin-digit-input").value = "";
    document.getElementById("confirm-pin-error-msg").style.display = "none";
    openModal("confirm-pin-modal");
    document.getElementById("confirm-pin-digit-input").focus();
}

function closeConfirmPinModal() {
    closeModal("confirm-pin-modal");
    pendingPinConfirmCallback = null;
}

// --- REPORTS VIEW & EXPORT ENGINE ---

// Los inputs <input type="date"> devuelven "YYYY-MM-DD". new Date("YYYY-MM-DD") lo
// interpreta como medianoche UTC, no como medianoche local. En zonas horarias detrás
// de UTC (como Honduras, UTC-6) eso corre el día hacia atrás y excluye casos resueltos
// "hoy" del reporte. Estas funciones arman/leen la fecha usando componentes locales.
function parseLocalDate(dateStr, endOfDay) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return endOfDay
        ? new Date(y, m - 1, d, 23, 59, 59, 999)
        : new Date(y, m - 1, d, 0, 0, 0, 0);
}

function toLocalDateInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function generateReportTable() {
    const startDateVal = document.getElementById("report-start-date").value;
    const endDateVal = document.getElementById("report-end-date").value;
    const tbody = document.getElementById("report-table-body");
    
    tbody.innerHTML = "";

    // Filter only CLOSED (Resolved) cases in the report
    let filtered = state.orders.filter(o => o.status === "Resuelto");

    if (startDateVal) {
        const start = parseLocalDate(startDateVal, false);
        filtered = filtered.filter(o => new Date(o.resolvedAt) >= start);
    }
    if (endDateVal) {
        const end = parseLocalDate(endDateVal, true);
        filtered = filtered.filter(o => new Date(o.resolvedAt) <= end);
    }

    // Sort by resolution date descending
    filtered.sort((a,b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));

    // Stats calculations for filter period
    const totalCount = filtered.length;
    let totalHrs = 0;
    let resolvedCount = 0;

    filtered.forEach(o => {
        if (o.resolvedAt && o.createdAt) {
            const diff = parseFloat(calculateDiffHours(o.createdAt, o.resolvedAt));
            totalHrs += diff;
            resolvedCount++;
        }
    });

    const avgHrs = resolvedCount > 0 ? (totalHrs / resolvedCount).toFixed(1) : "--";

    document.getElementById("rep-stat-total").textContent = totalCount;
    document.getElementById("rep-stat-closed").textContent = resolvedCount;
    document.getElementById("rep-stat-open").textContent = state.orders.filter(o => o.status !== "Resuelto").length;
    document.getElementById("rep-stat-time").textContent = avgHrs !== "--" ? `${avgHrs} hrs` : "--";

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; color: var(--text-muted);">
                    No se encontraron casos resueltos en el rango de fechas seleccionado.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(o => {
        const machine = state.machinery.find(m => m.id === o.machineId) || { name: "Desconocida", area: "N/A" };
        const tr = document.createElement("tr");
        
        tr.innerHTML = `
            <td><strong>${o.id}</strong></td>
            <td>${machine.name} <br><small style="color:var(--text-muted)">${o.machineId}</small></td>
            <td>${machine.area}</td>
            <td><span class="badge badge-priority-${o.priority}">${o.priority}</span></td>
            <td>${o.description}</td>
            <td>${o.mechanic}</td>
            <td>${formatDate(o.createdAt)}</td>
            <td>${formatDate(o.resolvedAt)}</td>
            <td><div style="max-width:250px; white-space:normal;">${o.observations || 'Sin observaciones'}</div></td>
            <td><div style="max-width:200px; white-space:normal;">${o.usedParts && o.usedParts.length > 0 ? o.usedParts.map(p => `${p.name} x${p.qty}`).join(", ") : 'Ninguna'}</div></td>
            <td>${o.usedParts && o.usedParts.length > 0 ? 'L ' + o.usedParts.reduce((sum, p) => sum + ((p.unitPrice || 0) * p.qty), 0).toLocaleString('es-HN', {minimumFractionDigits:2, maximumFractionDigits:2}) : 'L 0.00'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Prepara el buscador de máquina del reporte de gastos (limpia resultados previos)
function populateMachineReportSelect() {
    const searchInput = document.getElementById("report-machine-search-input");
    const resultsBox = document.getElementById("report-machine-search-results");
    if (!searchInput || !resultsBox) return;
    resultsBox.innerHTML = "";
}

// Filtra y muestra las máquinas que coinciden con la búsqueda (nombre, código o área)
function renderMachineReportSearchResults(query) {
    const container = document.getElementById("report-machine-search-results");
    if (!container) return;

    const q = query.trim().toLowerCase();
    if (q === "") {
        container.innerHTML = "";
        return;
    }

    const results = state.machinery.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.area && m.area.toLowerCase().includes(q))
    ).slice(0, 20);

    if (results.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9em; padding: 4px 0;">No se encontraron máquinas que coincidan con "${query}".</p>`;
        return;
    }

    container.innerHTML = results.map(m => `
        <div class="part-search-result-item" style="cursor:pointer;" onclick="selectReportMachine('${m.id}')">
            <div class="part-result-info">
                <strong>${m.name}</strong>
                <small>${m.id} · ${m.area}</small>
            </div>
        </div>
    `).join("");
}

// Guarda la máquina elegida y limpia el listado de resultados
function selectReportMachine(machineId) {
    const machine = state.machinery.find(m => m.id === machineId);
    if (!machine) return;

    document.getElementById("report-machine-select-id").value = machine.id;
    document.getElementById("report-machine-search-input").value = `${machine.name} [${machine.id}]`;
    document.getElementById("report-machine-search-results").innerHTML = "";
    document.getElementById("report-machine-selected-label").textContent = `Seleccionada: ${machine.name} (${machine.area})`;
}

// Genera el reporte Excel de gastos en piezas cambiadas para una máquina específica
function exportMachinePartsReport() {
    const machineId = document.getElementById("report-machine-select-id").value;
    if (!machineId) {
        alert("Por favor busca y selecciona una máquina de la lista antes de descargar el reporte.");
        return;
    }

    const machine = state.machinery.find(m => m.id === machineId);
    if (!machine) {
        alert("No se encontró la máquina seleccionada.");
        return;
    }

    // Recolectar cada cambio de pieza (gasto) registrado en órdenes cerradas de esta máquina
    const expenseRows = [];
    state.orders
        .filter(o => o.machineId === machineId && o.status === "Resuelto" && o.usedParts && o.usedParts.length > 0)
        .sort((a, b) => new Date(a.resolvedAt) - new Date(b.resolvedAt))
        .forEach(o => {
            o.usedParts.forEach(p => {
                const unitPrice = p.unitPrice || 0;
                const subtotal = unitPrice * p.qty;
                expenseRows.push([
                    formatDate(o.resolvedAt),
                    o.id,
                    p.name,
                    p.partNumber,
                    p.qty,
                    unitPrice,
                    subtotal
                ]);
            });
        });

    if (expenseRows.length === 0) {
        alert(`No hay piezas cambiadas registradas para "${machine.name}" todavía.`);
        return;
    }

    const grandTotal = expenseRows.reduce((sum, row) => sum + row[6], 0);

    // Construir la hoja de cálculo manualmente para poder incluir el encabezado y el total al final
    const sheetData = [
        ["Reporte de Gastos en Piezas por Máquina"],
        ["Máquina:", machine.name, "Código:", machine.id, "Área:", machine.area, "Tipo de Operación:", machine.operationType || "N/A"],
        [],
        ["Fecha", "Orden ID", "Pieza", "Número de Parte", "Cantidad", "Precio Unitario (LPS)", "Subtotal (LPS)"],
        ...expenseRows,
        [],
        ["", "", "", "", "", "TOTAL GASTADO:", grandTotal]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    worksheet["!cols"] = [
        {wch: 14}, // Fecha
        {wch: 12}, // Orden ID
        {wch: 28}, // Pieza
        {wch: 20}, // Número de Parte
        {wch: 10}, // Cantidad
        {wch: 20}, // Precio Unitario
        {wch: 16}  // Subtotal
    ];

    const workbook = XLSX.utils.book_new();
    // El nombre de la hoja no puede exceder 31 caracteres ni tener ciertos caracteres especiales
    const safeSheetName = machine.name.replace(/[\\/*?:\[\]]/g, "").substring(0, 31) || "Gastos Maquina";
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

    const safeFileName = machine.name.replace(/[^a-zA-Z0-9_\-]/g, "_");
    XLSX.writeFile(workbook, `Reporte_Gastos_${safeFileName}_${machine.id}.xlsx`);
}

// Calcula las estadísticas y arma la tabla detallada del mecánico seleccionado
function generateMechanicReport() {
    const mechanic = document.getElementById("report-mechanic-select").value;
    const statsBox = document.getElementById("mechanic-report-stats");
    const tableWrapper = document.getElementById("mechanic-report-table-wrapper");

    if (!mechanic) {
        alert("Por favor selecciona un mecánico antes de generar el reporte.");
        return;
    }

    const mechanicOrders = state.orders.filter(o => o.mechanic === mechanic);
    const resolvedOrders = mechanicOrders.filter(o => o.status === "Resuelto");
    const activeOrders = mechanicOrders.filter(o => o.status !== "Resuelto");

    // Tiempo promedio de resolución (en horas), solo sobre órdenes ya cerradas
    let avgHoursLabel = "-- hrs";
    if (resolvedOrders.length > 0) {
        const totalHours = resolvedOrders.reduce((sum, o) => sum + parseFloat(calculateDiffHours(o.createdAt, o.resolvedAt) || 0), 0);
        avgHoursLabel = `${(totalHours / resolvedOrders.length).toFixed(1)} hrs`;
    }

    // Costo total de piezas utilizadas en las órdenes que este mecánico ha cerrado
    const totalPartsCost = resolvedOrders.reduce((sum, o) => {
        if (!o.usedParts || o.usedParts.length === 0) return sum;
        return sum + o.usedParts.reduce((s, p) => s + ((p.unitPrice || 0) * p.qty), 0);
    }, 0);

    document.getElementById("mech-stat-total").textContent = mechanicOrders.length;
    document.getElementById("mech-stat-resolved").textContent = resolvedOrders.length;
    document.getElementById("mech-stat-active").textContent = activeOrders.length;
    document.getElementById("mech-stat-time").textContent = avgHoursLabel;
    document.getElementById("mech-stat-cost").textContent = "L " + totalPartsCost.toLocaleString('es-HN', {minimumFractionDigits: 2, maximumFractionDigits: 2});

    // Tabla detallada, de la orden más reciente a la más antigua
    const tbody = document.getElementById("mechanic-report-table-body");
    tbody.innerHTML = "";

    const sortedOrders = [...mechanicOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (sortedOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color: var(--text-muted);">Este mecánico no tiene órdenes registradas todavía.</td></tr>`;
    } else {
        sortedOrders.forEach(o => {
            const machine = state.machinery.find(m => m.id === o.machineId) || { name: "Maquinaria Desconocida", area: "N/A" };
            const partsCost = o.usedParts && o.usedParts.length > 0
                ? o.usedParts.reduce((sum, p) => sum + ((p.unitPrice || 0) * p.qty), 0)
                : 0;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${o.id}</td>
                <td>${machine.name}</td>
                <td>${machine.area}</td>
                <td>${o.priority || 'N/A'}</td>
                <td>${o.status}</td>
                <td><div style="max-width:220px; white-space:normal;">${o.description || ''}</div></td>
                <td>${formatDate(o.createdAt)}</td>
                <td>${o.status === "Resuelto" ? formatDate(o.resolvedAt) : '--'}</td>
                <td><div style="max-width:200px; white-space:normal;">${o.usedParts && o.usedParts.length > 0 ? o.usedParts.map(p => `${p.name} x${p.qty}`).join(", ") : 'Ninguna'}</div></td>
                <td>${'L ' + partsCost.toLocaleString('es-HN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    statsBox.style.display = "grid";
    tableWrapper.style.display = "block";
}

// Genera y descarga el reporte Excel con todas las órdenes del mecánico seleccionado
function exportMechanicReport() {
    const mechanic = document.getElementById("report-mechanic-select").value;
    if (!mechanic) {
        alert("Por favor selecciona un mecánico de la lista antes de descargar el reporte.");
        return;
    }

    const mechanicOrders = state.orders.filter(o => o.mechanic === mechanic);
    if (mechanicOrders.length === 0) {
        alert(`No hay órdenes registradas para "${mechanic}" todavía.`);
        return;
    }

    const sortedOrders = [...mechanicOrders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const dataForExcel = sortedOrders.map(o => {
        const machine = state.machinery.find(m => m.id === o.machineId) || { name: "Maquinaria Desconocida", area: "N/A" };
        const partsCost = o.usedParts && o.usedParts.length > 0
            ? o.usedParts.reduce((sum, p) => sum + ((p.unitPrice || 0) * p.qty), 0)
            : 0;
        return {
            "ID Orden": o.id,
            "Nombre Máquina": machine.name,
            "Área Planta": machine.area,
            "Criticidad": o.priority,
            "Estado": o.status,
            "Falla / Tarea": o.description,
            "Fecha Creación": new Date(o.createdAt).toLocaleString("es-MX"),
            "Fecha Resolución": o.status === "Resuelto" ? new Date(o.resolvedAt).toLocaleString("es-MX") : "--",
            "Horas de Inactividad": o.status === "Resuelto" ? calculateDiffHours(o.createdAt, o.resolvedAt) : "--",
            "Observaciones Finales": o.observations || "",
            "Piezas Cambiadas": o.usedParts && o.usedParts.length > 0 ? o.usedParts.map(p => `${p.name} (${p.partNumber}) x${p.qty}`).join(", ") : "Ninguna",
            "Costo Piezas (LPS)": partsCost
        };
    });

    const resolvedOrders = mechanicOrders.filter(o => o.status === "Resuelto");
    const totalPartsCost = resolvedOrders.reduce((sum, o) => {
        if (!o.usedParts || o.usedParts.length === 0) return sum;
        return sum + o.usedParts.reduce((s, p) => s + ((p.unitPrice || 0) * p.qty), 0);
    }, 0);

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    worksheet["!cols"] = [
        {wch: 12}, // ID Orden
        {wch: 28}, // Nombre Máquina
        {wch: 14}, // Área
        {wch: 12}, // Criticidad
        {wch: 12}, // Estado
        {wch: 40}, // Falla
        {wch: 22}, // Fecha Creación
        {wch: 22}, // Fecha Resolución
        {wch: 18}, // Horas Inactividad
        {wch: 40}, // Observaciones
        {wch: 40}, // Piezas Cambiadas
        {wch: 18}  // Costo Piezas
    ];

    // Añadir un resumen al final de la hoja
    XLSX.utils.sheet_add_aoa(worksheet, [
        [],
        ["", "", "", "", "", "", "", "", "", "", "TOTAL ÓRDENES:", mechanicOrders.length],
        ["", "", "", "", "", "", "", "", "", "", "ÓRDENES RESUELTAS:", resolvedOrders.length],
        ["", "", "", "", "", "", "", "", "", "", "COSTO TOTAL PIEZAS (LPS):", totalPartsCost]
    ], { origin: -1 });

    const workbook = XLSX.utils.book_new();
    // El nombre de la hoja no puede exceder 31 caracteres ni tener ciertos caracteres especiales
    const safeSheetName = mechanic.replace(/[\\/*?:\[\]]/g, "").substring(0, 31) || "Reporte Mecanico";
    XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

    const safeFileName = mechanic.replace(/[^a-zA-Z0-9_\-]/g, "_");
    XLSX.writeFile(workbook, `Reporte_Mecanico_${safeFileName}.xlsx`);
}

function exportReportToExcel() {
    const startDateVal = document.getElementById("report-start-date").value;
    const endDateVal = document.getElementById("report-end-date").value;

    let filtered = state.orders.filter(o => o.status === "Resuelto");

    if (startDateVal) {
        const start = parseLocalDate(startDateVal, false);
        filtered = filtered.filter(o => new Date(o.resolvedAt) >= start);
    }
    if (endDateVal) {
        const end = parseLocalDate(endDateVal, true);
        filtered = filtered.filter(o => new Date(o.resolvedAt) <= end);
    }

    // Map data to clean excel format JSON
    const dataForExcel = filtered.map(o => {
        const machine = state.machinery.find(m => m.id === o.machineId) || { name: "Maquinaria Desconocida", area: "N/A" };
        return {
            "ID Orden": o.id,
            "Código Máquina": o.machineId,
            "Nombre Máquina": machine.name,
            "Área Planta": machine.area,
            "Tipo de Operación": machine.operationType || "",
            "Criticidad": o.priority,
            "Defecto Reportado": o.description,
            "Mecánico Asignado": o.mechanic,
            "Ingresado Por": o.enteredBy || "",
            "Fecha Creación": new Date(o.createdAt).toLocaleString("es-MX"),
            "Fecha Resolución": new Date(o.resolvedAt).toLocaleString("es-MX"),
            "Horas de Inactividad": calculateDiffHours(o.createdAt, o.resolvedAt),
            "Observaciones Finales": o.observations || "",
            "Piezas Cambiadas": o.usedParts && o.usedParts.length > 0 ? o.usedParts.map(p => `${p.name} (${p.partNumber}) x${p.qty}`).join(", ") : "Ninguna",
            "Costo Total Piezas (LPS)": o.usedParts && o.usedParts.length > 0 ? o.usedParts.reduce((sum, p) => sum + ((p.unitPrice || 0) * p.qty), 0) : 0
        };
    });

    if (dataForExcel.length === 0) {
        alert("No hay registros en el rango actual para exportar.");
        return;
    }

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    
    // Style column widths for clean export
    const wscols = [
        {wch: 12}, // ID
        {wch: 16}, // Codigo
        {wch: 28}, // Nombre
        {wch: 14}, // Area
        {wch: 20}, // Tipo de Operación
        {wch: 12}, // Criticidad
        {wch: 45}, // Defecto
        {wch: 20}, // Mecánico
        {wch: 20}, // Ingresado Por
        {wch: 22}, // Creación
        {wch: 22}, // Resolución
        {wch: 18}, // Horas
        {wch: 45}, // Observaciones
        {wch: 45}, // Piezas Cambiadas
        {wch: 20}  // Costo Total Piezas
    ];
    worksheet["!cols"] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "Casos Cerrados Mecánica");

    // File name format with dates
    let filename = "Reporte_Monzini_Mecanica";
    if (startDateVal) filename += `_Desde_${startDateVal}`;
    if (endDateVal) filename += `_Hasta_${endDateVal}`;
    filename += ".xlsx";

    XLSX.writeFile(workbook, filename);
}

// --- SPA NAVIGATION SYSTEM ---
function navigateToPage(pageId) {
    // Stop camera if leaving scanner page
    if (pageId !== "scanner") {
        stopScanning();
    }

    // Render imediato con datos locales
    renderPageContent(pageId);

    // Si estamos en la nube, actualizar en segundo plano para ver cambios de otros dispositivos
    if (CONFIG_DATABASE_URL) {
        loadStateFromCloud().then(() => {
            if (pageId === "scanner") {
                populateWorkOrders(); // Solo actualizar el selector simulado, sin recargar cámara
            } else {
                renderPageContent(pageId); // Re-renderizar de forma segura
            }
        });
    }
}

function renderPageContent(pageId) {
    // Remove active state from all navs
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        if (item.getAttribute("data-page") === pageId) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Hide/show page sections
    const sections = document.querySelectorAll(".page-section");
    sections.forEach(sec => {
        if (sec.id === `page-${pageId}`) {
            sec.classList.add("active");
        } else {
            sec.classList.remove("active");
        }
    });

    // Run view hooks
    updateHeaderTitle(pageId);

    if (pageId === "dashboard") {
        populateDashboard();
    } else if (pageId === "machinery") {
        populateAreaFilterOptions();
        populateMachinery();
    } else if (pageId === "parts") {
        populateParts();
    } else if (pageId === "orders") {
        populateWorkOrders();
    } else if (pageId === "scanner") {
        initCameraScanner();
        populateWorkOrders();
    } else if (pageId === "reports") {
        checkReportsLock();
    }
}

function populateTelegramConfig() {
    const container = document.getElementById("telegram-mechanic-config-list");
    const backupContainer = document.getElementById("telegram-backup-config-list");
    if (!container) return;
    if (!state.mechanicTelegram) state.mechanicTelegram = {};
    if (!state.backupTelegram) state.backupTelegram = {};

    if (backupContainer) {
        backupContainer.innerHTML = BACKUP_LIST.map(name => {
            const safeId = `telegram-backup-chatid-${name.replace(/\s+/g, "_")}`;
            const currentVal = state.backupTelegram[name] || "";
            return `
                <div class="telegram-config-item" style="border-left: 3px solid var(--color-primary);">
                    <label for="${safeId}">${name}</label>
                    <input type="text" id="${safeId}" class="form-control input-dark" placeholder="Chat ID de Telegram (ej. 123456789)" value="${currentVal}">
                </div>
            `;
        }).join("");
    }

    container.innerHTML = MECHANIC_LIST.map(name => {
        const safeId = `telegram-chatid-${name.replace(/\s+/g, "_")}`;
        const currentVal = state.mechanicTelegram[name] || "";
        return `
            <div class="telegram-config-item">
                <label for="${safeId}">${name}</label>
                <input type="text" id="${safeId}" class="form-control input-dark" placeholder="Chat ID de Telegram (ej. 123456789)" value="${currentVal}">
            </div>
        `;
    }).join("");
}

function checkReportsLock() {
    const lockScreen = document.getElementById("reports-lock-screen");
    const reportsDashboard = document.getElementById("reports-dashboard");

    if (state.unlockedReports) {
        lockScreen.style.display = "none";
        reportsDashboard.style.display = "block";
        generateReportTable();
        populateMachineReportSelect();
        populateTelegramConfig();
    } else {
        lockScreen.style.display = "flex";
        reportsDashboard.style.display = "none";
        document.getElementById("pin-digit-input").value = "";
        document.getElementById("pin-error-msg").style.display = "none";
    }

    // Reinicia el panel del reporte por mecánico cada vez que se entra a la sección
    document.getElementById("report-mechanic-select").value = "";
    document.getElementById("mechanic-report-stats").style.display = "none";
    document.getElementById("mechanic-report-table-wrapper").style.display = "none";
}

// --- EVENT LISTENERS & INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    // 0. Iniciar sesión anónima en Firebase (necesario para que las reglas
    //    "auth != null" permitan leer/escribir en Realtime Database).
    initFirebaseAuth();

    // 0. Mobile menu (hamburger) toggle
    const sidebarEl = document.getElementById("app-sidebar");
    const sidebarOverlayEl = document.getElementById("sidebar-overlay");
    const mobileMenuBtn = document.getElementById("btn-mobile-menu");

    function openMobileMenu() {
        sidebarEl.classList.add("is-open");
        sidebarOverlayEl.classList.add("is-visible");
    }
    function closeMobileMenu() {
        sidebarEl.classList.remove("is-open");
        sidebarOverlayEl.classList.remove("is-visible");
    }
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            if (sidebarEl.classList.contains("is-open")) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }
    if (sidebarOverlayEl) {
        sidebarOverlayEl.addEventListener("click", closeMobileMenu);
    }

    // 1. Sidebar Nav click handlers
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const page = item.getAttribute("data-page");
            navigateToPage(page);
            closeMobileMenu(); // Cerrar el menú al elegir una sección (en móvil)
        });
    });

    // 2. Global Actions
    document.getElementById("quick-alert-btn").addEventListener("click", () => {
        navigateToPage("orders");
    });

    // Set header date
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    document.getElementById("header-date").textContent = new Date().toLocaleDateString('es-MX', options);

    // 3. Machinery catalog search / filter
    document.getElementById("machine-search-input").addEventListener("input", (e) => {
        const area = document.getElementById("machine-filter-area").value;
        populateMachinery(e.target.value, area);
    });

    document.getElementById("machine-filter-area").addEventListener("change", (e) => {
        const query = document.getElementById("machine-search-input").value;
        populateMachinery(query, e.target.value);
    });

    // 4. Modal machine catalog open/close
    document.getElementById("open-add-machine-btn").addEventListener("click", () => {
        resetMachineModalToAddMode();
        openModal("add-machine-modal");
    });
    
    const closeMachineModal = () => {
        closeModal("add-machine-modal");
        resetMachineModalToAddMode();
    };
    document.getElementById("btn-close-machine-modal").addEventListener("click", closeMachineModal);
    document.getElementById("btn-cancel-machine-modal").addEventListener("click", closeMachineModal);

    // 4b. Parts catalog modal open/close
    document.getElementById("open-add-part-btn").addEventListener("click", () => {
        resetPartModalToAddMode();
        document.getElementById("add-part-form").reset();
        openModal("add-part-modal");
    });

    const closePartModal = () => {
        closeModal("add-part-modal");
        resetPartModalToAddMode();
    };
    document.getElementById("btn-close-part-modal").addEventListener("click", closePartModal);
    document.getElementById("btn-cancel-part-modal").addEventListener("click", closePartModal);

    // Parts search
    document.getElementById("parts-search-input").addEventListener("input", (e) => {
        populateParts(e.target.value);
    });

    // Add / Edit part form
    document.getElementById("add-part-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const originalId = document.getElementById("edit-part-original-id").value;
        const nameVal = document.getElementById("new-part-name").value.trim();
        const partNumVal = document.getElementById("new-part-number").value.trim().toUpperCase();
        const priceVal = parseFloat(document.getElementById("new-part-price").value) || 0;
        const inventoryNumVal = document.getElementById("new-part-inventory").value.trim();
        const descVal = document.getElementById("new-part-description").value.trim();

        if (!state.parts) state.parts = [];

        if (originalId) {
            // --- MODO EDICIÓN ---
            const part = state.parts.find(p => p.id === originalId);
            if (!part) { alert("Error: no se encontró la pieza a editar."); return; }
            part.name = nameVal;
            part.partNumber = partNumVal;
            part.price = priceVal;
            part.inventoryNumber = inventoryNumVal;
            part.description = descVal;
            saveParts();
            closeModal("add-part-modal");
            resetPartModalToAddMode();
            e.target.reset();
            populateParts(document.getElementById("parts-search-input").value);
            return;
        }

        // --- MODO AGREGAR ---
        const newPart = {
            id: `part-${Date.now()}`,
            name: nameVal,
            partNumber: partNumVal,
            price: priceVal,
            inventoryNumber: inventoryNumVal,
            description: descVal,
            createdAt: new Date().toISOString()
        };
        state.parts.push(newPart);
        saveParts();
        closeModal("add-part-modal");
        e.target.reset();
        populateParts();
    });

    // Add / Edit machinery form (modo determinado por edit-machine-original-id)
    document.getElementById("add-machine-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const originalId = document.getElementById("edit-machine-original-id").value;
        const idVal = document.getElementById("new-machine-id").value.trim().toUpperCase();

        if (originalId) {
            // --- MODO EDICIÓN ---
            const machine = state.machinery.find(m => m.id === originalId);
            if (!machine) {
                alert("Error: no se encontró la máquina a editar.");
                return;
            }
            const updatedName = document.getElementById("new-machine-name").value.trim();
            const updatedArea = document.getElementById("new-machine-area").value;
            const updatedStatus = document.getElementById("new-machine-status").value;
            const updatedBrand = document.getElementById("new-machine-brand").value.trim() || "Genérica";
            const updatedModel = document.getElementById("new-machine-model").value.trim() || "N/A";
            const updatedOperationType = document.getElementById("new-machine-operation-type").value.trim();

            requestBossPinConfirmation(
                `Ingresa el PIN de jefe para guardar los cambios de "${machine.name}" (${machine.id}).`,
                () => {
                    machine.name = updatedName;
                    machine.area = updatedArea;
                    machine.status = updatedStatus;
                    machine.brand = updatedBrand;
                    machine.model = updatedModel;
                    machine.operationType = updatedOperationType;

                    saveMachinery();
                    closeModal("add-machine-modal");
                    resetMachineModalToAddMode();
                    e.target.reset();
                    populateAreaFilterOptions();
                    populateMachinery();
                }
            );
            return;
        }

        // --- MODO AGREGAR ---
        // Validate duplication
        if (state.machinery.some(m => m.id === idVal)) {
            alert("Error: Ya existe una maquinaria registrada con ese código QR.");
            return;
        }

        const newMachine = {
            id: idVal,
            name: document.getElementById("new-machine-name").value.trim(),
            area: document.getElementById("new-machine-area").value,
            status: document.getElementById("new-machine-status").value,
            brand: document.getElementById("new-machine-brand").value.trim() || "Genérica",
            model: document.getElementById("new-machine-model").value.trim() || "N/A",
            operationType: document.getElementById("new-machine-operation-type").value.trim(),
            createdAt: new Date().toISOString()
        };

        requestBossPinConfirmation(
            `Ingresa el PIN de jefe para registrar la máquina "${newMachine.name || newMachine.id}".`,
            () => {
                state.machinery.push(newMachine);
                saveMachinery();
                closeModal("add-machine-modal");
                e.target.reset();

                // Refresh and display machinery
                populateAreaFilterOptions();
                populateMachinery();
            }
        );
    });

    // 5. Work Order creation
    document.getElementById("create-order-form").addEventListener("submit", (e) => {
        e.preventDefault();
        
        const machineId = document.getElementById("order-machine-id").value;
        const newOrder = {
            id: `WO-${String(state.orders.length + 1).padStart(4, '0')}`,
            machineId: machineId,
            priority: document.getElementById("order-priority").value,
            description: document.getElementById("order-description").value.trim(),
            observations: document.getElementById("order-observations").value.trim(),
            mechanic: document.getElementById("order-mechanic").value,
            enteredBy: document.getElementById("order-entered-by").value,
            status: "Pendiente",
            createdAt: new Date().toISOString(),
            resolvedAt: null,
            usedParts: []
        };

        // Automatically set the machine status to "Fuera de Servicio" if priority is Crítica, or "Mantenimiento" if Alta/Media
        const machine = state.machinery.find(m => m.id === machineId);
        if (machine) {
            if (newOrder.priority === "Crítica") {
                machine.status = "Fuera de Servicio";
            } else if (newOrder.priority === "Alta" || newOrder.priority === "Media") {
                machine.status = "Mantenimiento";
            }
            saveMachinery();
        }

        state.orders.push(newOrder);
        saveOrders();
        e.target.reset();

        // Alerta automática por Telegram al mecánico asignado (si está configurado)
        if (newOrder.mechanic) {
            const machineName = machine ? (machine.name || machine.id) : machineId;
            const machineDept = machine ? (machine.area || "") : "";
            const mensaje =
                `🔧 <b>Nueva incidencia asignada</b>\n\n` +
                `<b>Orden:</b> ${newOrder.id}\n` +
                `<b>Máquina:</b> ${machineName}\n` +
                (machineDept ? `<b>Departamento:</b> ${machineDept}\n` : "") +
                `<b>Prioridad:</b> ${newOrder.priority}\n` +
                `<b>Ingresado por:</b> ${newOrder.enteredBy || "No especificado"}\n` +
                `<b>Descripción:</b> ${newOrder.description || "Sin descripción"}\n\n` +
                `Ingresa a la app de Monzini para ver el detalle completo.`;
            sendTelegramAlert(newOrder.mechanic, mensaje);
        }

        alert(`Orden ${newOrder.id} levantada exitosamente.`);
        navigateToPage("dashboard");
    });

    // 6. Camera scanner control
    document.getElementById("start-camera-btn").addEventListener("click", () => {
        const cameraSelect = document.getElementById("camera-source-select");
        const selectedId = cameraSelect ? cameraSelect.value : "";
        if (selectedId) {
            startScanning(selectedId);
        } else {
            // No hay cámara seleccionada todavía: reintentar la detección de dispositivos
            initCameraScanner();
        }
    });
    document.getElementById("stop-camera-btn").addEventListener("click", stopScanning);
    document.getElementById("btn-close-scanner-modal").addEventListener("click", () => closeModal("scanner-success-modal"));
    document.getElementById("btn-scanner-cancel").addEventListener("click", () => closeModal("scanner-success-modal"));

    // 7. Order Action Modal Actions
    document.getElementById("btn-close-modal").addEventListener("click", () => closeModal("observations-modal"));
    document.getElementById("btn-modal-cancel").addEventListener("click", () => closeModal("observations-modal"));
    
    document.getElementById("btn-modal-progress").addEventListener("click", () => {
        const orderId = document.getElementById("modal-order-id").value;
        const obs = document.getElementById("modal-observations-input").value.trim();
        
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.status = "En Proceso";
            order.observations = obs;
            saveOrders();
            closeModal("observations-modal");
            populateWorkOrders();
            populateDashboard();
        }
    });

    document.getElementById("btn-modal-resolve").addEventListener("click", () => {
        const orderId = document.getElementById("modal-order-id").value;
        const obs = document.getElementById("modal-observations-input").value.trim();
        
        if (obs === "") {
            alert("Por favor detalle las observaciones finales sobre cómo se resolvió la avería antes de cerrar el caso.");
            return;
        }

        const order = state.orders.find(o => o.id === orderId);
        if (!order) return;

        // Guardamos las observaciones acumuladas antes de preguntar por el repuesto
        order.observations = obs;
        saveOrders();

        // Preguntamos si se cambió algún repuesto antes de cerrar el caso
        pendingCloseOrderId = orderId;
        closeModal("observations-modal");
        openModal("confirm-part-change-modal");
    });

    // --- FLUJO: ¿CAMBIÓ REPUESTO AL CERRAR ORDEN? ---
    document.getElementById("btn-close-confirm-part-modal").addEventListener("click", () => {
        closeModal("confirm-part-change-modal");
        pendingCloseOrderId = null;
    });

    // No cambió repuesto: se cierra la orden de forma normal
    document.getElementById("btn-part-change-no").addEventListener("click", () => {
        const orderId = pendingCloseOrderId;
        closeModal("confirm-part-change-modal");
        if (orderId) {
            finalizeCloseOrder(orderId, []);
        }
        pendingCloseOrderId = null;
    });

    // Sí cambió repuesto: abrimos el buscador de piezas
    document.getElementById("btn-part-change-yes").addEventListener("click", () => {
        closeModal("confirm-part-change-modal");
        openPartSelectionModal();
    });

    // Cancelar la selección de piezas: regresamos a la orden sin cerrarla
    document.getElementById("btn-cancel-select-parts").addEventListener("click", () => {
        closeModal("select-changed-parts-modal");
        const orderId = pendingCloseOrderId;
        pendingCloseOrderId = null;
        if (orderId) {
            openOrderActions(orderId);
        }
    });
    document.getElementById("btn-close-select-parts-modal").addEventListener("click", () => {
        document.getElementById("btn-cancel-select-parts").click();
    });

    // Buscador de piezas dentro del modal de cierre de orden
    document.getElementById("part-change-search-input").addEventListener("input", (e) => {
        renderPartSearchResults(e.target.value.trim());
    });

    // Confirmar piezas seleccionadas y cerrar la orden descontando inventario
    document.getElementById("btn-accept-select-parts").addEventListener("click", () => {
        const orderId = pendingCloseOrderId;
        if (!orderId) return;

        if (selectedChangedParts.length === 0) {
            alert("Agrega al menos una pieza, o presiona 'Cancelar' y selecciona 'No' si finalmente no hubo cambio de repuesto.");
            return;
        }

        // Registrar piezas seleccionadas y cerrar la orden (sin control de cantidades en inventario)
        closeModal("select-changed-parts-modal");
        finalizeCloseOrder(orderId, selectedChangedParts);
        pendingCloseOrderId = null;
    });

    // Save observations without changing status
    document.getElementById("modal-observations-input").addEventListener("change", (e) => {
        const orderId = document.getElementById("modal-order-id").value;
        const order = state.orders.find(o => o.id === orderId);
        if (order) {
            order.observations = e.target.value.trim();
            saveOrders();
        }
    });

    // 8. PIN Security Keyboard handlers
    const pinDigitsInput = document.getElementById("pin-digit-input");
    const pinError = document.getElementById("pin-error-msg");

    document.querySelectorAll(".pin-keyboard .btn-kbd[data-val]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (pinDigitsInput.value.length < 4) {
                pinDigitsInput.value += btn.getAttribute("data-val");
            }
        });
    });

    document.getElementById("btn-pin-clear").addEventListener("click", () => {
        pinDigitsInput.value = "";
        pinError.style.display = "none";
    });

    document.getElementById("pin-login-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const pin = pinDigitsInput.value;
        if (pin === BOSS_PIN) {
            state.unlockedReports = true;
            pinError.style.display = "none";
            checkReportsLock();
        } else {
            pinError.style.display = "block";
            pinDigitsInput.value = "";
            playScannerBeep(); // Audio feedback of error
        }
    });

    // 8b. PIN de confirmación para cambios de maquinaria (agregar/editar/eliminar)
    const confirmPinInput = document.getElementById("confirm-pin-digit-input");
    const confirmPinError = document.getElementById("confirm-pin-error-msg");

    document.querySelectorAll("#confirm-pin-modal .btn-kbd[data-cval]").forEach(btn => {
        btn.addEventListener("click", () => {
            if (confirmPinInput.value.length < 4) {
                confirmPinInput.value += btn.getAttribute("data-cval");
            }
        });
    });

    document.getElementById("btn-confirm-pin-clear").addEventListener("click", () => {
        confirmPinInput.value = "";
        confirmPinError.style.display = "none";
    });

    document.getElementById("btn-confirm-pin-cancel").addEventListener("click", () => {
        closeConfirmPinModal();
    });

    document.getElementById("confirm-pin-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const pin = confirmPinInput.value;
        if (pin === BOSS_PIN) {
            const callback = pendingPinConfirmCallback;
            closeConfirmPinModal();
            if (typeof callback === "function") callback();
        } else {
            confirmPinError.style.display = "block";
            confirmPinInput.value = "";
            playScannerBeep();
        }
    });

    // Report Actions
    document.getElementById("btn-lock-reports").addEventListener("click", () => {
        state.unlockedReports = false;
        checkReportsLock();
    });

    // Default dates in report: last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    document.getElementById("report-start-date").value = toLocalDateInputValue(thirtyDaysAgo);
    document.getElementById("report-end-date").value = toLocalDateInputValue(today);

    document.getElementById("btn-apply-report-filters").addEventListener("click", generateReportTable);
    document.getElementById("btn-export-excel").addEventListener("click", exportReportToExcel);
    document.getElementById("btn-export-machine-report").addEventListener("click", exportMachinePartsReport);
    document.getElementById("btn-generate-mechanic-report").addEventListener("click", generateMechanicReport);
    document.getElementById("btn-export-mechanic-report").addEventListener("click", exportMechanicReport);
    document.getElementById("report-machine-search-input").addEventListener("input", (e) => {
        // Si el usuario edita el texto después de haber seleccionado una máquina, invalidamos la selección
        document.getElementById("report-machine-select-id").value = "";
        document.getElementById("report-machine-selected-label").textContent = "Ningún equipo seleccionado todavía.";
        renderMachineReportSearchResults(e.target.value);
    });
    document.getElementById("btn-print-report").addEventListener("click", () => {
        window.print();
    });

    // Configuración de Alertas por Telegram
    document.getElementById("btn-save-telegram-config").addEventListener("click", () => {
        if (!state.mechanicTelegram) state.mechanicTelegram = {};
        MECHANIC_LIST.forEach(name => {
            const input = document.getElementById(`telegram-chatid-${name.replace(/\s+/g, "_")}`);
            if (input) {
                const val = input.value.trim();
                if (val) {
                    state.mechanicTelegram[name] = val;
                } else {
                    delete state.mechanicTelegram[name];
                }
            }
        });
        saveMechanicTelegram();

        if (!state.backupTelegram) state.backupTelegram = {};
        BACKUP_LIST.forEach(name => {
            const input = document.getElementById(`telegram-backup-chatid-${name.replace(/\s+/g, "_")}`);
            if (input) {
                const val = input.value.trim();
                if (val) {
                    state.backupTelegram[name] = val;
                } else {
                    delete state.backupTelegram[name];
                }
            }
        });
        saveBackupTelegram();

        alert("✅ Configuración de Telegram guardada y sincronizada.");
    });

    // Admin: forzar la sobreescritura de la maquinaria en la nube con el catálogo del Excel
    document.getElementById("btn-resync-machinery-excel").addEventListener("click", async () => {
        const confirmed = confirm(
            "Esto va a REEMPLAZAR la lista de maquinaria guardada en la nube (Firebase) por el catálogo " +
            "completo de 594 máquinas importado del Excel de departamentos.\n\n" +
            "Las órdenes de trabajo existentes NO se borran.\n\n" +
            "¿Deseas continuar?"
        );
        if (!confirmed) return;

        const btn = document.getElementById("btn-resync-machinery-excel");
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i><span>Sincronizando...</span>`;
        if (window.lucide) window.lucide.createIcons();

        try {
            // Copia fresca del catálogo correcto embebido en el código (proviene del Excel)
            state.machinery = JSON.parse(JSON.stringify(DEFAULT_MACHINERY));
            localStorage.setItem("monzini_machinery", JSON.stringify(state.machinery));
            const result = await syncStateToCloud();

            if (!result || !result.ok) {
                alert(
                    `⚠️ La maquinaria se actualizó SOLO en este navegador, pero NO se pudo subir a la nube.\n\n` +
                    `Motivo: ${result ? result.reason : "desconocido"}\n\n` +
                    `Es probable que las reglas de seguridad de tu Firebase Realtime Database estén bloqueando ` +
                    `la escritura (necesitan permitir "write" público, o requieren autenticación). ` +
                    `Revisa la consola del navegador (F12) para más detalle, o dime el error exacto.`
                );
            } else {
                alert(`✅ Listo: se sincronizaron ${state.machinery.length} máquinas a la nube correctamente.`);
            }
            populateAreaFilterOptions();
            populateMachinery();
            populateDashboard();
        } catch (err) {
            console.error("Error al resincronizar maquinaria:", err);
            alert("Ocurrió un error inesperado al sincronizar. Revisa la consola del navegador (F12) y compárteme el mensaje de error.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            if (window.lucide) window.lucide.createIcons();
        }
    });

    // Hook click on sync status badge for force manual sync
    const syncBadge = document.getElementById("sync-status-badge");
    if (syncBadge) {
        syncBadge.addEventListener("click", forceSync);
    }

    // Initialize Page
    loadStateFromCloud().then(() => {
        navigateToPage("dashboard");
    });
});

// --- FUNCIÓN PARA ELIMINAR MAQUINARIA (ÁMBITO GLOBAL) ---
function deleteMachine(machineId) {
    const machine = state.machinery.find(m => m.id === machineId);
    if (!machine) return;

    requestBossPinConfirmation(
        `Vas a eliminar la máquina "${machine.name}" (${machine.id}). Esta acción no se puede deshacer. Ingresa el PIN de jefe para confirmar.`,
        () => {
            state.machinery = state.machinery.filter(m => m.id !== machineId);
            saveMachinery();

            const currentSearch = document.getElementById("machine-search-input")?.value || "";
            const currentArea = document.getElementById("machine-filter-area")?.value || "all";
            populateMachinery(currentSearch, currentArea);

            if (typeof populateDashboard === "function") {
                populateDashboard();
            }

            // Refresh the dropdown lists in other views too
            populateWorkOrders();
        }
    );
}
// --- FUNCIÓN PARA ELIMINAR PIEZAS (ÁMBITO GLOBAL) ---
function deletePart(partId) {
    if (confirm(`¿Está seguro de que desea eliminar esta pieza del catálogo? Esta acción no se puede deshacer.`)) {
        state.parts = (state.parts || []).filter(p => p.id !== partId);
        saveParts();
        populateParts(document.getElementById("parts-search-input")?.value || "");
    }
}

// --- SCRIPT CORRECTOR DE ARRANQUE IMPREVISTO (MAQUINARIA Y ÓRDENES) ---
(function() {
    // Restaurar caché de localStorage al cargar el archivo de manera síncrona inmediata
    const savedMac = localStorage.getItem("monzini_machinery");
    if (savedMac !== null) {
        state.machinery = JSON.parse(savedMac);
    }
    const savedOrd = localStorage.getItem("monzini_orders");
    if (savedOrd !== null) {
        state.orders = JSON.parse(savedOrd);
    }
})();