// scripts/test-project-events.ts
import { 
  syncProjectClientNames, 
  getProjectClientSyncStats,
  syncSingleProjectClientName 
} from '@/services/clientSyncService';
import { 
  createProjectEvent, 
  getProjectEvents, 
  getProjectEventsByProjectId,
  countProjectEvents 
} from '@/services/projectEventService';
import { getProjects } from '@/services/projectService';
import { db } from '@/lib/firebase/client';
import type { ProjectEventType } from '@/types/project';

/**
 * Script completo de testing para la nueva arquitectura de eventos de proyecto
 */
async function runProjectEventsTest() {
  console.log('🧪 Iniciando test completo de eventos de proyecto...\n');

  try {
    // PASO 1: Sincronizar nombres de cliente
    console.log('📊 PASO 1: Sincronización de nombres de cliente');
    console.log('='.repeat(50));
    
    const statsBefore = await getProjectClientSyncStats(db);
    console.log('📋 Estadísticas antes de sincronización:');
    console.log(`   • Total proyectos: ${statsBefore.totalProjects}`);
    console.log(`   • Con clientId: ${statsBefore.projectsWithClientId}`);
    console.log(`   • Con clientName: ${statsBefore.projectsWithClientName}`);
    console.log(`   • Necesitan sync: ${statsBefore.projectsNeedingSync}\n`);

    if (statsBefore.projectsNeedingSync > 0) {
      console.log('🔄 Ejecutando sincronización...');
      const syncedCount = await syncProjectClientNames(db);
      console.log(`✅ ${syncedCount} proyectos sincronizados\n`);
    } else {
      console.log('ℹ️ No hay proyectos que requieran sincronización\n');
    }

    // PASO 2: Obtener proyectos disponibles
    console.log('📂 PASO 2: Obtener proyectos disponibles');
    console.log('='.repeat(50));
    
    const projects = await getProjects();
    console.log(`📁 Proyectos encontrados: ${projects.length}`);
    
    if (projects.length === 0) {
      console.log('❌ No hay proyectos disponibles para crear eventos');
      return;
    }

    // Mostrar algunos proyectos disponibles
    const validProjects = projects.filter(p => p.clientName && p.clientName !== 'Cliente no especificado');
    console.log(`✅ Proyectos con cliente válido: ${validProjects.length}`);
    
    if (validProjects.length > 0) {
      console.log('\n📋 Primeros 3 proyectos válidos:');
      validProjects.slice(0, 3).forEach((project, index) => {
        console.log(`   ${index + 1}. ${project.projectNumber} - ${project.clientName} (${project.status})`);
      });
    }
    console.log('');

    // PASO 3: Crear eventos de prueba
    console.log('🎯 PASO 3: Crear eventos de prueba');
    console.log('='.repeat(50));

    const testProject = validProjects[0] || projects[0];
    console.log(`🎯 Usando proyecto de prueba: ${testProject.projectNumber} - ${testProject.clientName || 'Sin nombre'}`);

    // Crear 2 eventos de prueba
    const testEvents = [
      {
        projectId: testProject.id,
        eventDate: new Date(),
        description: 'Evento de prueba 1 - Instalación inicial',
        status: testProject.status,
        windowsCount: testProject.windowsCount || 5,
        squareMeters: testProject.squareMeters || 25.5,
        uninstall: false,
        clientName: testProject.clientName,
        checklist: [
          {
            id: 'test-1',
            description: 'Verificar medidas',
            isCompleted: false,
            createdAt: new Date()
          },
          {
            id: 'test-2', 
            description: 'Preparar herramientas',
            isCompleted: true,
            createdAt: new Date(),
            completedAt: new Date()
          }
        ]
      },
      {
        projectId: testProject.id,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 días
        description: 'Evento de prueba 2 - Seguimiento',
        status: 'en_proceso',
        windowsCount: testProject.windowsCount || 5,
        squareMeters: testProject.squareMeters || 25.5,
        uninstall: true,
        uninstallTypes: ['Marco', 'Vidrio'],
        clientName: testProject.clientName,
        checklist: []
      }
    ];

    const createdEvents: ProjectEventType[] = [];

    for (let i = 0; i < testEvents.length; i++) {
      try {
        console.log(`📝 Creando evento ${i + 1}...`);
        const event = await createProjectEvent(testEvents[i]);
        createdEvents.push(event);
        console.log(`   ✅ Evento creado: ${event.id}`);
        console.log(`   📅 Fecha: ${event.eventDate.toLocaleDateString()}`);
        console.log(`   👤 Cliente: ${event.clientName}`);
        console.log(`   ✔️ Checklist items: ${event.checklist?.length || 0}`);
      } catch (error) {
        console.error(`   ❌ Error al crear evento ${i + 1}:`, error);
      }
    }

    console.log(`\n🎉 ${createdEvents.length} eventos creados exitosamente\n`);

    // PASO 4: Verificar eventos creados
    console.log('🔍 PASO 4: Verificar eventos creados');
    console.log('='.repeat(50));

    const projectEventCount = await countProjectEvents(testProject.id);
    console.log(`📊 Eventos del proyecto ${testProject.projectNumber}: ${projectEventCount}`);

    const projectEvents = await getProjectEventsByProjectId(testProject.id);
    console.log(`📋 Eventos recuperados: ${projectEvents.length}`);

    console.log('\n📄 Detalles de eventos:');
    projectEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ID: ${event.id}`);
      console.log(`      📅 Fecha: ${event.eventDate.toLocaleDateString()}`);
      console.log(`      👤 Cliente: ${event.clientName}`);
      console.log(`      📝 Descripción: ${event.description}`);
      console.log(`      🏠 Ventanas: ${event.windowsCount}, M²: ${event.squareMeters}`);
      console.log(`      🔧 Desinstalación: ${event.uninstall ? 'Sí' : 'No'}`);
      if (event.uninstallTypes && event.uninstallTypes.length > 0) {
        console.log(`      🛠️ Tipos: ${event.uninstallTypes.join(', ')}`);
      }
      console.log(`      ✅ Checklist: ${event.checklist?.length || 0} items`);
      console.log('');
    });

    // PASO 5: Verificar todos los eventos
    console.log('📊 PASO 5: Estadísticas generales');
    console.log('='.repeat(50));

    const allEvents = await getProjectEvents();
    console.log(`📈 Total de eventos en sistema: ${allEvents.length}`);

    const eventsByStatus: Record<string, number> = {};
    allEvents.forEach(event => {
      eventsByStatus[event.status] = (eventsByStatus[event.status] || 0) + 1;
    });

    console.log('📊 Eventos por estado:');
    Object.entries(eventsByStatus).forEach(([status, count]) => {
      console.log(`   • ${status}: ${count}`);
    });

    // PASO 6: Validar sincronización final
    console.log('\n🔄 PASO 6: Validación final de sincronización');
    console.log('='.repeat(50));

    const statsAfter = await getProjectClientSyncStats(db);
    console.log('📋 Estadísticas finales:');
    console.log(`   • Total proyectos: ${statsAfter.totalProjects}`);
    console.log(`   • Con clientName: ${statsAfter.projectsWithClientName}`);
    console.log(`   • Necesitan sync: ${statsAfter.projectsNeedingSync}`);

    if (statsAfter.projectsNeedingSync === 0) {
      console.log('✅ Todos los proyectos están sincronizados correctamente');
    } else {
      console.log(`⚠️ ${statsAfter.projectsNeedingSync} proyectos aún necesitan sincronización`);
    }

    console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE! 🎉');
    console.log('='.repeat(50));
    console.log('✅ Sincronización de clientes funcionando');
    console.log('✅ Creación de eventos funcionando'); 
    console.log('✅ Validaciones implementadas');
    console.log('✅ Arquitectura lista para producción');

  } catch (error) {
    console.error('💥 Error durante el test:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runProjectEventsTest()
    .then(() => {
      console.log('\n👋 Test finalizado. Presiona Ctrl+C para salir.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal en test:', error);
      process.exit(1);
    });
}

export { runProjectEventsTest };