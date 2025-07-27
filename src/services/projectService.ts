// src/services/projectService.ts
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
  getDoc,
  setDoc,
  runTransaction,
  Firestore,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { ProjectType, ProjectDocument, ProjectImportData, FormattedAddress } from '@/types/project';
import { deletePaymentsForProject, getPaymentsForProject } from './paymentService';
import { deleteAfterSalesForProject } from './afterSalesService';
import { DEFAULT_REGION, DEFAULT_COUNTRY } from '@/constants/defaults';
import { createFirestoreFunction } from '@/lib/firebase/di';
import { docSnapshotToEntity, timestampToDate, prepareDataForFirestore, dateToTimestamp } from '@/utils/firestore-helpers';

const PROJECTS_COLLECTION = 'projects';

/**
 * Calcula el balance de un proyecto basado en el total y los pagos realizados
 * @param total - Total del proyecto
 * @param payments - Suma de pagos realizados
 * @returns El balance pendiente
 */
export const calculateProjectBalance = (total: number = 0, payments: number = 0): number => {
  return Math.max(0, (total || 0) - (payments || 0));
};

const projectFromDoc = (docSnapshot: DocumentSnapshot): ProjectType => {
  return docSnapshotToEntity<ProjectDocument, ProjectType>(
    docSnapshot,
    (data, id) => {
      // Solo lógica específica de proyecto
      let fullAddress: FormattedAddress | undefined;
      if (data.fullAddress) {
        // Si fullAddress ya existe en el documento, usarlo directamente
        fullAddress = data.fullAddress;
      } else if (data.address) {
        // Si no existe fullAddress pero sí los campos legados, crear una estructura fullAddress
        fullAddress = {
          textoCompleto: data.address,
          coordenadas: { latitude: 0, longitude: 0 },
          placeId: '', // Añadido
          componentes: {
            comuna: data.commune || '',
            region: data.region || '',
            pais: DEFAULT_COUNTRY
          }
        };
      }

      return {
        date: timestampToDate(data.date),
        isPaid: data.isPaid ?? false,
        fullAddress,
      };
    }
  );
};

/**
 * Implementación interna de getProjects con inyección de dependencias
 * @param firestore - Instancia de Firestore
 * @param clientId - ID del cliente para filtrar proyectos (opcional)
 * @returns Promesa con el array de proyectos, incluyendo información del cliente si está disponible
 */
const getProjectsImpl = async (firestore: Firestore, clientId?: string): Promise<ProjectType[]> => {
  const projectsCollectionRef = collection(firestore, PROJECTS_COLLECTION);
  let q;
  
  // Crear la consulta base
  if (clientId) {
    q = query(projectsCollectionRef, where('clientId', '==', clientId));
  } else {
    q = query(projectsCollectionRef);
  }
  
  // Obtener los proyectos
  const querySnapshot = await getDocs(q);
  let projects = querySnapshot.docs.map(projectFromDoc);
  
  // Obtener información de clientes para los proyectos
  const clientIds = [...new Set(projects.map(p => p.clientId))];
  const clientsPromises = clientIds.map(clientId => 
    getDoc(doc(firestore, 'clients', clientId)).catch(() => null)
  );
  const clientsSnapshots = await Promise.all(clientsPromises);
  
  // Crear un mapa de clientes para búsqueda rápida
  const clientsMap = clientsSnapshots.reduce((acc, clientDoc) => {
    if (clientDoc?.exists()) {
      const clientData = clientDoc.data();
      acc[clientDoc.id] = clientData?.name || 'Cliente no encontrado';
    }
    return acc;
  }, {} as Record<string, string>);
  
  // Enriquecer los proyectos con la información del cliente
  projects = projects.map(project => ({
    ...project,
    clientName: clientsMap[project.clientId] || 'Cliente no encontrado'
  }));
  
  // Ordenar los proyectos por fecha descendente
  return projects.sort((a, b) => b.date.getTime() - a.date.getTime());
};

/**
 * Obtiene todos los proyectos, opcionalmente filtrados por cliente
 * Soporta inyección de dependencias mediante getProjects.withFirestore(firestore, clientId)
 * @param clientId - ID del cliente para filtrar proyectos (opcional)
 * @returns Promesa con el array de proyectos, incluyendo información del cliente si está disponible
 */
export const getProjects = createFirestoreFunction(getProjectsImpl);

export const getProjectById = async (projectId: string): Promise<ProjectType | null> => {
  const projectDocRef = doc(db, PROJECTS_COLLECTION, projectId);
  const docSnap = await getDoc(projectDocRef);
  if (docSnap.exists()) {
    return projectFromDoc(docSnap);
  }
  return null;
};

