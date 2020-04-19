import postcss from 'postcss';
import shorthands from './shorthands';

export default postcss.plugin('postcss-starter', userOpts => {
  // config
  const defaultOpts = { rootRem: 16, prefix: 'range', screenMin: '48rem', screenMax: '87.5rem' };
  const opts = { ...defaultOpts, ...userOpts };

	return root => {
    root.walkRules(rule => {
      rule.walkDecls(decl => {
        // return from non-function declaration
        if (!decl.value.includes(opts.prefix)) {
          return;
        }

        // get values as array
        const values = postcss.list.space(decl.value);

        // get new declaration object using decl.prop and values array
        const newDecls = getNewDecls(decl.prop, values);

        // map through new declarations object entries and render
        Object.entries(newDecls).map(item => {
          // deconstruct prop and value from item
          const [prop, value] = item;

          const valueRange = getDeclValues(value, opts.prefix);

          // append decl and return if not shorthand range value
          if (!valueRange) {
            rule.append(postcss.decl({ prop, value }));
            return;
          }

          // get array of range params
          const rangeParams = postcss.list.comma(valueRange);

          // deconstruct and set opts defaults
          const [userMin, userMax, screenMin = opts.screenMin, screenMax = opts.screenMax] = rangeParams;

          // create min/max values and work out value if unit is a ratio
          const min = isUnitRatio(userMin) ? getMinFromRatio(userMin, userMax) : userMin;
          const max = isUnitRatio(userMax) ? getMaxFromRatio(userMin, userMax) : userMax;

          // error reporting
          if (isUnitRatio(userMin) && isUnitRatio(userMax)) {
            throw decl.error('Range requires a unit type for the minimum or maximum size.');
          }

          if (!max) {
            throw decl.error('Range requires a maximum unit size.');
          }

          if (!screenMin) {
            throw decl.error('Range requires a minimum screen size.');
          }

          if (!screenMax) {
            throw decl.error('Range requires a maximum screen size.');
          }

          // sizes to rem unit
          // https://stackoverflow.com/questions/14810506/map-function-for-objects-instead-of-arrays
          const sizes = Object.assign({}, ...Object.entries({ min, max, screenMin, screenMax }).map(([k, v]) => ({ [k]: getUnitRem(v, opts.rootRem) })));

          // render rules
          // min size
          rule.append(postcss.decl({ prop, value: sizes.min }));

          // vw based size
          rule.vw = postcss.atRule({ name: 'media', params: `(min-width: ${sizes.screenMin})` });

          rule
            .vw
            .append({ selector: rule.selector })
            .walkRules(selector => {
              selector.append({
                prop,
                value: `calc(${sizes.min} + (${getNumber(sizes.max)} - ${getNumber(sizes.min)}) * ((100vw - ${sizes.screenMin}) / (${getNumber(sizes.screenMax)} - ${getNumber(sizes.screenMin)})))`,
              });
            });

          root.insertBefore(rule.next, rule.vw);

          // max size
          rule.max = postcss.atRule({ name: 'media', params: `(min-width: ${sizes.screenMax})` });

          rule
            .max
            .append({selector: rule.selector})
            .walkRules(selector => {
              selector.append({
                prop,
                value: sizes.max,
              });
          });

          root.insertAfter(rule.vw, rule.max);
        });

        decl.remove();
      });
    });
	};
});

// return new declarations as object with k => v
const getNewDecls = (prop, values) => {
  return shorthands(prop, values) || { [prop]: values.shift() };
}

// get declaration values
const getDeclValues = (value, prefix) => {
  const regExp = new RegExp(escapeRegExp(prefix) + '\\s*\\((.*)\\)', 'i'); // values between curly brackets
  const match = value.match(regExp);
  return match ? match[1] : false;
}

// get min value from min ratio value
const getMinFromRatio = (min, max) => {
  // if negative value then reverse logic
  return (min < 0 ? getNumber(max) * (min * -1) : getNumber(max) / min) + getUnit(max);
}

// get max value from max ratio value
const getMaxFromRatio = (min, max) => {
  // if negative value then reverse logic
  return (max < 0 ? getNumber(min) / (max * -1) : getNumber(min) * max) + getUnit(min);
}

// is unit a ratio
const isUnitRatio = x => {
  return getUnit(x) === '';
}

// get unit only
const getUnit = x => {
  return x.replace(/^-?[0-9.]+/g, '');
}

// get number only
const getNumber = x => {
  return x.replace(/[a-zA-Z]+/g, '');
}

// get rem from px value
const getUnitRem = (x, rootRem) => {
  return getUnit(x) === 'px' ? `${getNumber(x) / rootRem}rem` : x;
}

// esc reg exp function for prefix
const escapeRegExp = str => {
  return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
