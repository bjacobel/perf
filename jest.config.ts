export default {
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '<rootDir>/reports/coverage',
  moduleDirectories: ['<rootDir>/node_modules'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  snapshotSerializers: ['jest-snapshot-serializer-ansi'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        diagnostics: {
          warnOnly: true,
        },
      },
    ],
  },
};
