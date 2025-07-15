// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Configuración personalizada de Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  /**
   * 👇 ESTA ES LA LÍNEA CLAVE
   * Le dice a Jest que ignore todos los node_modules EXCEPTO `lucide-react`.
   * Esto permite que Babel transforme el código de `lucide-react` para que Jest lo entienda.
   */
  transformIgnorePatterns: ['/node_modules/(?!(lucide-react)/)'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // ...otros mapeos que tengas
  },
};

module.exports = createJestConfig(customJestConfig);