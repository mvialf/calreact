// scripts/test-firebase.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

console.log('🚀 Iniciando prueba de conexión con Firebase...');

// Verificar variables de entorno
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Faltan las siguientes variables de entorno:');
  missingVars.forEach(varName => console.error(`- ${varName}`));
  process.exit(1);
}

// Mostrar información de configuración (sin exponer la API key completa)
console.log('🔍 Configuración de Firebase:');
console.log('- Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('- Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('- API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Presente' : '❌ Faltante');

// Inicializar Firebase
console.log('\n🚀 Inicializando Firebase...');
const { initializeApp } = require('firebase/app');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

(async () => {
  try {
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado correctamente');
    
    // Probar Firestore
    console.log('\n🔌 Probando conexión con Firestore...');
    const { getFirestore, doc, getDoc } = require('firebase/firestore');
    const db = getFirestore(app);
    
    // Intentar leer un documento de prueba
    const testDoc = await getDoc(doc(db, 'metadata/service'));
    
    if (testDoc.exists()) {
      console.log('✅ Conexión con Firestore exitosa');
      console.log('Datos del documento de prueba:', testDoc.data());
    } else {
      console.log('ℹ️ El documento de prueba no existe, pero la conexión es exitosa');
    }
    
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    process.exit(1);
  }
})();
