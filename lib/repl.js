(function (GLOBAL) {
  "use strict";
  var __cmp, __generatorToPromise, __in, __isArray, __owns, __slice, __toArray,
      __typeof, _i, backlog, child_process, enableColors, g, gorilla, module,
      nonContextGlobals, readline, sandbox, stdin, stdout, toGsIdent, toJsIdent,
      util, vm;
  __cmp = function (left, right) {
    var type;
    if (left === right) {
      return 0;
    } else {
      type = typeof left;
      if (type !== "number" && type !== "string") {
        throw new TypeError("Cannot compare a non-number/string: " + type);
      } else if (type !== typeof right) {
        throw new TypeError("Cannot compare elements of different types: " + type + " vs " + typeof right);
      } else if (left < right) {
        return -1;
      } else {
        return 1;
      }
    }
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
  readline = require("readline");
  util = require("util");
  vm = require("vm");
  module = require("module");
  child_process = require("child_process");
  enableColors = process.platform !== "win32" && !process.env.NODE_DISABLE_COLORS;
  stdin = process.openStdin();
  stdout = process.stdout;
  function error(err) {
    return process.stderr.write((err.stack || err.toString()) + "\n\n");
  }
  backlog = "";
  sandbox = vm.createContext();
  nonContextGlobals = [
    "Buffer",
    "console",
    "process",
    "setInterval",
    "clearInterval",
    "setTimeout",
    "clearTimeout"
  ];
  for (_i = nonContextGlobals.length; _i--; ) {
    g = nonContextGlobals[_i];
    sandbox[g] = GLOBAL[g];
  }
  sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
  sandbox._ = void 0;
  function unique(array) {
    var _arr, _i, _len, item, result;
    result = [];
    for (_arr = __toArray(array), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      item = _arr[_i];
      if (!__in(item, result)) {
        result.push(item);
      }
    }
    return result;
  }
  function getAllPropertyNames(obj) {
    var current, result;
    result = [];
    if (obj == null) {
      return result;
    }
    current = Object(obj);
    while (current != null) {
      result.push.apply(result, Object.getOwnPropertyNames(current));
      current = Object.getPrototypeOf(current);
    }
    return unique(result);
  }
  function memoize(func) {
    var cache;
    cache = {};
    return function (name) {
      if (__owns.call(cache, name)) {
        return cache[name];
      } else {
        return cache[name] = func(name);
      }
    };
  }
  toJsIdent = memoize(function (name) {
    var _end, i, part, parts;
    parts = name.split("-");
    for (i = 1, _end = parts.length; i < _end; ++i) {
      part = parts[i];
      parts[i] = "" + part.charAt(0).toUpperCase() + part.substring(1);
    }
    return parts.join("");
  });
  toGsIdent = memoize(function (name) {
    var _end, i, lower, parts, result, upper;
    if (name.match(/^[A-Z]/) || !name.match(/[A-Z]/)) {
      return name;
    } else if (name === "isNaN") {
      return "is-NaN";
    } else {
      parts = name.split(/([A-Z]+)/);
      if (parts.length === 1) {
        return parts[0];
      } else {
        result = [parts[0]];
        for (i = 1, _end = parts.length; i < _end; i += 2) {
          upper = parts[i];
          lower = parts[i + 1];
          if (lower.length > 0) {
            if (upper.length > 1) {
              result.push(upper.substring(0, upper.length - 1));
            }
            result.push("" + upper.charAt(upper.length - 1).toLowerCase() + lower);
          } else if (upper.length > 0) {
            result.push(upper);
          }
        }
        return result.join("-");
      }
    }
  });
  function arrayToGsIdents(names) {
    var _arr, _i, _len, name;
    _arr = [];
    for (_i = 0, _len = names.length; _i < _len; ++_i) {
      name = names[_i];
      _arr.push(toGsIdent(name));
    }
    return _arr;
  }
  function autoComplete(text) {
    return completeAttribute(text) || completeVariable(text) || [[], text];
  }
  function completeSegment(prefix, possibilities) {
    var completions;
    completions = unique(getCompletions(prefix, arrayToGsIdents(possibilities))).sort(function (a, b) {
      return __cmp(a.toLowerCase(), b.toLowerCase());
    });
    return [completions, prefix];
  }
  function completeAttribute(text) {
    var all, match, obj, prefix, val;
    match = text.match(/\s*([\w\-\.]+)(?:\.([\w\-]*))$/);
    if (match) {
      all = match[0];
      obj = match[1];
      prefix = match[2];
      try {
        val = vm.runInContext(toJsIdent(obj), sandbox);
      } catch (err) {
        return;
      }
      return completeSegment(prefix, getAllPropertyNames(val));
    }
  }
  function completeVariable(text) {
    var _ref, free, globalThis;
    if ((_ref = text.match(/\s*([\w\-]*)$/)) != null) {
      free = _ref[1];
    }
    if (free) {
      try {
        globalThis = vm.runInContext("this", sandbox);
      } catch (err) {
        globalThis = void 0;
      }
      return completeSegment(free, getAllPropertyNames(globalThis).concat(getAllPropertyNames(sandbox), __toArray(gorilla.getReservedWords())));
    }
  }
  function startsWith(source, check) {
    var checkLength;
    checkLength = check.length;
    if (source.length < checkLength) {
      return false;
    } else if (checkLength === 0) {
      return true;
    } else {
      return source.lastIndexOf(check, 0) === 0;
    }
  }
  function getCompletions(prefix, candidates) {
    var _arr, _arr2, _i, _len, e;
    _arr = [];
    for (_arr2 = __toArray(candidates), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
      e = _arr2[_i];
      if (startsWith(e, prefix)) {
        _arr.push(e);
      }
    }
    return _arr;
  }
  exports.start = function (options) {
    var pipe, pipeBacklog, recentSigint, repl;
    if (options == null) {
      options = {};
    }
    process.on("uncaughtException", error);
    if (readline.createInterface.length < 3) {
      stdin.on("data", function (buffer) {
        return repl.write(buffer);
      });
      repl = readline.createInterface(stdin, autoComplete);
    } else {
      repl = readline.createInterface(stdin, stdout, autoComplete);
    }
    if (options.pipe) {
      pipe = child_process.spawn(options.pipe);
      pipeBacklog = "";
      pipe.stdout.on("data", function (data) {
        var line, match;
        pipeBacklog += data.toString();
        while (true) {
          match = pipeBacklog.match(/^[^\n]*\n/);
          if (!match) {
            break;
          }
          line = match[0];
          pipeBacklog = pipeBacklog.substring(line.length);
          if (/^(?:\u001b.*?h)?\w*?> /.test(line)) {
            setTimeout(
              function () {
                return repl.prompt();
              },
              50
            );
          } else if (!/^(?:\u001b.*?h)?\.+ /.test(line)) {
            process.stdout.write(line);
          }
        }
      });
      pipe.stderr.on("data", function (data) {
        return process.stderr.write(data);
      });
    }
    recentSigint = false;
    repl.on("SIGINT", function () {
      if (backlog) {
        backlog = "";
        process.stdout.write("\n");
        repl.setPrompt("gs> ");
        repl.prompt();
        return repl.write(null, { ctrl: true, name: "u" });
      } else if (!recentSigint) {
        process.stdout.write("\n(^C again to quit)\n");
        repl.setPrompt("gs> ");
        repl.prompt();
        repl.write(null, { ctrl: true, name: "u" });
        return recentSigint = true;
      } else {
        repl.close();
        if (pipe != null) {
          return pipe.kill();
        }
      }
    });
    repl.on("close", function () {
      process.stdout.write("\n");
      return stdin.destroy();
    });
    repl.on("line", function (buffer) {
      var code, p;
      recentSigint = false;
      if (!buffer.toString().trim() && !backlog) {
        repl.prompt();
        return;
      }
      backlog += buffer;
      if (backlog.charAt(backlog.length - 1) === "\\") {
        backlog = backlog.substring(0, backlog.length - 1) + "\n";
        repl.setPrompt("..> ");
        repl.prompt();
        return;
      }
      repl.setPrompt("gs> ");
      code = backlog;
      backlog = "";
      if (pipe) {
        p = __generatorToPromise(function *() {
          var compiled;
          compiled = yield gorilla.compile(code, { "eval": true, filename: "repl", modulename: "repl" });
          return pipe.stdin.write(compiled.code);
        })();
      } else if (options.stdout) {
        p = __generatorToPromise(function *() {
          var compiled;
          compiled = yield gorilla.compile(code, { bare: true, "return": true, filename: "repl", modulename: "repl" });
          process.stdout.write(compiled.code + "\n");
          return repl.prompt();
        })();
      } else if (options.ast) {
        p = __generatorToPromise(function *() {
          var ret;
          ret = yield gorilla.ast(code, { sandbox: sandbox, filename: "repl", modulename: "repl" });
          process.stdout.write(util.inspect(ret.node, false, 2, enableColors) + "\n");
          return repl.prompt();
        })();
      } else if (options.parse) {
        p = __generatorToPromise(function *() {
          var ret;
          ret = yield gorilla.parse(code, { sandbox: sandbox, filename: "repl", modulename: "repl" });
          process.stdout.write(util.inspect(ret.result, false, 2, enableColors) + "\n");
          return repl.prompt();
        })();
      } else {
        p = __generatorToPromise(function *() {
          var ret;
          ret = yield gorilla["eval"](code, { sandbox: sandbox, filename: "repl", modulename: "repl" });
          if (ret !== void 0) {
            process.stdout.write(util.inspect(ret, false, 2, enableColors) + "\n");
          }
          return repl.prompt();
        })();
      }
      return p.then(null, function (err) {
        process.stderr.write(String(err != null && err.stack || err) + "\n");
        return repl.prompt();
      });
    });
    repl.setPrompt("gs> ");
    return repl.prompt();
  };
}.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
