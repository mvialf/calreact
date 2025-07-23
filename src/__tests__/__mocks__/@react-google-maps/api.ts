// Mock para @react-google-maps/api
export const useLoadScript = jest.fn().mockImplementation(() => ({
  isLoaded: true,
  loadError: null,
}));

// Mock para window.google
const mockAutocompleteService = {
  getPlacePredictions: jest.fn((request, callback) => {
    if (request.input === 'Avenida Providencia') {
      callback([
        {
          place_id: 'test-place-1',
          description: 'Avenida Providencia 123, Santiago, Chile',
          structured_formatting: {
            main_text: 'Avenida Providencia 123',
            secondary_text: 'Santiago, Chile',
          },
        },
      ], 'OK');
    } else {
      callback([], 'ZERO_RESULTS');
    }
  }),
};

const mockPlacesService = {
  getDetails: jest.fn(({ placeId }, callback) => {
    if (placeId === 'test-place-1') {
      callback(
        {
          place_id: 'test-place-1',
          formatted_address: 'Avenida Providencia 123, Santiago, Chile',
          address_components: [
            { long_name: '123', types: ['street_number'] },
            { long_name: 'Avenida Providencia', types: ['route'] },
            { long_name: 'Santiago', types: ['locality', 'political'] },
            { long_name: 'Santiago', types: ['administrative_area_level_2', 'political'] },
            { long_name: 'Región Metropolitana', types: ['administrative_area_level_1', 'political'] },
            { long_name: 'Chile', types: ['country', 'political'] },
            { long_name: '7500000', types: ['postal_code'] },
          ],
          geometry: {
            location: {
              lat: () => -33.4333,
              lng: () => -70.6,
            },
          },
        },
        'OK'
      );
    } else {
      callback(null, 'INVALID_REQUEST');
    }
  }),
};

// Mock global para window.google
const mockGoogle = {
  maps: {
    Animation: {},
    BicyclingLayer: jest.fn(),
    Circle: jest.fn(),
    // Agregar más propiedades según sea necesario
    places: {
      AutocompleteService: jest.fn(() => mockAutocompleteService),
      PlacesService: jest.fn(() => mockPlacesService),
      PlacesServiceStatus: {
        OK: 'OK',
        ZERO_RESULTS: 'ZERO_RESULTS',
        INVALID_REQUEST: 'INVALID_REQUEST',
      },
    },
    // Métodos estáticos necesarios
    importLibrary: jest.fn(),
  },
} as unknown as typeof google; // Forzar el tipo

global.window.google = mockGoogle;

// Exportar los mocks para usarlos en las pruebas
export const mocks = {
  google: mockGoogle,
  autocompleteService: mockAutocompleteService,
  placesService: mockPlacesService,
};

export default {
  useLoadScript,
};
