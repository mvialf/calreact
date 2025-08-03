// Mock de datos de test unificado para todas las entidades
// Datos relacionados y consistentes para testing completo

import type { Client } from '@/types/client';
import type { ProjectType, EnrichedProject } from '@/types/project';
import type { Payment } from '@/types/payment';
import type { AfterSales } from '@/types/afterSales';
import type { Visit } from '@/services/visitService';

// --- CLIENTES MOCK ---
export const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+56912345678',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'client-2', 
    name: 'Carlos Silva',
    email: 'carlos.silva@email.com',
    phone: '+56987654321',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: 'client-3',
    name: 'Ana Torres',
    email: 'ana.torres@email.com', 
    phone: '+56955555555',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
  },
];

// --- PROYECTOS MOCK ---
export const mockProjects: ProjectType[] = [
  {
    id: 'project-1',
    projectNumber: 'PRY-001',
    clientId: 'client-1',
    description: 'Instalación sistema seguridad',
    glosa: 'Instalación sistema seguridad',
    date: new Date('2024-01-20'),
    subtotal: 126050,
    taxRate: 19,
    total: 150000,
    balance: 105000, // 150000 - 45000 (payment)
    status: 'montaje',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: 'project-2',
    projectNumber: 'PRY-002', 
    clientId: 'client-2',
    description: 'Mantenimiento alarmas',
    date: new Date('2024-02-15'),
    subtotal: 63025,
    taxRate: 19,
    total: 75000,
    balance: 0, // Paid in full
    status: 'completado',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
  {
    id: 'project-3',
    projectNumber: 'PRY-003',
    clientId: 'client-3', 
    description: 'Instalación cámaras CCTV',
    date: new Date('2024-03-10'),
    subtotal: 168067,
    taxRate: 19,
    total: 200000,
    balance: 200000, // No payments yet
    status: 'ingresado',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
  },
];

// --- PROYECTOS ENRIQUECIDOS MOCK ---
export const mockEnrichedProjects: EnrichedProject[] = mockProjects.map((project, index) => {
  const client = mockClients.find(c => c.id === project.clientId);
  const totalPayments = [45000, 75000, 0][index]; // Pagos simulados
  
  return {
    ...project,
    clientName: client?.name || 'Cliente Desconocido',
    totalPayments,
    totalPaymentPercentage: project.total ? (totalPayments / project.total) * 100 : 0,
    isPaid: totalPayments >= (project.total || 0),
    balance: project.balance || 0,
  };
});

// --- PAGOS MOCK ---
export const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    projectId: 'project-1',
    amount: 45000,
    date: new Date('2024-01-25'),
    paymentMethod: 'tarjeta de crédito',
    paymentType: 'anticipo',
    installments: 6,
    isAdjustment: false,
    createdAt: new Date('2024-01-25'),
  },
  {
    id: 'payment-2',
    projectId: 'project-2',
    amount: 37500,
    date: new Date('2024-02-24'),
    paymentMethod: 'tarjeta de crédito',
    paymentType: 'proyecto',
    installments: '6 cuotas',
    isAdjustment: false,
    createdAt: new Date('2024-02-24'),
  },
  {
    id: 'payment-3',
    projectId: 'project-2',
    amount: 37500,
    date: new Date('2024-02-25'),
    paymentMethod: 'efectivo',
    paymentType: 'proyecto',
    isAdjustment: false,
    createdAt: new Date('2024-02-25'),
  },
];

// --- PAGOS ENRIQUECIDOS MOCK ---
export const mockEnrichedPayments = mockPayments.map(payment => {
  const project = mockProjects.find(p => p.id === payment.projectId);
  const client = project ? mockClients.find(c => c.id === project.clientId) : null;
  
  return {
    ...payment,
    clientName: client?.name || 'Cliente Desconocido',
    projectNumber: project ? `${project.projectNumber}${project.glosa ? ` - ${project.glosa}` : ''}` : 'Proyecto Desconocido',
  };
});

