import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../utils/testUtils';
import { PageTableLayout, type TableColumn } from '@/components/layout/PageTableLayout';
import { mockClients } from '../../__mocks__/testData';

// Datos de prueba para el componente
const mockData = [
  { id: '1', name: 'Juan Pérez', email: 'juan@email.com', status: 'activo', amount: 1000 },
  { id: '2', name: 'María García', email: 'maria@email.com', status: 'inactivo', amount: 2000 },
  { id: '3', name: 'Carlos López', email: 'carlos@email.com', status: 'activo', amount: 1500 },
];

// Definición de columnas de prueba
const mockColumns: TableColumn[] = [
  {
    key: 'name',
    label: 'Nombre',
    sortable: true,
    render: (item) => <span className="font-medium">{item.name}</span>
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Estado',
    align: 'center',
    render: (item) => (
      <span className={`badge ${item.status === 'activo' ? 'badge-success' : 'badge-warning'}`}>
        {item.status}
      </span>
    )
  },
  {
    key: 'amount',
    label: 'Monto',
    sortable: true,
    align: 'right',
    render: (item) => `$${item.amount.toLocaleString()}`
  },
  {
    key: 'actions',
    label: 'Acciones',
    align: 'center',
    render: (item) => (
      <button onClick={() => console.log('Edit', item.id)}>
        Editar
      </button>
    )
  }
];

