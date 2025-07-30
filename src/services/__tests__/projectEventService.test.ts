/**
 * Tests para projectEventService
 * 
 * Estos tests verifican la funcionalidad crítica del servicio de eventos de proyecto,
 * asegurando que la validación, sincronización y CRUD funcionen correctamente.
 */

import { 
  getProjectEvents, 
  createProjectEvent, 
  updateProjectEvent, 
  deleteProjectEvent,
  getProjectEventById 
} from '../projectEventService';
import { validateProjectEventData, sanitizeProjectEventData } from '@/utils/eventValidation';
import { syncSingleProjectClientName } from '../clientSyncService';
import { getProjectById } from '../projectService';
import type { ProjectEventType, ProjectType } from '@/types/project';

// Mocks
jest.mock('@/utils/eventValidation');
jest.mock('../clientSyncService');
jest.mock('../projectService');
jest.mock('@/lib/firebase/client', () => ({
  db: {}
}));

// Mock Firebase functions
const mockFirestore = {
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  where: jest.fn(),
};

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => mockFirestore.collection()),
  getDocs: jest.fn(() => mockFirestore.getDocs()),
  addDoc: jest.fn(() => mockFirestore.addDoc()),
  updateDoc: jest.fn(() => mockFirestore.updateDoc()),
  deleteDoc: jest.fn(() => mockFirestore.deleteDoc()),
  doc: jest.fn(() => mockFirestore.doc()),
  getDoc: jest.fn(() => mockFirestore.getDoc()),
  query: jest.fn(() => mockFirestore.query()),
  orderBy: jest.fn(() => mockFirestore.orderBy()),
  where: jest.fn(() => mockFirestore.where()),
  serverTimestamp: jest.fn(() => new Date()),
}));

// Mock data
const mockProjectEvent: Omit<ProjectEventType, 'id' | 'createdAt' | 'updatedAt'> = {
  projectId: 'project-123',
  eventDate: new Date('2025-02-15'),
  description: 'Test event',
  phone: '+56912345678',
  fullAddress: {
    textoCompleto: 'Test Address 123',
    coordenadas: { latitude: -33.4489, longitude: -70.6693 },
    placeId: 'place-123',
    comune: 'Santiago'
  },
  status: 'cotizado',
  windowsCount: 5,
  squareMeters: 25.5,
  uninstall: false,
  clientName: 'Test Client',
  checklist: [
    {
      id: 'check-1',
      description: 'Check item 1',
      isCompleted: false
    }
  ]
};

const mockProject: ProjectType = {
  id: 'project-123',
  projectNumber: 'PR-2025-001',
  clientId: 'client-123',
  clientName: 'Test Client',
  description: 'Test project',
  date: new Date('2025-01-01'),
  subtotal: 1000,
  taxRate: 19,
  total: 1190,
  balance: 1190,
  status: 'cotizado',
  fullAddress: {
    textoCompleto: 'Project Address 456',
    coordenadas: { latitude: -33.4489, longitude: -70.6693 },
    placeId: 'place-456',
    comune: 'Las Condes'
  }
};

const mockValidationResult = {
  isValid: true,
  errors: [],
  warnings: [],
  sanitizedData: mockProjectEvent
};

const mockFirestoreDoc = {
  id: 'event-123',
  data: () => ({
    ...mockProjectEvent,
    eventDate: { seconds: Math.floor(mockProjectEvent.eventDate.getTime() / 1000) },
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
    updatedAt: { seconds: Math.floor(Date.now() / 1000) }
  }),
  exists: () => true
};