export const createProject = async (projectData: Omit<ProjectType, 'id' | 'createdAt' | 'updatedAt' | 'total' | 'balance' | 'clientName'>): Promise<ProjectType> => {
  const projectsCollectionRef = collection(db, PROJECTS_COLLECTION);

  const subtotal = Number(projectData.subtotal) || 0;
  const taxRate = Number(projectData.taxRate) || 0;
  const total = subtotal * (1 + taxRate / 100);

  // Preparar datos usando utilidad
  const baseData = {
    ...projectData,
    date: dateToTimestamp(new Date(projectData.date)),
    subtotal,
    taxRate,
    total,
    balance: total,
    isPaid: false,
  };

  // Handle address compatibility
  if (projectData.fullAddress) {
    baseData.address = projectData.fullAddress.textoCompleto || '';
    baseData.commune = projectData.fullAddress.componentes?.comuna || '';
    baseData.region = projectData.fullAddress.componentes?.region || DEFAULT_REGION;
  }

  const dataToSave = prepareDataForFirestore(baseData);

  const docRef = await addDoc(projectsCollectionRef, dataToSave);
  const newDocSnap = await getDoc(docRef);
  return projectFromDoc(newDocSnap);
};


export const updateProject = async (projectId: string, projectData: Partial<Omit<ProjectType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  const projectDocRef = doc(db, PROJECTS_COLLECTION, projectId);

  const dataToUpdate: { [key: string]: any } = { ...projectData };

  // Convert date to Timestamp if it's a Date object
  if (dataToUpdate.date && dataToUpdate.date instanceof Date) {
    dataToUpdate.date = Timestamp.fromDate(dataToUpdate.date);
  }

  // Recalculate total and balance if subtotal or taxRate changes
  if (dataToUpdate.subtotal !== undefined || dataToUpdate.taxRate !== undefined) {
    const currentSnap = await getDoc(projectDocRef);
    const currentData = currentSnap.data() as ProjectDocument | undefined;

    const subtotal = dataToUpdate.subtotal !== undefined ? Number(dataToUpdate.subtotal) : Number(currentData?.subtotal || 0);
    const taxRate = dataToUpdate.taxRate !== undefined ? Number(dataToUpdate.taxRate) : Number(currentData?.taxRate || 0);
    
    dataToUpdate.total = subtotal * (1 + taxRate / 100);

    const payments = await getPaymentsForProject(projectId);
    const sumOfPayments = payments
      .filter(p => !p.isAdjustment && typeof p.amount === 'number')
      .reduce((sum, p) => sum + (p.amount || 0), 0);
      
    dataToUpdate.balance = calculateProjectBalance(dataToUpdate.total, sumOfPayments);
    dataToUpdate.isPaid = dataToUpdate.balance <= 0;
  }
  
  // Handle address compatibility
  if (dataToUpdate.fullAddress) {
    dataToUpdate.address = dataToUpdate.fullAddress.textoCompleto || '';
    dataToUpdate.commune = dataToUpdate.fullAddress.componentes?.comuna || '';
    dataToUpdate.region = dataToUpdate.fullAddress.componentes?.region || DEFAULT_REGION;
  }

  dataToUpdate.updatedAt = serverTimestamp();

  await updateDoc(projectDocRef, dataToUpdate);
};

/**
 * Adds a payment to a project and updates the project's balance within a transaction.
 * @param projectId The ID of the project to add the payment to.
 * @param amount The amount of the payment.
 * @param date The date of the payment.
 * @param isAdjustment Whether the payment is an adjustment.
 * @returns A promise that resolves when the operation is complete.
 */
export const addPaymentToProject = async (projectId: string, amount: number, date: Date, isAdjustment: boolean): Promise<void> => {
  // IMPLEMENTACIÓN ATÓMICA: Usa transacción Firebase para evitar race conditions
  // Esta implementación resuelve el problema de atomicidad identificado en auditoría
  
  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const paymentsCollectionRef = collection(db, 'payments');

  await runTransaction(db, async (transaction) => {
    // 1. Leer proyecto actual dentro de transacción
    const projectDoc = await transaction.get(projectRef);
    if (!projectDoc.exists()) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    const projectData = projectDoc.data() as ProjectDocument;
    
    // 2. Crear documento de pago con ID auto-generado
    const paymentRef = doc(paymentsCollectionRef);
    const paymentData = {
      projectId,
      amount,
      date: Timestamp.fromDate(date),
      method: 'transferencia', // Default method
      isAdjustment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // 3. Calcular nuevo balance basado en el balance actual
    const currentBalance = projectData.balance || 0;
    const newBalance = isAdjustment 
      ? currentBalance + amount  // Adjustments can be positive or negative
      : Math.max(0, currentBalance - amount); // Payments reduce balance
    
    const isPaid = newBalance <= 0;
    
    // 4. Actualizar proyecto con nuevo balance
    const projectUpdates = {
      balance: newBalance,
      isPaid,
      updatedAt: serverTimestamp(),
    };
    
    // 5. Ejecutar ambas operaciones atómicamente
    transaction.set(paymentRef, paymentData);
    transaction.update(projectRef, projectUpdates);
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await deletePaymentsForProject(projectId);
  await deleteAfterSalesForProject(projectId);

  const projectDocRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(projectDocRef);
};
