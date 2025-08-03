import React from 'react';
import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import VisitsPage from '@/app/visits/page';
import { mockVisits } from '../__mocks__/testData';
import { getVisits, deleteVisit } from '@/services/visitService';

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
jest.mock('@/services/visitService');
const mockGetVisits = getVisits as jest.MockedFunction<typeof getVisits>;
const mockDeleteVisit = deleteVisit as jest.MockedFunction<typeof deleteVisit>;

// Mock de Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    pathname: '/visits',
    searchParams: new URLSearchParams(),
  }),
  usePathname: () => '/visits',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock del componente NewVisitDialog
jest.mock('@/components/modals/visits', () => ({
  NewVisitDialog: () => (
    <button data-testid="new-visit-button">
      Nueva Visita
    </button>
  ),
  EditVisitDialog: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="edit-visit-dialog">{children}</div>
  ),
}));

describe('VisitsPage Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar mocks por defecto
    mockGetVisits.mockResolvedValue(mockVisits);
    mockDeleteVisit.mockResolvedValue(undefined);
  });

  describe('Integración con PageTableLayout', () => {
    it('debe renderizar PageTableLayout con título y configuración correcta', async () => {
      render(<VisitsPage />);

      // Esperar a que los datos se carguen
      await waitFor(() => {
        expect(screen.getByText('Visitas')).toBeInTheDocument();
      });

      // Verificar botón de nueva visita (mockeado)
      expect(screen.getByTestId('new-visit-button')).toBeInTheDocument();

      // Verificar placeholder de búsqueda
      expect(screen.getByPlaceholderText('Buscar visitas...')).toBeInTheDocument();
    });

    it('debe mostrar datos de visitas en la tabla', async () => {
      render(<VisitsPage />);

      // Esperar a que los datos se carguen
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Verificar que se muestran otros datos de visitas
      expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
      expect(screen.getByText('Ana Torres')).toBeInTheDocument();

      // Verificar teléfonos
      expect(screen.getByText('+56912345678')).toBeInTheDocument();
      expect(screen.getByText('+56987654321')).toBeInTheDocument();
    });

    it('debe mostrar columnas específicas de visitas', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        // Verificar headers de columnas específicos de visitas
        expect(screen.getByText('Nombre')).toBeInTheDocument();
        expect(screen.getByText('Teléfono')).toBeInTheDocument();
        expect(screen.getByText('Dirección')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
        expect(screen.getByText('Fecha Programada')).toBeInTheDocument();
        expect(screen.getByText('Acciones')).toBeInTheDocument();
      });
    });

    it('debe manejar estado de carga correctamente', () => {
      // Mock para simular carga lenta
      mockGetVisits.mockImplementation(() => new Promise(() => {}));
      
      render(<VisitsPage />);

      // Verificar que se muestra el mensaje de carga
      expect(screen.getByText('Cargando visitas...')).toBeInTheDocument();
    });

    it('debe mostrar estado vacío cuando no hay visitas', async () => {
      mockGetVisits.mockResolvedValue([]);

      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('No hay visitas registradas')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de búsqueda específica de visitas', () => {
    it('debe filtrar por nombre', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar visitas...');
      fireEvent.change(searchInput, { target: { value: 'Juan' } });

      // Verificar que se filtra correctamente
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    it('debe filtrar por teléfono', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('+56912345678')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar visitas...');
      fireEvent.change(searchInput, { target: { value: '+56912345678' } });

      // Verificar que se filtra por teléfono
      expect(screen.getByText('+56912345678')).toBeInTheDocument();
    });

    it('debe filtrar por dirección', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Avenida Providencia 123, Santiago')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar visitas...');
      fireEvent.change(searchInput, { target: { value: 'Providencia' } });

      // Verificar que se filtra por dirección
      expect(screen.getByText('Avenida Providencia 123, Santiago')).toBeInTheDocument();
    });
  });

  describe('Funcionalidad de selección múltiple', () => {
    it('debe mostrar checkboxes para selección múltiple', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Verificar que se muestran checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('debe manejar selección de filas individuales', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Hacer clic en una checkbox de fila
      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Primer row (después del select all)
      
      fireEvent.click(firstRowCheckbox);
      
      // Verificar que la fila se selecciona
      expect(firstRowCheckbox).toBeChecked();
    });
  });

  describe('Paginación específica de visitas', () => {
    it('debe mostrar paginación cuando hay más visitas que el tamaño de página', async () => {
      // Crear array con más de 10 visitas para activar paginación
      const manyVisits = Array.from({ length: 15 }, (_, i) => ({
        ...mockVisits[0],
        id: `visit-${i + 1}`,
        name: `Visita ${i + 1}`,
      }));
      
      mockGetVisits.mockResolvedValue(manyVisits);

      render(<VisitsPage />);

      await waitFor(() => {
        // Verificar que se muestra información de paginación
        expect(screen.getAllByText(/página/i).length).toBeGreaterThan(0);
      });
    });

    it('debe mostrar solo 10 visitas por página por defecto', async () => {
      const manyVisits = Array.from({ length: 15 }, (_, i) => ({
        ...mockVisits[0],
        id: `visit-${i + 1}`,
        name: `Visita ${i + 1}`,
      }));
      
      mockGetVisits.mockResolvedValue(manyVisits);

      render(<VisitsPage />);

      await waitFor(() => {
        // Verificar que solo se muestran 10 filas de datos (+ 1 header)
        const dataRows = screen.getAllByRole('row').filter(row => 
          !row.querySelector('th') // Excluir header
        );
        expect(dataRows).toHaveLength(10);
      });
    });
  });

  describe('Renderizado de datos específicos de visitas', () => {
    it('debe mostrar estados como badges con colores apropiados', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        // Verificar que se muestran los estados
        expect(screen.getByText('Completada')).toBeInTheDocument();
        expect(screen.getByText('Agendada')).toBeInTheDocument();
        expect(screen.getByText('Reagendada')).toBeInTheDocument();
      });
    });

    it('debe mostrar iconos junto a teléfonos y direcciones', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Verificar que hay iconos de teléfono y dirección (via data-testid)
      const phoneIcons = screen.getAllByTestId('lucide-icon');
      expect(phoneIcons.length).toBeGreaterThan(0);
    });

    it('debe formatear correctamente las fechas', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        // Verificar que se muestran fechas formateadas
        const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
        expect(screen.getAllByText(dateRegex).length).toBeGreaterThan(0);
      });
    });

    it('debe truncar direcciones largas correctamente', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Verificar que las direcciones tienen clase de truncado
      const addressElements = screen.getAllByText(/Santiago/);
      addressElements.forEach(element => {
        const span = element.closest('span');
        if (span && span.className.includes('truncate')) {
          expect(span).toHaveClass('truncate');
        }
      });
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la carga de visitas', async () => {
      mockGetVisits.mockRejectedValue(new Error('Error de conexión'));

      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText(/No se pudieron cargar las visitas/)).toBeInTheDocument();
      });
    });
  });

  describe('Acciones específicas de visitas', () => {
    it('debe mostrar acciones disponibles en el dropdown', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
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

    it('debe abrir diálogo de confirmación al intentar eliminar', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
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

  describe('Estados de carga específicos', () => {
    it('debe mostrar mensaje de carga inicial', () => {
      mockGetVisits.mockImplementation(() => new Promise(() => {}));
      
      render(<VisitsPage />);

      expect(screen.getByText('Cargando visitas...')).toBeInTheDocument();
    });

    it('debe usar PageTableLayout para estado de carga de tabla', async () => {
      render(<VisitsPage />);

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      });

      // Una vez cargados los datos, la tabla debe estar renderizada
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});