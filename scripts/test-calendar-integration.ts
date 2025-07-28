// scripts/test-calendar-integration.ts
/**
 * Test para verificar que los projectEvents aparecen correctamente en el calendario
 */

import { getAllCalendarEvents, getCalendarEventStats } from '@/services/calendarEventService';
import { getProjectEvents, createProjectEvent } from '@/services/projectEventService';
import { getProjects } from '@/services/projectService';
import { db } from '@/lib/firebase/client';

async function testCalendarIntegration() {
  console.log('🧪 TEST: Integración Calendar + ProjectEvents');
  console.log('='.repeat(50));

  try {
    // 1. Verificar eventos de proyecto existentes
    console.log('📋 1. Verificando project events existentes...');
    const projectEvents = await getProjectEvents();
    console.log(`   📁 Project events encontrados: ${projectEvents.length}`);
    
    if (projectEvents.length > 0) {
      console.log('   📄 Primeros project events:');
      projectEvents.slice(0, 3).forEach((event, index) => {
        console.log(`      ${index + 1}. ${event.clientName} - ${event.description} (${event.eventDate.toLocaleDateString()})`);
      });
    }

    // 2. Obtener eventos del calendario usando el nuevo servicio
    console.log('\n📅 2. Obteniendo eventos para el calendario...');
    const calendarEvents = await getAllCalendarEvents(db);
    console.log(`   🎯 Eventos del calendario: ${calendarEvents.length}`);
    
    if (calendarEvents.length > 0) {
      console.log('   📋 Eventos del calendario:');
      calendarEvents.slice(0, 5).forEach((event, index) => {
        console.log(`      ${index + 1}. ${event.name}`);
        console.log(`         📅 Fecha: ${event.startDate.toLocaleDateString()}`);
        console.log(`         🏷️ Tipo: ${event.type}`);
        console.log(`         🎨 Color: ${event.color}`);
        console.log(`         👤 Cliente: ${event.clientName || 'N/A'}`);
        console.log('');
      });
    }

    // 3. Comparar números
    console.log('📊 3. Comparación de números:');
    console.log(`   📋 Project Events: ${projectEvents.length}`);
    console.log(`   📅 Calendar Events: ${calendarEvents.length}`);
    
    if (projectEvents.length === calendarEvents.length) {
      console.log('   ✅ Los números coinciden - Conversión correcta');
    } else {
      console.log('   ⚠️ Los números no coinciden - Revisar conversión');
    }

    // 4. Obtener estadísticas
    console.log('\n📈 4. Estadísticas del calendario...');
    const stats = await getCalendarEventStats(db);
    console.log(`   📊 Total eventos: ${stats.totalEvents}`);
    console.log(`   🎯 Por tipo:`, stats.eventsByType);
    console.log(`   📋 Por estado:`, stats.eventsByStatus);
    console.log(`   ⏰ Próximos: ${stats.upcomingEvents}`);
    console.log(`   ⏰ Vencidos: ${stats.overdueEvents}`);

    // 5. Crear un evento de prueba si no hay eventos
    if (projectEvents.length === 0) {
      console.log('\n📝 5. No hay eventos - Creando evento de prueba...');
      
      const projects = await getProjects();
      if (projects.length > 0) {
        const testProject = projects[0];
        console.log(`   🎯 Usando proyecto: ${testProject.projectNumber}`);
        
        const testEventData = {
          projectId: testProject.id,
          eventDate: new Date(),
          description: 'Evento de prueba para calendario',
          status: testProject.status as any,
          windowsCount: testProject.windowsCount || 3,
          squareMeters: testProject.squareMeters || 20.0,
          uninstall: false,
          clientName: testProject.clientName || 'Cliente de prueba',
          checklist: [
            {
              id: 'calendar-test-1',
              description: 'Verificar integración calendario',
              isCompleted: false,
              createdAt: new Date()
            }
          ]
        };

        const createdEvent = await createProjectEvent(testEventData);
        console.log(`   ✅ Evento creado: ${createdEvent.id}`);
        
        // Verificar que aparece en el calendario
        const updatedCalendarEvents = await getAllCalendarEvents(db);
        console.log(`   📅 Eventos en calendario después de crear: ${updatedCalendarEvents.length}`);
        
        const newCalendarEvent = updatedCalendarEvents.find(e => e.referenceId === testProject.id);
        if (newCalendarEvent) {
          console.log('   🎉 ¡ÉXITO! El nuevo evento aparece en el calendario');
          console.log(`      📝 Nombre: ${newCalendarEvent.name}`);
          console.log(`      🎨 Color: ${newCalendarEvent.color}`);
          console.log(`      👤 Cliente: ${newCalendarEvent.clientName}`);
        } else {
          console.log('   ❌ ERROR: El nuevo evento NO aparece en el calendario');
        }
      } else {
        console.log('   ⚠️ No hay proyectos disponibles para crear evento de prueba');
      }
    }

    // 6. Resultado final
    console.log('\n🎯 6. RESULTADO FINAL');
    console.log('='.repeat(30));
    
    if (calendarEvents.length > 0) {
      console.log('✅ ÉXITO: Los project events aparecen en el calendario');
      console.log('✅ La integración está funcionando correctamente');
      console.log('✅ Los usuarios deberían ver los eventos');
    } else {
      console.log('❌ PROBLEMA: No hay eventos en el calendario');
      console.log('💡 Posibles causas:');
      console.log('   - No hay project events creados');
      console.log('   - Error en la conversión de tipos');
      console.log('   - Problema con la configuración de Firebase');
    }

    console.log('\n🎉 TEST COMPLETADO');

  } catch (error) {
    console.error('💥 ERROR EN TEST:', error);
    
    if (error instanceof Error) {
      console.error('   📝 Mensaje:', error.message);
      console.error('   📍 Stack:', error.stack);
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testCalendarIntegration()
    .then(() => {
      console.log('\n👋 Test de integración finalizado.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { testCalendarIntegration };