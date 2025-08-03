import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import PaymentsPage from '@/app/payments/page';
import { mockPayments, mockProjects, mockClients } from '../__mocks__/testData';
import { getAllPayments } from '@/services/paymentService';
import { getProjects } from '@/services/projectService';
import { getClients } from '@/services/clientService';

// Mocks de servicios
jest.mock('@/services/paymentService');
jest.mock('@/services/projectService');
jest.mock('@/services/clientService');

const mockGetAllPayments = getAllPayments as jest.MockedFunction<typeof getAllPayments>;
const mockGetProjects = getProjects as jest.MockedFunction<typeof getProjects>;
const mockGetClients = getClients as jest.MockedFunction<typeof getClients>;

describe('PaymentsPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks por defecto
    mockGetAllPayments.mockResolvedValue(mockPayments);
    mockGetProjects.mockResolvedValue(mockProjects);
    mockGetClients.mockResolvedValue(mockClients);
  });

  describe('Integración con PageTableLayout', () => {
    it('debe renderizar PageTableLayout con título y configuración correcta', async () => {
      render(<PaymentsPage />);

      // Verificar título
      expect(screen.getByText('Gestión de Pagos')).toBeInTheDocument();

      // Verificar botón de acción
      await waitFor(() => {
        expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
      });

      // Verificar placeholder de búsqueda
      expect(screen.getByPlaceholderText('Filtrar por proyecto, cliente, tipo...')).toBeInTheDocument();
    });

    it('debe mostrar datos de pagos enriquecidos en la tabla', async () => {
      render(<PaymentsPage />);

      // Esperar a que los datos se carguen
      await waitFor(() => {
        expect(screen.getByText('PRY-001 - Instalación sistema seguridad')).toBeInTheDocument();
      });

      // Verificar que se muestran los datos del cliente
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

      // Verificar formato de moneda
      expect(screen.getByText('$45.000')).toBeInTheDocument();

      // Verificar método de pago con cuotas (usar getAllByText para múltiples elementos)
      expect(screen.getAllByText('Tarjeta de Crédito').length).toBeGreaterThan(0);
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    it('debe mostrar columnas específicas de pagos', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // Verificar headers de columnas específicos de pagos
        expect(screen.getByText('Proyecto')).toBeInTheDocument();
        expect(screen.getByText('Valor')).toBeInTheDocument();
        expect(screen.getByText('Fecha')).toBeInTheDocument();
        expect(screen.getByText('Medio de Pago')).toBeInTheDocument();
        expect(screen.getByText('Tipo')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      });
    });

    it('debe manejar estado de carga correctamente', () => {
      // Mock para simular carga lenta
      mockGetAllPayments.mockImplementation(() => new Promise(() => {}));
      
      render(<PaymentsPage />);

      // Verificar que se muestra el skeleton durante la carga
      expect(screen.getAllByRole('row')).toHaveLength(11); // Header + 10 skeleton rows
    });

    it('debe mostrar estado vacío cuando no hay pagos', async () => {
      mockGetAllPayments.mockResolvedValue([]);

      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('No hay pagos registrados.')).toBeInTheDocument();
        expect(screen.getByText('Empieza añadiendo pagos a tus proyectos.')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de búsqueda específica de pagos', () => {
    it('debe filtrar por número de proyecto', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001 - Instalación sistema seguridad')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Filtrar por proyecto, cliente, tipo...');
      fireEvent.change(searchInput, { target: { value: 'PRY-001' } });

      // Verificar que sigue mostrando el pago filtrado
      expect(screen.getByText('PRY-001 - Instalación sistema seguridad')).toBeInTheDocument();
    });

    it('debe filtrar por nombre de cliente', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Filtrar por proyecto, cliente, tipo...');
      fireEvent.change(searchInput, { target: { value: 'Juan' } });

      // Verificar que se filtra correctamente
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('debe filtrar por tipo de pago', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('anticipo')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Filtrar por proyecto, cliente, tipo...');
      fireEvent.change(searchInput, { target: { value: 'anticipo' } });

      // Verificar que se filtra por tipo
      expect(screen.getByText('anticipo')).toBeInTheDocument();
    });

    it('debe filtrar por método de pago', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tarjeta de Crédito')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Filtrar por proyecto, cliente, tipo...');
      fireEvent.change(searchInput, { target: { value: 'tarjeta' } });

      // Verificar filtrado por método de pago (puede haber múltiples)
      expect(screen.getAllByText('Tarjeta de Crédito').length).toBeGreaterThan(0);
    });
  });

  describe('Paginación específica de pagos', () => {
    it('debe mostrar paginación cuando hay más pagos que el tamaño de página', async () => {
      // Crear array con más de 10 pagos para activar paginación
      const manyPayments = Array.from({ length: 15 }, (_, i) => ({
        ...mockPayments[0],
        id: `payment-${i + 1}`,
        amount: 1000 * (i + 1)
      }));
      
      mockGetAllPayments.mockResolvedValue(manyPayments);

      render(<PaymentsPage />);

      await waitFor(() => {
        // Verificar que se muestra información de paginación
        expect(screen.getAllByText(/página/i).length).toBeGreaterThan(0);
      });
    });

    it('debe mostrar solo 10 pagos por página por defecto', async () => {
      const manyPayments = Array.from({ length: 15 }, (_, i) => ({
        ...mockPayments[0],
        id: `payment-${i + 1}`,
        amount: 1000 * (i + 1)
      }));
      
      mockGetAllPayments.mockResolvedValue(manyPayments);

      render(<PaymentsPage />);

      await waitFor(() => {
        // Verificar que solo se muestran 10 filas de datos (+ 1 header)
        const dataRows = screen.getAllByRole('row').filter(row => 
          !row.querySelector('th') // Excluir header
        );
        expect(dataRows).toHaveLength(10);
      });
    });
  });

  describe('Acciones específicas de pagos', () => {
    it('debe mostrar botones de editar y eliminar para cada pago', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001 - Instalación sistema seguridad')).toBeInTheDocument();
      });

      // Abrir dropdown de acciones
      const actionButton = screen.getAllByLabelText('Más acciones')[0];
      fireEvent.click(actionButton);

      // Verificar opciones de editar y eliminar
      await waitFor(() => {
        expect(screen.getByText('Editar')).toBeInTheDocument();
        expect(screen.getByText('Eliminar')).toBeInTheDocument();
      });
    });

    it('debe abrir diálogo de confirmación al intentar eliminar', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001 - Instalación sistema seguridad')).toBeInTheDocument();
      });

      // Abrir dropdown y seleccionar eliminar
      const actionButton = screen.getAllByLabelText('Más acciones')[0];
      fireEvent.click(actionButton);

      await waitFor(() => {
        const deleteButton = screen.getByText('Eliminar');
        fireEvent.click(deleteButton);
      });

      // Verificar que se abre el diálogo de confirmación
      await waitFor(() => {
        expect(screen.getByText('¿Estás absolutamente seguro?')).toBeInTheDocument();
        expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
      });
    });
  });

  describe('Renderizado de datos enriquecidos', () => {
    it('debe mostrar información de proyecto y cliente combinada', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // Verificar que se muestra el número de proyecto con descripción
        expect(screen.getByText('PRY-001 - Instalación sistema seguridad')).toBeInTheDocument();
        
        // Verificar que se muestra el nombre del cliente
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });
    });

    it('debe manejar datos faltantes graciosamente', async () => {
      // Mock con datos incompletos
      const incompletePayments = [{
        ...mockPayments[0],
        projectId: 'nonexistent-project'
      }];
      
      mockGetAllPayments.mockResolvedValue(incompletePayments);

      render(<PaymentsPage />);

      await waitFor(() => {
        // Verificar manejo de proyecto no encontrado
        expect(screen.getByText(/Proyecto no encontrado/)).toBeInTheDocument();
      });
    });

    it('debe formatear correctamente las fechas y monedas', async () => {
      render(<PaymentsPage />);

      await waitFor(() => {
        // Verificar formato de moneda chilena
        expect(screen.getByText('$45.000')).toBeInTheDocument();
      });
        
      // Verificar que se muestran fechas formateadas (múltiples elementos esperados)
      const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/;
      expect(screen.getAllByText(dateRegex).length).toBeGreaterThan(0);
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la carga de pagos', async () => {
      mockGetAllPayments.mockRejectedValue(new Error('Error de conexión'));

      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Error al cargar pagos')).toBeInTheDocument();
        expect(screen.getByText('Error de conexión')).toBeInTheDocument();
      });
    });

    it('debe tener botón para reintentar la carga', async () => {
      mockGetAllPayments.mockRejectedValue(new Error('Error de conexión'));

      render(<PaymentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Intentar de Nuevo')).toBeInTheDocument();
      });
    });
  });
});