describe('projectEventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (validateProjectEventData as jest.Mock).mockReturnValue(mockValidationResult);
    (sanitizeProjectEventData as jest.Mock).mockReturnValue(mockProjectEvent);
    (getProjectById as jest.Mock).mockResolvedValue(mockProject);
    (syncSingleProjectClientName as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getProjectEvents', () => {
    it('should fetch all project events successfully', async () => {
      const mockSnapshot = {
        docs: [mockFirestoreDoc]
      };
      
      mockFirestore.getDocs.mockResolvedValue(mockSnapshot);
      
      const result = await getProjectEvents.withFirestore(mockFirestore as any);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'event-123',
        projectId: 'project-123',
        clientName: 'Test Client'
      });
    });

    it('should fetch project events filtered by projectId', async () => {
      const mockSnapshot = {
        docs: [mockFirestoreDoc]
      };
      
      mockFirestore.getDocs.mockResolvedValue(mockSnapshot);
      
      const result = await getProjectEvents.withFirestore(mockFirestore as any, 'project-123');
      
      expect(mockFirestore.where).toHaveBeenCalledWith('projectId', '==', 'project-123');
      expect(result).toHaveLength(1);
    });

    it('should handle empty results', async () => {
      const mockSnapshot = { docs: [] };
      mockFirestore.getDocs.mockResolvedValue(mockSnapshot);
      
      const result = await getProjectEvents.withFirestore(mockFirestore as any);
      
      expect(result).toEqual([]);
    });
  });

  describe('createProjectEvent', () => {
    it('should create project event successfully', async () => {
      mockFirestore.addDoc.mockResolvedValue({ id: 'new-event-123' });
      mockFirestore.getDoc.mockResolvedValue(mockFirestoreDoc);
      
      const result = await createProjectEvent(mockProjectEvent, mockFirestore as any);
      
      expect(validateProjectEventData).toHaveBeenCalledWith(mockProjectEvent);
      expect(getProjectById).toHaveBeenCalledWith('project-123');
      expect(sanitizeProjectEventData).toHaveBeenCalledWith(mockProjectEvent, mockProject);
      expect(mockFirestore.addDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'event-123',
        projectId: 'project-123'
      });
    });

    it('should throw error for invalid data', async () => {
      const invalidValidationResult = {
        isValid: false,
        errors: ['Invalid event date'],
        warnings: []
      };
      
      (validateProjectEventData as jest.Mock).mockReturnValue(invalidValidationResult);
      
      await expect(createProjectEvent(mockProjectEvent, mockFirestore as any))
        .rejects.toThrow('Datos del evento inválidos: Invalid event date');
    });

    it('should throw error when project not found', async () => {
      (getProjectById as jest.Mock).mockResolvedValue(null);
      
      await expect(createProjectEvent(mockProjectEvent, mockFirestore as any))
        .rejects.toThrow('Proyecto project-123 no encontrado');
    });

    it('should handle project without clientName and sync', async () => {
      const projectWithoutClientName = { ...mockProject, clientName: undefined };
      (getProjectById as jest.Mock).mockResolvedValue(projectWithoutClientName);
      
      // Mock updated project after sync
      const updatedProject = { ...mockProject, clientName: 'Synced Client Name' };
      (getProjectById as jest.Mock)
        .mockResolvedValueOnce(projectWithoutClientName)
        .mockResolvedValueOnce(updatedProject);
      
      mockFirestore.addDoc.mockResolvedValue({ id: 'new-event-123' });
      mockFirestore.getDoc.mockResolvedValue(mockFirestoreDoc);
      
      await createProjectEvent(mockProjectEvent, mockFirestore as any);
      
      expect(syncSingleProjectClientName).toHaveBeenCalledWith('project-123', mockFirestore);
      expect(getProjectById).toHaveBeenCalledTimes(2); // Once initial, once after sync
    });
  });

  describe('updateProjectEvent', () => {
    it('should update project event successfully', async () => {
      const updateData = { description: 'Updated description' };
      
      // Mock getProjectEventById to return existing event
      const mockGetEventById = jest.fn().mockResolvedValue({
        id: 'event-123',
        ...mockProjectEvent
      });
      
      // We need to mock the function that's imported
      jest.doMock('../projectEventService', () => ({
        ...jest.requireActual('../projectEventService'),
        getProjectEventById: mockGetEventById
      }));
      
      mockFirestore.updateDoc.mockResolvedValue(undefined);
      
      await updateProjectEvent('event-123', updateData, mockFirestore as any);
      
      expect(mockFirestore.updateDoc).toHaveBeenCalled();
    });

    it('should throw error when event not found for update', async () => {
      const mockGetEventById = jest.fn().mockResolvedValue(null);
      
      jest.doMock('../projectEventService', () => ({
        ...jest.requireActual('../projectEventService'),
        getProjectEventById: mockGetEventById
      }));
      
      await expect(updateProjectEvent('nonexistent-event', {}, mockFirestore as any))
        .rejects.toThrow('Evento nonexistent-event no encontrado');
    });
  });

  describe('deleteProjectEvent', () => {
    it('should delete project event successfully', async () => {
      mockFirestore.deleteDoc.mockResolvedValue(undefined);
      
      await deleteProjectEvent('event-123', mockFirestore as any);
      
      expect(mockFirestore.doc).toHaveBeenCalledWith(mockFirestore, 'projectEvents', 'event-123');
      expect(mockFirestore.deleteDoc).toHaveBeenCalled();
    });

    it('should handle deletion errors gracefully', async () => {
      const deleteError = new Error('Firestore delete failed');
      mockFirestore.deleteDoc.mockRejectedValue(deleteError);
      
      await expect(deleteProjectEvent('event-123', mockFirestore as any))
        .rejects.toThrow('Firestore delete failed');
    });
  });

  describe('getProjectEventById', () => {
    it('should return event when found', async () => {
      mockFirestore.getDoc.mockResolvedValue(mockFirestoreDoc);
      
      const result = await getProjectEventById('event-123');
      
      expect(result).toMatchObject({
        id: 'event-123',
        projectId: 'project-123'
      });
    });

    it('should return null when event not found', async () => {
      const mockNonExistentDoc = {
        exists: () => false
      };
      mockFirestore.getDoc.mockResolvedValue(mockNonExistentDoc);
      
      const result = await getProjectEventById('nonexistent-event');
      
      expect(result).toBeNull();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle Firestore connection errors', async () => {
      const firestoreError = new Error('Firestore connection failed');
      mockFirestore.getDocs.mockRejectedValue(firestoreError);
      
      await expect(getProjectEvents.withFirestore(mockFirestore as any))
        .rejects.toThrow('Firestore connection failed');
    });

    it('should handle malformed document data', async () => {
      const malformedDoc = {
        id: 'malformed-123',
        data: () => ({
          // Missing required fields
          projectId: 'project-123'
          // eventDate missing
        }),
        exists: () => true
      };
      
      const mockSnapshot = { docs: [malformedDoc] };
      mockFirestore.getDocs.mockResolvedValue(mockSnapshot);
      
      // The service should handle this gracefully
      const result = await getProjectEvents.withFirestore(mockFirestore as any);
      expect(result).toHaveLength(1);
    });

    it('should validate required fields on creation', async () => {
      const incompleteEvent = {
        ...mockProjectEvent,
        projectId: '' // Invalid empty projectId
      };
      
      const invalidValidationResult = {
        isValid: false,
        errors: ['projectId is required'],
        warnings: []
      };
      
      (validateProjectEventData as jest.Mock).mockReturnValue(invalidValidationResult);
      
      await expect(createProjectEvent(incompleteEvent, mockFirestore as any))
        .rejects.toThrow('Datos del evento inválidos: projectId is required');
    });
  });
});