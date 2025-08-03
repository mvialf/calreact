import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddressInput } from '../components/ui/addressInput';

// Mock de @react-google-maps/api
jest.mock('@react-google-maps/api', () => ({
  useLoadScript: jest.fn().mockReturnValue({
    isLoaded: true,
    loadError: null,
  }),
}));

// Mock para las funciones de Google Maps
const mockGetPlacePredictions = jest.fn();
const mockGetDetails = jest.fn();

// Declaraciones simplificadas para pruebas
type PredictionResult = any;
type PlaceResult = any;
type GoogleCallback = (results: any, status: string) => void;

// Crear el objeto global de Google Maps sin tipado estricto para las pruebas
global.google = {
  maps: {
    places: {
      AutocompleteService: jest.fn().mockImplementation(() => ({
        getPlacePredictions: mockGetPlacePredictions,
      })),
      PlacesService: jest.fn().mockImplementation(() => ({
        getDetails: mockGetDetails,
      })),
      AutocompleteSessionToken: jest.fn().mockImplementation(() => 'test-session-token'),
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        REQUEST_DENIED: 'REQUEST_DENIED',
      },
    },
  },
} as any;

describe('AddressInput', () => {
  const mockOnSelect = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Configurar implementaciones por defecto para los mocks
    mockGetPlacePredictions.mockImplementation((_request, callback: GoogleCallback) => {
      callback([{
        description: 'Avenida Providencia 123, Santiago, Chile',
        place_id: 'test-place-id-1',
        structured_formatting: {
          main_text: 'Avenida Providencia 123',
          secondary_text: 'Santiago, Chile',
        },
      }], 'OK');
    });
    
    mockGetDetails.mockImplementation((_request, callback: GoogleCallback) => {
      callback({
        place_id: 'test-place-id-1',
        name: 'Avenida Providencia 123',
        formatted_address: 'Avenida Providencia 123, Santiago, Chile',
        geometry: {
          location: {
            lat: () => -33.4489,
            lng: () => -70.6693,
          },
        },
        address_components: [
          { long_name: '123', short_name: '123', types: ['street_number'] },
          { long_name: 'Avenida Providencia', short_name: 'Av. Providencia', types: ['route'] },
          { long_name: 'Santiago', short_name: 'Santiago', types: ['locality', 'political'] },
        ],
      }, 'OK');
    });
  });

  it('debe renderizar el componente correctamente', () => {
    render(<AddressInput onSelect={mockOnSelect} />);
    const input = screen.getByPlaceholderText('Buscar dirección...');
    expect(input).toBeInTheDocument();
  });

  it('debe mostrar predicciones al escribir en el input', async () => {
    render(<AddressInput onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Buscar dirección...');
    fireEvent.change(input, { target: { value: 'Avenida Providencia' } });
    
    // Esperar a que se complete el debounce
    await waitFor(() => {
      expect(mockGetPlacePredictions).toHaveBeenCalled();
    });
  });

  it('debe manejar la selección de una dirección', async () => {
    render(<AddressInput onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Buscar dirección...');
    fireEvent.change(input, { target: { value: 'Avenida Providencia' } });
    
    // Esperar a que aparezcan las predicciones
    await waitFor(() => {
      expect(screen.getByText('Avenida Providencia 123')).toBeInTheDocument();
    });
    
    // Hacer clic en la primera predicción
    fireEvent.click(screen.getByText('Avenida Providencia 123'));
    
    // Verificar que se llamó a getDetails
    await waitFor(() => {
      expect(mockGetDetails).toHaveBeenCalled();
    });
    
    // Verificar que se llamó a onSelect
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalled();
    });
  });

  it('debe manejar errores al obtener predicciones', async () => {
    // Configurar el mock para que falle
    mockGetPlacePredictions.mockImplementationOnce((_request, callback: GoogleCallback) => {
      callback([], 'ZERO_RESULTS');
    });
    
    render(<AddressInput onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Buscar dirección...');
    fireEvent.change(input, { target: { value: 'Dirección inexistente' } });
    
    // Verificar que se muestra el mensaje de "no hay resultados"
    await waitFor(() => {
      const message = screen.getByText('No se encontraron resultados');
      expect(message).toBeInTheDocument();
    });
  });

  it('debe manejar errores al obtener detalles del lugar', async () => {
    // Configurar el mock para que falle
    mockGetDetails.mockImplementationOnce((_request, callback: GoogleCallback) => {
      callback(null, 'REQUEST_DENIED');
    });
    
    // Espiar console.error para verificar que se registra el error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<AddressInput onSelect={mockOnSelect} />);
    
    const input = screen.getByPlaceholderText('Buscar dirección...');
    fireEvent.change(input, { target: { value: 'Avenida Providencia' } });
    
    // Hacer clic en la primera predicción
    await waitFor(() => {
      fireEvent.click(screen.getByText('Avenida Providencia 123'));
    });
    
    // Verificar que se registró el error
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al obtener detalles del lugar:', 'REQUEST_DENIED');
    });
    
    consoleErrorSpy.mockRestore();
  });

  it('debe mostrar correctamente múltiples resultados de autocompletado', async () => {
    // Configurar múltiples predicciones para simular varios resultados
    mockGetPlacePredictions.mockImplementationOnce((_request, callback: GoogleCallback) => {
      callback([
        {
          description: 'Avenida Providencia 123, Santiago, Chile',
          place_id: 'place-id-1',
          structured_formatting: {
            main_text: 'Avenida Providencia 123',
            secondary_text: 'Santiago, Chile',
          },
        },
        {
          description: 'Avenida Las Condes 456, Santiago, Chile',
          place_id: 'place-id-2',
          structured_formatting: {
            main_text: 'Avenida Las Condes 456',
            secondary_text: 'Santiago, Chile',
          },
        },
        {
          description: 'Avenida Apoquindo 789, Santiago, Chile',
          place_id: 'place-id-3',
          structured_formatting: {
            main_text: 'Avenida Apoquindo 789',
            secondary_text: 'Santiago, Chile',
          },
        },
      ], 'OK');
    });


    render(
      <AddressInput
        onPlaceSelected={() => {}}
        placeholder="Buscar dirección"
      />
    );

    // Escribir en el campo de búsqueda
    const input = screen.getByPlaceholderText('Buscar dirección');
    fireEvent.change(input, { target: { value: 'Avenida' } });

    // Esperar a que aparezcan los resultados (simular el debounce)
    await waitFor(
      () => {
        expect(mockGetPlacePredictions).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    // Verificar que se muestran todos los resultados esperados
    await waitFor(() => {
      // Verificar que cada resultado se muestra correctamente
      expect(screen.getByText('Avenida Providencia 123')).toBeInTheDocument();
      expect(screen.getByText('Avenida Las Condes 456')).toBeInTheDocument();
      expect(screen.getByText('Avenida Apoquindo 789')).toBeInTheDocument();
      
      // Verificar que se muestran las direcciones secundarias
      const direccionesSecundarias = screen.getAllByText('Santiago, Chile');
      expect(direccionesSecundarias).toHaveLength(3);
    });

    // Verificar la interacción con los resultados
    const primerResultado = screen.getByText('Avenida Providencia 123');
    fireEvent.click(primerResultado);

    // Comprobar que se llama a getDetails con el place_id correcto
    await waitFor(() => {
      // Verificar que se llamó a getDetails con los parámetros correctos
      expect(mockGetDetails).toHaveBeenCalledWith(
        { placeId: 'place-id-1' },
        expect.any(Function)
      );
    });
  });
});
