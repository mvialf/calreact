// Importaciones de Jest y Testing Library
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Componente bajo prueba
import { AddressInput } from '../addressInput';

// Mocks
import { mocks } from '@/__tests__/__mocks__/@react-google-maps/api';

// Mock de módulos externos
jest.mock('@/utils/address-utils', () => ({
  extractAddressComponents: jest.fn(() => ({
    route: 'Avenida Providencia',
    streetNumber: '123',
    locality: 'Santiago',
    administrativeArea: 'Región Metropolitana',
    country: 'Chile',
    postalCode: '7500000',
  })),
}));

// Mock de next/navigation para evitar errores de router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('AddressInput', () => {
  const onSelectMock = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear el estado de los mocks de Google
    mocks.autocompleteService.getPlacePredictions.mockClear();
    mocks.placesService.getDetails.mockClear();
  });

  it('debe renderizar correctamente el input de búsqueda', () => {
    // Arrange
    render(<AddressInput onSelect={onSelectMock} />);
    
    // Act - Buscar elementos
    const input = screen.getByRole('textbox', { name: /buscar dirección/i });
    const searchIcon = screen.getByTestId('icon-search');
    
    // Assert - Verificar que los elementos estén en el documento
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Buscar dirección');
    expect(searchIcon).toBeInTheDocument();
  });

  it('debe mostrar sugerencias al escribir en el input', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AddressInput onSelect={onSelectMock} />);
    
    // Act - Escribir en el input
    const input = screen.getByRole('textbox', { name: /buscar dirección/i });
    await act(async () => {
      await user.type(input, 'Avenida Providencia');
      await new Promise(resolve => setTimeout(resolve, 500)); // Esperar el debounce
    });
    
    // Assert - Verificar que se llamó al servicio de autocompletado
    expect(mocks.autocompleteService.getPlacePredictions).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'Avenida Providencia',
        componentRestrictions: { country: 'cl' },
        types: ['address'],
      }),
      expect.any(Function)
    );
    
    // Verificar que se muestra la sugerencia
    await waitFor(() => {
      expect(screen.getByText('Avenida Providencia 123, Santiago, Chile')).toBeInTheDocument();
    });
  });

  it('debe seleccionar una dirección de las sugerencias', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AddressInput onSelect={onSelectMock} />);
    
    // Act - Escribir en el input y seleccionar sugerencia
    const input = screen.getByRole('textbox', { name: /buscar dirección/i });
    await act(async () => {
      await user.type(input, 'Avenida Providencia');
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    // Assert - Verificar que se muestran las sugerencias
    const suggestion = await screen.findByText('Avenida Providencia 123');
    expect(suggestion).toBeInTheDocument();
    
    // Act - Hacer clic en la sugerencia
    await act(async () => {
      await user.click(suggestion);
    });
    
    // Assert - Verificar que se llamó al servicio de detalles
    await waitFor(() => {
      expect(mocks.placesService.getDetails).toHaveBeenCalledWith(
        { placeId: 'test-place-1' },
        expect.any(Function)
      );
    });
    
    // Verificar que se llamó a onSelect con los datos correctos
    await waitFor(() => {
      expect(onSelectMock).toHaveBeenCalledWith(expect.objectContaining({
        textoCompleto: 'Avenida Providencia 123, Santiago, Chile',
        coordenadas: { latitude: -33.4333, longitude: -70.6 },
      }));
    });
    
    // Verificar que se muestra la dirección seleccionada
    const selectedInput = screen.getByRole('textbox', { name: /dirección seleccionada/i });
    expect(selectedInput).toHaveValue('Avenida Providencia 123, Santiago, Chile');
  });

  it('debe mostrar la dirección seleccionada', async () => {
    const selectedAddress = {
      textoCompleto: 'Avenida Providencia 123, Santiago, Chile',
      coordenadas: {
        latitude: -33.4333,
        longitude: -70.6,
      },
      placeId: 'test-place-1',
      componentes: {
        calle: 'Avenida Providencia',
        numero: '123',
        comuna: 'Santiago',
        ciudad: 'Santiago',
        region: 'Región Metropolitana',
        pais: 'Chile',
        codigoPostal: '7500000',
      },
      detalle: 'Avenida Providencia 123, Santiago, Chile',
    };
    
    render(<AddressInput value={selectedAddress} onSelect={onSelectMock} />);
    
    // Verificar que se muestra la dirección seleccionada
    expect(screen.getByText('Avenida Providencia 123')).toBeInTheDocument();
    expect(screen.getByText('Santiago, Región Metropolitana')).toBeInTheDocument();
    
    // Verificar que el botón de limpiar está presente
    const clearButton = screen.getByRole('button', { name: /limpiar dirección/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('debe limpiar la dirección seleccionada', async () => {
    // Arrange
    const user = userEvent.setup();
    const selectedAddress = {
      textoCompleto: 'Avenida Providencia 123, Santiago, Chile',
      coordenadas: { latitude: -33.4333, longitude: -70.6 },
      placeId: 'test-place-1',
    };
    
    render(<AddressInput onSelect={onSelectMock} value={selectedAddress} />);
    
    // Act - Verificar que se muestra la dirección seleccionada
    const selectedInput = screen.getByRole('textbox', { name: /dirección seleccionada/i });
    expect(selectedInput).toHaveValue('Avenida Providencia 123, Santiago, Chile');
    
    // Act - Hacer clic en el botón de limpiar
    const clearButton = screen.getByRole('button', { name: /limpiar dirección/i });
    await act(async () => {
      await user.click(clearButton);
    });
    
    // Assert - Verificar que se limpió la dirección
    expect(screen.queryByRole('textbox', { name: /dirección seleccionada/i })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /buscar dirección/i })).toBeInTheDocument();
    expect(onSelectMock).toHaveBeenCalledWith(null);
  });  

  it('debe manejar la adición de información adicional', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AddressInput onSelect={onSelectMock} />);
    
    // Act - Escribir en el input de búsqueda
    const input = screen.getByRole('textbox', { name: /buscar dirección/i });
    await act(async () => {
      await user.type(input, 'Avenida Providencia');
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    // Act - Seleccionar una sugerencia
    const suggestion = await screen.findByText('Avenida Providencia 123, Santiago, Chile');
    await act(async () => {
      await user.click(suggestion);
      await new Promise(resolve => setTimeout(resolve, 100));
    });
    
    // Act - Abrir menú de acciones
    const actionsButton = screen.getByRole('button', { name: /acciones/i });
    await user.click(actionsButton);
    
    // Act - Hacer clic en "Agregar información adicional"
    const addInfoButton = screen.getByRole('menuitem', { name: /agregar información adicional/i });
    await user.click(addInfoButton);
    
    // Act - Escribir información adicional
    const additionalInfoInput = screen.getByRole('textbox', { name: /información adicional/i });
    await user.type(additionalInfoInput, 'Depto 405');
    
    // Act - Hacer clic en OK
    const okButton = screen.getByRole('button', { name: /ok/i });
    await user.click(okButton);
    
    // Assert - Verificar que se actualizó la dirección con la información adicional
    await waitFor(() => {
      expect(onSelectMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          informacionAdicional: 'Depto 405',
        })
      );
    });
  });

  it('debe mostrar un mensaje cuando no hay sugerencias', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<AddressInput onSelect={onSelectMock} />);
    
    // Act - Buscar una dirección que no existe
    const input = screen.getByRole('textbox', { name: /buscar dirección/i });
    await act(async () => {
      await user.type(input, 'Dirección inexistente');
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    
    // Assert - Verificar que se muestra el mensaje de "No se encontraron direcciones"
    await waitFor(() => {
      expect(screen.getByText('No se encontraron direcciones')).toBeInTheDocument();
    });
  });
});
