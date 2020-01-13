const filter = require('lodash/filter');
const calcMean = require('lodash/mean');

const NOT_MATCHING = 'Oops, not what you expected';

const sumUp = array => array.reduce((res, [, n]) => res + n, 0);

const every = ([min = 0, max = min], sizes) => {
  let result = true;
  const message = sizes.map(([name, size]) => {
    const check = min <= size && size <= max;
    result = result && check;
    return check ? null : `${NOT_MATCHING} (every): ${min} <= ${size} <= ${max} (${name})`;
  });
  return { result, message: filter(message, Boolean) };
};

const sum = ([min = 0, max = min], sizes) => {
  const summedUp = sumUp(sizes);
  const result = min <= summedUp && summedUp <= max;
  const names = sizes.map(([name]) => name);
  return {
    result,
    message: result ? null : `${NOT_MATCHING} (sum): ${min} <= ${summedUp} <= ${max} (${names})`,
  };
};

const mean = ([min = 0, max = min], sizes) => {
  const avg = sizes.length && sumUp(sizes) / sizes.length;
  const result = min <= avg && avg <= max;
  const names = sizes.map(([name]) => name);
  return {
    result,
    message: result ? null : `${NOT_MATCHING} (mean): ${min} <= ${avg} <= ${max} (${names})`,
  };
};

const deviation = ([min = 0, max = min], sizes) => {
  const avg = sizes.length && sumUp(sizes) / sizes.length;
  const std = calcMean(sizes.map(([, n]) => (n - avg) ** 2)) ** 0.5;
  const result = min <= std && std <= max;
  const names = sizes.map(([name]) => name);
  return {
    result,
    message: result ? null : `${NOT_MATCHING} (deviation): ${min} <= ${std} <= ${max} (${names})`,
  };
};

module.exports = {
  every,
  sum,
  mean,
  deviation,
};
