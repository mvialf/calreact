import React, { ReactElement } from 'react';
import { render, RenderOptions, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Importar mocks
import { mockFirestore } from '@/__mocks__/firebaseMock';
import * as testData from '../__mocks__/testData';

// Tipos para las utilidades de test
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

interface PageTableTestHelpers {
  searchInput: HTMLElement;
  table: HTMLElement;
  getColumnHeaders: () => HTMLElement[];
  getTableRows: () => HTMLElement[];
  getRowByIndex: (index: number) => HTMLElement | null;
  getPaginationControls: () => HTMLElement;
  getSelectAllCheckbox: () => HTMLElement;
  getActionButton: () => HTMLElement;
}

// --- PROVIDERS WRAPPER ---
function AllTheProviders({ children, queryClient }: { children: React.ReactNode; queryClient?: QueryClient }) {
  const defaultQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const client = queryClient || defaultQueryClient;

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

// --- CUSTOM RENDER ---
export function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

// --- HELPERS PARA PAGETALELAYOUT ---
export function getPageTableHelpers(): PageTableTestHelpers {
  const searchInput = screen.getByPlaceholderText(/buscar|filtrar/i);
  const table = screen.getByRole('table');
  
  return {
    searchInput,
    table,
    getColumnHeaders: () => screen.getAllByRole('columnheader'),
    getTableRows: () => screen.getAllByRole('row').slice(1), // Excluir header
    getRowByIndex: (index: number) => {
      const rows = screen.getAllByRole('row').slice(1);
      return rows[index] || null;
    },
    getPaginationControls: () => screen.getByTestId('pagination-controls') || screen.getByText(/página/i).closest('div'),
    getSelectAllCheckbox: () => screen.getAllByRole('checkbox')[0], // Primer checkbox (select all)
    getActionButton: () => screen.getByRole('button', { name: /registrar|nuevo|agregar/i }),
  };
}

// --- HELPERS PARA INTERACCIONES COMUNES ---
export const tableInteractions = {
  // Buscar en la tabla
  async search(searchTerm: string) {
    const { searchInput } = getPageTableHelpers();
    fireEvent.change(searchInput, { target: { value: searchTerm } });
    
    // Esperar debounce si existe
    await waitFor(() => {
      expect(searchInput).toHaveValue(searchTerm);
    });
  },

  // Cambiar página
  async goToPage(pageNumber: number) {
    const pageButton = screen.getByRole('button', { name: pageNumber.toString() });
    fireEvent.click(pageButton);
    
    await waitFor(() => {
      expect(pageButton).toHaveAttribute('aria-current', 'page');
    });
  },

  // Cambiar tamaño de página
  async changePageSize(size: number) {
    const pageSizeSelect = screen.getByDisplayValue(/10|25|50/);
    fireEvent.change(pageSizeSelect, { target: { value: size.toString() } });
    
    await waitFor(() => {
      expect(pageSizeSelect).toHaveValue(size.toString());
    });
  },

  // Seleccionar todas las filas
  async selectAll() {
    const { getSelectAllCheckbox } = getPageTableHelpers();
    const selectAllCheckbox = getSelectAllCheckbox();
    fireEvent.click(selectAllCheckbox);
    
    await waitFor(() => {
      expect(selectAllCheckbox).toBeChecked();
    });
  },

  // Seleccionar fila específica
  async selectRow(index: number) {
    const { getRowByIndex } = getPageTableHelpers();
    const row = getRowByIndex(index);
    if (!row) throw new Error(`No se encontró la fila ${index}`);
    
    const checkbox = row.querySelector('input[type="checkbox"]');
    if (!checkbox) throw new Error(`No se encontró checkbox en fila ${index}`);
    
    fireEvent.click(checkbox);
    
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  },

  // Ordenar por columna
  async sortByColumn(columnText: string) {
    const columnHeader = screen.getByRole('columnheader', { name: new RegExp(columnText, 'i') });
    fireEvent.click(columnHeader);
    
    await waitFor(() => {
      // Verificar que el ícono de ordenamiento cambie
      expect(columnHeader).toBeInTheDocument();
    });
  },

  // Hacer clic en acción de fila
  async clickRowAction(rowIndex: number, actionText: string) {
    const { getRowByIndex } = getPageTableHelpers();
    const row = getRowByIndex(rowIndex);
    if (!row) throw new Error(`No se encontró la fila ${rowIndex}`);

    // Buscar botón de menú de acciones
    const actionButton = row.querySelector('button[aria-label*="acciones"], button[aria-label*="menu"]') || 
                        row.querySelector('button:last-child');
    
    if (!actionButton) throw new Error(`No se encontró botón de acciones en fila ${rowIndex}`);
    
    fireEvent.click(actionButton);
    
    // Esperar que aparezca el menú
    await waitFor(() => {
      const menuItem = screen.getByText(new RegExp(actionText, 'i'));
      expect(menuItem).toBeInTheDocument();
      fireEvent.click(menuItem);
    });
  },
};

// --- HELPERS PARA ESTADOS DE LOADING/ERROR ---
export const stateHelpers = {
  // Verificar estado de carga
  expectLoadingState() {
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
    // Verificar skeletons
    const skeletons = screen.getAllByTestId(/skeleton/i);
    expect(skeletons.length).toBeGreaterThan(0);
  },

  // Verificar estado vacío
  expectEmptyState(emptyText?: string) {
    const defaultText = emptyText || /no.*encontr|no.*registr|no.*datos/i;
    expect(screen.getByText(defaultText)).toBeInTheDocument();
  },

  // Verificar estado de error
  expectErrorState(errorText?: string) {
    const defaultText = errorText || /error|problema|fall/i;
    expect(screen.getByText(defaultText)).toBeInTheDocument();
  },

  // Verificar que los datos se muestran
  expectDataDisplayed(expectedRowCount?: number) {
    const { getTableRows } = getPageTableHelpers();
    const rows = getTableRows();
    
    if (expectedRowCount !== undefined) {
      expect(rows).toHaveLength(expectedRowCount);
    } else {
      expect(rows.length).toBeGreaterThan(0);
    }
  },
};

// --- MOCKS PARA HOOKS ESPECÍFICOS ---
export const mockHooks = {
  // Mock para useProjectsData
  mockUseProjectsData: (data = testData.mockEnrichedProjects, isLoading = false, error = null) => {
    return jest.fn().mockReturnValue({
      projects: data,
      isLoading,
      isError: !!error,
      error,
    });
  },

  // Mock para React Query
  mockUseQuery: (data: any, isLoading = false, error = null) => {
    return jest.fn().mockReturnValue({
      data,
      isLoading,
      isError: !!error,
      error,
      refetch: jest.fn(),
      isSuccess: !isLoading && !error,
    });
  },

  // Mock para mutations
  mockUseMutation: (onSuccess?: Function, onError?: Function) => {
    return jest.fn().mockReturnValue({
      mutate: jest.fn().mockImplementation((variables) => {
        if (onSuccess) {
          setTimeout(() => onSuccess(variables), 0);
        }
      }),
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
      isError: false,
      error: null,
      variables: null,
    });
  },
};

// --- HELPERS PARA FIREBASE MOCKING ---
export const firebaseMocks = {
  // Configurar Firestore mock con datos específicos
  mockFirestoreData: (collection: string, data: any[]) => {
    mockFirestore.collection.mockImplementation((collectionName: string) => {
      if (collectionName === collection) {
        return {
          ...mockFirestore,
          get: jest.fn().mockResolvedValue({
            docs: data.map(item => ({
              id: item.id,
              data: () => item,
              exists: true,
            })),
            empty: data.length === 0,
            forEach: jest.fn((callback) => {
              data.forEach((item, index) => callback({
                id: item.id,
                data: () => item,
                exists: true,
              }));
            }),
          }),
        };
      }
      return mockFirestore;
    });
  },

  // Reset mocks
  resetMocks: () => {
    jest.clearAllMocks();
  },
};

// --- UTILIDADES DE ASSERTIONS ---
export const assertions = {
  // Verificar que una tabla tiene las columnas esperadas
  expectTableColumns: (expectedColumns: string[]) => {
    const { getColumnHeaders } = getPageTableHelpers();
    const headers = getColumnHeaders();
    
    expectedColumns.forEach(columnText => {
      expect(screen.getByRole('columnheader', { name: new RegExp(columnText, 'i') })).toBeInTheDocument();
    });
  },

  // Verificar que una fila contiene datos específicos
  expectRowContains: (rowIndex: number, expectedData: string[]) => {
    const { getRowByIndex } = getPageTableHelpers();
    const row = getRowByIndex(rowIndex);
    
    if (!row) throw new Error(`No se encontró la fila ${rowIndex}`);
    
    expectedData.forEach(data => {
      expect(row).toHaveTextContent(new RegExp(data, 'i'));
    });
  },

  // Verificar paginación
  expectPagination: (currentPage: number, totalPages: number, itemsPerPage: number) => {
    expect(screen.getByText(new RegExp(`página ${currentPage}`, 'i'))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${itemsPerPage}.*página`, 'i'))).toBeInTheDocument();
  },
};

// Re-exportar todo lo que necesitamos de testing library
export * from '@testing-library/react';
export { customRender as render };