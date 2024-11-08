import {
  constant, filter, flatten, get, zip,
} from 'lodash-es';
import fg from 'fast-glob';
import { gzipSizeFromFileSync } from 'gzip-size';
import path from 'path';
import { __dirname } from './esm.js';

import * as basicRules from './basic-rules.js';

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

const buildResult = data => data.reduce((carr, curr) => ({
  result: carr.result && curr.result,
  message: flatten([...carr.message, ...filter([curr.message], Boolean)]),
}), { result: true, message: [] });

const mapToStandardRules = rules => rules.reduce((carr, rule) => {
  // TODO: Make sure only functions are valid that have correct signature
  if (rule instanceof Function) return [...carr, rule];
  const ruleOptions = Object.entries(rule);
  const stdRules = ruleOptions.map(([name, params]) => (
    get(basicRules, name, NON_EXISTING_RULE).bind(null, params)));
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
      const id = `${Date.now()}-${parseInt(Math.random() * 1000, 10)}`;
      const entries = fg.sync(paths, { ...GLOB_OPTIONS, cwd, ignore });
      this.rules[id] = mapToStandardRules(rules);
      return {
        ...carr,
        [id]: entries.map(p => path.relative(relativeTo, p)),
      };
    }, {});
  }

  gzip(file) {
    return gzipSizeFromFileSync(path.join(this.options.relativeTo, file)) / BYTE_TO_KILOBYTE;
  }

  check() {
    const observableEntries = Object.entries(this.toObserve);

    const result = observableEntries.map(([id, files]) => {
      const rules = this.rules[id];
      if (!rules || !rules.length) return false;

      const sizeMap = zip(files, files.map(file => this.gzip(file)));
      const appliedRules = rules.map(rule => rule(sizeMap));

      return buildResult(appliedRules);
    });

    return buildResult(result);
  }
}

export {
  DEFAULT_OPTIONS,
  Bundlecheck,
};
