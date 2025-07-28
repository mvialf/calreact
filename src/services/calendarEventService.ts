// src/services/calendarEventService.ts
/**
 * Servicio para integrar eventos específicos de dominio (projectEvents, etc.) 
 * con el sistema de calendario que espera EventType[]
 */

// Firebase imports
import { Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

// Types imports
import type { EventType } from '@/types/event';
import type { ProjectEventType } from '@/types/project';

// Services imports
import { getProjectEvents } from './projectEventService';

// Utils imports
import { generateEventDisplayName } from '@/utils/eventValidation';

/**
 * Convierte un ProjectEventType a EventType para compatibilidad con el calendario
 */
function convertProjectEventToCalendarEvent(projectEvent: ProjectEventType): EventType {
  // Generar nombre usando la misma lógica que ClientDisplay en calendar-event.tsx
  const getEventName = (): string => {
    // Misma lógica que ClientDisplay: clientName o glosa como fallback
    return projectEvent.clientName?.trim() || projectEvent.glosa?.trim() || 'Cliente no especificado';
  };
  
  // Todos los proyectos usan el mismo color azul (según calendar-event.tsx)
  const getProjectColor = (): string => {
    return 'hsl(221, 83%, 53%)'; // Azul uniforme para todos los proyectos
  };

  return {
    id: projectEvent.id,
    name: getEventName(),
    startDate: projectEvent.eventDate,
    endDate: projectEvent.eventDate, // Eventos de proyecto son de un día
    description: [
      projectEvent.description,
      projectEvent.windowsCount ? `Ventanas: ${projectEvent.windowsCount}` : '',
      projectEvent.squareMeters ? `M²: ${projectEvent.squareMeters}` : '',
      projectEvent.uninstall ? 'Requiere desinstalación' : '',
      projectEvent.phone ? `Tel: ${projectEvent.phone}` : '',
    ].filter(Boolean).join(' • '),
    color: getProjectColor(),
    type: 'Proyecto',
    referenceId: projectEvent.projectId,
    status: projectEvent.status,
    location: projectEvent.fullAddress?.textoCompleto,
    clientName: projectEvent.clientName,
    glosa: projectEvent.glosa,
    // Campos específicos del proyecto para acceso posterior
    windowsCount: projectEvent.windowsCount,
    squareMeters: projectEvent.squareMeters,
    uninstall: projectEvent.uninstall,
    checklist: projectEvent.checklist,
  } as EventType & {
    windowsCount?: number;
    squareMeters?: number; 
    uninstall?: boolean;
    checklist?: any[];
    glosa?: string;
  };
}

/**
 * Obtiene todos los eventos del calendario combinando diferentes fuentes
 * @param firestore - Instancia de Firestore
 * @param userId - ID del usuario (para futura implementación de filtros por usuario)
 * @returns Array de eventos formateados para el calendario
 */
export async function getAllCalendarEvents(
  firestore: Firestore = db,
  userId?: string
): Promise<EventType[]> {
  console.log('📅 Obteniendo todos los eventos para el calendario...');
  
  try {
    const allEvents: EventType[] = [];

    // 1. Obtener eventos de proyecto
    console.log('📋 Obteniendo project events...');
    const projectEvents = await getProjectEvents.withFirestore(firestore);
    console.log(`   ✅ ${projectEvents.length} project events encontrados`);
    
    // Convertir project events a calendar events
    const calendarProjectEvents = projectEvents.map(convertProjectEventToCalendarEvent);
    allEvents.push(...calendarProjectEvents);

    // 2. TODO: Obtener eventos de postventa cuando se implementen
    // const afterSalesEvents = await getAfterSalesEvents.withFirestore(firestore);
    // allEvents.push(...afterSalesEvents.map(convertAfterSalesEventToCalendarEvent));

    // 3. TODO: Obtener eventos de visita cuando se implementen  
    // const visitEvents = await getVisitEvents.withFirestore(firestore);
    // allEvents.push(...visitEvents.map(convertVisitEventToCalendarEvent));

    // 4. Ordenar eventos por fecha
    allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    console.log(`🎉 Total eventos para calendario: ${allEvents.length}`);
    
    // Log de resumen por tipo
    const eventsByType = allEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('📊 Eventos por tipo:', eventsByType);

    return allEvents;

  } catch (error) {
    console.error('❌ Error al obtener eventos del calendario:', error);
    throw error;
  }
}

/**
 * Obtiene eventos del calendario para un rango de fechas específico
 * @param startDate - Fecha de inicio del rango
 * @param endDate - Fecha de fin del rango  
 * @param firestore - Instancia de Firestore
 * @param userId - ID del usuario
 * @returns Array de eventos en el rango especificado
 */
export async function getCalendarEventsInRange(
  startDate: Date,
  endDate: Date,
  firestore: Firestore = db,
  userId?: string
): Promise<EventType[]> {
  console.log(`📅 Obteniendo eventos entre ${startDate.toLocaleDateString()} y ${endDate.toLocaleDateString()}`);
  
  const allEvents = await getAllCalendarEvents(firestore, userId);
  
  // Filtrar eventos en el rango especificado
  const eventsInRange = allEvents.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    
    // El evento está en el rango si:
    // - Comienza dentro del rango, O
    // - Termina dentro del rango, O  
    // - Abarca todo el rango
    return (eventStart >= startDate && eventStart <= endDate) ||
           (eventEnd >= startDate && eventEnd <= endDate) ||
           (eventStart <= startDate && eventEnd >= endDate);
  });

  console.log(`📋 ${eventsInRange.length} eventos encontrados en el rango`);
  return eventsInRange;
}

