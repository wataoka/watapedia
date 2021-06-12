// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const MODULE_NAME_MAPPING = {
  '@root/(.+)': '<rootDir>/$1',
  '@commons/(.+)': '<rootDir>/src/lib/$1',
  '@server/(.+)': '<rootDir>/src/server/$1',
  '@alias/logger': '<rootDir>/src/lib/service/logger',
  // -- doesn't work with unknown error -- 2019.06.19 Yuki Takei
  // debug: '<rootDir>/src/lib/service/logger/alias-for-debug',
};

module.exports = {
  // Indicates whether each individual test should be reported during the run
  verbose: true,

  rootDir: '../',
  globalSetup: '<rootDir>/src/test/global-setup.js',
  globalTeardown: '<rootDir>/src/test/global-teardown.js',

  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      rootDir: '.',
      setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],
      testMatch: ['<rootDir>/src/test/**/*.test.js'],
      // Automatically clear mock calls and instances between every test
      clearMocks: true,
      // A map from regular expressions to module names that allow to stub out resources with a single module
      moduleNameMapper: MODULE_NAME_MAPPING,
    },
    // {
    //   displayName: 'client',
    //   rootDir: '.',
    //   testMatch: ['<rootDir>/src/test/client/**/*.test.js'],
    // },
  ],


  // Indicates whether the coverage information should be collected while executing the test
  // collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/client/**/*.js',
    'src/lib/**/*.js',
    'src/migrations/**/*.js',
    'src/server/**/*.js',
  ],

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

};
