import {
  Firestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getDoc } from 'firebase/firestore';
import type { EventType } from '@/types/event';

const EVENTS_COLLECTION = 'events';

// Helper para convertir un documento de Firestore a EventType
const fromFirestore = (docSnap: QueryDocumentSnapshot<DocumentData>): EventType => {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    startDate: (data.startDate as Timestamp).toDate(),
    endDate: (data.endDate as Timestamp).toDate(),
    description: data.description,
    color: data.color,
    type: data.type, // Añadido
    referenceId: data.referenceId, // Añadido
  };
};

/**
 * Obtiene todos los eventos para un usuario específico.
 */
export const getEvents = async (db: Firestore, userId: string): Promise<EventType[]> => {
  if (!userId) {
    console.error("User ID is required to fetch events.");
    return [];
  }
  try {
    const eventsCollectionRef = collection(db, EVENTS_COLLECTION);
    const q = query(eventsCollectionRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromFirestore);
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error; // O manejar de forma más específica
  }
};

/**
 * Añade un nuevo evento para un usuario específico.
 */
export const addEvent = async (
  db: Firestore,
  userId: string,
  eventData: Omit<EventType, 'id'>
): Promise<EventType> => {
  if (!userId) {
    throw new Error("User ID is required to add an event.");
  }
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      userId,
      startDate: Timestamp.fromDate(new Date(eventData.startDate)),
      endDate: Timestamp.fromDate(new Date(eventData.endDate)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    // Para devolver el evento completo, podríamos hacer otra lectura o construirlo
    // Por simplicidad, aquí devolvemos el eventData con el nuevo ID.
    return {
      id: docRef.id,
      ...eventData,
      startDate: new Date(eventData.startDate), // Aseguramos que las fechas devueltas sean Date
      endDate: new Date(eventData.endDate)
    };
  } catch (error) {
    console.error("Error adding event:", error);
    throw error;
  }
};

/**
 * Actualiza un evento existente para un usuario específico.
 */
export const updateEvent = async (
  db: Firestore,
  userId: string, // Aunque no se use directamente en la query por ID, es bueno para validación/seguridad futura
  eventId: string,
  eventData: Partial<Omit<EventType, 'id'>> // Permitimos actualizaciones parciales
): Promise<EventType> => {
  if (!userId) {
    throw new Error("User ID is required to update an event.");
  }
  if (!eventId) {
    throw new Error("Event ID is required to update an event.");
  }
  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
    
    // Preparamos los datos para actualizar, convirtiendo fechas a Timestamps si existen
    const updatePayload: { [key: string]: any } = { ...eventData, updatedAt: serverTimestamp() };
    if (eventData.startDate) {
      updatePayload.startDate = Timestamp.fromDate(new Date(eventData.startDate));
    }
    if (eventData.endDate) {
      updatePayload.endDate = Timestamp.fromDate(new Date(eventData.endDate));
    }

    await updateDoc(eventDocRef, updatePayload);

    const updatedDoc = await getDoc(eventDocRef);
    if (!updatedDoc.exists()) {
      throw new Error("Updated event not found!");
    }
    return fromFirestore(updatedDoc as QueryDocumentSnapshot<DocumentData>);

  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
};

/**
 * Elimina un evento para un usuario específico.
 */
export const deleteEvent = async (
  db: Firestore,
  userId: string, // Similar a updateEvent, para validación/seguridad
  eventId: string
): Promise<void> => {
  if (!userId) {
    throw new Error("User ID is required to delete an event.");
  }
  if (!eventId) {
    throw new Error("Event ID is required to delete an event.");
  }
  try {
    const eventDocRef = doc(db, EVENTS_COLLECTION, eventId);
    // Opcional: Antes de borrar, verificar que el evento pertenece al userId si la regla de seguridad no lo cubre
    await deleteDoc(eventDocRef);
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
};