// --- VISITAS MOCK ---
export const mockVisits: Visit[] = [
  {
    id: 'visit-1',
    name: 'Juan Pérez',
    phone: '+56912345678', 
    address: 'Avenida Providencia 123, Santiago',
    status: 'Completada',
    scheduledDate: new Date('2024-01-30'),
    observations: 'Visita de instalación completada exitosamente',
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-01-30'),
  },
  {
    id: 'visit-2',
    name: 'Carlos Silva',
    phone: '+56987654321',
    address: 'Las Condes 456, Santiago', 
    status: 'Agendada',
    scheduledDate: new Date('2024-04-15'),
    observations: 'Visita de mantenimiento programada',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
  },
  {
    id: 'visit-3',
    name: 'Ana Torres',
    phone: '+56955555555',
    address: 'Ñuñoa 789, Santiago',
    status: 'Reagendada',
    scheduledDate: new Date('2024-04-20'),
    observations: 'Cliente no disponible, reagendar',
    createdAt: new Date('2024-04-02'),
    updatedAt: new Date('2024-04-10'),
  },
];

// --- POSTVENTAS MOCK ---
export const mockAfterSales: AfterSales[] = [
  {
    id: 'aftersale-1',
    projectId: 'project-1',
    description: 'Revisión sistema después de 6 meses',
    afterSalesStatus: 'Completada',
    entryDate: new Date('2024-07-20'),
    createdAt: new Date('2024-07-18'),
    updatedAt: new Date('2024-07-20'),
  },
  {
    id: 'aftersale-2',
    projectId: 'project-2',
    description: 'Mantenimiento preventivo anual',
    afterSalesStatus: 'Agendada',
    entryDate: new Date('2024-08-15'),
    createdAt: new Date('2024-08-01'),
    updatedAt: new Date('2024-08-01'),
  },
  {
    id: 'aftersale-3',
    projectId: 'project-3',
    description: 'Llamada de seguimiento',
    afterSalesStatus: 'Ingresada',
    entryDate: new Date('2024-09-01'),
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2024-09-01'),
  },
];

// --- UTILIDADES DE BÚSQUEDA ---
export const getClientById = (id: string) => mockClients.find(client => client.id === id);
export const getProjectById = (id: string) => mockProjects.find(project => project.id === id);
export const getPaymentsByProjectId = (projectId: string) => mockPayments.filter(payment => payment.projectId === projectId);
export const getAfterSalesByProjectId = (projectId: string) => mockAfterSales.filter(afterSale => afterSale.projectId === projectId);

// --- DATOS PARA ESTADOS ESPECÍFICOS ---
export const mockLoadingState = {
  isLoading: true,
  data: [],
  error: null,
};

export const mockErrorState = {
  isLoading: false,
  data: [],
  error: new Error('Error al cargar datos de prueba'),
};

export const mockEmptyState = {
  isLoading: false,
  data: [],
  error: null,
};

// --- CONSTANTES DE TEST ---
export const TEST_IDS = {
  searchInput: 'search-input',
  table: 'page-table',
  paginationControls: 'pagination-controls',
  selectAllCheckbox: 'select-all-checkbox',
  actionButton: 'action-button',
  loadingSkeleton: 'loading-skeleton',
  emptyState: 'empty-state',
} as const;

export const MOCK_FORM_DATA = {
  newClient: {
    name: 'Nuevo Cliente Test',
    email: 'nuevo@test.com',
    phone: '+56999999999',
    address: 'Dirección Test 123',
  },
  newProject: {
    projectNumber: 'PRY-TEST',
    description: 'Proyecto de prueba',
    glosa: 'Test',
    total: 100000,
  },
  newPayment: {
    amount: 50000,
    date: new Date(),
    paymentMethod: 'transferencia' as const,
    paymentType: 'anticipo' as const,
  },
} as const;