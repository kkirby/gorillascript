(function () {
  "use strict";
  var __create, __generatorToPromise, __in, __isArray, __owns, __slice,
      __toArray, __toPromise, __typeof, _ref, Cache, fs, inspect, isPrimordial,
      mkdirp, path, writeFileWithMkdirp;
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
    };
  __generatorToPromise = function (func) {
    return function () {
      var iter;
      iter = func.apply(this, arguments);
      return new Promise(function (fulfill, reject) {
        function next(result) {
          var info;
          try {
            info = iter.next(result);
          } catch (e) {
            return reject(e);
          }
          if (info.done) {
            return fulfill(info.value);
          } else if (info.value instanceof Promise) {
            return info.value.then(
              function (result) {
                return next(result);
              },
              function (e) {
                try {
                  return iter["throw"](e);
                } catch (e) {
                  return reject(e);
                }
              }
            );
          }
        }
        return next();
      });
    };
  };
  __in = typeof Array.prototype.indexOf === "function"
    ? (function (indexOf) {
      return function (child, parent) {
        return indexOf.call(parent, child) !== -1;
      };
    }(Array.prototype.indexOf))
    : function (child, parent) {
      var i, len;
      len = +parent.length;
      i = -1;
      while (++i < len) {
        if (child === parent[i] && i in parent) {
          return true;
        }
      }
      return false;
    };
  __isArray = typeof Array.isArray === "function" ? Array.isArray
    : (function (_toString) {
      return function (x) {
        return _toString.call(x) === "[object Array]";
      };
    }(Object.prototype.toString));
  __owns = Object.prototype.hasOwnProperty;
  __slice = Array.prototype.slice;
  __toArray = function (x) {
    if (x == null) {
      throw new TypeError("Expected an object, got " + __typeof(x));
    } else if (__isArray(x)) {
      return x;
    } else if (typeof x === "string") {
      return x.split("");
    } else if (typeof x.length === "number") {
      return __slice.call(x);
    } else {
      throw new TypeError("Expected an object with a length property, got " + __typeof(x));
    }
  };
  __toPromise = function (func, context, args) {
    if (typeof func !== "function") {
      throw new TypeError("Expected func to be a Function, got " + __typeof(func));
    }
    return new Promise(function (fulfill, reject) {
      return func.apply(context, __toArray(args).concat([
        function (err, value) {
          if (err != null) {
            reject(err);
          } else {
            fulfill(value);
          }
        }
      ]));
    });
  };
  __typeof = (function () {
    var _toString;
    _toString = Object.prototype.toString;
    return function (o) {
      if (o === void 0) {
        return "Undefined";
      } else if (o === null) {
        return "Null";
      } else {
        return o.constructor && o.constructor.name || _toString.call(o).slice(8, -1);
      }
    };
  }());
  if ((_ref = require("util")) != null) {
    inspect = _ref.inspect;
  }
  path = require("path");
  fs = require("fs");
  function stringRepeat(text, count) {
    if (count < 1) {
      return "";
    } else if (count === 1) {
      return text;
    } else if (count & 1) {
      return "" + text + stringRepeat(text, count - 1);
    } else {
      return stringRepeat("" + text + text, count / 2);
    }
  }
  function padLeft(text, len, padding) {
    return "" + stringRepeat(padding, len - text.length) + text;
  }
  function padRight(text, len, padding) {
    return "" + text + stringRepeat(padding, len - text.length);
  }
  Cache = (function () {
    var _Cache_prototype;
    function Cache() {
      var _this;
      _this = this instanceof Cache ? this : __create(_Cache_prototype);
      _this.weakmap = new WeakMap();
      return _this;
    }
    _Cache_prototype = Cache.prototype;
    Cache.displayName = "Cache";
    _Cache_prototype.get = function (key) {
      return this.weakmap.get(key);
    };
    _Cache_prototype.set = function (key, value) {
      this.weakmap.set(key, value);
    };
    _Cache_prototype.getOrAdd = function (key, factory) {
      var value, weakmap;
      weakmap = this.weakmap;
      value = weakmap.get(key);
      if (value === void 0) {
        value = factory(key);
        weakmap.set(key, value);
      }
      return value;
    };
    return Cache;
  }());
  function quote(value) {
    if (inspect) {
      return inspect(value);
    } else if (value.indexOf("'") === -1) {
      return "'" + JSON.stringify(value).slice(1, -1) + "'";
    } else {
      return JSON.stringify(value);
    }
  }
  function unique(items) {
    var _arr, _i, _len, item, result;
    result = [];
    for (_arr = __toArray(items), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      item = _arr[_i];
      if (!__in(item, result)) {
        result.push(item);
      }
    }
    return result;
  }
  function findPackageJson(dir) {
    var filepath, parent;
    filepath = path.join(dir, "package.json");
    if (fs.existsSync(filepath)) {
      return filepath;
    } else {
      parent = path.normalize(path.join(dir, ".."));
      if (parent !== dir) {
        return findPackageJson(parent);
      }
    }
  }
  function getPackageVersion(filename) {
    var packageJsonFilename, version;
    if (typeof filename !== "string" || !fs || !path) {
      return "";
    }
    try {
      packageJsonFilename = findPackageJson(path.dirname(filename));
    } catch (e) {}
    if (!packageJsonFilename) {
      return "";
    }
    try {
      version = JSON.parse(fs.readFileSync(packageJsonFilename)).version;
    } catch (e) {}
    if (typeof version === "string") {
      return version;
    } else {
      return "";
    }
  }
  isPrimordial = (function () {
    var PRIMORDIAL_GLOBALS;
    PRIMORDIAL_GLOBALS = {
      Object: true,
      String: true,
      Number: true,
      Boolean: true,
      Function: true,
      Array: true,
      Math: true,
      JSON: true,
      Date: true,
      RegExp: true,
      Error: true,
      RangeError: true,
      ReferenceError: true,
      SyntaxError: true,
      TypeError: true,
      URIError: true,
      escape: true,
      unescape: true,
      parseInt: true,
      parseFloat: true,
      isNaN: true,
      isFinite: true,
      decodeURI: true,
      decodeURIComponent: true,
      encodeURI: true,
      encodeURIComponent: true
    };
    return function (name) {
      return __owns.call(PRIMORDIAL_GLOBALS, name);
    };
  }());
  function fsExistsPromise(path) {
    return new Promise(function (fulfill) {
      return fs.exists(path, fulfill);
    });
  }
  mkdirp = __generatorToPromise(function *(dirpath, mode) {
    var _arr, _i, _len, acc, current, exists, part;
    if (mode == null) {
      mode = 511 & ~+process.umask();
    }
    if (dirpath.charAt(0) === "/") {
      acc = "/";
    } else {
      acc = "";
    }
    for (_arr = __toArray(dirpath.split(/[\/\\]/g)), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      part = _arr[_i];
      current = path.resolve(path.join(acc, part));
      exists = yield fsExistsPromise(current);
      if (!exists) {
        try {
          yield __toPromise(fs.mkdir, fs, [current, mode]);
        } catch (e) {
          throw new Error("Unable to create directory '" + current + "' (Error code: " + e.code + ")");
        }
      }
      acc = current;
    }
  });
  writeFileWithMkdirp = __generatorToPromise(function *(filepath, text, encoding) {
    yield mkdirp(path.dirname(filepath));
    yield __toPromise(fs.writeFile, fs, [filepath, text, encoding]);
  });
  exports.stringRepeat = stringRepeat;
  exports.padLeft = padLeft;
  exports.padRight = padRight;
  exports.Cache = Cache;
  exports.quote = quote;
  exports.unique = unique;
  exports.getPackageVersion = getPackageVersion;
  exports.isPrimordial = isPrimordial;
  exports.mkdirp = mkdirp;
  exports.writeFileWithMkdirp = writeFileWithMkdirp;
}.call(this));
