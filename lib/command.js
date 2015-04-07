(function () {
  "use strict";
  var __create, __delay, __generatorToPromise, __import, __isArray, __owns,
      __slice, __toArray, __toPromise, __typeof, _once, child_process, fs,
      gorilla, path, util;
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
    };
  __delay = function (milliseconds, value) {
    if (typeof milliseconds !== "number") {
      throw new TypeError("Expected milliseconds to be a Number, got " + __typeof(milliseconds));
    }
    return new Promise(function (fulfill, reject) {
      if (milliseconds <= 0) {
        return fulfill(value);
      } else {
        return setTimeout(
          function () {
            fulfill(value);
          },
          milliseconds
        );
      }
    });
  };
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
  __import = function (dest, source) {
    var k;
    for (k in source) {
      if (__owns.call(source, k)) {
        dest[k] = source[k];
      }
    }
    return dest;
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
  gorilla = require("./gorilla");
  util = require("util");
  fs = require("fs");
  path = require("path");
  child_process = require("child_process");
  child_process.exec("which gjs", (_once = false, function (err, whichGjsStdout, whichGjsStderr) {
    var argv, filenames, hasGjs, main, optimist;
    if (_once) {
      throw new Error("Attempted to call function more than once");
    } else {
      _once = true;
    }
    hasGjs = err == null && whichGjsStdout.length && !whichGjsStderr.length;
    optimist = require("optimist").usage("$0 [OPTIONS] path/to/script.gs", {
      help: { boolean: true, desc: "Show this help screen" },
      v: { alias: "version", boolean: true, desc: "GorillaScript v" + gorilla.version },
      a: {
        alias: "ast",
        boolean: true,
        desc: "Display JavaScript AST nodes instead of compilation"
      },
      b: { alias: "bare", boolean: true, desc: "Compile without safety top-level closure wrapper" },
      c: { alias: "compile", boolean: true, desc: "Compile to JavaScript and save as .js files" },
      o: { alias: "output", string: true, desc: "Set the file/directory for compiled JavaScript" },
      i: { alias: "interactive", boolean: true, desc: "Run interactively with the REPL" },
      n: {
        alias: "parse",
        boolean: true,
        desc: "Display GorillaScript parser nodes instead of compilation"
      },
      p: { alias: "stdout", boolean: true, desc: "Print the compiled JavaScript to stdout" },
      s: { alias: "stdin", boolean: true, desc: "Listen for and compile GorillaScript from stdin" },
      e: { alias: "eval", string: true, desc: "Compile and a string from command line" },
      u: { alias: "uglify", boolean: true, desc: "Uglify compiled code with UglifyJS2" },
      minify: { boolean: true, desc: "Minimize the use of unnecessary whitespace" },
      m: { alias: "map", string: true, desc: "Build a SourceMap" },
      "source-root": {
        string: true,
        desc: "Specify a sourceRoot in a SourceMap, defaults to ''"
      },
      j: {
        alias: "join",
        boolean: true,
        desc: "Join all the generated JavaScript into a single file"
      },
      "no-prelude": { boolean: true, desc: "Do not include the standard prelude" },
      w: { alias: "watch", boolean: true, desc: "Watch for changes and compile as-needed" },
      options: { string: true, desc: "a JSON object of options to pass into the compiler" },
      coverage: { boolean: true, desc: "Instrument with _$jscoverage support" }
    });
    if (hasGjs) {
      optimist.option("gjs", { boolean: true, desc: "Run with gjs" });
    }
    optimist.check(function (argv) {
      function exclusive() {
        var _i, _len, found, opt, opts;
        opts = __slice.call(arguments);
        found = null;
        for (_i = 0, _len = opts.length; _i < _len; ++_i) {
          opt = opts[_i];
          if (opt === "_") {
            if (argv._.length) {
              if (!found) {
                found = "filenames";
              } else {
                throw "Cannot specify both " + found + " and filenames";
              }
            }
          } else if (argv[opt]) {
            if (!found) {
              found = "--" + opt;
            } else {
              throw "Cannot specify both " + found + " and --" + opt;
            }
          }
        }
      }
      function depend(mainOpt) {
        var _i, _len, opt, opts;
        opts = __slice.call(arguments, 1);
        if (argv[mainOpt]) {
          for (_i = 0, _len = opts.length; _i < _len; ++_i) {
            opt = opts[_i];
            if (!argv[opt]) {
              throw "Must specify --" + opt + " if specifying --" + mainOpt;
            }
          }
        }
      }
      exclusive("ast", "compile", "nodes", "stdout");
      exclusive("nodes", "cov");
      depend("output", "compile");
      depend("map", "output");
      depend("source-root", "map");
      depend("compile", "_");
      exclusive("interactive", "_", "stdin", "eval");
      depend("watch", "compile");
      depend("join", "output");
      if (argv.watch) {
        if (argv.join) {
          throw "TODO: --watch with --join";
        }
        if (argv.map) {
          throw "TODO: --watch with --map";
        }
      }
      if (argv._.length > 1 && argv.map && !argv.join) {
        throw "Cannot specify --map with multiple files unless using --join";
      }
      if (argv.map && typeof argv.map !== "string") {
        throw "Must specify a filename with --map";
      }
      if (argv.options) {
        try {
          if (typeof JSON.parse(argv.options) !== "object" || JSON.parse(argv.options) === null) {
            throw "Expected --options to provide an object";
          }
        } catch (e) {
          if (e instanceof SyntaxError) {
            throw "Unable to parse options: " + e.message;
          } else {
            throw e;
          }
        }
      }
    });
    argv = optimist.argv;
    function readStdin() {
      var buffer, defer;
      defer = __defer();
      buffer = "";
      process.stdin.on("data", function (chunk) {
        return buffer += chunk.toString();
      });
      process.stdin.on("end", function () {
        return defer.fulfill(buffer);
      });
      process.stdin.resume();
      return defer.promise;
    }
    filenames = argv._;
    main = __generatorToPromise(function *() {
      var _arr, _arr2, _i, _len, _ref, _time, baseFilenames, code, compileTime,
          filename, handleCode, handleQueue, i, input, item, newArgv, options,
          replOpts, watchFile, watchQueue;
      if (argv.help) {
        return optimist.showHelp(console.log);
      }
      if (argv.version) {
        return console.log("GorillaScript v" + gorilla.version);
      }
      options = {};
      if (argv.options) {
        __import(options, JSON.parse(argv.options));
      }
      if (argv.uglify) {
        options.undefinedName = "undefined";
        options.uglify = true;
      }
      if (argv.minify) {
        options.minify = true;
      }
      if (argv.bare) {
        options.bare = true;
      }
      if (argv.coverage) {
        options.coverage = true;
      }
      if (argv["no-prelude"]) {
        options.noPrelude = true;
      } else {
        yield gorilla.init();
      }
      if (argv.interactive || !filenames.length && !argv.stdin && !argv["eval"]) {
        replOpts = { stdout: argv.stdout, parse: argv.parse, ast: argv.ast };
        if (argv.gjs) {
          replOpts.pipe = "gjs";
        }
        return require("./repl").start(replOpts);
      }
      if (argv.stdout) {
        options.writer = function (text) {
          return process.stdout.write(text);
        };
      }
      handleCode = __generatorToPromise(function *(code) {
        var ast, compiled, evaled, gjs, nodes, result;
        if (argv.ast) {
          ast = yield gorilla.ast(code, options);
          result = util.inspect(ast.node, false, null);
        } else if (argv.parse) {
          nodes = yield gorilla.parse(code, options);
          result = util.inspect(nodes.result, false, null);
        } else if (argv.stdout) {
          compiled = yield gorilla.compile(code, options);
          if (options.uglify) {
            process.stdout.write("\n");
          }
          result = compiled.code;
        } else if (argv.gjs) {
          compiled = yield gorilla.compile(code, __import({ "eval": true }, options));
          console.log("running with gjs");
          gjs = child_process.spawn("gjs");
          gjs.stdout.on("data", function (data) {
            return process.stdout.write(data);
          });
          gjs.stderr.on("data", function (data) {
            return process.stderr.write(data);
          });
          gjs.stdin.write(compiled.code);
          yield __delay(50);
          gjs.stdin.end();
          result = "";
        } else if (argv["eval"]) {
          evaled = yield gorilla["eval"](code, options);
          result = util.inspect(evaled, false, null);
        } else {
          yield gorilla.run(code, options);
          result = "";
        }
        if (result !== "") {
          process.stdout.write(result);
          return process.stdout.write("\n");
        }
      });
      if (argv["embedded-generator"]) {
        options.embeddedGenerator = true;
        argv.embedded = true;
      }
      if (argv.embedded) {
        options.embedded = true;
        options.noindent = true;
      }
      if (argv["eval"] != null) {
        return yield handleCode(String(argv["eval"]));
      }
      if (argv.stdin) {
        code = yield readStdin();
        return yield handleCode(String(code));
      }
      if (!filenames.length) {
        throw new Error("Expected at least one filename by this point");
      }
      if (!argv.compile) {
        input = yield __toPromise(fs.readFile, fs, [filenames[0]]);
        options.filename = filenames[0];
        newArgv = ["gorilla"];
        for (_arr = __toArray(process.argv), i = 0, _len = _arr.length; i < _len; ++i) {
          item = _arr[i];
          if (item === filenames[0]) {
            newArgv.push.apply(newArgv, __toArray(__slice.call(process.argv, i)));
            break;
          }
        }
        process.argv = newArgv;
        return yield handleCode(String(input));
      }
      if (argv.map) {
        options.sourceMap = { file: argv.map, sourceRoot: argv["source-root"] || "" };
      }
      function getJsOutputPath(filename) {
        var baseDir, dir;
        if (argv.output && filenames.length === 1) {
          return argv.output;
        } else {
          baseDir = path.dirname(filename);
          if (argv.output) {
            dir = path.join(argv.output, baseDir);
          } else {
            dir = baseDir;
          }
          return path.join(dir, path.basename(filename, path.extname(filename)) + ".js");
        }
      }
      if (filenames.length > 1 && argv.join) {
        _arr = [];
        for (_arr2 = __toArray(filenames), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
          filename = _arr2[_i];
          _arr.push(path.basename(filename));
        }
        baseFilenames = _arr;
        process.stdout.write("Compiling " + baseFilenames.join(", ") + " ... ");
        _time = new Date().getTime();
        yield gorilla.compileFile((_ref = __import({}, options), _ref.input = filenames, _ref.output = argv.output, _ref));
        compileTime = new Date().getTime() - _time;
        process.stdout.write((compileTime / 1000).toFixed(3) + " seconds\n");
      } else {
        for (_arr = __toArray(filenames), _i = 0, _len = _arr.length; _i < _len; ++_i) {
          filename = _arr[_i];
          process.stdout.write("Compiling " + path.basename(filename) + " ... ");
          _time = new Date().getTime();
          yield gorilla.compileFile((_ref = __import({}, options), _ref.input = filename, _ref.output = getJsOutputPath(filename), _ref));
          compileTime = new Date().getTime() - _time;
          process.stdout.write((compileTime / 1000).toFixed(3) + " seconds\n");
        }
      }
      if (argv.watch) {
        watchQueue = __create(null);
        handleQueue = (function () {
          var inHandle;
          inHandle = false;
          return function () {
            var bestName, lowestTime, name, time;
            if (inHandle) {
              return;
            }
            lowestTime = new Date().getTime() - 1000;
            for (name in watchQueue) {
              if (__owns.call(watchQueue, name)) {
                time = watchQueue[name];
                if (time < lowestTime) {
                  lowestTime = time;
                  bestName = name;
                }
              }
            }
            if (bestName != null) {
              delete watchQueue[bestName];
              inHandle = true;
              return __generatorToPromise(function *() {
                var _ref, _time, compileTime;
                try {
                  process.stdout.write("Compiling " + path.basename(bestName) + " ... ");
                  _time = new Date().getTime();
                  yield gorilla.compileFile((_ref = __import({}, options), _ref.input = bestName, _ref.output = getJsOutputPath(bestName), _ref));
                  compileTime = new Date().getTime() - _time;
                  process.stdout.write((compileTime / 1000).toFixed(3) + " seconds\n");
                } catch (e) {
                  console.error(typeof e !== "undefined" && e !== null && e.stack || e);
                }
                inHandle = false;
                return handleQueue();
              })();
            }
          };
        }());
        watchFile = function (filename) {
          var watcher;
          watcher = fs.watch(filename, function (event, name) {
            if (name == null) {
              name = filename;
            }
            watchQueue[name] = new Date().getTime();
            watcher.close();
            setTimeout(
              function () {
                return watchFile(filename);
              },
              50
            );
          });
          watcher.on("error", function (e) {
            return console.error(e != null && e.stack || e);
          });
        };
        for (_arr = __toArray(filenames), _i = 0, _len = _arr.length; _i < _len; ++_i) {
          filename = _arr[_i];
          watchFile(filename);
        }
        setInterval(handleQueue, 17);
        return console.log("Watching " + filenames.join(", ") + "...");
      }
    })();
    return main.then(null, function (e) {
      console.error(e != null && e.stack || e);
      return process.exit(1);
    });
  }));
}.call(this));
