// jest.config.js
module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/tests/',
      '/scripts/'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },
    testMatch: [
      '**/tests/unit/**/*.test.js',
      '**/tests/unit/**/*.spec.js'
    ],
    setupFilesAfterEnv: ['./tests/setup.js'],
    globalSetup: './tests/globalSetup.js',
    globalTeardown: './tests/globalTeardown.js',
    maxWorkers: '50%',
    detectOpenHandles: true,
    forceExit: true,
    moduleFileExtensions: ['js', 'json'],
    transform: {},
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    watchPathIgnorePatterns: ['/node_modules/', '/dist/']
  }