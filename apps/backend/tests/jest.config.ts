import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '..',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  reporters: ['default', '<rootDir>/tests/reporters/qaSummaryReporter.js'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  collectCoverageFrom: [
    'tests/**/*.ts',
    'src/models/services/couriers/*.ts',
    '!tests/**/*.d.ts',
  ],
  coverageDirectory: '<rootDir>/tests/reports/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 60000,
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tests/tsconfig.test.json',
      isolatedModules: true,
    },
  },
}

export default config
