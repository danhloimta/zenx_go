module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  moduleNameMapper: { '^marked$': '<rootDir>/test/marked.cjs' },
  maxWorkers: 1,
  detectOpenHandles: true,
};
