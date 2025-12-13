/**
 * @fileoverview Jest Configuration for Integration Tests
 * @purpose Configure integration tests for real AI services
 * @created 2025-11-17
 *
 * These tests:
 * - Run against real Grok API
 * - Require GROK_API_KEY environment variable
 * - Have longer timeouts (60s default, up to 120s for some tests)
 * - Skip gracefully if API key not provided
 * - Track costs and performance metrics
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/integration'],
  testMatch: ['**/*.integration.test.ts'],

  // Longer timeout for AI API calls
  testTimeout: 60000, // 60 seconds default

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      diagnostics: {
        ignoreCodes: [2578] // Ignore "Unused '@ts-expect-error' directive"
      }
    }
  },

  // Module resolution
  moduleNameMapper: {
    '^@contracts/(.*)$': '<rootDir>/src/contracts/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1'
  },

  // Coverage settings
  collectCoverageFrom: [
    'src/services/real/**/*.ts',
    'src/services/providers/**/*.ts',
    '!src/**/*.d.ts'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],

  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results/integration',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],

  // Detect slow tests
  slowTestThreshold: 30, // Warn if test takes >30s

  // Verbose output
  verbose: true
}
