/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
var pSlice = Array.prototype.slice;
var objectKeys = Object.keys;
function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
      kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}

export function equals(actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

    // 7.3. Other pairs that do not both pass typeof value == 'object',
    // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

    // 7.4. For all other Object pairs, including Array objects, equivalence is
    // determined by having the same number of owned properties (as verified
    // with Object.prototype.hasOwnProperty.call), the same set of keys
    // (although not necessarily the same order), equivalent values for every
    // corresponding key, and an identical 'prototype' property. Note: this
    // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
};

const _hasOwnProperty = Object.prototype.hasOwnProperty;

export function hasOwnProperty(obj, key) {
  return _hasOwnProperty.call(obj, key);
}

export function _objectKeys(obj) {
  if (Array.isArray(obj)) {
    var keys = new Array(obj.length);
    for (var k = 0; k < keys.length; k++) {
      keys[k] = "" + k;
    }
    return keys;
  }
  if (Object.keys) {
    return Object.keys(obj);
  }
  var keys = [];
  for (var i in obj) {
    if (hasOwnProperty(obj, i)) {
      keys.push(i);
    }
  }
  return keys;
};

/**
 * Deeply clone the object.
 * https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
 * @param  {any} obj value to clone
 * @return {any} cloned obj
 */
export function _deepClone(obj) {
  switch (typeof obj) {
    case "object":
      return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
    case "undefined":
      return null; //this is how JSON.stringify behaves for array items
    default:
      return obj; //no need to clone primitives
  }
}

//3x faster than cached /^\d+$/.test(str)
export function isInteger(str) {
  var i = 0;
  var len = str.length;
  var charCode;
  while ( i < len ) {
    charCode = str.charCodeAt(i);
    if (charCode >= 48 && charCode <= 57) {
      i++;
      continue;
    }
    return false;
  }
  return true;
}

/**
 * Escapes a json pointer path
 * @param path The raw pointer
 * @return the Escaped path
 */
export function escapePathComponent(path) {
  if (path.indexOf('/') === -1 && path.indexOf('~') === -1) return path;
  return path.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Unescapes a json pointer path
 * @param path The escaped pointer
 * @return The unescaped path
 */
export function unescapePathComponent(path) {
  return path.replace(/~1/g, '/').replace(/~0/g, '~');
}

export function _getPathRecursive(root, obj) {
  var found;
  for (var key in root) {
    if (hasOwnProperty(root, key)) {
      if (root[key] === obj) {
        return escapePathComponent(key) + '/';
      }
      else if (typeof root[key] === 'object') {
        found = _getPathRecursive(root[key], obj);
        if (found != '') {
          return escapePathComponent(key) + '/' + found;
        }
      }
    }
  }
  return '';
}

export function getPath(root, obj) {
  if (root === obj) {
    return '/';
  }
  var path = _getPathRecursive(root, obj);
  if (path === '') {
    throw new Error("Object not found in root");
  }
  return '/' + path;
}

/**
 * Recursively checks whether an object has any undefined values inside.
 */
export function hasUndefined(obj) {
  if (obj === undefined) {
    return true;
  }
  if (obj) {
    if (Array.isArray(obj)) {
      for (var i = 0, len = obj.length; i < len; i++) {
        if (hasUndefined(obj[i])) {
          return true;
        }
      }
    }
    else if (typeof obj === "object") {
      var objKeys = _objectKeys(obj);
      var objKeysLength = objKeys.length;
      for (var i = 0; i < objKeysLength; i++) {
        if (hasUndefined(obj[objKeys[i]])) {
          return true;
        }
      }
    }
  }
  return false;
}

export class PatchError extends Error {
  constructor(message, name, index, operation, tree) {
    super(message);
  }
}
