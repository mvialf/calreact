// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Configuración personalizada de Jest (simplificada)
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  /**
   * Mock para lucide-react ya configurado en src/__mocks__/lucide-react.js
   * No necesitamos transformIgnorePatterns complejos
   */

  /**
   * Mapeo de módulos - Next.js ya maneja TypeScript
   */
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  /**
   * Cobertura de código
   */
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/__tests__/**',
    '!src/__mocks__/**',
    '!src/types/**',
  ],

  /**
   * Configuración de reportes y rendimiento
   */
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
  clearMocks: true,
  restoreMocks: true,
};

module.exports = createJestConfig(customJestConfig);