/**
 * Tests para firestore-helpers
 * 
 * Estos tests verifican las utilidades de Firestore que son críticas
 * para la conversión y manejo correcto de datos.
 */

import {
  timestampToDate,
  dateToTimestamp,
  docSnapshotToEntity,
  convertFirestoreDocuments,
  addTimestamps,
  updateTimestamps,
  prepareDataForFirestore
} from '../firestore-helpers';
import { Timestamp } from 'firebase/firestore';

// Mock Firestore Timestamp
const mockTimestamp = {
  seconds: 1640995200, // 2022-01-01 00:00:00 UTC
  nanoseconds: 0,
  toDate: jest.fn(() => new Date('2022-01-01T00:00:00.000Z')),
  toMillis: jest.fn(() => 1640995200000)
} as any as Timestamp;

const mockDocumentSnapshot = {
  id: 'test-doc-123',
  data: () => ({
    name: 'Test Document',
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    date: mockTimestamp,
    isActive: true,
    count: 42
  }),
  exists: () => true
};

const mockDocumentSnapshotNoData = {
  id: 'empty-doc',
  data: () => undefined,
  exists: () => false
};

// Mock serverTimestamp
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  serverTimestamp: jest.fn(() => ({ serverTimestamp: true })),
  Timestamp: {
    fromDate: jest.fn((date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000,
      toDate: () => date
    }))
  }
}));

