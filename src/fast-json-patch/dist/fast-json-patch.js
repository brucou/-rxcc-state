(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.fastJsonPatch = {})));
}(this, (function (exports) { 'use strict';

/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
var pSlice = Array.prototype.slice;
var objectKeys = Object.keys;
function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

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

function equals(actual, expected, opts) {
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
}

const _hasOwnProperty = Object.prototype.hasOwnProperty;

function hasOwnProperty(obj, key) {
  return _hasOwnProperty.call(obj, key);
}

function _objectKeys(obj) {
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
}

/**
 * Deeply clone the object.
 * https://jsperf.com/deep-copy-vs-json-stringify-json-parse/25 (recursiveDeepCopy)
 * @param  {any} obj value to clone
 * @return {any} cloned obj
 */
function _deepClone(obj) {
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
function isInteger(str) {
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
function escapePathComponent(path) {
  if (path.indexOf('/') === -1 && path.indexOf('~') === -1) return path;
  return path.replace(/~/g, '~0').replace(/\//g, '~1');
}

/**
 * Unescapes a json pointer path
 * @param path The escaped pointer
 * @return The unescaped path
 */
function unescapePathComponent(path) {
  return path.replace(/~1/g, '/').replace(/~0/g, '~');
}





/**
 * Recursively checks whether an object has any undefined values inside.
 */
function hasUndefined(obj) {
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

class PatchError extends Error {
  constructor(message, name, index, operation, tree) {
    super(message);
  }
}

/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
const equalsOptions = { strict: true };
const _equals = equals;
const areEquals = (a, b) => {
  return _equals(a, b, equalsOptions)
};
const JsonPatchError = PatchError;


/* We use a Javascript hash to store each
 function. Each hash entry (property) uses
 the operation identifiers specified in rfc6902.
 In this way, we can map each patch operation
 to its dedicated function in efficient way.
 */

/* The operations applicable to an object */
const objOps = {
  add: function (obj, key, document) {
    obj[key] = this.value;
    return { newDocument: document };
  },
  remove: function (obj, key, document) {
    var removed = obj[key];
    delete obj[key];
    return { newDocument: document, removed }
  },
  replace: function (obj, key, document) {
    var removed = obj[key];
    obj[key] = this.value;
    return { newDocument: document, removed };
  },
  move: function (obj, key, document) {
    /* in case move target overwrites an existing value,
    return the removed value, this can be taxing performance-wise,
    and is potentially unneeded */
    let removed = getValueByPointer(document, this.path);

    if (removed) {
      removed = _deepClone(removed);
    }

    const originalValue = applyOperation(document,
      { op: "remove", path: this.from }
    ).removed;

    applyOperation(document,
      { op: "add", path: this.path, value: originalValue }
    );

    return { newDocument: document, removed };
  },
  copy: function (obj, key, document) {
    const valueToCopy = getValueByPointer(document, this.from);
    // enforce copy by value so further operations don't affect source (see issue #177)
    applyOperation(document,
      { op: "add", path: this.path, value: _deepClone(valueToCopy) }
    );
    return { newDocument: document }
  },
  test: function (obj, key, document) {
    return { newDocument: document, test: areEquals(obj[key], this.value) }
  },
  _get: function (obj, key, document) {
    this.value = obj[key];
    return { newDocument: document }
  }
};

/* The operations applicable to an array. Many are the same as for the object */
var arrOps = {
  add: function (arr, i, document) {
    if(isInteger(i)) {
      arr.splice(i, 0, this.value);
    } else { // array props
      arr[i] = this.value;
    }
    // this may be needed when using '-' in an array
    return { newDocument: document, index: i }
  },
  remove: function (arr, i, document) {
    var removedList = arr.splice(i, 1);
    return { newDocument: document, removed: removedList[0] };
  },
  replace: function (arr, i, document) {
    var removed = arr[i];
    arr[i] = this.value;
    return { newDocument: document, removed };
  },
  move: objOps.move,
  copy: objOps.copy,
  test: objOps.test,
  _get: objOps._get
};

/**
 * Retrieves a value from a JSON document by a JSON pointer.
 * Returns the value.
 *
 * @param document The document to get the value from
 * @param pointer an escaped JSON pointer
 * @return The retrieved value
 */
function getValueByPointer(document, pointer) {
  if (pointer == '') {
    return document;
  }
  var getOriginalDestination = { op: "_get", path: pointer };
  applyOperation(document, getOriginalDestination);
  return getOriginalDestination.value;
}
/**
 * Apply a single JSON Patch Operation on a JSON document.
 * Returns the {newDocument, result} of the operation.
 * It modifies the `document` and `operation` objects - it gets the values by reference.
 * If you would like to avoid touching your values, clone them:
 * `jsonpatch.applyOperation(document, jsonpatch._deepClone(operation))`.
 *
 * @param document The document to patch
 * @param operation The operation to apply
 * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
 * @param mutateDocument Whether to mutate the original document or clone it before applying
 * @return `{newDocument, result}` after the operation
 */
function applyOperation(document, operation, validateOperation = false, mutateDocument = true) {
  if (validateOperation) {
    if (typeof validateOperation == 'function') {
      validateOperation(operation, 0, document, operation.path);
    }
    else {
      validator(operation, 0);
    }
  }
  /* ROOT OPERATIONS */
  if (operation.path === "") {
    let returnValue = { newDocument: document };
    if (operation.op === 'add') {
      returnValue.newDocument = operation.value;
      return returnValue;
    } else if (operation.op === 'replace') {
      returnValue.newDocument = operation.value;
      returnValue.removed = document; //document we removed
      return returnValue;
    }
    else if (operation.op === 'move' || operation.op === 'copy') { // it's a move or copy to root
      returnValue.newDocument = getValueByPointer(document, operation.from); // get the value by json-pointer in `from` field
      if (operation.op === 'move') { // report removed item
        returnValue.removed = document;
      }
      return returnValue;
    } else if (operation.op === 'test') {
      returnValue.test = areEquals(document, operation.value);
      if (returnValue.test === false) {
        throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
      }
      returnValue.newDocument = document;
      return returnValue;
    } else if (operation.op === 'remove') { // a remove on root
      returnValue.removed = document;
      returnValue.newDocument = null;
      return returnValue;
    } else if (operation.op === '_get') {
      operation.value = document;
      return returnValue;
    } else { /* bad operation */
      if (validateOperation) {
        throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', 0, operation, document);
      } else {
        return returnValue;
      }
    }
  } /* END ROOT OPERATIONS */
  else {
    if (!mutateDocument) {
      document = _deepClone(document);
    }
    const path = operation.path || "";
    const keys = path.split('/');
    let obj = document;
    let t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
    let len = keys.length;
    let existingPathFragment = undefined;
    let key;
    let validateFunction;
    if (typeof validateOperation == 'function') {
      validateFunction = validateOperation;
    }
    else {
      validateFunction = validator;
    }
    while (true) {
      key = keys[t];

      if (validateOperation) {
        if (existingPathFragment === undefined) {
          if (obj[key] === undefined) {
            existingPathFragment = keys.slice(0, t).join('/');
          }
          else if (t == len - 1) {
            existingPathFragment = operation.path;
          }
          if (existingPathFragment !== undefined) {
            validateFunction(operation, 0, document, existingPathFragment);
          }
        }
      }
      t++;
      if (Array.isArray(obj)) {
        if (key === '-') {
          key = obj.length;
        }
        else {
          if (validateOperation && !isInteger(key)) {
            throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", 0, operation.path, operation);
          } // only parse key when it's an integer for `arr.prop` to work
          else if(isInteger(key)) {
            key = ~~key;
          }
        }
        if (t >= len) {
          if (validateOperation && operation.op === "add" && key > obj.length) {
            throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", 0, operation.path, operation);
          }
          const returnValue = arrOps[operation.op].call(operation, obj, key, document); // Apply patch
          if (returnValue.test === false) {
            throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
          }
          return returnValue;
        }
      }
      else {
        if (key && key.indexOf('~') != -1) {
          key = unescapePathComponent(key);
        }
        if (t >= len) {
          const returnValue = objOps[operation.op].call(operation, obj, key, document); // Apply patch
          if (returnValue.test === false) {
            throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
          }
          return returnValue;
        }
      }
      obj = obj[key];
    }
  }
}

/**
 * Apply a full JSON Patch array on a JSON document.
 * Returns the {newDocument, result} of the patch.
 * It modifies the `document` object and `patch` - it gets the values by reference.
 * If you would like to avoid touching your values, clone them:
 * `jsonpatch.applyPatch(document, jsonpatch._deepClone(patch))`.
 *
 * @param document The document to patch
 * @param patch The patch to apply
 * @param validateOperation `false` is without validation, `true` to use default jsonpatch's validation, or you can pass a `validateOperation` callback to be used for validation.
 * @param mutateDocument Whether to mutate the original document or clone it before applying
 * @return An array of `{newDocument, result}` after the patch
 */
function applyPatch(document, patch, validateOperation, mutateDocument = true) {
  if(validateOperation) {
    if(!Array.isArray(patch)) {
      throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
    }
  }
  if (!mutateDocument) {
  document = _deepClone(document);
}
const results = new Array(patch.length);

for (let i = 0, length = patch.length; i < length; i++) {
  results[i] = applyOperation(document, patch[i], validateOperation);
  document = results[i].newDocument; // in case root was replaced
}
results.newDocument = document;
return results;
}

/**
 * Apply a single JSON Patch Operation on a JSON document.
 * Returns the updated document.
 * Suitable as a reducer.
 *
 * @param document The document to patch
 * @param operation The operation to apply
 * @return The updated document
 */
function applyReducer(document, operation) {
  const operationResult = applyOperation(document, operation);
  if (operationResult.test === false) { // failed test
    throw new JsonPatchError("Test operation failed", 'TEST_OPERATION_FAILED', 0, operation, document);
  }
  return operationResult.newDocument;
}

/**
 * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
 * @param {object} operation - operation object (patch)
 * @param {number} index - index of operation in the sequence
 * @param {object} [document] - object where the operation is supposed to be applied
 * @param {string} [existingPathFragment] - comes along with `document`
 */
function validator(operation, index, document, existingPathFragment) {
  if (typeof operation !== 'object' || operation === null || Array.isArray(operation)) {
  throw new JsonPatchError('Operation is not an object', 'OPERATION_NOT_AN_OBJECT', index, operation, document);
}

else if (!objOps[operation.op]) {
  throw new JsonPatchError('Operation `op` property is not one of operations defined in RFC-6902', 'OPERATION_OP_INVALID', index, operation, document);
}

else if (typeof operation.path !== 'string') {
  throw new JsonPatchError('Operation `path` property is not a string', 'OPERATION_PATH_INVALID', index, operation, document);
}

else if (operation.path.indexOf('/') !== 0 && operation.path.length > 0) {
  // paths that aren't empty string should start with "/"
  throw new JsonPatchError('Operation `path` property must start with "/"', 'OPERATION_PATH_INVALID', index, operation, document);
}

else if ((operation.op === 'move' || operation.op === 'copy') && typeof operation.from !== 'string') {
  throw new JsonPatchError('Operation `from` property is not present (applicable in `move` and `copy` operations)', 'OPERATION_FROM_REQUIRED', index, operation, document);
}

else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && operation.value === undefined) {
  throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_REQUIRED', index, operation, document);
}

else if ((operation.op === 'add' || operation.op === 'replace' || operation.op === 'test') && hasUndefined(operation.value)) {
  throw new JsonPatchError('Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)', 'OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED', index, operation, document);
}

else if (document) {
  if (operation.op == "add") {
    var pathLen = operation.path.split("/").length;
    var existingPathLen = existingPathFragment.split("/").length;
    if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen) {
      throw new JsonPatchError('Cannot perform an `add` operation at the desired path', 'OPERATION_PATH_CANNOT_ADD', index, operation, document);
    }
  }
  else if (operation.op === 'replace' || operation.op === 'remove' || (operation.op) === '_get') {
    if (operation.path !== existingPathFragment) {
      throw new JsonPatchError('Cannot perform the operation at a path that does not exist', 'OPERATION_PATH_UNRESOLVABLE', index, operation, document);
    }
  }
else if (operation.op === 'move' || operation.op === 'copy') {
    var existingValue = { op: "_get", path: operation.from, value: undefined };
    var error = validate([existingValue], document);
    if (error && error.name === 'OPERATION_PATH_UNRESOLVABLE') {
      throw new JsonPatchError('Cannot perform the operation from a path that does not exist', 'OPERATION_FROM_UNRESOLVABLE', index, operation, document);
    }
  }
}
}

/**
 * Validates a sequence of operations. If `document` parameter is provided, the sequence is additionally validated against the object document.
 * If error is encountered, returns a JsonPatchError object
 * @param sequence
 * @param document
 * @returns {JsonPatchError|undefined}
 */
function validate(sequence, document, externalValidator) {
  try {
    if (!Array.isArray(sequence)) {
      throw new JsonPatchError('Patch sequence must be an array', 'SEQUENCE_NOT_AN_ARRAY');
    }
    if (document) {
      //clone document and sequence so that we can safely try applying operations
      applyPatch(_deepClone(document), _deepClone(sequence), externalValidator || true);
    }
    else {
      externalValidator = externalValidator || validator;
      for (var i = 0; i < sequence.length; i++) {
        externalValidator(sequence[i], i, document, undefined);
      }
    }
  }
  catch (e) {
    if (e instanceof JsonPatchError) {
      return e;
    }
    else {
      throw e;
    }
  }
}

/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
var beforeDict = [];

class Mirror {
  constructor(obj) {
    this.obj = obj;
    this.observers = [];
  }
}

class ObserverInfo {
  constructor(callback, observer) {
    this.callback = callback;
    this.observer = observer;
  }
}

function getMirror(obj) {
  for (var i = 0, length = beforeDict.length; i < length; i++) {
    if (beforeDict[i].obj === obj) {
      return beforeDict[i];
    }
  }
}

function getObserverFromMirror(mirror, callback) {
  for (var j = 0, length = mirror.observers.length; j < length; j++) {
    if (mirror.observers[j].callback === callback) {
      return mirror.observers[j].observer;
    }
  }
}

function removeObserverFromMirror(mirror, observer) {
  for (var j = 0, length = mirror.observers.length; j < length; j++) {
    if (mirror.observers[j].observer === observer) {
      mirror.observers.splice(j, 1);
      return;
    }
  }
}

/**
 * Detach an observer from an object
 */
function unobserve(root, observer) {
  observer.unobserve();
}

/**
 * Observes changes made to an object, which can then be retrieved using generate
 */
function observe(obj, callback) {
  var patches = [];
var observer;
var mirror = getMirror(obj);

if (!mirror) {
  mirror = new Mirror(obj);
  beforeDict.push(mirror);
} else {
  observer = getObserverFromMirror(mirror, callback);
}

if (observer) {
  return observer;
}

observer = {};

mirror.value = _deepClone(obj);

if (callback) {
  observer.callback = callback;
  observer.next = null;

  var dirtyCheck = () => {
    generate(observer);
  };
  var fastCheck = () => {
    clearTimeout(observer.next);
    observer.next = setTimeout(dirtyCheck);
  };
  if (typeof window !== 'undefined') { //not Node
    if (window.addEventListener) { //standards
      window.addEventListener('mouseup', fastCheck);
      window.addEventListener('keyup', fastCheck);
      window.addEventListener('mousedown', fastCheck);
      window.addEventListener('keydown', fastCheck);
      window.addEventListener('change', fastCheck);
    }
    else { //IE8
      (document.documentElement).attachEvent('onmouseup', fastCheck);
      (document.documentElement).attachEvent('onkeyup', fastCheck);
      (document.documentElement).attachEvent('onmousedown', fastCheck);
      (document.documentElement).attachEvent('onkeydown', fastCheck);
      (document.documentElement).attachEvent('onchange', fastCheck);
    }
  }
}
observer.patches = patches;
observer.object = obj;

observer.unobserve = () => {
  generate(observer);
  clearTimeout(observer.next);
  removeObserverFromMirror(mirror, observer);

  if (typeof window !== 'undefined') {
    if (window.removeEventListener) {
      window.removeEventListener('mouseup', fastCheck);
      window.removeEventListener('keyup', fastCheck);
      window.removeEventListener('mousedown', fastCheck);
      window.removeEventListener('keydown', fastCheck);
    }
    else {
      (document.documentElement).detachEvent('onmouseup', fastCheck);
      (document.documentElement).detachEvent('onkeyup', fastCheck);
      (document.documentElement).detachEvent('onmousedown', fastCheck);
      (document.documentElement).detachEvent('onkeydown', fastCheck);
    }
  }
};

mirror.observers.push(new ObserverInfo(callback, observer));

return observer;
}

/**
 * Generate an array of patches from an observer
 */
function generate(observer) {
  var mirror;
  for (var i = 0, length = beforeDict.length; i < length; i++) {
    if (beforeDict[i].obj === observer.object) {
      mirror = beforeDict[i];
      break;
    }
  }
  _generate(mirror.value, observer.object, observer.patches, "");
  if (observer.patches.length) {
    applyPatch(mirror.value, observer.patches);
  }
  var temp = observer.patches;
  if (temp.length > 0) {
    observer.patches = [];
    if (observer.callback) {
      observer.callback(temp);
    }
  }
  return temp;
}

// Dirty check if obj is different from mirror, generate patches and update mirror
function _generate(mirror, obj, patches, path) {
  if (obj === mirror) {
    return;
  }

  if (typeof obj.toJSON === "function") {
    obj = obj.toJSON();
  }

  var newKeys = _objectKeys(obj);
  var oldKeys = _objectKeys(mirror);
  var deleted = false;

  //if ever "move" operation is implemented here, make sure this test runs OK: "should not generate the same patch twice (move)"
  for (var t = oldKeys.length - 1; t >= 0; t--) {
    var key = oldKeys[t];
    var oldVal = mirror[key];
    if (hasOwnProperty(obj, key) && !(obj[key] === undefined && oldVal !== undefined && Array.isArray(obj) === false)) {
      var newVal = obj[key];
      if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null) {
        _generate(oldVal, newVal, patches, path + "/" + escapePathComponent(key));
      }
      else {
        if (oldVal !== newVal) {
          patches.push({ op: "replace", path: path + "/" + escapePathComponent(key), value: _deepClone(newVal) });
        }
      }
    }
    else {
      patches.push({ op: "remove", path: path + "/" + escapePathComponent(key) });
      deleted = true; // property has been deleted
    }
  }

  if (!deleted && newKeys.length == oldKeys.length) {
    return;
  }

  for (var t = 0; t < newKeys.length; t++) {
    var key = newKeys[t];
    if (!hasOwnProperty(mirror, key) && obj[key] !== undefined) {
      patches.push({ op: "add", path: path + "/" + escapePathComponent(key), value: _deepClone(obj[key]) });
    }
  }
}
/**
 * Create an array of patches from the differences in two objects
 */
function compare(tree1, tree2) {
  var patches = [];
  _generate(tree1, tree2, patches, '');
  return patches;
}

exports.unobserve = unobserve;
exports.observe = observe;
exports.generate = generate;
exports.compare = compare;
exports.applyOperation = applyOperation;
exports.applyPatch = applyPatch;
exports.applyReducer = applyReducer;
exports.getValueByPointer = getValueByPointer;
exports.validate = validate;
exports.validator = validator;
exports.JsonPatchError = PatchError;
exports.deepClone = _deepClone;
exports.escapePathComponent = escapePathComponent;
exports.unescapePathComponent = unescapePathComponent;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=fast-json-patch.js.map
