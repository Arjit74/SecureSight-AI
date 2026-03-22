/**
 * Jest Configuration
 * Configures test runner, coverage, and environment settings
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage collection
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!tests/**',
    '!jest.config.js'
  ],

  // Coverage thresholds
  coveragePathIgnorePatterns: [
    'node_modules',
    'tests'
  ],

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Timeout for tests (in ms)
  testTimeout: 10000,

  // Show individual test results
  verbose: true,

  // Stop after first test failure (for faster feedback)
  bail: 0,

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Transform: No transformation needed for plain Node.js
  noStackTrace: false,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};
