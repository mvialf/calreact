import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import ProjectsPage from '@/app/projects/page';
import { mockProjects, mockClients, mockPayments } from '../__mocks__/testData';
import { useProjectsData } from '@/hooks/useProjectsData';

// Mock del hook personalizado
jest.mock('@/hooks/useProjectsData');
const mockUseProjectsData = useProjectsData as jest.MockedFunction<typeof useProjectsData>;

// Mock de Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    pathname: '/projects',
    searchParams: new URLSearchParams(),
  }),
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock del componente NewProjectDialog para evitar problemas con useRouter
jest.mock('@/components/modals/projects/NewProjectDialog', () => ({
  NewProjectDialog: () => (
    <button data-testid="new-project-button">
      Nuevo Proyecto
    </button>
  ),
}));

// Mock del componente EditProjectDialog
jest.mock('@/components/modals/projects/EditProjectDialog', () => ({
  EditProjectDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="edit-project-dialog">{children}</div>
  ),
}));

// Mock del toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('ProjectsPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mock por defecto con datos enriquecidos
    const enrichedProjects = mockProjects.map((project, index) => {
      const client = mockClients.find(c => c.id === project.clientId);
      const projectPayments = mockPayments.filter(p => p.projectId === project.id);
      const totalPayments = projectPayments.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        ...project,
        clientName: client?.name || 'Cliente Desconocido',
        totalPayments,
        totalPaymentPercentage: project.total ? (totalPayments / project.total) * 100 : 0,
        isPaid: totalPayments >= (project.total || 0),
        balance: project.balance || 0,
      };
    });

    mockUseProjectsData.mockReturnValue({
      projects: enrichedProjects,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe('Integración con PageTableLayout', () => {
    it('debe renderizar PageTableLayout con título y configuración correcta', async () => {
      render(<ProjectsPage />);

      // Verificar título
      expect(screen.getByText('Proyectos')).toBeInTheDocument();

      // Verificar botón de nuevo proyecto (mockeado)
      expect(screen.getByTestId('new-project-button')).toBeInTheDocument();

      // Verificar placeholder de búsqueda
      expect(screen.getByPlaceholderText('Buscar por presupuesto, cliente o glosa...')).toBeInTheDocument();
    });

    it('debe mostrar datos de proyectos enriquecidos en la tabla', async () => {
      render(<ProjectsPage />);

      // Esperar a que los datos se carguen
      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Verificar que se muestran los datos del cliente
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();

      // Verificar formato de moneda en monto total
      expect(screen.getByText('$150.000')).toBeInTheDocument();

      // Verificar estado del proyecto
      expect(screen.getByText('montaje')).toBeInTheDocument();
    });

    it('debe mostrar columnas específicas de proyectos', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        // Verificar headers de columnas específicos de proyectos
        expect(screen.getByText('Proyecto')).toBeInTheDocument();
        expect(screen.getByText('Fecha Creación')).toBeInTheDocument();
        expect(screen.getByText('Monto Total')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Pagos')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      });
    });

    it('debe manejar estado de carga correctamente', () => {
      mockUseProjectsData.mockReturnValue({
        projects: [],
        isLoading: true,
        isError: false,
        error: null,
      });
      
      render(<ProjectsPage />);

      // Verificar que se muestra el skeleton durante la carga
      expect(screen.getAllByRole('row')).toHaveLength(11); // Header + 10 skeleton rows
    });

    it('debe mostrar estado vacío cuando no hay proyectos', async () => {
      mockUseProjectsData.mockReturnValue({
        projects: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('No se encontraron proyectos que coincidan con los filtros actuales.')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de búsqueda específica de proyectos', () => {
    it('debe filtrar por número de proyecto', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar por presupuesto, cliente o glosa...');
      fireEvent.change(searchInput, { target: { value: 'PRY-001' } });

      // Verificar que sigue mostrando el proyecto filtrado
      expect(screen.getByText('PRY-001')).toBeInTheDocument();
    });

    it('debe filtrar por nombre de cliente', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar por presupuesto, cliente o glosa...');
      fireEvent.change(searchInput, { target: { value: 'Juan' } });

      // Verificar que se filtra correctamente
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('debe filtrar por glosa', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar por presupuesto, cliente o glosa...');
      fireEvent.change(searchInput, { target: { value: 'Instalación' } });

      // Verificar que se filtra por glosa
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });
  });

  describe('Funcionalidad de selección múltiple', () => {
    it('debe mostrar checkboxes para selección múltiple', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Verificar que se muestran checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('debe manejar selección de filas individuales', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Hacer clic en una checkbox de fila
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Primer row (después del select all)
      
      fireEvent.click(firstRowCheckbox);
      
      // Verificar que la fila se selecciona (esto se refleja visualmente)
      expect(firstRowCheckbox).toBeChecked();
    });
  });

  describe('Ordenamiento específico de proyectos', () => {
    it('debe permitir ordenamiento por columnas sortables', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Hacer clic en header "Proyecto" para ordenar
      const projectHeader = screen.getByText('Proyecto').closest('th');
      if (projectHeader) {
        fireEvent.click(projectHeader);
      }

      // Verificar que los datos siguen mostrándose (ordenamiento aplicado)
      expect(screen.getByText('PRY-001')).toBeInTheDocument();
    });

    it('debe mostrar indicadores de ordenamiento', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Verificar que las columnas sortables tienen cursor pointer
      const projectHeader = screen.getByText('Proyecto').closest('th');
      const totalHeader = screen.getByText('Monto Total').closest('th');
      
      if (projectHeader && totalHeader) {
        expect(projectHeader).toHaveClass('cursor-pointer');
        expect(totalHeader).toHaveClass('cursor-pointer');
      }
    });
  });

  describe('Paginación específica de proyectos', () => {
    it('debe mostrar paginación cuando hay más proyectos que el tamaño de página', async () => {
      // Crear array con más de 10 proyectos para activar paginación
      const manyProjects = Array.from({ length: 15 }, (_, i) => ({
        ...mockProjects[0],
        id: `project-${i + 1}`,
        projectNumber: `PRY-${String(i + 1).padStart(3, '0')}`,
        clientName: 'Cliente Test',
        totalPayments: 0,
        totalPaymentPercentage: 0,
        isPaid: false,
        balance: 100000,
      }));
      
      mockUseProjectsData.mockReturnValue({
        projects: manyProjects,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        // Verificar que se muestra información de paginación
        expect(screen.getAllByText(/página/i).length).toBeGreaterThan(0);
      });
    });

    it('debe mostrar solo 10 proyectos por página por defecto', async () => {
      const manyProjects = Array.from({ length: 15 }, (_, i) => ({
        ...mockProjects[0],
        id: `project-${i + 1}`,
        projectNumber: `PRY-${String(i + 1).padStart(3, '0')}`,
        clientName: 'Cliente Test',
        totalPayments: 0,
        totalPaymentPercentage: 0,
        isPaid: false,
        balance: 100000,
      }));
      
      mockUseProjectsData.mockReturnValue({
        projects: manyProjects,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        // Verificar que solo se muestran 10 filas de datos (+ 1 header)
        const dataRows = screen.getAllByRole('row').filter(row => 
          !row.querySelector('th') // Excluir header
        );
        expect(dataRows).toHaveLength(10);
      });
    });
  });

  describe('Filtros adicionales específicos de proyectos', () => {
    it('debe mostrar botón para ocultar/mostrar proyectos completados y pagados', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Verificar que existe el botón de filtro adicional
      const filterButton = screen.getByTitle('Ocultar proyectos completados y pagados');
      expect(filterButton).toBeInTheDocument();
    });

    it('debe filtrar proyectos completados y pagados cuando se activa el filtro', async () => {
      // Agregar un proyecto completado y pagado a los datos mock
      const projectsWithCompleted = [
        ...mockProjects.map((project, index) => {
          const client = mockClients.find(c => c.id === project.clientId);
          const projectPayments = mockPayments.filter(p => p.projectId === project.id);
          const totalPayments = projectPayments.reduce((sum, p) => sum + p.amount, 0);
          
          return {
            ...project,
            clientName: client?.name || 'Cliente Desconocido',
            totalPayments,
            totalPaymentPercentage: project.total ? (totalPayments / project.total) * 100 : 0,
            isPaid: totalPayments >= (project.total || 0),
            balance: project.balance || 0,
          };
        }),
        {
          id: 'completed-project',
          projectNumber: 'PRY-COMPLETED',
          clientId: 'client-1',
          description: 'Proyecto completado',
          glosa: 'Proyecto completado',
          date: new Date('2024-01-01'),
          subtotal: 100000,
          taxRate: 19,
          total: 119000,
          balance: 0,
          status: 'completado' as const,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          clientName: 'Juan Pérez',
          totalPayments: 119000,
          totalPaymentPercentage: 100,
          isPaid: true,
        }
      ];

      mockUseProjectsData.mockReturnValue({
        projects: projectsWithCompleted,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-COMPLETED')).toBeInTheDocument();
      });

      // Activar el filtro
      const filterButton = screen.getByTitle('Ocultar proyectos completados y pagados');
      fireEvent.click(filterButton);

      // Verificar que el proyecto completado ya no se muestra
      await waitFor(() => {
        expect(screen.queryByText('PRY-COMPLETED')).not.toBeInTheDocument();
      });
    });
  });

  describe('Renderizado de datos específicos de proyectos', () => {
    it('debe mostrar información de pagos con porcentajes', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Verificar que se muestran los pagos
      expect(screen.getByText('$45.000')).toBeInTheDocument();
      
      // Verificar que se muestra el porcentaje de pago
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('debe mostrar estados del proyecto como badges clicables', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('montaje')).toBeInTheDocument();
      });

      // Verificar que el estado es clicable (debe ser un dropdown)
      const statusBadge = screen.getByText('montaje').closest('button');
      expect(statusBadge).toBeInTheDocument();
    });

    it('debe formatear correctamente las fechas', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        // Verificar que se muestra una fecha formateada
        const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
        expect(screen.getAllByText(dateRegex).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la carga de proyectos', async () => {
      mockUseProjectsData.mockReturnValue({
        projects: [],
        isLoading: false,
        isError: true,
        error: new Error('Error de conexión'),
      });

      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error al cargar proyectos/)).toBeInTheDocument();
        expect(screen.getByText(/Error de conexión/)).toBeInTheDocument();
      });
    });
  });

  describe('Acciones específicas de proyectos', () => {
    it('debe mostrar acciones disponibles en el dropdown', async () => {
      render(<ProjectsPage />);

      await waitFor(() => {
        expect(screen.getByText('PRY-001')).toBeInTheDocument();
      });

      // Buscar y hacer clic en el botón de acciones
      const actionButtons = screen.getAllByRole('button');
      const actionButton = actionButtons.find(button => 
        button.querySelector('[data-testid="lucide-icon"]')
      );
      
      if (actionButton) {
        fireEvent.click(actionButton);

        // Esperar a que aparezcan las opciones del dropdown
        await waitFor(() => {
          expect(screen.getByText('Editar')).toBeInTheDocument();
          expect(screen.getByText('Registrar Pago')).toBeInTheDocument();
          expect(screen.getByText('Estado de Cuenta')).toBeInTheDocument();
          expect(screen.getByText('Eliminar')).toBeInTheDocument();
        });
      }
    });
  });
});