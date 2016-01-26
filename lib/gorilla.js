(function (GLOBAL) {
  "use strict";
  var __import, __isArray, __lte, __num, __owns, __slice, __strnum, __toArray,
      __typeof, ast, fetchAndParsePreludeMacros, fs, init, isAcceptableIdent,
      os, parser, path, real__filename, SourceMap, writeFileWithMkdirp;
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
  __lte = function (x, y) {
    var type;
    type = typeof x;
    if (type !== "number" && type !== "string") {
      throw new TypeError("Cannot compare a non-number/string: " + type);
    } else if (type !== typeof y) {
      throw new TypeError("Cannot compare elements of different types: " + type + " vs " + typeof y);
    } else {
      return x <= y;
    }
  };
  __num = function (num) {
    if (typeof num !== "number") {
      throw new TypeError("Expected a number, got " + __typeof(num));
    } else {
      return num;
    }
  };
  __owns = Object.prototype.hasOwnProperty;
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
  parser = require("./parser");
  ast = require("./jsast");
  os = require("os");
  fs = require("fs");
  path = require("path");
  SourceMap = require("./source-map");
  writeFileWithMkdirp = require("./utils").writeFileWithMkdirp;
  isAcceptableIdent = require("./jsutils").isAcceptableIdent;
  exports.version = "0.10.03";
  exports.ParserError = parser.ParserError;
  exports.MacroError = parser.MacroError;
  if (typeof __filename !== "undefined" && __filename !== null) {
    real__filename = fs.realpathSync(__filename);
  }
  fetchAndParsePreludeMacros = (function () {
    var parsedPreludeMacros, preludeCachePath, preludePromise, preludeSrcPath,
        work;
    if (real__filename != null) {
      preludeSrcPath = path.join(path.dirname(real__filename), "../src/jsprelude.gs");
    }
    if (os != null) {
      preludeCachePath = path.join(os.tmpDir(), "gs-jsprelude-" + __strnum(exports.version) + ".cache");
    }
    work = function () {
      var cachePrelude, errored, parsedPrelude, prelude, preludeCacheStat,
          preludeSrcStat;
      preludeSrcStat = fs.statSync(preludeSrcPath);
      try {
        preludeCacheStat = fs.statSync(preludeCachePath);
      } catch (e) {
        if (e.code !== "ENOENT") {
          throw e;
        }
      }
      if (preludeCacheStat && __lte(preludeSrcStat.mtime.getTime(), preludeCacheStat.mtime.getTime())) {
        cachePrelude = fs.readFileSync(preludeCachePath, "utf8");
        errored = false;
        try {
          parsedPreludeMacros = parser.deserializePrelude(cachePrelude);
        } catch (e) {
          if (e instanceof ReferenceError) {
            throw e;
          } else {
            console.error("Error deserializing prelude, reloading. " + String(e.stack || e));
            errored = true;
          }
        }
        if (errored) {
          fs.unlinkSync(preludeCachePath);
        }
      }
      if (parsedPreludeMacros == null) {
        prelude = fs.readFileSync(preludeSrcPath, "utf8");
        parsedPrelude = parser(prelude, null, { serializeMacros: true, filename: preludeSrcPath });
        parsedPreludeMacros = parsedPrelude.macros;
        writeFileWithMkdirp(preludeCachePath, parsedPreludeMacros.serialize(), "utf8");
      }
      work = null;
      preludePromise = void 0;
      return parsedPreludeMacros;
    };
    function f() {
      if (parsedPreludeMacros != null) {
        return parsedPreludeMacros;
      } else if (preludePromise == null) {
        return preludePromise = work();
      } else {
        return preludePromise;
      }
    }
    exports.getSerializedPrelude = function () {
      f();
      return fs.readFileSync(preludeCachePath, "utf8");
    };
    exports.withPrelude = function (serializedPrelude) {
      if (typeof serializedPrelude !== "function") {
        throw new TypeError("Expected serializedPrelude to be a Function, got " + __typeof(serializedPrelude));
      }
      exports.withPrelude = function () {
        throw new Error("Cannot provide a prelude more than once");
      };
      parsedPreludeMacros = parser.deserializePrelude(serializedPrelude);
      work = null;
      return this;
    };
    return f;
  }());
  exports.parse = function (source, options) {
    var macros, parseOptions;
    if (options == null) {
      options = {};
    }
    if (options.macros) {
      macros = options.macros;
    } else if (options.noPrelude) {
      macros = null;
    } else {
      macros = fetchAndParsePreludeMacros();
    }
    parseOptions = { filename: options.filename, noindent: !!options.noindent, progress: options.progress };
    if (options.embedded) {
      parseOptions.embedded = !!options.embedded;
      parseOptions.embeddedUnpretty = !!options.embeddedUnpretty;
      parseOptions.embeddedGenerator = !!options.embeddedGenerator;
      parseOptions.embeddedOpen = options.embeddedOpen;
      parseOptions.embeddedClose = options.embeddedClose;
      parseOptions.embeddedOpenWrite = options.embeddedOpenWrite;
      parseOptions.embeddedCloseWrite = options.embeddedCloseWrite;
      parseOptions.embeddedOpenComment = options.embeddedOpenComment;
      parseOptions.embeddedCloseComment = options.embeddedCloseComment;
      parseOptions.embeddedOpenLiteral = options.embeddedOpenLiteral;
      parseOptions.embeddedCloseLiteral = options.embeddedCloseLiteral;
    }
    return parser(source, macros, parseOptions);
  };
  exports.getReservedWords = function (options) {
    if (options == null) {
      options = {};
    }
    if (options.noPrelude) {
      return parser.getReservedWords(null, options);
    } else {
      return parser.getReservedWords(fetchAndParsePreludeMacros(true), options);
    }
  };
  function joinParsedResults(results) {
    var _arr, _i, _len, joinedParsed, parsed;
    joinedParsed = {
      parseTime: 0,
      macroExpandTime: 0,
      reduceTime: 0,
      macros: results[0].macros,
      result: []
    };
    for (_arr = __toArray(results), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      parsed = _arr[_i];
      joinedParsed.parseTime += __num(parsed.parseTime);
      joinedParsed.macroExpandTime += __num(parsed.macroExpandTime);
      joinedParsed.reduceTime += __num(parsed.reduceTime);
      joinedParsed.result.push(parsed.result);
    }
    return joinedParsed;
  }
  function handleAstPipe(node, options, fileSources) {
    var coverage, coverageName;
    if (typeof options.astPipe === "function") {
      node = options.astPipe(node, fileSources, ast);
      if (!(node instanceof ast.Root)) {
        throw new Error("Expected astPipe to return a Root, got " + __typeof(node));
      }
    }
    if (options.coverage) {
      coverage = require("./coverage");
      if (typeof options.coverage === "string") {
        if (!isAcceptableIdent(options.coverage)) {
          throw new Error("coverage option must be an acceptable ident. '" + __strnum(options.coverage) + "' is not.");
        }
        coverageName = options.coverage;
      } else {
        coverageName = null;
      }
      node = coverage(node, fileSources, coverageName);
    }
    return node;
  }
  exports.ast = function (source, options) {
    var _arr, _i, _len, array, doneAstPipeTime, fileSources, item, name, node,
        originalProgress, parsed, progressCounts, startAstPipeTime, startTime,
        translated, translator;
    if (options == null) {
      options = {};
    }
    startTime = new Date().getTime();
    if (typeof options.translator === "function") {
      translator = options.translator;
    } else {
      translator = require(typeof options.translator === "string" ? options.translator : "./jstranslator");
    }
    if (__isArray(source)) {
      array = [];
      originalProgress = options.progress;
      progressCounts = { parse: 0, macroExpand: 0, reduce: 0 };
      if (typeof originalProgress === "function") {
        options.progress = function (name, time) {
          return progressCounts[name] = __num(progressCounts[name]) + __num(time);
        };
      }
      for (_arr = __toArray(source), _i = 0, _len = _arr.length; _i < _len; ++_i) {
        item = _arr[_i];
        if (__isArray(options.filenames)) {
          options.filename = options.filenames[i];
        }
        array.push(exports.parse(item, options));
      }
      options.progress = originalProgress;
      if (typeof originalProgress === "function") {
        for (_arr = ["parse", "macroExpand", "reduce"], _i = 0, _len = _arr.length; _i < _len; ++_i) {
          name = _arr[_i];
          options.progress(name, progressCounts[name]);
        }
      }
      parsed = joinParsedResults(array);
    } else {
      parsed = exports.parse(source, options);
    }
    translated = translator(parsed.result, parsed.macros, parsed.getPosition, options);
    fileSources = {};
    if (options.filename) {
      fileSources[options.filename] = source;
    }
    startAstPipeTime = new Date().getTime();
    node = handleAstPipe(translated.node, options, fileSources);
    doneAstPipeTime = new Date().getTime();
    return {
      node: node,
      parseTime: parsed.parseTime,
      macroExpandTime: parsed.macroExpandTime,
      reduceTime: parsed.reduceTime,
      translateTime: translated.time,
      astPipeTime: doneAstPipeTime - startAstPipeTime,
      time: doneAstPipeTime - startTime
    };
  };
  exports.compile = function (source, options) {
    var compiled, node, startTime, translated;
    if (options == null) {
      options = {};
    }
    startTime = new Date().getTime();
    translated = exports.ast(source, options);
    node = translated.node;
    compiled = node.compile(options);
    return {
      parseTime: translated.parseTime,
      macroExpandTime: translated.macroExpandTime,
      reduceTime: translated.reduceTime,
      translateTime: translated.translateTime,
      compileTime: compiled.compileTime,
      uglifyTime: compiled.uglifyTime,
      time: new Date().getTime() - startTime,
      code: compiled.code
    };
  };
  exports.compileFile = function (options) {
    var _arr, _arr2, _i, _len, code, compiled, fileSources, footer, i, input,
        inputs, linefeed, name, node, originalProgress, output, parsed,
        progressCounts, source, sourceMapFile, sources, startParseTime,
        translated, translator;
    if (options == null) {
      options = {};
    }
    options = __import({}, options);
    inputs = options.input;
    if (typeof inputs === "string") {
      inputs = [inputs];
    } else if (!__isArray(inputs)) {
      throw new Error("Expected options.input to be a string or array of strings");
    } else if (inputs.length === 0) {
      throw new Error("Expected options.input to not be empty");
    }
    output = options.output;
    if (typeof output !== "string") {
      throw new Error("Expected options.output to be a string, got " + __typeof(output));
    }
    if (!options.sourceMap) {
      options.sourceMap = null;
    } else if (typeof options.sourceMap === "string") {
      sourceMapFile = options.sourceMap;
      options.sourceMap = SourceMap(sourceMapFile, options.output, "");
    } else {
      if (typeof options.sourceMap.file !== "string") {
        throw new Error("Expected options.sourceMap.file to be a string, got " + __typeof(options.sourceMap.file));
      }
      if (typeof options.sourceMap.sourceRoot !== "string") {
        throw new Error("Expected options.sourceMap.sourceRoot to be a string, got " + __typeof(options.sourceMap.sourceRoot));
      }
      sourceMapFile = options.sourceMap.file;
      options.sourceMap = SourceMap(sourceMapFile, options.output, options.sourceMap.sourceRoot);
    }
    _arr = [];
    for (_arr2 = __toArray(inputs), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
      input = _arr2[_i];
      _arr.push(fs.readFileSync(input, "utf8"));
    }
    sources = _arr;
    originalProgress = sources.length > 0 && options.progress;
    progressCounts = { parse: 0, macroExpand: 0, reduce: 0 };
    if (typeof originalProgress === "function") {
      options.progress = function (name, time) {
        return progressCounts[name] = __num(progressCounts[name]) + __num(time);
      };
    }
    _arr = [];
    for (i = 0, _len = sources.length; i < _len; ++i) {
      source = sources[i];
      startParseTime = Date.now();
      options.filename = inputs[i];
      _arr.push(exports.parse(source, options));
    }
    parsed = _arr;
    if (typeof originalProgress === "function") {
      options.progress = originalProgress;
      for (_arr = ["parse", "macroExpand", "reduce"], _i = 0, _len = _arr.length; _i < _len; ++_i) {
        name = _arr[_i];
        options.progress(name, progressCounts[name]);
      }
    }
    options.filenames = inputs;
    translator = require("./jstranslator");
    translated = translator(
      (function () {
        var _arr, _i, _len, x;
        _arr = [];
        for (_i = 0, _len = parsed.length; _i < _len; ++_i) {
          x = parsed[_i];
          _arr.push(x.result);
        }
        return _arr;
      }()),
      parsed[0].macros,
      (function () {
        var _arr, _i, _len, x;
        _arr = [];
        for (_i = 0, _len = parsed.length; _i < _len; ++_i) {
          x = parsed[_i];
          _arr.push(x.getPosition);
        }
        return _arr;
      }()),
      options
    );
    node = translated.node;
    fileSources = {};
    for (_arr = __toArray(inputs), i = 0, _len = _arr.length; i < _len; ++i) {
      input = _arr[i];
      fileSources[input] = sources[i];
    }
    node = handleAstPipe(node, options, fileSources);
    compiled = node.compile(options);
    code = compiled.code;
    if (sourceMapFile) {
      linefeed = options.linefeed || "\n";
      footer = __strnum(linefeed) + "//# sourceMappingURL=" + __strnum(path.relative(path.dirname(options.output), sourceMapFile)) + __strnum(linefeed);
      code = __strnum(code) + footer;
    }
    writeFileWithMkdirp(options.output, code, options.encoding || "utf8");
    if (sourceMapFile) {
      writeFileWithMkdirp(sourceMapFile, options.sourceMap.toString(), "utf8");
    }
  };
  function evaluate(code, options) {
    var _arr, _i, _module, _obj, _require, fun, k, Module, r, sandbox, v, vm;
    if (typeof require === "function") {
      vm = require("vm");
    }
    if (vm) {
      sandbox = vm.createContext();
      sandbox.global = sandbox.root = sandbox.GLOBAL = sandbox;
      if (options.sandbox != null) {
        if (options.sandbox instanceof sandbox.constructor) {
          sandbox = options.sandbox;
        } else {
          _obj = options.sandbox;
          for (k in _obj) {
            if (__owns.call(_obj, k)) {
              v = _obj[k];
              sandbox[k] = v;
            }
          }
        }
      } else {
        for (k in GLOBAL) {
          if (__owns.call(GLOBAL, k)) {
            v = GLOBAL[k];
            sandbox[k] = v;
          }
        }
      }
      sandbox.__filename = options.filename || "eval";
      sandbox.__dirname = path.dirname(sandbox.__filename);
      if (!sandbox.module && !sandbox.require) {
        Module = require("module");
        _module = sandbox.module = new Module(options.modulename || "eval");
        _require = sandbox.require = function (path) {
          return Module._load(path, _module);
        };
        _module.filename = sandbox.__filename;
        for (_arr = Object.getOwnPropertyNames(require), _i = _arr.length; _i--; ) {
          r = _arr[_i];
          try {
            _require[r] = require[r];
          } catch (e) {}
        }
      }
      if (options.includeGlobals) {
        for (k in GLOBAL) {
          if (__owns.call(GLOBAL, k) && !(k in sandbox)) {
            sandbox[k] = GLOBAL[k];
          }
        }
      }
      return vm.runInContext(code, sandbox);
    } else {
      fun = Function("return " + __strnum(code));
      return fun();
    }
  }
  exports["eval"] = function (source, options) {
    var compiled, result, startTime;
    if (options == null) {
      options = {};
    }
    options["eval"] = true;
    options["return"] = false;
    compiled = exports.compile(source, options);
    startTime = new Date().getTime();
    result = evaluate(compiled.code, options);
    if (typeof options.progress === "function") {
      options.progress("eval", new Date().getTime() - startTime);
    }
    return result;
  };
  exports.run = function (source, options) {
    var compiled, mainModule, Module;
    if (options == null) {
      options = {};
    }
    if (typeof process === "undefined") {
      return exports["eval"](source, options);
    }
    mainModule = require.main;
    mainModule.filename = process.argv[1] = options.filename ? fs.realpathSync(options.filename) : ".";
    if (mainModule.moduleCache) {
      mainModule.moduleCache = {};
    }
    if (process.binding("natives").module) {
      Module = require("module").Module;
      mainModule.paths = Module._nodeModulePaths(path.dirname(options.filename));
    }
    if (path.extname(mainModule.filename) !== ".gs" || require.extensions) {
      compiled = exports.compile(source, options);
      return mainModule._compile(compiled.code, mainModule.filename);
    } else {
      return mainModule._compile(source, mainModule.filename);
    }
  };
  init = exports.init = function (options) {
    if (options == null) {
      options = {};
    }
    fetchAndParsePreludeMacros();
  };
  exports.getMtime = function (source) {
    var _arr, _i, _len, _ref, acc, file, files, fileStats, libDir, libFile,
        libFiles, stat, time;
    files = [];
    files.push(path.join(path.dirname(real__filename), "../src/jsprelude.gs"));
    libDir = path.join(path.dirname(real__filename), "../lib");
    libFiles = fs.readdirSync(libDir);
    for (_arr = __toArray(libFiles), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      libFile = _arr[_i];
      if (path.extname(libFile) === ".js") {
        files.push(path.join(libDir, libFile));
      }
    }
    _arr = [];
    for (_i = 0, _len = files.length; _i < _len; ++_i) {
      file = files[_i];
      _arr.push(fs.statSync(file));
    }
    fileStats = _arr;
    if (fileStats.length === 0) {
      fileStats = new Date();
    }
    acc = -4503599627370496;
    for (_i = 0, _len = fileStats.length; _i < _len; ++_i) {
      stat = fileStats[_i];
      if (acc > __num(_ref = stat.mtime.getTime())) {
        acc = acc;
      } else {
        acc = _ref;
      }
    }
    time = acc;
    return new Date(time);
  };
  exports.AST = ast;
}.call(this, typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : this));
