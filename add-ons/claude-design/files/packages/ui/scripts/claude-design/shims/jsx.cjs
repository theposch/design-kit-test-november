/* global module, window -- a CommonJS shim that runs in the browser */
// The JSX runtime over the canvas's React 18: jsx(type, props, key) is
// createElement with the key moved back into the props.
var React = window.React;

function jsx(type, props, key) {
  return key === undefined
    ? React.createElement(type, props)
    : React.createElement(type, Object.assign({}, props, { key: key }));
}

module.exports = { jsx: jsx, jsxs: jsx, jsxDEV: jsx, Fragment: React.Fragment };
