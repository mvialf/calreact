// src/services/projectEventService.ts
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
  serverTimestamp,
  getDoc,
  Firestore,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { ProjectEventType, ProjectEventDocument, ProjectType } from '@/types/project';
import { createFirestoreFunction } from '@/lib/firebase/di';
import { 
  docSnapshotToEntity, 
  timestampToDate, 
  prepareDataForFirestore, 
  dateToTimestamp 
} from '@/utils/firestore-helpers';
import { getProjectById } from './projectService';
import { syncSingleProjectClientName } from './clientSyncService';
import { validateProjectEventData, sanitizeProjectEventData } from '@/utils/eventValidation';

const PROJECT_EVENTS_COLLECTION = 'projectEvents';

/**
 * Convierte un documento de Firestore a ProjectEventType
 */
const projectEventFromDoc = (docSnapshot: DocumentSnapshot): ProjectEventType => {
  return docSnapshotToEntity<ProjectEventDocument, ProjectEventType>(
    docSnapshot,
    (data, id) => ({
      eventDate: timestampToDate(data.eventDate),
    })
  );
};

/**
 * Implementación interna de getProjectEvents con inyección de dependencias
 * @param firestore - Instancia de Firestore
 * @param projectId - ID del proyecto para filtrar eventos (opcional)
 * @returns Promesa con el array de eventos de proyecto
 */
const getProjectEventsImpl = async (
  firestore: Firestore, 
  projectId?: string
): Promise<ProjectEventType[]> => {
  const eventsCollectionRef = collection(firestore, PROJECT_EVENTS_COLLECTION);
  let q;
  
  if (projectId) {
    q = query(
      eventsCollectionRef, 
      where('projectId', '==', projectId),
      orderBy('eventDate', 'desc')
    );
  } else {
    q = query(eventsCollectionRef, orderBy('eventDate', 'desc'));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(projectEventFromDoc);
};

/**
 * Obtiene todos los eventos de proyecto, opcionalmente filtrados por proyecto
 * Soporta inyección de dependencias mediante getProjectEvents.withFirestore(firestore, projectId)
 * @param projectId - ID del proyecto para filtrar eventos (opcional)
 * @returns Promesa con el array de eventos de proyecto
 */
export const getProjectEvents = createFirestoreFunction(getProjectEventsImpl);

/**
 * Obtiene un evento de proyecto por su ID
 * @param eventId - ID del evento
 * @returns Promesa con el evento o null si no existe
 */
export const getProjectEventById = async (eventId: string): Promise<ProjectEventType | null> => {
  const eventDocRef = doc(db, PROJECT_EVENTS_COLLECTION, eventId);
  const docSnap = await getDoc(eventDocRef);
  
  if (docSnap.exists()) {
    return projectEventFromDoc(docSnap);
  }
  return null;
};

/**
 * Crea un nuevo evento de proyecto con sincronización automática de cliente
 * @param eventData - Datos del evento sin id, createdAt, updatedAt
 * @param firestore - Instancia de Firestore (opcional)
 * @returns Promesa con el evento creado
 */
export const createProjectEvent = async (
  eventData: Omit<ProjectEventType, 'id' | 'createdAt' | 'updatedAt'>,
  firestore: Firestore = db
): Promise<ProjectEventType> => {
  console.log('🔄 Creando evento de proyecto...', { projectId: eventData.projectId });
  
  try {
    // 1. Validar datos del evento
    const validation = validateProjectEventData(eventData);
    if (!validation.isValid) {
      throw new Error(`Datos del evento inválidos: ${validation.errors.join(', ')}`);
    }
    
    // Log de warnings si existen
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Advertencias en datos del evento:', validation.warnings);
    }
    
    // 2. Obtener datos del proyecto
    if (!eventData.projectId) {
      throw new Error('ID del proyecto es requerido');
    }
    
    const projectData = await getProjectById(eventData.projectId);
    if (!projectData) {
      throw new Error(`Proyecto ${eventData.projectId} no encontrado`);
    }
    
    // 3. Sincronizar clientName del proyecto si es necesario
    if (projectData.clientId && !projectData.clientName) {
      console.log('🔄 Sincronizando nombre del cliente para el proyecto...');
      await syncSingleProjectClientName(eventData.projectId, firestore);
      
      // Recargar datos del proyecto después de la sincronización
      const updatedProject = await getProjectById(eventData.projectId);
      if (updatedProject) {
        Object.assign(projectData, updatedProject);
      }
    }
    
    // 4. Sanitizar y normalizar datos
    const sanitizedData = sanitizeProjectEventData(eventData, projectData);
    
    console.log('✅ Datos sanitizados:', {
      projectId: sanitizedData.projectId,
      clientName: sanitizedData.clientName,
      eventDate: sanitizedData.eventDate
    });
    
    // 5. Preparar datos para Firestore
    const baseData = {
      ...sanitizedData,
      eventDate: dateToTimestamp(sanitizedData.eventDate),
    };
    
    const dataToSave = prepareDataForFirestore(baseData);
    
    // 6. Guardar en Firestore
    const eventsCollectionRef = collection(firestore, PROJECT_EVENTS_COLLECTION);
    const docRef = await addDoc(eventsCollectionRef, dataToSave);
    const newDocSnap = await getDoc(docRef);
    
    const createdEvent = projectEventFromDoc(newDocSnap);
    console.log('🎉 Evento de proyecto creado exitosamente:', createdEvent.id);
    
    return createdEvent;
    
  } catch (error) {
    console.error('❌ Error al crear evento de proyecto:', error);
    throw error;
  }
};

