[![CircleCI](https://circleci.com/gh/dazlious/bundlecheck/tree/main.svg?style=svg)](https://circleci.com/gh/dazlious/bundlecheck/tree/main)
[![codecov](https://codecov.io/gh/dazlious/bundlecheck/branch/main/graph/badge.svg)](https://codecov.io/gh/dazlious/bundlecheck)

Check the sizes of your code-splitted bundles. Any file, a lot of predefined rules and fully customized rules can be added.

## Motivation

Since the beginning days, my number one choice was [Bundlesize](https://github.com/siddharthkp/bundlesize). Not because it is very customizable, but it worked.

While the number of mobile devices is increasing and performance is crucial to a lot of companies, bundles get split in several files.

This lead to more problems with bundlesize, because one can only specify a `maxSize` which was not sufficient to me anylonger.

## Install

```bash
yarn add bundlecheck --dev
npm install bundlecheck --save-dev
```

## Get Started

__All sizes are in KiloByte__

Create a basic configuration file with the following content in the root of your project and call it `.bundlecheck.config.js`.

```javascript
module.exports = {
  relativeTo: '.',
  cwd: '.',
  observe: [
    {
      paths: ['**'],
      rules: [{ every: [0.01, 0.5] }],
    },
  ],
}
```

Inside your `package.json` add this to your scripts section:

```json
  "scripts": {
    "bundlecheck": "bundlecheck"
  }
```

## CLI Options

Specify a config file: `--configfile` or `-cf`

## Documentation

### General Configuration

- `cwd` Specifies a root folder from where to find all paths
- `relativeTo` Used to make `cwd` relative to this specified path
- `observe` An array of observable paths on which rules can be applied
- `rules`: An array of rules that are tested against every entry in `observe`
- `ignore`: An array of [fast-glob](https://github.com/mrmlnc/fast-glob) paths that should be ignored

### Observe Entry Configuration

#### Use a predefined check function

```javascript
observe: [
  {
    paths: ['**.js'] // Use glob patter (fast-glob)
    rules: [
      every: [0.1, 5], // Any file matched has to be between 100 Bytes and 5 KiloBytes big
      sum: [0.001], // The sum of all matching files has to be exactly 1 Byte
      mean: [,0.05], // Averaging matched file sizes have to be below 50 Bytes
      deviation [1, 2] // Defining the standard deviation of all matched files, so there has to be a difference between all files between 1 and 2 KiloByte
    ]
  }
]
```

#### Defining a custom check function

Multiple rules inside of one observe entry are treated with a boolean AND.

```javascript
observe: [
  {
    paths: ['**.js']
    rules: [
      () => ({
        result: true,
        message: 'This will always result to true',
      }),
      (sizeMap) => {
        const result = sizeMap.reduce((s, [path, size]) => s + size, 0) <= 0.2;
        return {
          result,
          message: result ? 'All Good' :
            `Sum of files ${sizeMap.map(([ name ]) => name).join(' ')} too big`,
        }
      },
    ]
  }
]
```

## Example Configurations

### NextJS

Contents of a configuration file used within [NextJS](https://nextjs.org)

```javascript
const fs = require('fs');

const buildId = fs.readFileSync('dist/BUILD_ID', 'utf8');

module.exports = {
  relativeTo: '.',
  cwd: 'dist',
  observe: [
    {
      paths: [`server/static/${buildId}/pages/**.js`],
      rules: [{ every: [0, 65] }]
    },
    {
      paths: [`static/css/**.css`],
      rules: [{ every: [0, 2.5], sum: [0, 3] }]
    },
    {
      paths: [`static/chunks/!(commons)*.js`],
      rules: [{ every: [0, 0.2] }]
    },
    {
      paths: [`static/chunks/commons*.js`],
      rules: [{ every: [0, 235] }]
    },
    {
      paths: [`static/${buildId}/pages/!(_app)*.js`],
      rules: [{ every: [0, 100], sum: [0, 120] }]
    },
    {
      paths: [`static/${buildId}/pages/_app.js`],
      rules: [{ every: [120, 130] }]
    },
    {
      paths: ['static/runtime/main-*.js', 'static/runtime/polyfills-*.js', 'static/runtime/webpack-*.js'],
      rules: [{ every: [0, 15], sum: [20, 25] }]
    },
  ],
};
```

## Yet to come

The following features are planned:

- Fully log successes and errors (currently only errors are displayed)
- Create a Webpack loader in order to integrate Bundlecheck within the build process
- Compare measured size against last build on a specific branch
- Make use of Github PR checks
- Support other config file formats than JS
