// src/utils/__tests__/eventValidation.test.ts
import {
  validateProjectEventData,
  validateProjectForEvents,
  sanitizeProjectEventData,
  generateEventDisplayName,
  detectEventChanges
} from '../eventValidation';
import type { ProjectEventType, ProjectType } from '@/types/project';

describe('eventValidation', () => {
  const mockProject: ProjectType = {
    id: 'project-123',
    projectNumber: 'P-2025-001',
    clientId: 'client-123',
    clientName: 'Juan Pérez',
    description: 'Proyecto de prueba',
    date: new Date('2025-01-01'),
    subtotal: 1000,
    taxRate: 19,
    status: 'ingresado',
    windowsCount: 5,
    squareMeters: 25.5,
    uninstall: false
  };

  const mockEventData: Partial<ProjectEventType> = {
    projectId: mockProject.id,
    eventDate: new Date('2025-02-01'),
    description: 'Evento de prueba',
    status: 'ingresado',
    windowsCount: 3,
    squareMeters: 15.0,
    uninstall: false
  };

  describe('validateProjectEventData', () => {
    it('should validate valid event data', () => {
      const result = validateProjectEventData(mockEventData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require projectId', () => {
      const invalidData = { ...mockEventData };
      delete invalidData.projectId;
      
      const result = validateProjectEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID del proyecto es requerido');
    });

    it('should require eventDate', () => {
      const invalidData = { ...mockEventData };
      delete invalidData.eventDate;
      
      const result = validateProjectEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Fecha del evento es requerida');
    });

    it('should require status', () => {
      const invalidData = { ...mockEventData };
      delete invalidData.status;
      
      const result = validateProjectEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Estado del evento es requerido');
    });

    it('should validate numeric fields', () => {
      const invalidData = {
        ...mockEventData,
        windowsCount: NaN,
        squareMeters: -5
      };
      
      const result = validateProjectEventData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Número de ventanas debe ser un valor numérico válido');
      expect(result.errors).toContain('Metros cuadrados no puede ser negativo');
    });

    it('should warn about past dates', () => {
      const pastData = {
        ...mockEventData,
        eventDate: new Date('2020-01-01')
      };
      
      const result = validateProjectEventData(pastData);
      expect(result.warnings).toContain('La fecha del evento está en el pasado');
    });

    it('should warn about uninstall without types', () => {
      const uninstallData = {
        ...mockEventData,
        uninstall: true,
        uninstallTypes: []
      };
      
      const result = validateProjectEventData(uninstallData);
      expect(result.warnings).toContain('Se marcó desinstalación pero no se especificaron tipos');
    });
  });

  describe('validateProjectForEvents', () => {
    it('should validate valid project', () => {
      const result = validateProjectForEvents(mockProject);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require project ID', () => {
      const invalidProject = { ...mockProject };
      delete (invalidProject as any).id;
      
      const result = validateProjectForEvents(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ID del proyecto no válido');
    });

    it('should require client information', () => {
      const invalidProject = { ...mockProject };
      delete invalidProject.clientId;
      delete invalidProject.clientName;
      
      const result = validateProjectForEvents(invalidProject);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El proyecto debe tener información de cliente');
    });

    it('should warn about missing clientName with existing clientId', () => {
      const warningProject = { ...mockProject };
      delete warningProject.clientName;
      
      const result = validateProjectForEvents(warningProject);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('El proyecto tiene clientId pero no clientName - será sincronizado automáticamente');
    });

    it('should warn about completed projects', () => {
      const completedProject = { ...mockProject, status: 'completado' };
      
      const result = validateProjectForEvents(completedProject);
      expect(result.warnings).toContain('El proyecto está marcado como completado');
    });

    it('should warn about paid projects', () => {
      const paidProject = { ...mockProject, isPaid: true };
      
      const result = validateProjectForEvents(paidProject);
      expect(result.warnings).toContain('El proyecto está marcado como pagado');
    });
  });

  describe('sanitizeProjectEventData', () => {
    it('should sanitize and normalize event data', () => {
      const result = sanitizeProjectEventData(mockEventData, mockProject);
      
      expect(result.projectId).toBe(mockProject.id);
      expect(result.clientName).toBe(mockProject.clientName);
      expect(result.windowsCount).toBe(3);
      expect(result.squareMeters).toBe(15.0);
      expect(result.eventDate).toBeInstanceOf(Date);
    });

    it('should handle missing clientName', () => {
      const projectWithoutClientName = { ...mockProject };
      delete projectWithoutClientName.clientName;
      
      const result = sanitizeProjectEventData(mockEventData, projectWithoutClientName);
      expect(result.clientName).toBe('Cliente pendiente');
    });

    it('should sanitize numeric values', () => {
      const dirtyData = {
        ...mockEventData,
        windowsCount: -5.7,
        squareMeters: 'invalid' as any
      };
      
      const result = sanitizeProjectEventData(dirtyData, mockProject);
      expect(result.windowsCount).toBe(0); // Negative becomes 0, float becomes int
      expect(result.squareMeters).toBe(25.5); // Invalid becomes project default
    });

    it('should use project defaults when event data is missing', () => {
      const minimalData = {
        projectId: mockProject.id,
        eventDate: new Date(),
        status: 'ingresado'
      };
      
      const result = sanitizeProjectEventData(minimalData, mockProject);
      expect(result.windowsCount).toBe(mockProject.windowsCount);
      expect(result.squareMeters).toBe(mockProject.squareMeters);
      expect(result.description).toBe(mockProject.description);
    });
  });

  describe('generateEventDisplayName', () => {
    it('should generate name with project number and client', () => {
      const result = generateEventDisplayName(mockProject);
      expect(result).toBe('Proyecto P-2025-001 - Juan Pérez');
    });

    it('should handle missing project number', () => {
      const projectWithoutNumber = { ...mockProject };
      delete projectWithoutNumber.projectNumber;
      
      const result = generateEventDisplayName(projectWithoutNumber);
      expect(result).toBe('Juan Pérez');
    });

    it('should handle missing client name', () => {
      const projectWithoutClient = { ...mockProject };
      delete projectWithoutClient.clientName;
      
      const result = generateEventDisplayName(projectWithoutClient);
      expect(result).toBe('Proyecto P-2025-001');
    });

    it('should include status when relevant', () => {
      const processingProject = { ...mockProject, status: 'en_proceso' };
      
      const result = generateEventDisplayName(processingProject);
      expect(result).toBe('Proyecto P-2025-001 - Juan Pérez (en_proceso)');
    });

    it('should fallback to default name', () => {
      const emptyProject = { ...mockProject };
      delete emptyProject.projectNumber;
      delete emptyProject.clientName;
      
      const result = generateEventDisplayName(emptyProject);
      expect(result).toBe('Evento de proyecto');
    });
  });

  describe('detectEventChanges', () => {
    const originalEvent: ProjectEventType = {
      id: 'event-123',
      projectId: 'project-123',
      eventDate: new Date('2025-02-01'),
      description: 'Original description',
      status: 'ingresado',
      windowsCount: 5,
      squareMeters: 25.0,
      uninstall: false,
      clientName: 'Juan Pérez',
      checklist: []
    };

    it('should detect no changes when data is same', () => {
      const result = detectEventChanges(originalEvent, {});
      expect(result).toHaveLength(0);
    });

    it('should detect simple field changes', () => {
      const changes = {
        description: 'Updated description',
        windowsCount: 8
      };
      
      const result = detectEventChanges(originalEvent, changes);
      expect(result).toContain('description');
      expect(result).toContain('windowsCount');
      expect(result).toHaveLength(2);
    });

    it('should detect date changes', () => {
      const changes = {
        eventDate: new Date('2025-03-01')
      };
      
      const result = detectEventChanges(originalEvent, changes);
      expect(result).toContain('eventDate');
    });

    it('should not detect identical date changes', () => {
      const changes = {
        eventDate: new Date(originalEvent.eventDate)
      };
      
      const result = detectEventChanges(originalEvent, changes);
      expect(result).not.toContain('eventDate');
    });
  });
});