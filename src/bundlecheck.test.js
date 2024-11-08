import path from 'path';

import { Bundlecheck, DEFAULT_OPTIONS } from './bundlecheck.js';

jest.mock('./esm.js', () => ({
  __dirname: './',
}));

describe('Bundlecheck', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01'));

  let counter = 0;
  jest.spyOn(global.Math, 'random').mockImplementation(() => {
    counter += 1;
    return (counter / 1000);
  });

  beforeEach(() => {
    counter = 0;
  });

  it('should initialize', () => {
    expect(Bundlecheck).toBeInstanceOf(Function);
    expect(new Bundlecheck()).toBeInstanceOf(Bundlecheck);
  });

  describe('> Config', () => {
    it('should initialize with default config', () => {
      const bundlecheck = new Bundlecheck();
      expect(bundlecheck.options).toEqual(DEFAULT_OPTIONS);
    });

    it('should return paths relative to root', () => {
      const config = {
        relativeTo: path.resolve(__dirname, '..'),
        cwd: path.resolve(__dirname, '..', 'test'),
        observe: [
          {
            relativeTo: path.resolve(__dirname, '../__dist'),
            paths: ['**.json', '**.js'],
          },
          {
            paths: ['**.json', '**.js'],
          },
        ],
      };
      const bundlecheck = new Bundlecheck(config);

      expect(bundlecheck.options.cwd).toEqual(config.cwd);
      expect(bundlecheck.options.observe).toEqual(config.observe);
      expect(bundlecheck.options).not.toEqual(DEFAULT_OPTIONS);

      expect(bundlecheck.toObserve).toEqual(expect.objectContaining({
        [`${Date.now()}-1`]: [
          '../test/bar.json',
          '../test/foo.js',
          '../test/__dist/bar.json',
          '../test/__dist/foo.js',
        ],
        [`${Date.now()}-2`]: [
          'test/bar.json',
          'test/foo.js',
          'test/__dist/bar.json',
          'test/__dist/foo.js',
        ],
      }));
    });

    it('should use correct current working directory', () => {
      const config = {
        relativeTo: path.resolve(__dirname, '..'),
        cwd: path.resolve(__dirname, '..', 'test'),
        observe: [
          {
            cwd: path.resolve(__dirname, '..', 'test', '__dist'),
            paths: ['**.json', '**.js'],
          },
          {
            paths: ['**.json', '**.js'],
          },
        ],
      };
      const bundlecheck = new Bundlecheck(config);

      expect(bundlecheck.options.cwd).toEqual(config.cwd);
      expect(bundlecheck.options.observe).toEqual(config.observe);
      expect(bundlecheck.options).not.toEqual(DEFAULT_OPTIONS);
      expect(bundlecheck.toObserve).toEqual(
        {
          [`${Date.now()}-1`]: [
            'test/__dist/bar.json',
            'test/__dist/foo.js',
          ],
          [`${Date.now()}-2`]: [
            'test/bar.json',
            'test/foo.js',
            'test/__dist/bar.json',
            'test/__dist/foo.js',
          ],
        },
      );
    });

    it('should ignore certain files and folders', () => {
      const config = {
        relativeTo: path.resolve(__dirname, '..'),
        cwd: path.resolve(__dirname, '..', 'test'),
        ignore: ['**/foo.js', '__dist/bar.json'],
        observe: [
          {
            paths: ['**'],
          },
          {
            ignore: [],
            paths: ['**'],
          },
          {
            ignore: ['**/test/foo.js', '**/test/bar.json'],
            paths: ['**'],
          },
        ],
      };
      const bundlecheck = new Bundlecheck(config);

      expect(bundlecheck.options.cwd).toEqual(config.cwd);
      expect(bundlecheck.options.observe).toEqual(config.observe);
      expect(bundlecheck.options).not.toEqual(DEFAULT_OPTIONS);
      expect(bundlecheck.toObserve).toEqual(
        {
          [`${Date.now()}-1`]: [
            'test/bar.json',
          ],
          [`${Date.now()}-2`]: [
            'test/bar.json',
            'test/foo.js',
            'test/__dist/bar.json',
            'test/__dist/foo.js',
          ],
          [`${Date.now()}-3`]: [
            'test/__dist/bar.json',
            'test/__dist/foo.js',
          ],
        },
      );
    });
  });

  describe('> Rules', () => {
    const defaultConfig = {
      relativeTo: path.resolve(__dirname, '..'),
      cwd: path.resolve(__dirname, '..', 'test'),
    };

    const defaultObserveEntry = {
      paths: ['**'],
      rules: [],
    };

    it('should not pass check when there are no rules set', () => {
      const config = {
        ...defaultConfig,
        observe: [defaultObserveEntry],
      };
      const bundlecheck = new Bundlecheck(config);
      const { result, message } = bundlecheck.check();
      expect(result).toBeFalsy();
      expect(message).toEqual([]);
    });

    describe('> Every', () => {
      it('should pass check on every file size when min size is not set', () => {
        const expected = [undefined, 0.074];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ every: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check on every file size when max size is not set', () => {
        const expected = [0.074];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ every: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check on every file size rule if is greater than minSize and smaller than maxSize', () => {
        const expected = [0.074, 0.083];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ every: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should fail check on every file size rule if is smaller than minSize and smaller than maxSize', () => {
        const expected = [0.08, 0.083];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ every: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(expect.arrayContaining(
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*.json.*`))],
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*.json.*`))],
        ));
      });

      it('should fail check on every file size rule if is greater than minSize and greater than maxSize', () => {
        const expected = [0.074, 0.074];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ every: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(expect.arrayContaining(
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*.js.*`))],
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*.js.*`))],
        ));
      });
    });

    describe('> Sum', () => {
      it('should pass check on summing file size when min size is not set', () => {
        const expected = [undefined, 0.148];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ sum: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check on summing file size when max size is not set', () => {
        const expected = [0.148];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ sum: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check on summing up file size rules when between min and max', () => {
        const expected = [0.313, 0.315];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ sum: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should fail check on summing up file size rules when below min and max', () => {
        const expected = [0.01, 0.01];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ sum: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(expect.arrayContaining(
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*`))],
        ));
      });
    });

    describe('> Mean', () => {
      it('should pass check on mean file size when min size is not set', () => {
        const expected = [undefined, 0.074];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ mean: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check on mean file size when max size is not set', () => {
        const expected = [0.074];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ mean: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check when the mean size is between min and max', () => {
        const expected = [0.07, 0.08];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ mean: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should fail check when the mean size is below min and max', () => {
        const expected = [0.03, 0.04];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ mean: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(expect.arrayContaining(
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*`))],
        ));
      });

      it('should fail check when the mean size is above min and max', () => {
        const expected = [0.01, 0.02];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ mean: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(expect.arrayContaining(
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*`))],
        ));
      });
    });

    describe('> Standard Deviation', () => {
      it('should pass check on standard deviation file size when min size is not set', () => {
        const expected = [undefined, 0];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ deviation: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check on standard deviation file size when max size is not set', () => {
        const expected = [0];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            paths: ['**/*.json'],
            rules: [{ deviation: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should pass check when the standard deviation is between min and max', () => {
        const expected = [0.004, 0.005];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ deviation: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual([]);
      });

      it('should fail check when the standard deviation is below min and max', () => {
        const expected = [0.008, 0.01];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ deviation: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(expect.arrayContaining(
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*`))],
        ));
      });

      it('should fail check when the standard deviation is above min and max', () => {
        const expected = [0.005, 0.006];
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [{ deviation: expected }],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(expect.arrayContaining(
          [expect.stringMatching(new RegExp(`.*${expected[0]} <= [0-9.]* <= ${expected[1]}.*`))],
        ));
      });
    });

    describe('> Custom Rules', () => {
      it('should pass check on custom rule that returns true', () => {
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [() => ({ result: true, message: 'force true' })],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeTruthy();
        expect(message).toEqual(['force true']);
      });

      it('should fail check on custom rule that returns false', () => {
        const config = {
          ...defaultConfig,
          observe: [{
            ...defaultObserveEntry,
            rules: [() => ({ result: false, message: 'force false' })],
          }],
        };
        const bundlecheck = new Bundlecheck(config);
        const { result, message } = bundlecheck.check();
        expect(result).toBeFalsy();
        expect(message).toEqual(['force false']);
      });
    });
  });
});
