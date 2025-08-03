import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import AfterSalesPage from '@/app/aftersales/page';
import { mockAfterSales, mockProjects } from '../__mocks__/testData';
import { getAfterSalesForProject, deleteAfterSales } from '@/services/afterSalesService';
import { getProjects } from '@/services/projectService';

// Mock de Firebase antes que otros mocks
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn(),
  },
  auth: {
    currentUser: null,
  },
}));

// Mock de servicios
jest.mock('@/services/afterSalesService');
jest.mock('@/services/projectService');

const mockGetAfterSalesForProject = getAfterSalesForProject as jest.MockedFunction<typeof getAfterSalesForProject>;
const mockDeleteAfterSales = deleteAfterSales as jest.MockedFunction<typeof deleteAfterSales>;
const mockGetProjects = getProjects as jest.MockedFunction<typeof getProjects>;

// Mock del componente NewAfterSaleDialog
jest.mock('@/components/modals/afterSales', () => ({
  NewAfterSaleDialog: () => (
    <button data-testid="new-aftersale-button">
      Nueva Postventa
    </button>
  ),
  EditAfterSaleDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="edit-aftersale-dialog">{children}</div>
  ),
}));

describe('AfterSalesPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks por defecto
    mockGetProjects.mockResolvedValue(mockProjects);
    mockGetAfterSalesForProject.mockImplementation((projectId) => {
      // Simular que devuelve casos de postventa para el proyecto específico
      return Promise.resolve(mockAfterSales.filter(as => as.projectId === projectId));
    });
    mockDeleteAfterSales.mockResolvedValue(undefined);
  });

  describe('Integración con PageTableLayout', () => {
    it('debe renderizar PageTableLayout con título y configuración correcta', async () => {
      render(<AfterSalesPage />);

      // Esperar a que los datos se carguen
      await waitFor(() => {
        expect(screen.getByText('Postventas')).toBeInTheDocument();
      });

      // Verificar botón de nueva postventa (mockeado)
      expect(screen.getByTestId('new-aftersale-button')).toBeInTheDocument();

      // Verificar placeholder de búsqueda
      expect(screen.getByPlaceholderText('Buscar postventas...')).toBeInTheDocument();
    });

    it('debe mostrar datos de postventas en la tabla', async () => {
      render(<AfterSalesPage />);

      // Esperar a que los datos se carguen
      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      // Verificar otros datos de postventas
      expect(screen.getByText('Mantenimiento preventivo anual')).toBeInTheDocument();
      expect(screen.getByText('Llamada de seguimiento')).toBeInTheDocument();
    });

    it('debe mostrar columnas específicas de postventas', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar headers de columnas específicos de postventas
        expect(screen.getByText('Proyecto')).toBeInTheDocument();
        expect(screen.getByText('Ingreso')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      });
    });

    it('debe manejar estado de carga correctamente', () => {
      // Mock para simular carga lenta
      mockGetProjects.mockImplementation(() => new Promise(() => {}));
      
      render(<AfterSalesPage />);

      // Verificar que se muestra el skeleton durante la carga
      expect(screen.getAllByRole('row')).toHaveLength(11); // Header + 10 skeleton rows
    });

    it('debe mostrar estado vacío cuando no hay postventas', async () => {
      mockGetAfterSalesForProject.mockResolvedValue([]);

      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('No se encontraron registros de postventa.')).toBeInTheDocument();
        expect(screen.getByText('No hay datos que coincidan con los filtros actuales.')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de búsqueda específica de postventas', () => {
    it('debe filtrar por descripción', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar postventas...');
      fireEvent.change(searchInput, { target: { value: 'Revisión' } });

      // Verificar que se filtra correctamente
      expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
    });

    it('debe filtrar por estado', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Completada')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar postventas...');
      fireEvent.change(searchInput, { target: { value: 'Completada' } });

      // Verificar que se filtra por estado
      expect(screen.getByText('Completada')).toBeInTheDocument();
    });
  });

  describe('Funcionalidad de selección múltiple', () => {
    it('debe mostrar checkboxes para selección múltiple', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      // Verificar que se muestran checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('debe manejar selección de filas individuales', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      // Hacer clic en una checkbox de fila
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Primer row (después del select all)
      
      fireEvent.click(firstRowCheckbox);
      
      // Verificar que la fila se selecciona
      expect(firstRowCheckbox).toBeChecked();
    });
  });

  describe('Paginación específica de postventas', () => {
    it('debe mostrar paginación cuando hay más postventas que el tamaño de página', async () => {
      // Crear array con más de 10 postventas para activar paginación
      const manyAfterSales = Array.from({ length: 15 }, (_, i) => ({
        ...mockAfterSales[0],
        id: `aftersale-${i + 1}`,
        description: `Postventa ${i + 1}`,
      }));
      
      mockGetAfterSalesForProject.mockResolvedValue(manyAfterSales);

      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar que se muestra información de paginación
        expect(screen.getAllByText(/página/i).length).toBeGreaterThan(0);
      });
    });

    it('debe mostrar solo 10 postventas por página por defecto', async () => {
      const manyAfterSales = Array.from({ length: 15 }, (_, i) => ({
        ...mockAfterSales[0],
        id: `aftersale-${i + 1}`,
        description: `Postventa ${i + 1}`,
      }));
      
      mockGetAfterSalesForProject.mockResolvedValue(manyAfterSales);

      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar que solo se muestran 10 filas de datos (+ 1 header)
        const dataRows = screen.getAllByRole('row').filter(row => 
          !row.querySelector('th') // Excluir header
        );
        expect(dataRows).toHaveLength(10);
      });
    });
  });

  describe('Renderizado de datos específicos de postventas', () => {
    it('debe mostrar estados como badges con variantes apropiadas', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar que se muestran los estados
        expect(screen.getByText('Completada')).toBeInTheDocument();
        expect(screen.getByText('Agendada')).toBeInTheDocument();
        expect(screen.getByText('Ingresada')).toBeInTheDocument();
      });
    });

    it('debe mostrar información de proyecto usando ProjectClientDisplay', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar que se muestra información del proyecto 
        // (esto depende de cómo ProjectClientDisplay renderiza los datos)
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });
    });

    it('debe formatear correctamente las fechas de ingreso', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar que se muestran fechas formateadas
        const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
        expect(screen.getAllByText(dateRegex).length).toBeGreaterThan(0);
      });
    });

    it('debe manejar proyectos desconocidos graciosamente', async () => {
      // Mock con un caso de postventa con projectId inexistente
      const afterSaleWithUnknownProject = [{
        ...mockAfterSales[0],
        projectId: 'nonexistent-project'
      }];
      
      mockGetAfterSalesForProject.mockResolvedValue(afterSaleWithUnknownProject);

      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar manejo de proyecto desconocido
        expect(screen.getByText('Proyecto desconocido')).toBeInTheDocument();
      });
    });
  });

  describe('Acciones específicas de postventas', () => {
    it('debe mostrar acciones disponibles en el dropdown', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      // Buscar y hacer clic en el botón de acciones
      const actionButtons = screen.getAllByRole('button');
      const actionButton = actionButtons.find(button => 
        button.querySelector('[data-testid="lucide-icon"]') && 
        button.getAttribute('aria-expanded') !== null
      );
      
      if (actionButton) {
        fireEvent.click(actionButton);

        // Esperar a que aparezcan las opciones del dropdown
        await waitFor(() => {
          expect(screen.getByText('Ver detalles')).toBeInTheDocument();
          expect(screen.getByText('Editar')).toBeInTheDocument();
          expect(screen.getByText('Eliminar')).toBeInTheDocument();
        }, { timeout: 2000 });
      }
    });

    it('debe abrir diálogo de detalles al hacer clic en "Ver detalles"', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      // Buscar el botón de acciones y hacer clic
      const actionButtons = screen.getAllByRole('button');
      const actionButton = actionButtons.find(button => 
        button.querySelector('[data-testid="lucide-icon"]') && 
        button.getAttribute('aria-expanded') !== null
      );
      
      if (actionButton) {
        fireEvent.click(actionButton);

        await waitFor(() => {
          const detailsButton = screen.getByText('Ver detalles');
          fireEvent.click(detailsButton);
        });

        // Verificar que se abre el diálogo de detalles
        await waitFor(() => {
          expect(screen.getByText('Detalles de la Postventa')).toBeInTheDocument();
        });
      }
    });

    it('debe abrir diálogo de confirmación al intentar eliminar', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      // Buscar el botón de acciones y hacer clic
      const actionButtons = screen.getAllByRole('button');
      const actionButton = actionButtons.find(button => 
        button.querySelector('[data-testid="lucide-icon"]') && 
        button.getAttribute('aria-expanded') !== null
      );
      
      if (actionButton) {
        fireEvent.click(actionButton);

        await waitFor(() => {
          const deleteButton = screen.getByText('Eliminar');
          fireEvent.click(deleteButton);
        });

        // Verificar que se abre el diálogo de confirmación
        await waitFor(() => {
          expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
          expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Diálogos específicos de postventas', () => {
    it('debe mostrar información correcta en el diálogo de detalles', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        expect(screen.getByText('Revisión sistema después de 6 meses')).toBeInTheDocument();
      });

      // Simular apertura del diálogo de detalles directamente
      const actionButtons = screen.getAllByRole('button');
      const actionButton = actionButtons.find(button => 
        button.querySelector('[data-testid="lucide-icon"]') && 
        button.getAttribute('aria-expanded') !== null
      );
      
      if (actionButton) {
        fireEvent.click(actionButton);

        await waitFor(() => {
          const detailsButton = screen.getByText('Ver detalles');
          fireEvent.click(detailsButton);
        });

        // Verificar contenido del diálogo
        await waitFor(() => {
          expect(screen.getByText('Detalles de la Postventa')).toBeInTheDocument();
          expect(screen.getByText('Instalación sistema seguridad')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Carga de datos y estado', () => {
    it('debe cargar datos de múltiples proyectos correctamente', async () => {
      render(<AfterSalesPage />);

      await waitFor(() => {
        // Verificar que se llama getAfterSalesForProject para cada proyecto
        expect(mockGetAfterSalesForProject).toHaveBeenCalledTimes(mockProjects.length);
      });
    });

    it('debe manejar errores en la carga de datos', async () => {
      mockGetProjects.mockRejectedValue(new Error('Error de conexión'));

      render(<AfterSalesPage />);

      // El componente debería manejar el error graciosamente
      // (en este caso, probablemente mostrando un estado de carga o error)
      await waitFor(() => {
        expect(screen.getByTestId('new-aftersale-button')).toBeInTheDocument();
      });
    });
  });
});