describe('firestore-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('timestampToDate', () => {
    it('should convert Firestore Timestamp to Date', () => {
      const result = timestampToDate(mockTimestamp);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(1640995200000);
    });

    it('should handle null timestamp', () => {
      const result = timestampToDate(null);
      
      expect(result).toBeUndefined();
    });

    it('should handle undefined timestamp', () => {
      const result = timestampToDate(undefined);
      
      expect(result).toBeUndefined();
    });

    it('should handle already converted Date objects', () => {
      const existingDate = new Date('2023-01-01');
      const result = timestampToDate(existingDate as any);
      
      expect(result).toBe(existingDate);
    });

    it('should handle malformed timestamp objects', () => {
      const malformedTimestamp = { seconds: 'invalid' } as any;
      
      expect(() => timestampToDate(malformedTimestamp)).not.toThrow();
    });
  });

  describe('dateToTimestamp', () => {
    it('should convert Date to Firestore Timestamp', () => {
      const testDate = new Date('2023-01-01T12:00:00.000Z');
      const result = dateToTimestamp(testDate);
      
      expect(result).toBeDefined();
      expect(result.seconds).toBe(Math.floor(testDate.getTime() / 1000));
    });

    it('should handle null date', () => {
      const result = dateToTimestamp(null);
      
      expect(result).toBeNull();
    });

    it('should handle undefined date', () => {
      const result = dateToTimestamp(undefined);
      
      expect(result).toBeUndefined();
    });

    it('should handle invalid date objects', () => {
      const invalidDate = new Date('invalid-date');
      
      expect(() => dateToTimestamp(invalidDate)).not.toThrow();
    });
  });

  describe('docSnapshotToEntity', () => {
    it('should convert document snapshot to entity with transformer', () => {
      const transformer = (data: any, id: string) => ({
        customDate: timestampToDate(data.createdAt),
        customName: data.name.toUpperCase()
      });

      const result = docSnapshotToEntity(mockDocumentSnapshot, transformer);
      
      expect(result).toEqual({
        id: 'test-doc-123',
        name: 'Test Document',
        createdAt: new Date('2022-01-01T00:00:00.000Z'),
        updatedAt: new Date('2022-01-01T00:00:00.000Z'),
        date: new Date('2022-01-01T00:00:00.000Z'),
        isActive: true,
        count: 42,
        customDate: new Date('2022-01-01T00:00:00.000Z'),
        customName: 'TEST DOCUMENT'
      });
    });

    it('should handle document without data', () => {
      const transformer = (data: any, id: string) => ({ transformed: true });
      
      expect(() => docSnapshotToEntity(mockDocumentSnapshotNoData, transformer))
        .toThrow('Document snapshot does not exist or has no data');
    });

    it('should convert timestamps automatically', () => {
      const result = docSnapshotToEntity(mockDocumentSnapshot);
      
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.date).toBeInstanceOf(Date);
    });

    it('should preserve non-timestamp fields', () => {
      const result = docSnapshotToEntity(mockDocumentSnapshot);
      
      expect(result.name).toBe('Test Document');
      expect(result.isActive).toBe(true);
      expect(result.count).toBe(42);
    });
  });

  describe('convertFirestoreDocuments', () => {
    it('should convert array of documents with custom converter', () => {
      const docs = [mockDocumentSnapshot, mockDocumentSnapshot];
      const converter = (doc: any) => ({
        ...docSnapshotToEntity(doc),
        processed: true
      });

      const result = convertFirestoreDocuments(docs, converter);
      
      expect(result).toHaveLength(2);
      expect(result[0].processed).toBe(true);
      expect(result[1].processed).toBe(true);
    });

    it('should handle empty document array', () => {
      const result = convertFirestoreDocuments([], docSnapshotToEntity);
      
      expect(result).toEqual([]);
    });

    it('should filter out invalid documents', () => {
      const docs = [mockDocumentSnapshot, mockDocumentSnapshotNoData];
      const converter = (doc: any) => {
        try {
          return docSnapshotToEntity(doc);
        } catch {
          return null;
        }
      };

      const result = convertFirestoreDocuments(docs, converter);
      
      expect(result).toHaveLength(2); // Includes null from invalid doc
      expect(result[0]).toBeTruthy();
      expect(result[1]).toBeNull();
    });
  });

  describe('addTimestamps', () => {
    it('should add createdAt and updatedAt timestamps', () => {
      const data = { name: 'Test', value: 123 };
      const result = addTimestamps(data);
      
      expect(result).toEqual({
        name: 'Test',
        value: 123,
        createdAt: expect.objectContaining({ serverTimestamp: true }),
        updatedAt: expect.objectContaining({ serverTimestamp: true })
      });
    });

    it('should not overwrite existing timestamps', () => {
      const existingTimestamp = mockTimestamp;
      const data = { 
        name: 'Test', 
        createdAt: existingTimestamp,
        updatedAt: existingTimestamp 
      };
      
      const result = addTimestamps(data);
      
      expect(result.createdAt).toBe(existingTimestamp);
      expect(result.updatedAt).toBe(existingTimestamp);
    });

    it('should handle null data', () => {
      const result = addTimestamps(null);
      
      expect(result).toEqual({
        createdAt: expect.objectContaining({ serverTimestamp: true }),
        updatedAt: expect.objectContaining({ serverTimestamp: true })
      });
    });

    it('should handle undefined data', () => {
      const result = addTimestamps(undefined);
      
      expect(result).toEqual({
        createdAt: expect.objectContaining({ serverTimestamp: true }),
        updatedAt: expect.objectContaining({ serverTimestamp: true })
      });
    });
  });

  describe('updateTimestamps', () => {
    it('should add only updatedAt timestamp', () => {
      const data = { name: 'Updated Test', value: 456 };
      const result = updateTimestamps(data);
      
      expect(result).toEqual({
        name: 'Updated Test',
        value: 456,
        updatedAt: expect.objectContaining({ serverTimestamp: true })
      });
    });

    it('should preserve existing createdAt', () => {
      const existingCreatedAt = mockTimestamp;
      const data = { 
        name: 'Updated Test',
        createdAt: existingCreatedAt 
      };
      
      const result = updateTimestamps(data);
      
      expect(result.createdAt).toBe(existingCreatedAt);
      expect(result.updatedAt).toEqual(expect.objectContaining({ serverTimestamp: true }));
    });

    it('should overwrite existing updatedAt', () => {
      const oldUpdatedAt = mockTimestamp;
      const data = { 
        name: 'Updated Test',
        updatedAt: oldUpdatedAt 
      };
      
      const result = updateTimestamps(data);
      
      expect(result.updatedAt).not.toBe(oldUpdatedAt);
      expect(result.updatedAt).toEqual(expect.objectContaining({ serverTimestamp: true }));
    });
  });

  describe('prepareDataForFirestore', () => {
    it('should prepare data with timestamps for creation', () => {
      const data = { name: 'Test Project', status: 'active' };
      const result = prepareDataForFirestore(data);
      
      expect(result).toEqual({
        name: 'Test Project',
        status: 'active',
        createdAt: expect.objectContaining({ serverTimestamp: true }),
        updatedAt: expect.objectContaining({ serverTimestamp: true })
      });
    });

    it('should prepare data with update timestamp when createdAt exists', () => {
      const data = { 
        name: 'Updated Project', 
        status: 'inactive',
        createdAt: mockTimestamp 
      };
      
      const result = prepareDataForFirestore(data);
      
      expect(result).toEqual({
        name: 'Updated Project',
        status: 'inactive',
        createdAt: mockTimestamp,
        updatedAt: expect.objectContaining({ serverTimestamp: true })
      });
    });

    it('should handle complex nested objects', () => {
      const data = {
        name: 'Complex Project',
        details: {
          description: 'A complex project',
          tags: ['important', 'urgent']
        },
        metadata: {
          version: 1,
          author: 'test-user'
        }
      };
      
      const result = prepareDataForFirestore(data);
      
      expect(result.details).toEqual(data.details);
      expect(result.metadata).toEqual(data.metadata);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle arrays properly', () => {
      const data = {
        name: 'Array Project',
        items: ['item1', 'item2', 'item3'],
        numbers: [1, 2, 3]
      };
      
      const result = prepareDataForFirestore(data);
      
      expect(result.items).toEqual(['item1', 'item2', 'item3']);
      expect(result.numbers).toEqual([1, 2, 3]);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle circular references gracefully', () => {
      const data: any = { name: 'Circular' };
      data.self = data; // Create circular reference
      
      // Should not throw error
      expect(() => prepareDataForFirestore(data)).not.toThrow();
    });

    it('should handle very large objects', () => {
      const largeData = {
        name: 'Large Object',
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      };
      
      const result = prepareDataForFirestore(largeData);
      
      expect(result.items).toHaveLength(1000);
      expect(result.createdAt).toBeDefined();
    });

    it('should handle special characters in data', () => {
      const data = {
        name: 'Special Chars: äöü',
        emoji: '🚀 🎉 ✨',
        unicode: '\u{1F600}',
        symbols: '!@#$%^&*()',
      };
      
      const result = prepareDataForFirestore(data);
      
      expect(result.name).toBe('Special Chars: äöü');
      expect(result.emoji).toBe('🚀 🎉 ✨');
      expect(result.unicode).toBe('\u{1F600}');
      expect(result.symbols).toBe('!@#$%^&*()');
    });

    it('should handle different data types', () => {
      const data = {
        stringField: 'test',
        numberField: 42,
        booleanField: true,
        dateField: new Date(),
        nullField: null,
        undefinedField: undefined,
        arrayField: [1, 2, 3],
        objectField: { nested: 'value' }
      };
      
      const result = prepareDataForFirestore(data);
      
      expect(typeof result.stringField).toBe('string');
      expect(typeof result.numberField).toBe('number');
      expect(typeof result.booleanField).toBe('boolean');
      expect(result.dateField).toBeInstanceOf(Date);
      expect(result.nullField).toBeNull();
      expect(result.undefinedField).toBeUndefined();
      expect(Array.isArray(result.arrayField)).toBe(true);
      expect(typeof result.objectField).toBe('object');
    });
  });

  describe('Performance considerations', () => {
    it('should handle batch processing efficiently', () => {
      const startTime = performance.now();
      
      const docs = Array.from({ length: 100 }, (_, i) => ({
        ...mockDocumentSnapshot,
        id: `doc-${i}`
      }));
      
      const result = convertFirestoreDocuments(docs, docSnapshotToEntity);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(result).toHaveLength(100);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should not mutate original data', () => {
      const originalData = { name: 'Original', value: 123 };
      const dataCopy = { ...originalData };
      
      const result = prepareDataForFirestore(originalData);
      
      expect(originalData).toEqual(dataCopy); // Original should be unchanged
      expect(result).not.toBe(originalData); // Should be different object
    });
  });
});