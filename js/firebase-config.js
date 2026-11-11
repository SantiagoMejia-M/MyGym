// Pega aquí la configuración de tu proyecto de Firebase
// (Consola de Firebase → Configuración del proyecto → Tus apps → App web → "firebaseConfig").
// Estos datos son públicos por diseño; la seguridad la dan las reglas de Firestore (firestore.rules).
// Mientras apiKey esté vacío, la app funciona en "modo local": las cuentas y datos se guardan solo en ese celular.
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
