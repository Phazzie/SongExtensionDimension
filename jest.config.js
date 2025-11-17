module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
      diagnostics: {
        ignoreCodes: [2578] // Ignore "Unused '@ts-expect-error' directive"
      }
    }
  },
  moduleNameMapper: {
    '^@contracts/(.*)$': '<rootDir>/src/contracts/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@ui/(.*)$': '<rootDir>/src/ui/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
