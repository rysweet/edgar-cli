module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@cli/(.*)$': '<rootDir>/src/cli/$1',
    '^@tools/(.*)$': '<rootDir>/src/tools/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@subagents/(.*)$': '<rootDir>/src/subagents/$1',
    '^@output/(.*)$': '<rootDir>/src/output/$1',
    '^@mcp/(.*)$': '<rootDir>/src/mcp/$1',
    '^@llm/(.*)$': '<rootDir>/src/llm/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};