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
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { ProjectType, ProjectDocument, ProjectImportData, FormattedAddress } from '@/types/project';
import { deletePaymentsForProject, getPaymentsForProject } from './paymentService';
import { deleteAfterSalesForProject } from './afterSalesService';
import { runTransaction } from 'firebase/firestore';

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

const projectFromDoc = (docSnapshot: any): ProjectType => {
  const data = docSnapshot.data() as ProjectDocument;
  
  // Reconstruir fullAddress a partir de los campos legados si existe
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
        pais: 'Chile'
      }
    };
  }

  return {
    id: docSnapshot.id,
    ...data,
    date: data.date && data.date.toDate ? data.date.toDate() : new Date(),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    isPaid: data.isPaid === undefined ? false : data.isPaid, // Default to false if not set
    fullAddress: fullAddress,
  } as ProjectType;
};

/**
 * Obtiene todos los proyectos, opcionalmente filtrados por cliente
 * @param clientId - ID del cliente para filtrar proyectos (opcional)
 * @returns Promesa con el array de proyectos, incluyendo información del cliente si está disponible
 */
export const getProjects = async (clientId?: string): Promise<ProjectType[]> => {
  const projectsCollectionRef = collection(db, PROJECTS_COLLECTION);
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
    getDoc(doc(db, 'clients', clientId)).catch(() => null)
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

  // Remove derived fields before saving
  const dataToSave: Omit<ProjectDocument, 'id'> = {
    ...projectData,
    date: Timestamp.fromDate(new Date(projectData.date)),
    subtotal,
    taxRate,
    total,
    balance: total,
    isPaid: false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  // Handle address compatibility
  if (projectData.fullAddress) {
    dataToSave.address = projectData.fullAddress.textoCompleto || '';
    dataToSave.commune = projectData.fullAddress.componentes?.comuna || '';
    dataToSave.region = projectData.fullAddress.componentes?.region || 'RM';
  }

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
    dataToUpdate.region = dataToUpdate.fullAddress.componentes?.region || 'RM';
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
  // TODO: This implementation is not atomic and can lead to race conditions.
  // A better approach would be to use a Cloud Function for a transaction that can perform queries,
  // or to denormalize a 'totalPayments' field on the project document and update it atomically.

  const projectRef = doc(db, PROJECTS_COLLECTION, projectId);
  const paymentsCollectionRef = collection(db, 'payments');

  // 1. Get current project data
  const projectDoc = await getDoc(projectRef);
  if (!projectDoc.exists()) {
    throw new Error("Project not found!");
  }
  const projectData = projectDoc.data() as ProjectType;

  // 2. Add the new payment
  await addDoc(paymentsCollectionRef, {
    projectId,
    amount,
    date: Timestamp.fromDate(date),
    method: 'transferencia', // Or another default/provided method
    isAdjustment,
    createdAt: serverTimestamp(),
  });

  // 3. Recalculate and update the project's balance
  const payments = await getPaymentsForProject(projectId);
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const newBalance = calculateProjectBalance(projectData.total || 0, totalPayments);

  await updateDoc(projectRef, {
    balance: newBalance,
    isPaid: newBalance <= 0,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await deletePaymentsForProject(projectId);
  await deleteAfterSalesForProject(projectId);

  const projectDocRef = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(projectDocRef);
};
