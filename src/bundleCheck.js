const path = require('path');
const fs = require('fs');
const uuid = require('uuid/v4');
const fg = require('fast-glob');
const get = require('lodash/get');
const calcMean = require('lodash/mean');
const constant = require('lodash/constant');
const zip = require('lodash/zip');
const flatten = require('lodash/flatten');
const filter = require('lodash/filter');
const gzipSize = require('gzip-size');

const NON_EXISTING_RULE = constant(false);
const BYTE_TO_KILOBYTE = 1000;

const DEFAULT_OPTIONS = {
  relativeTo: __dirname,
  rules: [],
  cwd: __dirname,
  // alertOnOmit: true, // TODO: implement alerting user if a file was not selected for check
  ignore: [],
  observe: [],
};

const GLOB_OPTIONS = {
  caseSensitiveMatch: true,
  dot: true,
  onlyFiles: true,
  absolute: true,
  unique: true,
};

const NOT_MATCHING = 'Oops, not what you expected';

const buildResult = data => data.reduce((carr, curr) => ({
  result: carr.result && curr.result,
  message: flatten([...carr.message, ...filter([curr.message], Boolean)]),
}), { result: true, message: [] });

const sumUp = array => array.reduce((res, [, n]) => res + n, 0);

const STANDARD_RULES = {
  every: ([min = 0, max = min], sizes) => {
    let result = true;
    const message = sizes.map(([name, size]) => {
      const check = min <= size && size <= max;
      result = result && check;
      return check ? null : `${NOT_MATCHING} (every): ${min} <= ${size} <= ${max} (${name})`;
    });
    return { result, message: filter(message, Boolean) };
  },
  sum: ([min = 0, max = min], sizes) => {
    const sum = sumUp(sizes);
    const result = min <= sum && sum <= max;
    const names = sizes.map(([name]) => name);
    return {
      result,
      message: result ? null : `${NOT_MATCHING} (sum): ${min} <= ${sum} <= ${max} (${names})`,
    };
  },
  mean: ([min = 0, max = min], sizes) => {
    const mean = sizes.length && sumUp(sizes) / sizes.length;
    const result = min <= mean && mean <= max;
    const names = sizes.map(([name]) => name);
    return {
      result,
      message: result ? null : `${NOT_MATCHING} (mean): ${min} <= ${mean} <= ${max} (${names})`,
    };
  },
  deviation: ([min = 0, max = min], sizes) => {
    const mean = sizes.length && sumUp(sizes) / sizes.length;
    const std = calcMean(sizes.map(([, n]) => (n - mean) ** 2)) ** 0.5;
    const result = min <= std && std <= max;
    const names = sizes.map(([name]) => name);
    return {
      result,
      message: result ? null : `${NOT_MATCHING} (deviation): ${min} <= ${std} <= ${max} (${names})`,
    };
  },
};

const mapToStandardRules = rules => rules.reduce((carr, rule) => {
  // TODO: Make sure only functions are valid that have correct signature
  if (rule instanceof Function) return [...carr, rule];
  const ruleOptions = Object.entries(rule);
  const stdRules = ruleOptions.map(([name, params]) => (
    get(STANDARD_RULES, name, NON_EXISTING_RULE).bind(null, params)));
  return [...carr, ...stdRules];
}, []);

class Bundlecheck {
  constructor(options) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    const observers = get(this.options, 'observe', []).filter(({ paths }) => paths instanceof Array && !!paths.length);
    const defaultCwd = get(this.options, 'cwd', DEFAULT_OPTIONS.cwd);
    const defaultRelativeTo = get(this.options, 'relativeTo', defaultCwd);
    const defaultIgnore = get(this.options, 'ignore', DEFAULT_OPTIONS.ignore);
    const defaultRules = get(this.options, 'rules', DEFAULT_OPTIONS.rules);
    this.rules = {};
    this.toObserve = observers.reduce((carr, {
      paths,
      rules = defaultRules,
      relativeTo = defaultRelativeTo,
      ignore = defaultIgnore,
      cwd = defaultCwd,
    }) => {
      const id = uuid();
      const entries = fg.sync(paths, { ...GLOB_OPTIONS, cwd, ignore });
      this.rules[id] = mapToStandardRules(rules);
      return {
        ...carr,
        [id]: entries.map(p => path.relative(relativeTo, p)),
      };
    }, {});
  }

  check() {
    const observableEntries = Object.entries(this.toObserve);

    const result = observableEntries.map(([id, files]) => {
      const rules = this.rules[id];
      if (!rules || !rules.length) return false;

      const sizes = files.map(file => gzipSize.fileSync(path.join(this.options.relativeTo, file)) / BYTE_TO_KILOBYTE);
      const sizeMap = zip(files, sizes);
      const appliedRules = rules.map(rule => rule(sizeMap));

      return buildResult(appliedRules);
    });

    return buildResult(result);
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Bundlecheck,
};
