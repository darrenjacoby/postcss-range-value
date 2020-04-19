export default (prop, values) => {
  if (prop.match(/^(margin|margin-block|margin-inline)$/)) {
    return margin(prop, values);
  }

  if (prop.match(/^(padding|padding-block|padding-inline)$/)) {
    return padding(prop, values);
  }

  return false;
}

/**
 * Support for margin-block, margin-inline and margin
 * 
 * @param string prop
 * @param array values
 */
const margin = (prop, values) => {
  const [$1, $2, $3, $4] = values;

  if (['margin-block', 'margin-inline'].includes(prop)) {
    return { [`${prop}-start`]: $1, [`${prop}-end`]: $2 || $1 }
  }

  return { [`${prop}-top`]: $1, [`${prop}-right`]: $2 || $1, [`${prop}-bottom`]: $3 || $1, [`${prop}-left`]: $4 || $2 || $1 }
};

/**
 * Support for padding-block, padding-inline and padding
 * 
 * @param string prop
 * @param array values
 */
const padding = (prop, values) => {
  const [$1, $2, $3, $4] = values;

  if (['padding-block', 'padding-inline'].includes(prop)) {
    return { [`${prop}-start`]: $1, [`${prop}-end`]: $2 || $1 }
  }

  return { [`${prop}-top`]: $1, [`${prop}-right`]: $2 || $1, [`${prop}-bottom`]: $3 || $1, [`${prop}-left`]: $4 || $2 || $1 }
};
