// scripts/test-connection.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { config } from 'process';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

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

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
};

console.log('🔍 Verificando configuración de Firebase...');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:', firebaseConfig.authDomain);
console.log('API Key:', firebaseConfig.apiKey ? '✅ Presente' : '❌ Faltante');

// Función asíncrona para probar la conexión
async function testConnection() {
  try {
    console.log('🚀 Inicializando Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase inicializado correctamente');
    
    // Probar la conexión con Firestore
    console.log('🔌 Probando conexión con Firestore...');
    
    // Usar una promesa para manejar la operación asíncrona
    const testDoc = await getDoc(doc(db, 'metadata/service'));
    
    if (testDoc.exists()) {
      console.log('✅ Conexión con Firestore exitosa');
      console.log('Datos del documento de prueba:', testDoc.data());
    } else {
      console.log('ℹ️ El documento de prueba no existe, pero la conexión es exitosa');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar Firebase:', error);
    return false;
  }
}

// Ejecutar la prueba de conexión
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Error inesperado:', error);
    process.exit(1);
  });