/**
 * Actualiza un evento de proyecto con validación
 * @param eventId - ID del evento
 * @param eventData - Datos parciales para actualizar
 * @param firestore - Instancia de Firestore (opcional)
 * @returns Promesa que se resuelve cuando se completa la actualización
 */
export const updateProjectEvent = async (
  eventId: string, 
  eventData: Partial<Omit<ProjectEventType, 'id' | 'createdAt' | 'updatedAt'>>,
  firestore: Firestore = db
): Promise<void> => {
  console.log('🔄 Actualizando evento de proyecto:', eventId);
  
  try {
    // 1. Obtener evento actual
    const currentEvent = await getProjectEventById(eventId);
    if (!currentEvent) {
      throw new Error(`Evento ${eventId} no encontrado`);
    }
    
    // 2. Validar datos de actualización
    const mergedData = { ...currentEvent, ...eventData };
    const validation = validateProjectEventData(mergedData);
    
    if (!validation.isValid) {
      throw new Error(`Datos de actualización inválidos: ${validation.errors.join(', ')}`);
    }
    
    // 3. Preparar datos para actualizar
    const dataToUpdate: { [key: string]: any } = { ...eventData };
    
    // Convertir eventDate a Timestamp si es un Date object
    if (dataToUpdate.eventDate && dataToUpdate.eventDate instanceof Date) {
      dataToUpdate.eventDate = dateToTimestamp(dataToUpdate.eventDate);
    }
    
    // Validar campos numéricos
    if (dataToUpdate.windowsCount !== undefined) {
      dataToUpdate.windowsCount = Math.max(0, Math.floor(Number(dataToUpdate.windowsCount) || 0));
    }
    
    if (dataToUpdate.squareMeters !== undefined) {
      dataToUpdate.squareMeters = Math.max(0, Number(dataToUpdate.squareMeters) || 0);
    }
    
    dataToUpdate.updatedAt = serverTimestamp();
    
    // 4. Actualizar en Firestore
    const eventDocRef = doc(firestore, PROJECT_EVENTS_COLLECTION, eventId);
    await updateDoc(eventDocRef, dataToUpdate);
    
    console.log('✅ Evento de proyecto actualizado exitosamente:', eventId);
    
  } catch (error) {
    console.error('❌ Error al actualizar evento de proyecto:', error);
    throw error;
  }
};

/**
 * Elimina un evento de proyecto
 * @param eventId - ID del evento a eliminar
 * @param firestore - Instancia de Firestore (opcional)
 * @returns Promesa que se resuelve cuando se completa la eliminación
 */
export const deleteProjectEvent = async (
  eventId: string,
  firestore: Firestore = db
): Promise<void> => {
  console.log('🗑️ Eliminando evento de proyecto:', eventId);
  
  try {
    // Verificar que el evento existe antes de eliminarlo
    const eventExists = await getProjectEventById(eventId);
    if (!eventExists) {
      throw new Error(`Evento ${eventId} no encontrado`);
    }
    
    const eventDocRef = doc(firestore, PROJECT_EVENTS_COLLECTION, eventId);
    await deleteDoc(eventDocRef);
    
    console.log('✅ Evento de proyecto eliminado exitosamente:', eventId);
    
  } catch (error) {
    console.error('❌ Error al eliminar evento de proyecto:', error);
    throw error;
  }
};

/**
 * Obtiene todos los eventos de un proyecto específico con información enriquecida
 * @param projectId - ID del proyecto
 * @param firestore - Instancia de Firestore (opcional)
 * @returns Promesa con el array de eventos del proyecto
 */
export const getProjectEventsByProjectId = async (
  projectId: string,
  firestore: Firestore = db
): Promise<ProjectEventType[]> => {
  console.log('📅 Obteniendo eventos para proyecto:', projectId);
  
  try {
    const events = await getProjectEvents.withFirestore(firestore, projectId);
    console.log(`📋 ${events.length} eventos encontrados para proyecto ${projectId}`);
    return events;
  } catch (error) {
    console.error('❌ Error al obtener eventos del proyecto:', error);
    throw error;
  }
};

/**
 * Cuenta el número de eventos de un proyecto
 * @param projectId - ID del proyecto
 * @param firestore - Instancia de Firestore (opcional)
 * @returns Promesa con el número de eventos
 */
export const countProjectEvents = async (
  projectId: string,
  firestore: Firestore = db
): Promise<number> => {
  try {
    const events = await getProjectEventsByProjectId(projectId, firestore);
    return events.length;
  } catch (error) {
    console.error('❌ Error al contar eventos del proyecto:', error);
    return 0;
  }
};