/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true } }],
  },
  moduleNameMapper: {
    // Resolve Next.js path alias @/ → project root
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/api/validators.ts',
    'lib/analysis/energy-engine.ts',
  ],
}

module.exports = config
