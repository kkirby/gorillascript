(function (GLOBAL) {
  "use strict";
  var __defer, __generatorToPromise, __isArray, __slice, __strnum, __toArray,
      __toPromise, __typeof, fs, path, setImmediate;
  __defer = (function () {
    function __defer() {
      var deferred, isError, value;
      isError = false;
      value = null;
      deferred = [];
      function complete(newIsError, newValue) {
        var funcs;
        if (deferred) {
          funcs = deferred;
          deferred = null;
          isError = newIsError;
          value = newValue;
          if (funcs.length) {
            setImmediate(function () {
              var _end, i;
              for (i = 0, _end = funcs.length; i < _end; ++i) {
                funcs[i]();
              }
            });
          }
        }
      }
      return {
        promise: {
          then: function (onFulfilled, onRejected, allowSync) {
            var _ref, fulfill, promise, reject;
            if (allowSync !== true) {
              allowSync = void 0;
            }
            _ref = __defer();
            promise = _ref.promise;
            fulfill = _ref.fulfill;
            reject = _ref.reject;
            _ref = null;
            function step() {
              var f, result;
              try {
                if (isError) {
                  f = onRejected;
                } else {
                  f = onFulfilled;
                }
                if (typeof f === "function") {
                  result = f(value);
                  if (result && typeof result.then === "function") {
                    result.then(fulfill, reject, allowSync);
                  } else {
                    fulfill(result);
                  }
                } else {
                  (isError ? reject : fulfill)(value);
                }
              } catch (e) {
                reject(e);
              }
            }
            if (deferred) {
              deferred.push(step);
            } else if (allowSync) {
              step();
            } else {
              setImmediate(step);
            }
            return promise;
          },
          sync: function () {
            var result, state;
            state = 0;
            result = 0;
            this.then(
              function (ret) {
                state = 1;
                result = ret;
              },
              function (err) {
                state = 2;
                result = err;
              },
              true
            );
            switch (state) {
            case 0: throw new Error("Promise did not execute synchronously");
            case 1: return result;
            case 2: throw result;
            default: throw new Error("Unknown state");
            }
          }
        },
        fulfill: function (value) {
          complete(false, value);
        },
        reject: function (reason) {
          complete(true, reason);
        }
      };
    }
    __defer.fulfilled = function (value) {
      var d;
      d = __defer();
      d.fulfill(value);
      return d.promise;
    };
    __defer.rejected = function (reason) {
      var d;
      d = __defer();
      d.reject(reason);
      return d.promise;
    };
    return __defer;
  }());
  __generatorToPromise = function (generator, allowSync) {
    if (typeof generator !== "object" || generator === null) {
      throw new TypeError("Expected generator to be an Object, got " + __typeof(generator));
    } else {
      if (typeof generator.send !== "function") {
        throw new TypeError("Expected generator.send to be a Function, got " + __typeof(generator.send));
      }
      if (typeof generator["throw"] !== "function") {
        throw new TypeError("Expected generator.throw to be a Function, got " + __typeof(generator["throw"]));
      }
    }
    if (allowSync == null) {
      allowSync = false;
    } else if (typeof allowSync !== "boolean") {
      throw new TypeError("Expected allowSync to be a Boolean, got " + __typeof(allowSync));
    }
    function continuer(verb, arg) {
      var item;
      try {
        item = generator[verb](arg);
      } catch (e) {
        return __defer.rejected(e);
      }
      if (item.done) {
        return __defer.fulfilled(item.value);
      } else {
        return item.value.then(callback, errback, allowSync);
      }
    }
    function callback(value) {
      return continuer("send", value);
    }
    function errback(value) {
      return continuer("throw", value);
    }
    return callback(void 0);
  };
  __isArray = typeof Array.isArray === "function" ? Array.isArray
    : (function (_toString) {
      return function (x) {
        return _toString.call(x) === "[object Array]";
      };
    }(Object.prototype.toString));
  __slice = Array.prototype.slice;
  __strnum = function (strnum) {
    var type;
    type = typeof strnum;
    if (type === "string") {
      return strnum;
    } else if (type === "number") {
      return String(strnum);
    } else {
      throw new TypeError("Expected a string or number, got " + __typeof(strnum));
    }
  };
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
    var _ref, fulfill, promise, reject;
    if (typeof func !== "function") {
      throw new TypeError("Expected func to be a Function, got " + __typeof(func));
    }
    _ref = __defer();
    promise = _ref.promise;
    reject = _ref.reject;
    fulfill = _ref.fulfill;
    _ref = null;
    func.apply(context, __toArray(args).concat([
      function (err, value) {
        if (err != null) {
          reject(err);
        } else {
          fulfill(value);
        }
      }
    ]));
    return promise;
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
  setImmediate = typeof GLOBAL.setImmediate === "function" ? GLOBAL.setImmediate
    : typeof process !== "undefined" && typeof process.nextTick === "function"
    ? (function (nextTick) {
      return function (func) {
        var args;
        if (typeof func !== "function") {
          throw new TypeError("Expected func to be a Function, got " + __typeof(func));
        }
        args = __slice.call(arguments, 1);
        if (args.length) {
          return nextTick(function () {
            func.apply(void 0, __toArray(args));
          });
        } else {
          return nextTick(func);
        }
      };
    }(process.nextTick))
    : function (func) {
      var args;
      if (typeof func !== "function") {
        throw new TypeError("Expected func to be a Function, got " + __typeof(func));
      }
      args = __slice.call(arguments, 1);
      if (args.length) {
        return setTimeout(
          function () {
            func.apply(void 0, args);
          },
          0
        );
      } else {
        return setTimeout(func, 0);
      }
    };
  path = require("path");
  fs = require("fs");
  module.exports = function (grunt) {
    grunt.initConfig({
      gorilla: {
        build: {
          options: { verbose: true },
          files: [
            {
              expand: true,
              cwd: "src/",
              src: (function () {
                var _arr, _arr2, _i, _len, file;
                _arr = [];
                for (_arr2 = __toArray(fs.readdirSync("./src")), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
                  file = _arr2[_i];
                  if (path.extname(file) === ".gs" && !file.match(/prelude\.gs$/) && file !== "shared.gs") {
                    _arr.push(file);
                  }
                }
                return _arr;
              }()),
              dest: "lib/",
              ext: ".js"
            }
          ]
        },
        "build-cov": {
          options: { verbose: true, coverage: true },
          files: [
            {
              expand: true,
              cwd: "src/",
              src: (function () {
                var _arr, _arr2, _i, _len, file;
                _arr = [];
                for (_arr2 = __toArray(fs.readdirSync("./src")), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
                  file = _arr2[_i];
                  if (path.extname(file) === ".gs" && !file.match(/prelude\.gs$/) && file !== "shared.gs") {
                    _arr.push(file);
                  }
                }
                return _arr;
              }()),
              dest: "lib-cov/",
              ext: ".js"
            }
          ]
        },
        test: {
          options: { verbose: true },
          files: [
            {
              expand: true,
              cwd: "test/",
              src: ["**/*.gs"],
              dest: "test-js/",
              ext: ".js"
            }
          ]
        }
      },
      uglify: { browser: { files: { "extras/gorillascript.min.js": ["extras/gorillascript.js"] } } },
      clean: { test: ["test-js"] },
      mochaTest: {
        test: { options: { timeout: 10000 }, src: ["test-js/**/*.js"] },
        "test-cov": {
          options: { reporter: "html-cov", timeout: 10000, quiet: true },
          src: ["test-js/**/*.js"],
          dest: "coverage.html"
        }
      }
    });
    grunt.loadNpmTasks("grunt-gorilla");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-mocha-test");
    grunt.registerTask("build", ["gorilla:build"]);
    grunt.registerTask("build-cov", ["gorilla:build-cov"]);
    grunt.registerTask("browser", "Build gorillascript.js for use in the browser", function () {
      var _this, done, promise;
      _this = this;
      done = this.async();
      promise = __generatorToPromise((function () {
        var _arr, _e, _i, _len, _send, _state, _step, _throw, code, file,
            filenamePath, gorilla, libPath, parts, serializedPrelude, text;
        _state = 0;
        function _close() {
          _state = 8;
        }
        function _step(_received) {
          while (true) {
            switch (_state) {
            case 0:
              ++_state;
              return {
                done: false,
                value: __toPromise(fs.realpath, fs, [__filename])
              };
            case 1:
              filenamePath = _received;
              libPath = path.join(path.dirname(filenamePath), "lib");
              parts = [];
              _arr = [
                "utils",
                "jsutils",
                "types",
                "jsast",
                "parser",
                "parser-utils",
                "parser-scope",
                "parser-nodes",
                "parser-macroholder",
                "parser-macrocontext",
                "jstranslator",
                "gorilla",
                "browser"
              ];
              _i = 0;
              _len = _arr.length;
              ++_state;
            case 2:
              _state = _i < _len ? 3 : 6;
              break;
            case 3:
              file = _arr[_i];
              ++_state;
              return {
                done: false,
                value: __toPromise(fs.readFile, fs, [
                  path.join(libPath, __strnum(file) + ".js"),
                  "utf8"
                ])
              };
            case 4:
              text = _received;
              parts.push("require['./" + __strnum(file) + "'] = function () {\n  var module = { exports: this };\n  var exports = this;\n  " + __strnum(text.split("\n").join("\n  ")) + "\n  return module.exports;\n};");
              ++_state;
            case 5:
              ++_i;
              _state = 2;
              break;
            case 6:
              gorilla = require("./lib/gorilla");
              ++_state;
              return { done: false, value: gorilla.getSerializedPrelude() };
            case 7:
              serializedPrelude = _received;
              code = ';(function (root) {\n  "use strict";\n  var GorillaScript = (function (realRequire) {\n    function require(path) {\n      var has = Object.prototype.hasOwnProperty;\n      if (has.call(require._cache, path)) {\n        return require._cache[path];\n      } else if (has.call(require, path)) {\n        var func = require[path];\n        delete require[path];\n        return require._cache[path] = func.call({});\n      } else if (realRequire) {\n        return realRequire(path);\n      }\n    }\n    require._cache = {};\n    ' + parts.join("\n").split("\n").join("\n    ") + '\n\n    require("./browser");\n    return require("./gorilla").withPrelude(' + __strnum(serializedPrelude.split("\n").join("\n    ")) + ');\n  }(typeof module !== "undefined" && typeof require === "function" ? require : void 0));\n\n  if (typeof define === "function" && define.amd) {\n    define(function () { return GorillaScript; });\n  } else {\n    root.GorillaScript = GorillaScript;\n  }\n}(this));';
              grunt.file.write("extras/gorillascript.js", code);
              ++_state;
              return { done: true, value: grunt.log.writeln('File "extras/gorillascript.js" created.') };
            case 8:
              return { done: true, value: void 0 };
            default: throw new Error("Unknown state: " + _state);
            }
          }
        }
        function _throw(_e) {
          _close();
          throw _e;
        }
        function _send(_received) {
          try {
            return _step(_received);
          } catch (_e) {
            _throw(_e);
          }
        }
        return {
          close: _close,
          iterator: function () {
            return this;
          },
          next: function () {
            return _send(void 0);
          },
          send: _send,
          "throw": function (_e) {
            _throw(_e);
            return _send(void 0);
          }
        };
      }()));
      return promise.then(
        function () {
          return done();
        },
        function (e) {
          grunt.log.error(e != null && e.stack || e);
          return done(false);
        }
      );
    });
    grunt.registerTask("test", ["clean:test", "gorilla:test", "mochaTest:test"]);
    grunt.registerTask("check-env-cov", "Verify that GORILLA_COV is set", function () {
      if (!process.env.GORILLASCRIPT_COV) {
        grunt.log.error("You must set the GORILLASCRIPT_COV environment variable");
        return false;
      }
    });
    grunt.registerTask("test-cov", ["check-env-cov", "clean:test", "gorilla:test", "mochaTest:test-cov"]);
    grunt.registerTask("default", ["build", "test", "browser"]);
    return grunt.registerTask("full", ["default", "uglify"]);
  };
}.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
