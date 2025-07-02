// scripts/test-connection-direct.js
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');
const firebaseConfig = require('./firebase-config');

console.log('🚀 Iniciando prueba de conexión directa con Firebase...');

// Mostrar información de configuración (sin la API key completa)
console.log('🔍 Configuración de Firebase:');
console.log('- Project ID:', firebaseConfig.projectId);
console.log('- Auth Domain:', firebaseConfig.authDomain);
console.log('- API Key:', firebaseConfig.apiKey ? '✅ Presente' : '❌ Faltante');

// Inicializar Firebase
console.log('\n🚀 Inicializando Firebase...');

(async () => {
  try {
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase inicializado correctamente');
    
    // Probar Firestore
    console.log('\n🔌 Probando conexión con Firestore...');
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
