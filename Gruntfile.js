(function () {
  "use strict";
  var __generatorToPromise, __isArray, __num, __slice, __strnum, __toArray,
      __toPromise, __typeof, fs, path;
  __generatorToPromise = function (func) {
    return function () {
      var iter;
      iter = func.apply(this, arguments);
      return new Promise(function (fulfill, reject) {
        function next(result, handler) {
          var info;
          if (handler == null) {
            handler = "next";
          }
          try {
            info = iter[handler](result);
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
                return next(e, "throw");
              }
            );
          } else {
            return next(info.value);
          }
        }
        return next();
      });
    };
  };
  __isArray = typeof Array.isArray === "function" ? Array.isArray
    : (function (_toString) {
      return function (x) {
        return _toString.call(x) === "[object Array]";
      };
    }(Object.prototype.toString));
  __num = function (num) {
    if (typeof num !== "number") {
      throw new TypeError("Expected a number, got " + __typeof(num));
    } else {
      return num;
    }
  };
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
      promise = __generatorToPromise(function *() {
        var _arr, _i, _len, code, file, filenamePath, gorilla, libPath, parts,
            serializedPrelude, text;
        filenamePath = yield __toPromise(fs.realpath, fs, [__filename]);
        libPath = path.join(path.dirname(filenamePath), "lib");
        parts = [];
        for (_arr = [
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
        ], _i = 0, _len = _arr.length; _i < _len; ++_i) {
          file = _arr[_i];
          text = yield __toPromise(fs.readFile, fs, [
            path.join(libPath, __strnum(file) + ".js"),
            "utf8"
          ]);
          parts.push("require['./" + __strnum(file) + "'] = function () {\n  var module = { exports: this };\n  var exports = this;\n  " + __strnum(text.split("\n").join("\n  ")) + "\n  return module.exports;\n};");
        }
        gorilla = require("./lib/gorilla.js");
        serializedPrelude = yield gorilla.getSerializedPrelude();
        code = ';(function (root) {\n  "use strict";\n  var GorillaScript = (function (realRequire) {\n    function require(path) {\n      var has = Object.prototype.hasOwnProperty;\n      if (has.call(require._cache, path)) {\n        return require._cache[path];\n      } else if (has.call(require, path)) {\n        var func = require[path];\n        delete require[path];\n        return require._cache[path] = func.call({});\n      } else if (realRequire) {\n        return realRequire(path);\n      }\n    }\n    require._cache = {};\n    ' + parts.join("\n").split("\n").join("\n    ") + '\n\n    require("./browser");\n    return require("./gorilla").withPrelude(' + __strnum(serializedPrelude.split("\n").join("\n    ")) + ');\n  }(typeof module !== "undefined" && typeof require === "function" ? require : void 0));\n\n  if (typeof define === "function" && define.amd) {\n    define(function () { return GorillaScript; });\n  } else {\n    root.GorillaScript = GorillaScript;\n  }\n}(this));';
        grunt.file.write("extras/gorillascript.js", code);
        return grunt.log.writeln('File "extras/gorillascript.js" created.');
      })();
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
    grunt.registerTask("test", function () {
      if (__num(this.args.length) > 0) {
        grunt.config("gorilla.test.files.0.src", this.args.map(function (arg) {
          return "**/" + __strnum(arg) + ".gs";
        }));
      }
      return grunt.task.run(["clean:test", "gorilla:test", "mochaTest:test"]);
    });
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
}.call(this));
