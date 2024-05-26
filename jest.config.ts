const esmDeps = ['chrome-launcher', 'open'];

export default {
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: '<rootDir>/reports/coverage',
  moduleDirectories: ['<rootDir>/node_modules'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  snapshotSerializers: ['@relmify/jest-serializer-strip-ansi/always'],
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  transformIgnorePatterns: [`/node_modules/(?!(${esmDeps.join('|')})/)`],
  transform: {
    '^.+\\.(j|t)sx?$': [
      'ts-jest',
      {
        diagnostics: {
          warnOnly: true,
        },
      },
    ],
  },
};
