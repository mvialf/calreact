// scripts/fixAllBalances.ts
import { collection, getDocs, doc, getDoc, writeBatch, query, where, DocumentData } from 'firebase/firestore';
import { db } from '../src/lib/firebase/client';

// Definir la interfaz para los pagos
interface Payment {
  amount: number;
  isAdjustment?: boolean;
  projectId: string;
  // Agrega aquí otros campos si son necesarios
}

/**
 * Verifica la conexión con Firestore
 * @returns Promise<boolean> - true si la conexión es exitosa, false en caso contrario
 */
const checkFirestoreConnection = async (): Promise<boolean> => {
  console.log('🔍 Verificando conexión con Firestore...');
  
  try {
    // Intentar una operación de lectura simple
    const testDoc = await getDoc(doc(db, 'metadata/service'));
    console.log('✅ Conexión con Firestore establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con Firestore:', error);
    return false;
  }
};

/**
 * Obtiene todos los IDs de proyectos de la base de datos
 * @returns Promise<string[]> - Array con los IDs de los proyectos
 */
const getAllProjectIds = async (): Promise<string[]> => {
  console.log('📋 Obteniendo lista de proyectos...');
  
  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    const projectIds = projectsSnapshot.docs.map(doc => doc.id);
    
    if (projectIds.length === 0) {
      console.warn('⚠️ No se encontraron proyectos en la base de datos');
    } else {
      console.log(`📊 Se encontraron ${projectIds.length} proyectos`);
    }
    
    return projectIds;
  } catch (error) {
    console.error('❌ Error al obtener los proyectos:', error);
    throw error;
  }
};

/**
 * Corrige el balance de un proyecto específico
 * @param projectId - ID del proyecto a corregir
 * @returns Promise<number> - El nuevo balance calculado
 */
const fixSingleProjectBalance = async (projectId: string): Promise<number> => {
  try {
    console.log(`\n🔍 Procesando proyecto ${projectId}...`);
    
    // Obtener todos los pagos del proyecto
    const q = query(
      collection(db, 'payments'),
      where('projectId', '==', projectId)
    ).withConverter<Payment>({
      toFirestore: (data: Payment) => data,
      fromFirestore: (snap) => snap.data() as Payment
    });
    
    const paymentsSnapshot = await getDocs(q);
    
    let calculatedBalance = 0;
    
    // Calcular el balance basado en los pagos
    paymentsSnapshot.forEach(doc => {
      const payment = doc.data();
      calculatedBalance += payment.isAdjustment ? -payment.amount : payment.amount;
    });
    
    // Actualizar el balance del proyecto
    const projectRef = doc(db, 'projects', projectId);
    const batch = writeBatch(db);
    batch.update(projectRef, {
      balance: calculatedBalance,
      updatedAt: new Date()
    });
    
    await batch.commit();
    
    console.log(`✅ Proyecto ${projectId} - Balance actualizado a: $${calculatedBalance.toLocaleString()}`);
    return calculatedBalance;
  } catch (error) {
    console.error(`❌ Error al corregir el balance del proyecto ${projectId}:`, error);
    throw error;
  }
};

/**
 * Función principal que ejecuta la corrección de balances
 */
const main = async () => {
  try {
    console.log('🚀 Iniciando corrección de balances...');
    
    // Verificar conexión con Firestore
    const isConnected = await checkFirestoreConnection();
    if (!isConnected) {
      console.error('❌ No se pudo establecer conexión con Firestore');
      process.exit(1);
    }
    
    // Obtener todos los IDs de proyectos
    const projectIds = await getAllProjectIds();
    
    if (projectIds.length === 0) {
      console.log('ℹ️ No hay proyectos para procesar');
      process.exit(0);
    }
    
    console.log(`\n🔄 Procesando ${projectIds.length} proyectos...`);
    
    // Procesar cada proyecto
    let successCount = 0;
    let errorCount = 0;
    
    for (const projectId of projectIds) {
      try {
        await fixSingleProjectBalance(projectId);
        successCount++;
      } catch (error) {
        console.error(`❌ Error al procesar proyecto ${projectId}:`, error);
        errorCount++;
      }
    }
    
    // Mostrar resumen
    console.log('\n✨ Proceso de corrección completado');
    console.log(`✅ Proyectos actualizados correctamente: ${successCount}`);
    if (errorCount > 0) {
      console.warn(`⚠️  Proyectos con errores: ${errorCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error en el proceso principal:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Ejecutar la función principal
main();
