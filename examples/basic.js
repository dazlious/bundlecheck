const { Bundlecheck } = require('../src/bundlecheck');

const bc = new Bundlecheck({
  relativeTo: '.',
  cwd: './test',
  observe: [
    {
      paths: ['**'],
      rules: [{ every: [0.03, 0.04] }],
    },
  ],
});

console.log(bc.check());