/**
 * Busca eventos por término de búsqueda
 * @param searchTerm - Término de búsqueda
 * @param firestore - Instancia de Firestore
 * @param userId - ID del usuario
 * @returns Array de eventos que coinciden con la búsqueda
 */
export async function searchCalendarEvents(
  searchTerm: string,
  firestore: Firestore = db,
  userId?: string
): Promise<EventType[]> {
  if (!searchTerm.trim()) {
    return getAllCalendarEvents(firestore, userId);
  }

  console.log(`🔍 Buscando eventos con término: "${searchTerm}"`);
  
  const allEvents = await getAllCalendarEvents(firestore, userId);
  const lowerSearchTerm = searchTerm.toLowerCase();
  
  const filteredEvents = allEvents.filter(event => {
    return event.name.toLowerCase().includes(lowerSearchTerm) ||
           event.description?.toLowerCase().includes(lowerSearchTerm) ||
           event.clientName?.toLowerCase().includes(lowerSearchTerm) ||
           event.location?.toLowerCase().includes(lowerSearchTerm);
  });

  console.log(`📋 ${filteredEvents.length} eventos encontrados para "${searchTerm}"`);
  return filteredEvents;
}

/**
 * Obtiene estadísticas de eventos del calendario
 * @param firestore - Instancia de Firestore
 * @param userId - ID del usuario
 * @returns Estadísticas de eventos
 */
export async function getCalendarEventStats(
  firestore: Firestore = db,
  userId?: string
): Promise<{
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByStatus: Record<string, number>;
  upcomingEvents: number;
  overdueEvents: number;
}> {
  const allEvents = await getAllCalendarEvents(firestore, userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const stats = {
    totalEvents: allEvents.length,
    eventsByType: {} as Record<string, number>,
    eventsByStatus: {} as Record<string, number>,
    upcomingEvents: 0,
    overdueEvents: 0
  };

  allEvents.forEach(event => {
    // Por tipo
    stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
    
    // Por estado
    if (event.status) {
      stats.eventsByStatus[event.status] = (stats.eventsByStatus[event.status] || 0) + 1;
    }
    
    // Por temporalidad
    const eventDate = new Date(event.startDate);
    if (eventDate >= today) {
      stats.upcomingEvents++;
    } else {
      stats.overdueEvents++;
    }
  });

  return stats;
}