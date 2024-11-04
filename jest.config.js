
export default {
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'lcov', 'text'],
  verbose: true,
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', 'src/cli.js', 'src/index.js'],
  collectCoverageFrom: ['./src/*.js'],
  transform: {
      "^.+\\.[t|j]sx?$": "babel-jest"
  },
  transformIgnorePatterns: [],
  testPathIgnorePatterns: ['<rootDir>/node_modules/'],
  setupFilesAfterEnv: [  ],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
