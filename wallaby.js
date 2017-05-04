module.exports = {
  files: [
    'Level.js',
    {pattern: 'Level.test.js', ignore: true},
  ],
  tests: [
    'Level.test.js',
  ],
  testFramework: 'mocha',
  env: {
    type: 'node',
  },
};
