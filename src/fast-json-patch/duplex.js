/*!
 * https://github.com/Starcounter-Jack/JSON-Patch
 * (c) 2017 Joachim Wester
 * MIT license
 */
var isArray = Array.isArray;
var keyList = Object.keys;
var hasProp = Object.prototype.hasOwnProperty;

import { equals, PatchError, _deepClone, isInteger, _objectKeys, escapePathComponent, unescapePathComponent, hasUndefined, hasOwnProperty } from './helpers';
import { applyOperation, applyPatch, getValueByPointer } from './core';

/* export all core functions */
export { applyOperation, applyPatch, applyReducer, getValueByPointer, validate, validator } from './core';

/* export some helpers */
export { PatchError as JsonPatchError, _deepClone as deepClone, escapePathComponent, unescapePathComponent } from './helpers';

const equalsOptions = { strict: true };
const _equals = equals;
const areEquals = (a, b) => {
  return _equals(a, b, equalsOptions)
}

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
export function unobserve(root, observer) {
  observer.unobserve();
}

/**
 * Observes changes made to an object, which can then be retrieved using generate
 */
export function observe(obj, callback) {
  var patches = [];
var root = obj;
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
export function generate(observer) {
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
  var changed = false;
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
          changed = true;
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
export function compare(tree1, tree2) {
  var patches = [];
  _generate(tree1, tree2, patches, '');
  return patches;
}
