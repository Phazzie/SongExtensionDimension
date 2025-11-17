/**
 * @fileoverview Integration Test Setup
 * @purpose Configure environment for integration tests
 */

// Check for API key
if (!process.env.GROK_API_KEY && process.env.CI !== 'true') {
  console.warn('⚠️  GROK_API_KEY not set. Integration tests will be skipped.')
  console.warn('   Set GROK_API_KEY environment variable to run integration tests.')
}

// Global test timeout
jest.setTimeout(60000) // 60 seconds

// Suppress console output during tests (optional)
if (process.env.SUPPRESS_TEST_LOGS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  }
}
