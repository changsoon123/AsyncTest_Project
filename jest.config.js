const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './frontend/', // Point to the frontend directory for Next.js specific Jest config
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1', // Adjust path for frontend source
  },
  collectCoverageFrom: [
    'frontend/src/**/*.{js,jsx,ts,tsx}',
    '!frontend/src/**/*.d.ts',
    '!frontend/src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 10000,
  // Add a transform for backend TypeScript files if needed for backend unit tests
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/backend/', // Ignore backend tests for frontend Jest config
  ],
};

module.exports = createJestConfig(customJestConfig);
