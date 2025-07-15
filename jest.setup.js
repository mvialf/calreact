// jest.setup.js

// ✅ CORRECTO: Aquí es donde se carga la librería,
// porque se ejecuta cuando `expect` ya está definido.
require('@testing-library/jest-dom');

// --- Mocks Adicionales ---

// Mock para `window.matchMedia`
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para `IntersectionObserver`
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};