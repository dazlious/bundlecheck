module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text'],
  verbose: true,
  rootDir: './src',
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', 'src/cli.js', 'src/index.js'],
  collectCoverageFrom: ['*.js'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