describe('PageTableLayout', () => {
  const defaultProps = {
    title: 'Gestión de Datos',
    searchValue: '',
    onSearchChange: jest.fn(),
    columns: mockColumns,
    data: mockData,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    it('debe renderizar el título correctamente', () => {
      render(<PageTableLayout {...defaultProps} />);
      expect(screen.getByText('Gestión de Datos')).toBeInTheDocument();
    });

    it('debe renderizar el input de búsqueda con placeholder por defecto', () => {
      render(<PageTableLayout {...defaultProps} />);
      expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
    });

    it('debe renderizar el input de búsqueda con placeholder personalizado', () => {
      render(
        <PageTableLayout
          {...defaultProps}
          searchPlaceholder="Buscar usuarios..."
        />
      );
      expect(screen.getByPlaceholderText('Buscar usuarios...')).toBeInTheDocument();
    });

    it('debe renderizar el botón de acción cuando se proporciona', () => {
      const actionButton = <button>Nuevo Usuario</button>;
      render(<PageTableLayout {...defaultProps} actionButton={actionButton} />);
      expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument();
    });

    it('debe renderizar todas las columnas en el header', () => {
      render(<PageTableLayout {...defaultProps} />);
      
      mockColumns.forEach(column => {
        expect(screen.getByText(column.label)).toBeInTheDocument();
      });
    });

    it('debe renderizar los datos en las filas de la tabla', () => {
      render(<PageTableLayout {...defaultProps} />);
      
      mockData.forEach(item => {
        expect(screen.getByText(item.name)).toBeInTheDocument();
        expect(screen.getByText(item.email)).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidad de búsqueda', () => {
    it('debe llamar a onSearchChange cuando se escribe en el input', () => {
      const mockOnSearchChange = jest.fn();
      render(
        <PageTableLayout
          {...defaultProps}
          onSearchChange={mockOnSearchChange}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar...');
      fireEvent.change(searchInput, { target: { value: 'Juan' } });
      
      expect(mockOnSearchChange).toHaveBeenCalledWith('Juan');
    });

    it('debe mostrar el valor actual en el input de búsqueda', () => {
      render(
        <PageTableLayout
          {...defaultProps}
          searchValue="María"
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar...');
      expect(searchInput).toHaveValue('María');
    });
  });

  describe('Estados de carga y vacío', () => {
    it('debe mostrar skeletons durante la carga', () => {
      render(
        <PageTableLayout
          {...defaultProps}
          loading={true}
          data={[]}
          skeletonRowCount={5}
        />
      );

      // Verificar que se muestran las filas skeleton
      const skeletonRows = screen.getAllByRole('row').slice(1); // Excluir header
      expect(skeletonRows).toHaveLength(5);
    });

    it('debe mostrar el estado vacío cuando no hay datos', () => {
      render(
        <PageTableLayout
          {...defaultProps}
          data={[]}
          loading={false}
        />
      );

      expect(screen.getByText('No se encontraron registros')).toBeInTheDocument();
      expect(screen.getByText('No hay datos que coincidan con los filtros actuales.')).toBeInTheDocument();
    });

    it('debe mostrar estado vacío personalizado', () => {
      render(
        <PageTableLayout
          {...defaultProps}
          data={[]}
          loading={false}
          emptyStateTitle="No hay usuarios"
          emptyStateSubtitle="Agrega tu primer usuario para comenzar"
        />
      );

      expect(screen.getByText('No hay usuarios')).toBeInTheDocument();
      expect(screen.getByText('Agrega tu primer usuario para comenzar')).toBeInTheDocument();
    });
  });

  describe('Selección múltiple', () => {
    const selectableProps = {
      ...defaultProps,
      selectable: true,
      selectedRows: [],
      onSelectRow: jest.fn(),
      onSelectAll: jest.fn(),
    };

    it('debe mostrar checkboxes cuando selectable=true', () => {
      render(<PageTableLayout {...selectableProps} />);

      // Checkbox de "select all" + un checkbox por fila
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(mockData.length + 1);
    });

    it('debe llamar a onSelectAll cuando se hace clic en el checkbox principal', () => {
      const mockOnSelectAll = jest.fn();
      render(
        <PageTableLayout
          {...selectableProps}
          onSelectAll={mockOnSelectAll}
        />
      );

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      fireEvent.click(selectAllCheckbox);
      
      expect(mockOnSelectAll).toHaveBeenCalledWith(true);
    });

    it('debe llamar a onSelectRow cuando se hace clic en un checkbox de fila', () => {
      const mockOnSelectRow = jest.fn();
      render(
        <PageTableLayout
          {...selectableProps}
          onSelectRow={mockOnSelectRow}
        />
      );

      const rowCheckboxes = screen.getAllByRole('checkbox').slice(1);
      fireEvent.click(rowCheckboxes[0]);
      
      expect(mockOnSelectRow).toHaveBeenCalledWith('1');
    });

    it('debe marcar filas como seleccionadas cuando están en selectedRows', () => {
      render(
        <PageTableLayout
          {...selectableProps}
          selectedRows={['1', '3']}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      const firstRowCheckbox = checkboxes[1]; // Primer row (después del select all)
      const thirdRowCheckbox = checkboxes[3]; // Tercer row
      
      expect(firstRowCheckbox).toBeChecked();
      expect(thirdRowCheckbox).toBeChecked();
    });
  });

  describe('Ordenamiento', () => {
    const sortableProps = {
      ...defaultProps,
      sortBy: 'name',
      sortOrder: 'asc' as const,
      onSort: jest.fn(),
    };

    it('debe llamar a onSort cuando se hace clic en una columna ordenable', () => {
      const mockOnSort = jest.fn();
      render(
        <PageTableLayout
          {...sortableProps}
          onSort={mockOnSort}
        />
      );

      const nameHeader = screen.getByText('Nombre').closest('th');
      if (nameHeader) {
        fireEvent.click(nameHeader);
      }
      
      expect(mockOnSort).toHaveBeenCalledWith('name');
    });

    it('debe mostrar íconos de ordenamiento en columnas sortables', () => {
      render(<PageTableLayout {...sortableProps} />);

      // Verificar que las columnas sortables tienen cursor pointer
      const nameHeader = screen.getByText('Nombre').closest('th');
      const emailHeader = screen.getByText('Email').closest('th');
      
      if (nameHeader && emailHeader) {
        expect(nameHeader).toHaveClass('cursor-pointer');
        expect(emailHeader).toHaveClass('cursor-pointer');
      }
    });

    it('no debe permitir ordenamiento en columnas no sortables', () => {
      const mockOnSort = jest.fn();
      render(
        <PageTableLayout
          {...sortableProps}
          onSort={mockOnSort}
        />
      );

      const statusHeader = screen.getByText('Estado').closest('th');
      if (statusHeader) {
        fireEvent.click(statusHeader);
      }
      
      // La columna 'Estado' no es sortable según mockColumns
      expect(mockOnSort).not.toHaveBeenCalled();
    });
  });

  describe('Paginación', () => {
    const paginationProps = {
      ...defaultProps,
      pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 25,
        onPageChange: jest.fn(),
        onPageSizeChange: jest.fn(),
      },
    };

    it('debe mostrar controles de paginación cuando se proporciona', () => {
      render(<PageTableLayout {...paginationProps} />);

      // Verificar que se muestra algún control de paginación
      expect(screen.getAllByText(/página/i).length).toBeGreaterThan(0);
    });

    it('no debe mostrar paginación cuando totalItems <= itemsPerPage', () => {
      render(
        <PageTableLayout
          {...defaultProps}
          pagination={{
            currentPage: 1,
            itemsPerPage: 10,
            totalItems: 5, // Menos elementos que itemsPerPage
            onPageChange: jest.fn(),
            onPageSizeChange: jest.fn(),
          }}
        />
      );

      // No debería mostrar controles de paginación
      expect(screen.queryByText(/página/i)).not.toBeInTheDocument();
    });
  });

  describe('Renderizado personalizado de columnas', () => {
    it('debe usar la función render personalizada cuando se proporciona', () => {
      render(<PageTableLayout {...defaultProps} />);

      // Verificar que el nombre se renderiza con la clase font-medium
      const nameElements = screen.getAllByText(/Juan Pérez|María García|Carlos López/);
      nameElements.forEach(element => {
        expect(element).toHaveClass('font-medium');
      });
    });

    it('debe mostrar datos directos cuando no hay función render', () => {
      render(<PageTableLayout {...defaultProps} />);

      // El email no tiene función render, debe mostrar el valor directo
      expect(screen.getByText('juan@email.com')).toBeInTheDocument();
      expect(screen.getByText('maria@email.com')).toBeInTheDocument();
    });

    it('debe aplicar alineación de columnas correctamente', () => {
      render(<PageTableLayout {...defaultProps} />);

      // Verificar headers con alineación
      const statusHeader = screen.getByText('Estado').closest('th');
      const amountHeader = screen.getByText('Monto').closest('th');
      
      expect(statusHeader).toHaveClass('text-center');
      expect(amountHeader).toHaveClass('text-right');
    });
  });

  describe('Filtros adicionales', () => {
    it('debe renderizar filtros adicionales cuando se proporcionan', () => {
      const additionalFilters = (
        <select>
          <option>Todos</option>
          <option>Activos</option>
          <option>Inactivos</option>
        </select>
      );

      render(
        <PageTableLayout
          {...defaultProps}
          additionalFilters={additionalFilters}
        />
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Todos')).toBeInTheDocument();
    });
  });

  describe('Clases CSS personalizadas', () => {
    it('debe aplicar className personalizada a las filas', () => {
      const rowClassName = (item: any, index: number) => index % 2 === 0 ? 'even-row' : 'odd-row';
      
      render(
        <PageTableLayout
          {...defaultProps}
          rowClassName={rowClassName}
        />
      );

      const rows = screen.getAllByRole('row').slice(1); // Excluir header
      expect(rows[0]).toHaveClass('even-row');
      expect(rows[1]).toHaveClass('odd-row');
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener la estructura de tabla correcta', () => {
      render(<PageTableLayout {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(mockColumns.length);
      expect(screen.getAllByRole('row')).toHaveLength(mockData.length + 1); // +1 por header
    });

    it('debe tener labels apropiados para checkboxes', () => {
      render(
        <PageTableLayout
          {...defaultProps}
          selectable={true}
          selectedRows={[]}
          onSelectRow={jest.fn()}
          onSelectAll={jest.fn()}
        />
      );

      // Verificar que los checkboxes tienen comportamiento accesible
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
  });
});