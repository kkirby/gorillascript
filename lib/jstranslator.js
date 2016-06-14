(function () {
  "use strict";
  var __cmp, __create, __import, __isArray, __owns, __slice, __throw, __toArray,
      __typeof, _ref, ast, AstNode, Cache, getPos, isPrimordial, MacroHolder,
      ParserNode, primordialsBetterWithNew, Scope, translateLispyInternal,
      translateLispyOperator, Type;
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
  __create = typeof Object.create === "function" ? Object.create
    : function (x) {
      function F() {}
      F.prototype = x;
      return new F();
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
  __throw = function (x) {
    throw x;
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
  ast = require("./jsast");
  AstNode = ast.Node;
  Type = require("./types");
  _ref = require("./parser");
  MacroHolder = _ref.MacroHolder;
  ParserNode = _ref.Node;
  _ref = null;
  _ref = require("./utils");
  Cache = _ref.Cache;
  isPrimordial = _ref.isPrimordial;
  _ref = null;
  function needsCaching(item) {
    return !(item instanceof ast.Ident) && !(item instanceof ast.Const) && !(item instanceof ast.This) && !(item instanceof ast.Arguments);
  }
  function isNothing(node) {
    return node instanceof ParserNode.Symbol.nothing;
  }
  Scope = (function () {
    var _Scope_prototype, getId;
    function Scope(options, macros, bound, usedTmps, helperNames, variables, tmps) {
      var _this;
      _this = this instanceof Scope ? this : __create(_Scope_prototype);
      if (options == null) {
        options = {};
      }
      _this.options = options;
      _this.macros = macros;
      if (bound == null) {
        bound = false;
      }
      _this.bound = bound;
      if (usedTmps == null) {
        usedTmps = {};
      }
      _this.usedTmps = usedTmps;
      if (helperNames == null) {
        helperNames = {};
      }
      _this.helperNames = helperNames;
      if (tmps == null) {
        tmps = {};
      }
      _this.tmps = tmps;
      if (variables) {
        _this.variables = __create(variables);
      } else {
        _this.variables = {};
      }
      _this.hasBound = false;
      _this.usedThis = false;
      _this.id = getId();
      return _this;
    }
    _Scope_prototype = Scope.prototype;
    Scope.displayName = "Scope";
    getId = (function () {
      var id;
      id = -1;
      return function () {
        return ++id;
      };
    }());
    _Scope_prototype.maybeCache = function (item, type, func) {
      var ident, result;
      if (type == null) {
        type = Type.any;
      }
      if (!needsCaching(item)) {
        return func(item, item, false);
      } else {
        ident = this.reserveIdent(item.pos, "ref", type);
        result = func(
          ast.Assign(item.pos, ident, item),
          ident,
          true
        );
        this.releaseIdent(ident);
        return result;
      }
    };
    _Scope_prototype.maybeCacheAccess = function (item, func, parentName, childName, save) {
      var _this;
      _this = this;
      if (parentName == null) {
        parentName = "ref";
      }
      if (childName == null) {
        childName = "ref";
      }
      if (save == null) {
        save = false;
      }
      if (item instanceof ast.Binary && item.op === ".") {
        return this.maybeCache(item.left, Type.any, function (setParent, parent, parentCached) {
          return _this.maybeCache(item.right, Type.any, function (setChild, child, childCached) {
            if (parentCached || childCached) {
              return func(
                ast.Access(item.pos, setParent, setChild),
                ast.Access(item.pos, parent, child),
                true
              );
            } else {
              return func(item, item, false);
            }
          });
        });
      } else {
        return func(item, item, false);
      }
    };
    _Scope_prototype.reserveIdent = function (pos, namePart, type) {
      var _this;
      _this = this;
      if (namePart == null) {
        namePart = "ref";
      }
      if (type == null) {
        type = Type.any;
      }
      return (function () {
        var i, ident, name;
        for (i = 1; ; ++i) {
          if (i === 1) {
            name = "_" + namePart;
          } else {
            name = "_" + namePart + i;
          }
          if (!(name in _this.usedTmps)) {
            _this.usedTmps[name] = true;
            ident = ast.Ident(pos, name);
            _this.addVariable(ident, type);
            return ident;
          }
        }
      }());
    };
    _Scope_prototype.reserveParam = function (pos) {
      var _this;
      _this = this;
      return (function () {
        var i, name;
        for (i = 1; ; ++i) {
          if (i === 1) {
            name = "_p";
          } else {
            name = "_p" + i;
          }
          if (!(name in _this.usedTmps)) {
            _this.usedTmps[name] = true;
            return ast.Ident(pos, name);
          }
        }
      }());
    };
    _Scope_prototype.getTmp = function (pos, id, name, type) {
      var tmp, tmps;
      if (type == null) {
        type = Type.any;
      }
      tmps = this.tmps;
      if (id in tmps) {
        tmp = tmps[id];
        if (tmp instanceof ast.Ident) {
          return tmp;
        }
      }
      return tmps[id] = this.reserveIdent(pos, name || "tmp", type);
    };
    _Scope_prototype.releaseTmp = function (id) {
      var _ref, _ref2;
      if (__owns.call(this.tmps, id)) {
        this.releaseIdent((_ref = (_ref2 = this.tmps)[id], delete _ref2[id], _ref));
      }
    };
    _Scope_prototype.releaseTmps = function () {
      var _obj, id;
      _obj = this.tmps;
      for (id in _obj) {
        if (__owns.call(_obj, id)) {
          this.releaseTmp(id);
        }
      }
      this.tmps = {};
    };
    _Scope_prototype.releaseIdent = function (ident) {
      if (!__owns.call(this.usedTmps, ident.name)) {
        throw new Error("Trying to release a non-reserved ident: " + ident.name);
      }
      delete this.usedTmps[ident.name];
    };
    _Scope_prototype.markAsParam = function (ident) {
      this.variables[ident.name].isParam = true;
    };
    _Scope_prototype.markAsFunction = function (ident) {
      this.variables[ident.name].isFunction = true;
    };
    _Scope_prototype.addHelper = function (name) {
      this.helperNames[name] = true;
    };
    _Scope_prototype.fillHelperDependencies = function () {
      var _arr, _else, _i, dep, helperNames, name, toAdd;
      helperNames = this.helperNames;
      toAdd = {};
      while (true) {
        for (name in helperNames) {
          if (__owns.call(helperNames, name) && this.macros.hasHelper(name)) {
            for (_arr = __toArray(this.macros.helperDependencies(name)), _i = _arr.length; _i--; ) {
              dep = _arr[_i];
              if (!__owns.call(helperNames, dep)) {
                toAdd[dep] = true;
              }
            }
          }
        }
        _else = true;
        for (name in toAdd) {
          if (__owns.call(toAdd, name)) {
            _else = false;
            this.addHelper(name);
          }
        }
        if (_else) {
          break;
        }
        helperNames = toAdd;
        toAdd = {};
      }
    };
    function lowerSorter(a, b) {
      return __cmp(a.toLowerCase(), b.toLowerCase());
    }
    _Scope_prototype.getHelpers = function () {
      var _arr, _obj, k, names;
      _arr = [];
      _obj = this.helperNames;
      for (k in _obj) {
        if (__owns.call(_obj, k)) {
          _arr.push(k);
        }
      }
      names = _arr;
      return names.sort(lowerSorter);
    };
    _Scope_prototype.hasHelper = function (name) {
      return __owns.call(this.helperNames, name);
    };
    _Scope_prototype.addVariable = function (ident, type, isMutable) {
      if (type == null) {
        type = Type.any;
      }
      if (isMutable == null) {
        isMutable = false;
      }
      this.variables[ident.name] = { type: type, isMutable: isMutable };
    };
    _Scope_prototype.hasVariable = function (ident) {
      return ident.name in this.variables && typeof this.variables[ident.name] === "object" && this.variables[ident.name] !== null;
    };
    _Scope_prototype.hasOwnVariable = function (ident) {
      return __owns.call(this.variables, ident.name);
    };
    _Scope_prototype.isVariableMutable = function (ident) {
      var _ref;
      if ((_ref = this.variables[ident.name]) != null) {
        return _ref.isMutable;
      }
    };
    _Scope_prototype.removeVariable = function (ident) {
      delete this.variables[ident.name];
    };
    _Scope_prototype.getVariables = function () {
      var _arr, _obj, k, v, variables;
      _arr = [];
      _obj = this.variables;
      for (k in _obj) {
        if (__owns.call(_obj, k)) {
          v = _obj[k];
          if (!v.isParam && !v.isFunction) {
            _arr.push(k);
          }
        }
      }
      variables = _arr;
      return variables.sort(lowerSorter);
    };
    _Scope_prototype.clone = function (bound) {
      if (bound) {
        this.hasBound = true;
      }
      return Scope(
        this.options,
        this.macros,
        bound,
        __create(this.usedTmps),
        this.helperNames,
        this.variables,
        __create(this.tmps)
      );
    };
    return Scope;
  }());
  function uid() {
    return Math.random().toString(36).slice(2) + "-" + new Date().getTime();
  }
  function flattenSpreadArray(elements) {
    var _arr, _i, _len, changed, element, node, result;
    result = [];
    changed = false;
    for (_arr = __toArray(elements), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      element = _arr[_i];
      if (element.isInternalCall("spread")) {
        node = element.args[0];
        if (node.isInternalCall("array")) {
          result.push.apply(result, __toArray(node.args));
          changed = true;
        } else {
          result.push(element);
        }
      } else {
        result.push(element);
      }
    }
    if (changed) {
      return flattenSpreadArray(result);
    } else {
      return elements;
    }
  }
  function makePos(line, column, file) {
    var pos;
    if (file == null) {
      file = void 0;
    }
    pos = { line: line, column: column };
    if (file != null) {
      pos.file = file;
    }
    return pos;
  }
  getPos = function (node) {
    throw new Error("get-pos must be overridden");
  };
  function parseSwitch(args) {
    var _end, i, len, result;
    result = { topic: args[0], cases: [] };
    len = args.length;
    for (i = 1, _end = len - 1; i < _end; i += 3) {
      result.cases.push({ node: args[i], body: args[i + 1], fallthrough: args[i + 2] });
    }
    result.defaultCase = args[len - 1];
    return result;
  }
  function doNothing() {}
  function arrayTranslate(pos, elements, scope, replaceWithSlice, allowArrayLike, unassigned) {
    var _arr, _f, _i, _len, current, element, i, translatedItems;
    translatedItems = [];
    current = [];
    translatedItems.push(current);
    for (_arr = __toArray(flattenSpreadArray(elements)), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      element = _arr[_i];
      if (element.isInternalCall("spread")) {
        translatedItems.push({
          tNode: translate(element.args[0], scope, "expression", unassigned),
          type: element.args[0].type()
        });
        current = [];
        translatedItems.push(current);
      } else {
        current.push(translate(element, scope, "expression", unassigned));
      }
    }
    if (translatedItems.length === 1) {
      return function () {
        return ast.Arr(pos, (function () {
          var _arr, _arr2, _i, _len, tItem;
          _arr = [];
          for (_arr2 = __toArray(translatedItems[0]), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
            tItem = _arr2[_i];
            _arr.push(tItem());
          }
          return _arr;
        }()));
      };
    } else {
      for (i = translatedItems.length, _f = function (translatedItem, i) {
        if (i % 2 === 0) {
          if (translatedItem.length > 0) {
            return translatedItems[i] = function () {
              var _arr, _arr2, _i, _len, items, tItem;
              _arr = [];
              for (_arr2 = __toArray(translatedItem), _i = 0, _len = _arr2.length; _i < _len; ++_i) {
                tItem = _arr2[_i];
                _arr.push(tItem());
              }
              items = _arr;
              return ast.Arr(items[0].pos, items);
            };
          } else {
            return translatedItems.splice(i, 1);
          }
        } else {
          return translatedItems[i] = function () {
            var node;
            node = translatedItem.tNode();
            if (translatedItem.type.isSubsetOf(Type.array)) {
              return node;
            } else {
              scope.addHelper("__toArray");
              return ast.Call(
                node.pos,
                ast.Ident(node.pos, "__toArray"),
                [node]
              );
            }
          };
        }
      }; i--; ) {
        _f.call(this, translatedItems[i], i);
      }
      if (translatedItems.length === 1) {
        return function () {
          var array;
          array = translatedItems[0]();
          if (replaceWithSlice) {
            return ast.Call(
              pos,
              ast.Access(
                pos,
                ast.Ident(pos, "__slice"),
                "call"
              ),
              array instanceof ast.Call && array.func instanceof ast.Ident && array.func.name === "__toArray" ? array.args : [array]
            );
          } else if (allowArrayLike && array instanceof ast.Call && array.func instanceof ast.Ident && array.func.name === "__toArray" && array.args[0] instanceof ast.Arguments) {
            return array.args[0];
          } else {
            return array;
          }
        };
      } else {
        return function () {
          var _arr, _i, _len, head, item, rest;
          head = translatedItems[0]();
          _arr = [];
          for (_i = 1, _len = translatedItems.length; _i < _len; ++_i) {
            item = translatedItems[_i];
            _arr.push(item());
          }
          rest = _arr;
          return ast.Call(
            pos,
            ast.Access(pos, head, "concat"),
            rest
          );
        };
      }
    }
  }
  _ref = [];
  _ref[0] = function (node, args, scope, location, unassigned) {
    var tChild, tParent;
    tParent = translate(args[0], scope, "expression", unassigned);
    tChild = translate(args[1], scope, "expression", unassigned);
    return function () {
      return ast.Access(getPos(node), tParent(), tChild());
    };
  };
  _ref[1] = function (node, args, scope, location, unassigned) {
    var tArr;
    tArr = arrayTranslate(
      getPos(node),
      args,
      scope,
      true,
      unassigned
    );
    return function () {
      return tArr();
    };
  };
  _ref[3] = function (node, args, scope, location, unassigned) {
    var _arr, _arr2, i, len, subnode, tNodes;
    _arr = [];
    for (_arr2 = __toArray(args), i = 0, len = _arr2.length; i < len; ++i) {
      subnode = _arr2[i];
      _arr.push(translate(subnode, scope, location, unassigned));
    }
    tNodes = _arr;
    return function () {
      return ast.Block(getPos(node), (function () {
        var _arr, _i, _len, tNode;
        _arr = [];
        for (_i = 0, _len = tNodes.length; _i < _len; ++_i) {
          tNode = tNodes[_i];
          _arr.push(tNode());
        }
        return _arr;
      }()));
    };
  };
  _ref[4] = function (node, args, scope) {
    var tLabel;
    tLabel = args[0] && translate(args[0], scope, "label");
    return function () {
      return ast.Break(getPos(node), typeof tLabel === "function" ? tLabel() : void 0);
    };
  };
  _ref[5] = function (node, args, scope, location, unassigned) {
    var tText;
    tText = translate(args[0], scope, "expression", unassigned);
    return function () {
      return ast.Comment(getPos(node), tText().constValue());
    };
  };
  _ref[6] = function (node, args, scope, location, unassigned) {
    var context, contextAndArgs, func, realArgs, tArgs, tContext,
        tContextAndArgs, tFunc;
    func = args[0];
    context = args[1];
    realArgs = args.slice(2);
    tFunc = translate(func, scope, "expression", unassigned);
    if (!context.isInternalCall("spread")) {
      tContext = translate(context, scope, "expression", unassigned);
      tArgs = arrayTranslate(
        getPos(node),
        realArgs,
        scope,
        false,
        true,
        unassigned
      );
      return function () {
        var args, context, func;
        func = tFunc();
        context = tContext();
        args = tArgs();
        if (args instanceof ast.Arr) {
          return ast.Call(
            getPos(node),
            ast.Access(getPos(node), func, "call"),
            [context].concat(__toArray(args.elements))
          );
        } else {
          return ast.Call(
            getPos(node),
            ast.Access(getPos(node), func, "apply"),
            [context, args]
          );
        }
      };
    } else {
      contextAndArgs = args.slice(1);
      tContextAndArgs = arrayTranslate(
        getPos(node),
        contextAndArgs,
        scope,
        false,
        true,
        unassigned
      );
      return function () {
        var contextAndArgs, func;
        func = tFunc();
        contextAndArgs = tContextAndArgs();
        return scope.maybeCache(contextAndArgs, Type.array, function (setContextAndArgs, contextAndArgs) {
          scope.addHelper("__slice");
          return ast.Call(
            getPos(node),
            ast.Access(getPos(node), func, "apply"),
            [
              ast.Access(getPos(node), setContextAndArgs, 0),
              ast.Call(
                getPos(node),
                ast.Access(getPos(node), contextAndArgs, "slice"),
                [ast.Const(getPos(node), 1)]
              )
            ]
          );
        });
      };
    }
  };
  _ref[7] = function (node, args, scope) {
    var tLabel;
    tLabel = args[0] && translate(args[0], scope, "label");
    return function () {
      return ast.Continue(getPos(node), typeof tLabel === "function" ? tLabel() : void 0);
    };
  };
  _ref[8] = function (node, args, scope, location, unassigned) {
    throw new Error("Cannot have a stray custom node '" + args[0].constValue() + "'");
  };
  _ref[9] = function (node) {
    return function () {
      return ast.Debugger(getPos(node));
    };
  };
  _ref[10] = function (node, args, scope, location, unassigned) {
    var innerScope, tText, wrapped;
    if (args[0].isStatement()) {
      innerScope = args[0].scope.clone();
      wrapped = ParserNode.Call(args[0].index, args[0].scope, ParserNode.InternalCall(
        "function",
        args[0].index,
        innerScope,
        ParserNode.InternalCall("array", args[0].index, innerScope),
        ParserNode.InternalCall("autoReturn", args[0].index, innerScope, args[0].rescope(innerScope)),
        ParserNode.Value(args[0].index, true),
        ParserNode.Symbol.nothing(args[0].index),
        ParserNode.Value(args[0].index, false),
        ParserNode.Value(args[0].index, false)
      ));
    } else {
      wrapped = args[0];
    }
    tText = translate(wrapped, scope, "expression", unassigned);
    return function () {
      return ast.Call(
        getPos(node),
        ast.Ident(getPos(node), "write"),
        [tText()].concat(args[1].constValue()
          ? [ast.Const(getPos(node), true)]
          : [])
      );
    };
  };
  _ref[11] = function (node, args, scope, location, unassigned) {
    var bodyUnassigned, tBody, tInit, tStep, tTest;
    if (args[0] != null) {
      tInit = translate(args[0], scope, "expression", unassigned);
    }
    bodyUnassigned = unassigned && { "\u0000": true };
    if (args[1] != null) {
      tTest = translate(args[1], scope, "expression", bodyUnassigned);
    }
    tBody = translate(args[3], scope, "statement", bodyUnassigned);
    if (args[2] != null) {
      tStep = translate(args[2], scope, "expression", bodyUnassigned);
    }
    if (unassigned) {
      __import(unassigned, bodyUnassigned);
    }
    return function () {
      return ast.For(
        getPos(node),
        typeof tInit === "function" ? tInit() : void 0,
        typeof tTest === "function" ? tTest() : void 0,
        typeof tStep === "function" ? tStep() : void 0,
        tBody()
      );
    };
  };
  _ref[12] = function (node, args, scope, location, unassigned) {
    var bodyUnassigned, tBody, tKey, tObject;
    tKey = translate(args[0], scope, "leftExpression");
    if (unassigned && args[0].isSymbol && args[0].isIdent) {
      unassigned[args[0].name] = false;
    }
    tObject = translate(args[1], scope, "expression", unassigned);
    bodyUnassigned = unassigned && { "\u0000": true };
    tBody = translate(args[2], scope, "statement", bodyUnassigned);
    if (unassigned) {
      __import(unassigned, bodyUnassigned);
    }
    return function () {
      var key;
      key = tKey();
      if (!(key instanceof ast.Ident)) {
        throw new Error("Expected an Ident for a for-in key");
      }
      scope.addVariable(key, Type.string);
      return ast.ForIn(getPos(node), key, tObject(), tBody());
    };
  };
  _ref[13] = (function () {
    var primitiveTypes, translateType;
    primitiveTypes = { Boolean: "boolean", String: "string", Number: "number", Function: "function" };
    function translateTypeCheck(node) {
      var _arr, _end, _i, _len, i, result, type, typeData;
      switch (node.nodeTypeId) {
      case 1:
        switch (node.symbolTypeId) {
        case 1:
          if (__owns.call(primitiveTypes, node.name)) {
            return Type[primitiveTypes[node.name]];
          } else {
            return Type.any;
          }
        case 0:
          if (node.isNothing) {
            return Type.any;
          } else {
            throw new Error("Unknown type: " + __typeof(node));
          }
          break;
        default: throw new Error("Unhandled value in switch");
        }
        break;
      case 2:
        if (!node.isInternalCall()) {
          throw new Error("Unknown type: " + __typeof(node));
        }
        switch (node.func.name) {
        case "access": return Type.any;
        case "typeUnion":
          result = Type.none;
          for (_arr = __toArray(node.types), _i = 0, _len = _arr.length; _i < _len; ++_i) {
            type = _arr[_i];
            result = result.union(type.isConst()
              ? (function () {
                switch (type.constValue()) {
                case null: return Type["null"];
                case void 0: return Type["undefined"];
                default: throw new Error("Unknown const value for typechecking: " + String(type.value));
                }
              }())
              : type instanceof ParserNode.Symbol.ident
              ? (__owns.call(primitiveTypes, type.name) ? Type[primitiveTypes[type.name]] : Type.any)
              : __throw(new Error("Not implemented: typechecking for non-idents/consts within a type-union")));
          }
          return result;
        case "typeGeneric":
          if (node.args[0].isIdent) {
            switch (node.args[0].name) {
            case "Array": return translateTypeCheck(node.args[1]).array();
            case "Function": return translateTypeCheck(node.args[1])["function"]();
            default: return Type.any;
            }
          } else {
            return Type.any;
          }
          break;
        case "typeObject":
          typeData = {};
          for (i = 0, _end = +node.args.length; i < _end; i += 2) {
            if (node.args[i].isConst()) {
              typeData[node.args[i].constValue()] = translateTypeCheck(node.args[i + 1]);
            }
          }
          return Type.makeObject(typeData);
        default: throw new Error("Unhandled value in switch");
        }
        break;
      default: throw new Error("Unhandled value in switch");
      }
    }
    function translateParam(param, scope, inner) {
      var ident, laterInit, tmp, type;
      if (!param.isInternalCall("param")) {
        throw new Error("Unknown parameter type: " + __typeof(param));
      }
      ident = translate(param.args[0], scope, "param")();
      laterInit = [];
      if (ident instanceof ast.Binary && ident.op === "." && ident.right instanceof ast.Const && typeof ident.right.value === "string") {
        tmp = ast.Ident(ident.pos, ident.right.value);
        laterInit.push(ast.Binary(ident.pos, ident, "=", tmp));
        ident = tmp;
      }
      if (!(ident instanceof ast.Ident)) {
        throw new Error("Expecting param to be an Ident, got " + __typeof(ident));
      }
      type = translateTypeCheck(param.args[4]);
      scope.addVariable(ident, type, !!param.args[3].constValue());
      scope.markAsParam(ident);
      return { init: laterInit, ident: ident, spread: !!param.args[2].constValue() };
    }
    translateType = (function () {
      var primordialTypes;
      primordialTypes = {
        String: Type.string,
        Number: Type.number,
        Boolean: Type.boolean,
        Function: Type["function"],
        Array: Type.array
      };
      return function (node, scope) {
        var _arr, _arr2, _i, _len, arg, args, base, current, type;
        switch (node.nodeTypeId) {
        case 0:
          switch (node.value) {
          case null: return Type["null"];
          case void 0: return Type["undefined"];
          default: throw new Error("Unexpected Value type: " + String(node.value));
          }
          break;
        case 1:
          if (node.isIdent) {
            if (!__owns.call(primordialTypes, node.name)) {
              throw new Error("Not implemented: custom type: " + node.name);
            }
            return primordialTypes[node.name];
          } else {
            throw new Error("Unexpected type: " + __typeof(node));
          }
          break;
        case 2:
          if (!node.isInternalCall()) {
            throw new Error("Unexpected type: " + __typeof(node));
          }
          switch (node.func.name) {
          case "typeUnion":
            current = Type.none;
            for (_arr = __toArray(node.args), _i = 0, _len = _arr.length; _i < _len; ++_i) {
              type = _arr[_i];
              current = current.union(translateType(type));
            }
            return current;
          case "typeGeneric":
            base = translateType(node.args[0], scope);
            _arr = [];
            for (_arr2 = __toArray(node.args), _i = 1, _len = _arr2.length; _i < _len; ++_i) {
              arg = _arr2[_i];
              _arr.push(translateType(arg, scope));
            }
            args = _arr;
            return Type.generic.apply(Type, [base].concat(args));
          default: throw new Error("Unhandled value in switch");
          }
          break;
        default: throw new Error("Unhandled value in switch");
        }
      };
    }());
    return function (node, args, scope, location, unassigned) {
      return function () {
        var _arr, _ref, body, bodyPos, convertAutoReturn, fakeThis, i,
            initializers, innerScope, len, p, param, paramIdents,
            realInnerScope, unassigned, wrap;
        innerScope = scope.clone(!node.args[2].isConst() || !!node.args[2].constValue());
        realInnerScope = innerScope;
        paramIdents = [];
        initializers = [];
        for (_arr = __toArray(node.args[0].args), i = 0, len = _arr.length; i < len; ++i) {
          p = _arr[i];
          param = translateParam(p, innerScope, false);
          if (param.spread) {
            throw new Error("Encountered a spread parameter");
          }
          paramIdents.push(param.ident);
          initializers.push.apply(initializers, param.init);
        }
        if (!node.args[2].isConst()) {
          convertAutoReturn = function (subnode) {
            return subnode.args[0];
          };
        } else {
          convertAutoReturn = function (subnode) {
            return ParserNode.Call(subnode.index, subnode.scope, ParserNode.Symbol["return"](subnode.index), subnode.args[0]);
          };
        }
        function translateAutoReturn(subnode) {
          if (subnode.isInternalCall("function")) {
            return subnode;
          }
          if (subnode.isInternalCall("autoReturn")) {
            subnode = convertAutoReturn(subnode);
          }
          return subnode.walk(translateAutoReturn);
        }
        unassigned = {};
        _ref = translateFunctionBody(getPos(node), innerScope, translateAutoReturn(node.args[1]), unassigned);
        body = _ref.body;
        wrap = _ref.wrap;
        _ref = null;
        innerScope.releaseTmps();
        bodyPos = getPos(node.args[1]);
        body = ast.Block(bodyPos, initializers.concat([body]));
        if (!node.args[2].isConst()) {
          fakeThis = ast.Ident(bodyPos, "_this");
          innerScope.addVariable(fakeThis);
          body = ast.Block(bodyPos, [
            ast.Assign(bodyPos, fakeThis, translate(node.args[2], scope, "expression", unassigned)()),
            body,
            ast.Return(bodyPos, fakeThis)
          ]);
        } else if (innerScope.usedThis) {
          if (innerScope.bound) {
            scope.usedThis = true;
          }
          if (innerScope.hasBound && !realInnerScope.bound) {
            fakeThis = ast.Ident(bodyPos, "_this");
            innerScope.addVariable(fakeThis);
            body = ast.Block(bodyPos, [
              ast.Assign(bodyPos, fakeThis, ast.This(bodyPos)),
              body
            ]);
          }
        }
        return wrap(ast.Func(
          getPos(node),
          null,
          paramIdents,
          innerScope.getVariables(),
          body,
          [],
          node.args[4].constValue(),
          node.args[5].constValue()
        ));
      };
    };
  }());
  _ref[14] = function (node, args, scope, location, unassigned) {
    var innerLocation, k, tTest, tWhenFalse, tWhenTrue, v, whenFalseUnassigned;
    if (location === "statement" || location === "topStatement") {
      innerLocation = "statement";
    } else {
      innerLocation = location;
    }
    tTest = translate(args[0], scope, "expression", unassigned);
    whenFalseUnassigned = unassigned && __import({}, unassigned);
    tWhenTrue = translate(args[1], scope, innerLocation, unassigned);
    tWhenFalse = translate(args[2], scope, innerLocation, whenFalseUnassigned);
    if (unassigned) {
      for (k in whenFalseUnassigned) {
        if (__owns.call(whenFalseUnassigned, k)) {
          v = whenFalseUnassigned[k];
          if (!v) {
            unassigned[k] = false;
          }
        }
      }
    }
    return function () {
      return ast.If(getPos(node), tTest(), tWhenTrue(), typeof tWhenFalse === "function" ? tWhenFalse() : void 0);
    };
  };
  _ref[15] = function (node, args, scope, location, unassigned) {
    var tLabel, tNode;
    tLabel = translate(args[0], scope, "label");
    tNode = translate(args[1], scope, location, unassigned);
    return function () {
      return tNode().withLabel(tLabel());
    };
  };
  _ref[17] = function (node, args, scope, location, unassigned) {
    var tArgs, tFunc;
    if (args[0].isSymbol && args[0].isIdent && args[0].name === "RegExp" && args[1].isConst() && (!args[2] || args[2].isConst())) {
      if (args[2] && args[2].constValue()) {
        return function () {
          return ast.Regex(getPos(node), String(args[1].constValue()), String(args[2].constValue()));
        };
      } else {
        return function () {
          return ast.Regex(getPos(node), String(args[1].constValue()));
        };
      }
    }
    tFunc = translate(args[0], scope, "expression", unassigned);
    tArgs = arrayTranslate(
      getPos(node),
      __slice.call(args, 1),
      scope,
      false,
      true,
      unassigned
    );
    return function () {
      var args, func;
      func = tFunc();
      args = tArgs();
      if (args instanceof ast.Arr) {
        return ast.Call(getPos(node), func, args.elements, true);
      } else {
        scope.addHelper("__new");
        return ast.Call(
          getPos(node),
          ast.Access(
            getPos(node),
            ast.Ident(getPos(node), "__new"),
            ast.Const(getPos(node), "apply")
          ),
          [func, args]
        );
      }
    };
  };
  _ref[19] = function (node, args, scope, location, unassigned) {
    var _arr, _i, _len, _ref, pair, properties, tKeys, tPrototype, tValues;
    tKeys = [];
    tValues = [];
    properties = [];
    for (_arr = __toArray(args), _i = 1, _len = _arr.length; _i < _len; ++_i) {
      pair = _arr[_i];
      tKeys.push(translate(pair.args[0], scope, "expression", unassigned));
      tValues.push(translate(pair.args[1], scope, "expression", unassigned));
      properties.push((_ref = pair.args[2]) != null ? _ref.constValue() : void 0);
    }
    if (!isNothing(args[0])) {
      tPrototype = translate(args[0], scope, "expression", unassigned);
    } else {
      tPrototype = void 0;
    }
    return function () {
      var _len, constPairs, currentPair, currentPairs, i, ident, key,
          lastProperty, obj, postConstPairs, property, prototype, result, tKey,
          tValue, value;
      constPairs = [];
      postConstPairs = [];
      if (typeof tPrototype === "function") {
        prototype = tPrototype();
      }
      if (prototype != null) {
        currentPairs = postConstPairs;
      } else {
        currentPairs = constPairs;
      }
      lastProperty = null;
      for (i = 0, _len = tKeys.length; i < _len; ++i) {
        tKey = tKeys[i];
        tValue = tValues[i];
        key = tKey();
        value = tValue();
        property = properties[i];
        if (!(key instanceof ast.Const) || property) {
          currentPairs = postConstPairs;
        }
        currentPair = currentPairs[currentPairs.length - 1];
        if ((property === "get" || property === "set") && lastProperty && property !== lastProperty && key instanceof ast.Const && currentPair.key instanceof ast.Const && key.value === currentPair.key.value) {
          currentPair[lastProperty] = currentPair.value;
          currentPair.property = "" + lastProperty + property;
          delete currentPair.value;
          currentPair[property] = value;
          lastProperty = null;
        } else {
          currentPairs.push({ key: key, value: value, property: property });
          if (property === "get" || property === "set") {
            lastProperty = property;
          }
        }
      }
      if (prototype != null) {
        scope.addHelper("__create");
        obj = ast.Call(
          getPos(node),
          ast.Ident(getPos(node), "__create"),
          [prototype]
        );
      } else {
        obj = ast.Obj(getPos(node), (function () {
          var _arr, _i, _len, _ref, key, value;
          _arr = [];
          for (_i = 0, _len = constPairs.length; _i < _len; ++_i) {
            _ref = constPairs[_i];
            key = _ref.key;
            value = _ref.value;
            _ref = null;
            _arr.push(ast.Obj.Pair(key.pos, String(key.value), value));
          }
          return _arr;
        }()));
      }
      if (postConstPairs.length === 0) {
        return obj;
      } else {
        ident = scope.reserveIdent(getPos(node), "o", Type.object);
        result = ast.BlockExpression(getPos(node), [ast.Assign(getPos(node), ident, obj)].concat(
          (function () {
            var _arr, _i, _len, key, pair, property;
            _arr = [];
            for (_i = 0, _len = postConstPairs.length; _i < _len; ++_i) {
              pair = postConstPairs[_i];
              key = pair.key;
              property = pair.property;
              if (property) {
                scope.addHelper("__defProp");
                _arr.push(ast.Call(
                  key.pos,
                  ast.Ident(key.pos, "__defProp"),
                  [
                    ident,
                    key,
                    property === "property" ? pair.value
                      : property === "getset"
                      ? ast.Obj(pair.get.pos, [
                        ast.Obj.Pair(pair.get.pos, "get", pair.get),
                        ast.Obj.Pair(pair.set.pos, "set", pair.set),
                        ast.Obj.Pair(pair.set.pos, "configurable", ast.Const(pair.set.pos, true)),
                        ast.Obj.Pair(pair.set.pos, "enumerable", ast.Const(pair.set.pos, true))
                      ])
                      : property === "setget"
                      ? ast.Obj(pair.set.pos, [
                        ast.Obj.Pair(pair.set.pos, "set", pair.set),
                        ast.Obj.Pair(pair.get.pos, "get", pair.get),
                        ast.Obj.Pair(pair.get.pos, "configurable", ast.Const(pair.get.pos, true)),
                        ast.Obj.Pair(pair.get.pos, "enumerable", ast.Const(pair.get.pos, true))
                      ])
                      : property === "get"
                      ? ast.Obj(pair.value.pos, [
                        ast.Obj.Pair(pair.value.pos, "get", pair.value),
                        ast.Obj.Pair(pair.value.pos, "configurable", ast.Const(pair.value.pos, true)),
                        ast.Obj.Pair(pair.value.pos, "enumerable", ast.Const(pair.value.pos, true))
                      ])
                      : property === "set"
                      ? ast.Obj(pair.value.pos, [
                        ast.Obj.Pair(pair.value.pos, "set", pair.value),
                        ast.Obj.Pair(pair.value.pos, "configurable", ast.Const(pair.value.pos, true)),
                        ast.Obj.Pair(pair.value.pos, "enumerable", ast.Const(pair.value.pos, true))
                      ])
                      : __throw(new Error("Unknown property type: " + String(property)))
                  ]
                ));
              } else {
                _arr.push(ast.Assign(
                  key.pos,
                  ast.Access(key.pos, ident, key),
                  pair.value
                ));
              }
            }
            return _arr;
          }()),
          [ident]
        ));
        scope.releaseIdent(ident);
        return result;
      }
    };
  };
  _ref[21] = function (node, args, scope, location, unassigned) {
    var mutatedNode, tValue;
    if (location !== "statement" && location !== "topStatement") {
      throw new Error("Expected Return in statement position");
    }
    mutatedNode = args[0].mutateLast(
      null,
      function (n) {
        if (n.isInternalCall("return")) {
          return n;
        } else {
          return ParserNode.InternalCall("return", n.index, n.scope, n);
        }
      },
      null,
      true
    );
    if (mutatedNode.isInternalCall("return") && mutatedNode.args[0] === args[0]) {
      tValue = translate(args[0], scope, "expression", unassigned);
      if (args[0].isStatement()) {
        return tValue;
      } else {
        return function () {
          return ast.Return(getPos(node), tValue());
        };
      }
    } else {
      return translate(mutatedNode, scope, location, unassigned);
    }
  };
  _ref[25] = function (node, args) {
    throw new Error("Cannot have a stray super call");
  };
  _ref[24] = function (node, args, scope, location, unassigned) {
    var _arr, _arr2, _i, _len, baseUnassigned, case_, currentUnassigned, data,
        k, newCase, tCases, tDefaultCase, tTopic, v;
    data = parseSwitch(args);
    tTopic = translate(data.topic, scope, "expression", unassigned);
    baseUnassigned = unassigned && __import({}, unassigned);
    currentUnassigned = unassigned && __import({}, baseUnassigned);
    _arr = [];
    for (_arr2 = data.cases, _i = 0, _len = _arr2.length; _i < _len; ++_i) {
      case_ = _arr2[_i];
      newCase = {
        pos: getPos(case_.node),
        tNode: translate(case_.node, scope, "expression", currentUnassigned),
        tBody: translate(case_.body, scope, "statement", currentUnassigned),
        fallthrough: case_.fallthrough.constValue()
      };
      if (!newCase.fallthrough && unassigned) {
        for (k in currentUnassigned) {
          if (__owns.call(currentUnassigned, k)) {
            v = currentUnassigned[k];
            if (!v) {
              unassigned[k] = false;
            }
          }
        }
        currentUnassigned = __import({}, baseUnassigned);
      }
      _arr.push(newCase);
    }
    tCases = _arr;
    tDefaultCase = translate(data.defaultCase, scope, "statement", currentUnassigned);
    for (k in currentUnassigned) {
      if (__owns.call(currentUnassigned, k)) {
        v = currentUnassigned[k];
        if (!v) {
          unassigned[k] = false;
        }
      }
    }
    return function () {
      return ast.Switch(
        getPos(node),
        tTopic(),
        (function () {
          var _arr, case_, caseBody, caseNode, i, len;
          _arr = [];
          for (i = 0, len = tCases.length; i < len; ++i) {
            case_ = tCases[i];
            caseNode = case_.tNode();
            caseBody = case_.tBody();
            if (!case_.fallthrough) {
              caseBody = ast.Block(case_.pos, [caseBody, ast.Break(caseBody.pos)]);
            }
            _arr.push(ast.Switch.Case(case_.pos, caseNode, caseBody));
          }
          return _arr;
        }()),
        tDefaultCase()
      );
    };
  };
  _ref[31] = function (node, args, scope, location, unassigned) {
    var tNode;
    tNode = translate(args[0], scope, "expression", unassigned);
    return function () {
      return ast.Throw(getPos(node), tNode());
    };
  };
  _ref[39] = function (node, args, scope, location, unassigned) {
    var tNode;
    tNode = translate(args[0], scope, "expression", unassigned);
    return function () {
      var _ref;
      return ast.Yield(getPos(node), tNode(), (_ref = args[1]) != null ? _ref.value : void 0);
    };
  };
  _ref[40] = function (node, args, scope, location, unassigned) {
    var tNode;
    tNode = translate(args[0], scope, "expression", unassigned);
    return function () {
      var _ref;
      return ast.Await(getPos(node), tNode(), (_ref = args[1]) != null ? _ref.value : void 0);
    };
  };
  _ref[32] = function (node, args, scope, location, unassigned) {
    var _arr, _i, _len, tmp, tResult;
    tResult = translate(args[0], scope, location, unassigned);
    for (_arr = __toArray(args), _i = 1, _len = _arr.length; _i < _len; ++_i) {
      tmp = _arr[_i];
      scope.releaseTmp(tmp.constValue());
    }
    return tResult;
  };
  _ref[33] = function (node, args, scope, location, unassigned) {
    var tCatchBody, tCatchIdent, tTryBody;
    tTryBody = translate(args[0], scope, "statement", unassigned);
    tCatchIdent = translate(args[1], scope, "leftExpression");
    tCatchBody = translate(args[2], scope, "statement", unassigned);
    return function () {
      var catchIdent;
      catchIdent = tCatchIdent();
      if (catchIdent instanceof ast.Ident) {
        scope.addVariable(catchIdent);
        scope.markAsParam(catchIdent);
      }
      return ast.TryCatch(getPos(node), tTryBody(), catchIdent, tCatchBody());
    };
  };
  _ref[34] = function (node, args, scope, location, unassigned) {
    var tFinallyBody, tTryBody;
    tTryBody = translate(args[0], scope, "statement", unassigned);
    tFinallyBody = translate(args[1], scope, "statement", unassigned);
    return function () {
      return ast.TryFinally(getPos(node), tTryBody(), tFinallyBody());
    };
  };
  _ref[38] = function (node, args, scope, location, unassigned) {
    var ident, isMutable, tIdent;
    ident = args[0];
    if (unassigned && !unassigned["\u0000"] && ident.isSymbol && ident.isIdent && !__owns.call(unassigned, ident.name)) {
      unassigned[ident.name] = true;
    }
    tIdent = translate(ident, scope, "leftExpression");
    isMutable = node.scope.isMutable(ident);
    return function () {
      scope.addVariable(tIdent(), Type.any, isMutable);
      return ast.Noop(getPos(node));
    };
  };
  translateLispyInternal = _ref;
  _ref = [];
  _ref[0] = function (node, args, scope, location, unassigned) {
    var tLeft, tRight;
    tLeft = translate(args[0], scope, "expression", unassigned);
    tRight = translate(args[1], scope, "expression", unassigned);
    return function () {
      return ast.Binary(getPos(node), tLeft(), node.func.name, tRight());
    };
  };
  _ref[1] = function (node, args, scope, location, unassigned) {
    var opName, tSubnode;
    opName = node.func.name;
    if (unassigned && (opName === "++" || opName === "--" || opName === "++post" || opName === "--post") && args[0].isSymbol && args[0].isIdent) {
      unassigned[args[0].name] = false;
    }
    tSubnode = translate(args[0], scope, "expression", unassigned);
    return function () {
      return ast.Unary(getPos(node), opName, tSubnode());
    };
  };
  _ref[2] = function (node, args, scope, location, unassigned) {
    var opName, tLeft, tRight;
    opName = node.func.name;
    tLeft = translate(args[0], scope, "leftExpression");
    tRight = translate(args[1], scope, "expression", unassigned);
    if (unassigned && args[0].isSymbol && args[0].isIdent) {
      if (opName === "=" && unassigned[args[0].name] && !unassigned["\u0000"] && args[1].isConstValue(void 0)) {
        return function () {
          return ast.Noop(getPos(node));
        };
      }
      unassigned[args[0].name] = false;
    }
    return function () {
      var left, right;
      left = tLeft();
      right = tRight();
      if (opName === "=" && location === "topStatement" && left instanceof ast.Ident && right instanceof ast.Func && right.name == null && scope.hasOwnVariable(left) && !scope.isVariableMutable(left)) {
        scope.markAsFunction(left);
        return ast.Func(
          getPos(node),
          left,
          right.params,
          right.variables,
          right.body,
          right.declarations,
          right.generator,
          right.promise
        );
      } else {
        return ast.Binary(getPos(node), left, opName, right);
      }
    };
  };
  translateLispyOperator = _ref;
  primordialsBetterWithNew = {
    Error: true,
    RangeError: true,
    ReferenceError: true,
    SyntaxError: true,
    TypeError: true,
    URIError: true
  };
  function translateLispyCall(node, func, args, scope, location, unassigned) {
    var tArgs, tCode, tFunc;
    if (func.isSymbol && func.isIdent) {
      if (func.name === "RegExp" && args[0].isConst() && (!args[1] || args[1].isConst())) {
        if (args[1] && args[1].constValue()) {
          return function () {
            return ast.Regex(getPos(node), String(args[0].constValue()), String(args[1].constValue()));
          };
        } else {
          return function () {
            return ast.Regex(getPos(node), String(args[0].constValue()));
          };
        }
      } else if (func.name === "eval") {
        tCode = translate(args[0], scope, "expression", unassigned);
        return function () {
          return ast.Eval(getPos(node), tCode());
        };
      }
    }
    tFunc = translate(func, scope, "expression", unassigned);
    tArgs = arrayTranslate(
      getPos(node),
      args,
      scope,
      false,
      true,
      unassigned
    );
    return function () {
      var args, func;
      func = tFunc();
      args = tArgs();
      if (args instanceof ast.Arr) {
        return ast.Call(getPos(node), func, args.elements, func instanceof ast.Ident && __owns.call(primordialsBetterWithNew, func.name));
      } else if (func instanceof ast.Binary && func.op === ".") {
        return scope.maybeCache(func.left, Type["function"], function (setParent, parent) {
          return ast.Call(
            getPos(node),
            ast.Access(getPos(node), setParent, func.right, "apply"),
            [parent, args]
          );
        });
      } else {
        return ast.Call(
          getPos(node),
          ast.Access(getPos(node), func, "apply"),
          [
            ast.Const(getPos(node), void 0),
            args
          ]
        );
      }
    };
  }
  function translateLispy(node, scope, location, unassigned) {
    var args, func, ident, name;
    switch (node.nodeTypeId) {
    case 0:
      return function () {
        return ast.Const(getPos(node), node.value);
      };
    case 1:
      switch (node.symbolTypeId) {
      case 1:
        name = node.name;
        switch (name) {
        case "arguments":
          return function () {
            return ast.Arguments(getPos(node));
          };
        case "this":
          return function () {
            scope.usedThis = true;
            if (scope.bound) {
              return ast.Ident(getPos(node), "_this");
            } else {
              return ast.This(getPos(node));
            }
          };
        default:
          scope.addHelper(name);
          return function () {
            var ident;
            ident = ast.Ident(getPos(node), name);
            if (!scope.options.embedded || isPrimordial(name) || location !== "expression" || scope.hasVariable(ident) || scope.macros.hasHelper(name)) {
              return ident;
            } else {
              return ast.Access(
                getPos(node),
                ast.Ident(getPos(node), "context"),
                ast.Const(getPos(node), name)
              );
            }
          };
        }
        break;
      case 2:
        ident = scope.getTmp(getPos(node), node.id, node.name, node.scope.type(node));
        return function () {
          return ident;
        };
      case 0:
        if (node.isNothing) {
          return function () {
            return ast.Noop(getPos(node));
          };
        } else {
          throw new Error("Unhandled symbol: " + __typeof(node));
        }
        break;
      default: throw new Error("Unhandled value in switch");
      }
      break;
    case 2:
      func = node.func;
      args = node.args;
      if (func.isSymbol) {
        switch (func.symbolTypeId) {
        case 0:
          return translateLispyInternal[func.internalId](
            node,
            args,
            scope,
            location,
            unassigned
          );
        case 3:
          return translateLispyOperator[func.operatorTypeId](
            node,
            args,
            scope,
            location,
            unassigned
          );
        }
      }
      return translateLispyCall(
        node,
        func,
        args,
        scope,
        location,
        unassigned
      );
    default: throw new Error("Unhandled value in switch");
    }
  }
  function translate(node, scope, location, unassigned) {
    return translateLispy(node, scope, location, unassigned);
  }
  function translateFunctionBody(pos, scope, body, unassigned) {
    var _ref, translatedBody;
    if (unassigned == null) {
      unassigned = {};
    }
    translatedBody = translate(body, scope, "topStatement", unassigned)();
    if (pos.file) {
      if (!(_ref = translatedBody.pos).file) {
        _ref.file = pos.file;
      }
    }
    return {
      wrap: function (x) {
        return x;
      },
      body: translatedBody
    };
  }
  function makeGetPos(getPosition) {
    return function (node) {
      var pos;
      pos = getPosition(node.index);
      return makePos(pos.line, pos.column);
    };
  }
  function propagateFilenames(node) {
    var file;
    file = node.pos.file;
    if (file) {
      return node.walk(function (subnode) {
        var _ref;
        if (!(_ref = subnode.pos).file) {
          _ref.file = file;
        }
        return propagateFilenames(subnode);
      });
    } else {
      return node.walk(propagateFilenames);
    }
  }
  function translateRoot(roots, scope, getPosition) {
    var _arr, _i, _len, _ref, bareInit, body, callFunc, comments, commentsBody,
        fakeThis, helper, ident, init, innerScope, name, noPos, ret, root,
        rootBody, rootPos, walker;
    if (!__isArray(roots)) {
      roots = [roots];
    }
    if (!__isArray(getPosition)) {
      getPosition = [getPosition];
    }
    if (roots.length === 0) {
      return ast.Root(
        { line: 0, column: 0 },
        ast.Noop({ line: 0, column: 0 }),
        [],
        []
      );
    }
    function splitComments(body) {
      var comments;
      comments = [];
      while (true) {
        if (body instanceof ast.Comment) {
          comments.push(body);
          body = ast.Noop(body.pos);
        } else if (body instanceof ast.Block && body.body[0] instanceof ast.Comment) {
          comments.push(body.body[0]);
          body = ast.Block(body.pos, __slice.call(body.body, 1));
        } else {
          break;
        }
      }
      return { comments: comments, body: body };
    }
    noPos = makePos(0, 0);
    innerScope = scope;
    if (scope.options.embedded) {
      innerScope = scope.clone();
      for (_arr = ["write", "context"], _i = 0, _len = _arr.length; _i < _len; ++_i) {
        name = _arr[_i];
        ident = ast.Ident(
          { line: 0, column: 0 },
          name
        );
        innerScope.addVariable(ident);
        innerScope.markAsParam(ident);
      }
    }
    function handleEmbedded(body, wrap, scope) {
      var commentsBody;
      if (scope.options.embedded) {
        commentsBody = splitComments(body);
        body = commentsBody.body;
        return ast.Block(body.pos, commentsBody.comments.concat([
          ast.Return(body.pos, wrap(ast.Func(
            body.pos,
            null,
            [
              ast.Ident(body.pos, "write"),
              ast.Ident(body.pos, "context")
            ],
            scope.getVariables(),
            ast.Block(body.pos, [
              ast.If(
                body.pos,
                ast.Binary(
                  body.pos,
                  ast.Ident(body.pos, "context"),
                  "==",
                  ast.Const(body.pos, null)
                ),
                ast.Assign(
                  body.pos,
                  ast.Ident(body.pos, "context"),
                  ast.Obj(body.pos)
                )
              ),
              body
            ]),
            [],
            root.args[3].constValue()
          )))
        ]));
      } else {
        return wrap(body);
      }
    }
    if (roots.length === 1) {
      getPos = makeGetPos(getPosition[0]);
      root = roots[0];
      if (!(root instanceof ParserNode) || !root.isInternalCall("root")) {
        throw new Error("Cannot translate non-Root object");
      }
      rootPos = getPos(root);
      rootPos.file = root.args[0].constValue();
      rootBody = root.args[1];
      if (scope.options["return"] || scope.options["eval"]) {
        rootBody = ParserNode.InternalCall("return", rootBody.index, rootBody.scope, rootBody);
      }
      ret = translateFunctionBody(rootPos, innerScope, rootBody);
      if (!(_ref = ret.body.pos).file) {
        _ref.file = rootPos.file;
      }
      getPos = null;
      body = handleEmbedded(ret.body, ret.wrap, innerScope);
    } else {
      body = ast.Block(noPos, (function () {
        var _arr, _arr2, _len, _ref, bodyScope, comments, i, ret, root,
            rootBody, rootPos;
        _arr = [];
        for (_arr2 = __toArray(roots), i = 0, _len = _arr2.length; i < _len; ++i) {
          root = _arr2[i];
          getPos = makeGetPos(getPosition[i]);
          if (!(root instanceof ParserNode) || !root.isInternalCall("root")) {
            throw new Error("Cannot translate non-Root object");
          }
          bodyScope = innerScope.clone(false);
          ret = translateFunctionBody(getPos(root), bodyScope, root.args[1]);
          rootPos = getPos(root);
          rootPos.file = root.args[0].constValue();
          if (!(_ref = ret.body.pos).file) {
            _ref.file = rootPos.file;
          }
          getPos = null;
          _ref = splitComments(ret.body);
          comments = _ref.comments;
          rootBody = _ref.body;
          _ref = null;
          _arr.push(ast.Block(rootPos, comments.concat([
            ast.Call(
              rootPos,
              ast.Access(
                rootPos,
                ast.Func(
                  rootPos,
                  null,
                  [],
                  bodyScope.getVariables(),
                  handleEmbedded(ret.body, ret.wrap, bodyScope)
                ),
                ast.Const(rootPos, "call")
              ),
              [ast.This(rootPos)]
            )
          ])));
        }
        return _arr;
      }()));
    }
    commentsBody = splitComments(body);
    comments = commentsBody.comments;
    body = commentsBody.body;
    init = [];
    if (innerScope.hasBound && innerScope.usedThis) {
      fakeThis = ast.Ident(body.pos, "_this");
      innerScope.addVariable(fakeThis);
      init.push(ast.Assign(body.pos, fakeThis, ast.This(body.pos)));
    }
    scope.fillHelperDependencies();
    for (_arr = __toArray(scope.getHelpers()), _i = 0, _len = _arr.length; _i < _len; ++_i) {
      helper = _arr[_i];
      if (helper !== "GLOBAL" && scope.macros.hasHelper(helper)) {
        ident = ast.Ident(body.pos, helper);
        scope.addVariable(ident);
        init.push(ast.Assign(body.pos, ident, scope.macros.getHelper(helper)));
      }
    }
    bareInit = [];
    if (scope.options["eval"]) {
      walker = function (node) {
        if (node instanceof ast.Func) {
          scope.addHelper("GLOBAL");
          if (node.name != null) {
            return ast.Block(node.pos, [
              node,
              ast.Assign(
                node.pos,
                ast.Access(
                  node.pos,
                  ast.Ident(node.pos, "GLOBAL"),
                  node.name.name
                ),
                node.name
              )
            ]);
          } else {
            return node;
          }
        } else if (node instanceof ast.Binary && node.op === "=" && node.left instanceof ast.Ident) {
          scope.addHelper("GLOBAL");
          return ast.Assign(
            node.pos,
            ast.Access(
              node.pos,
              ast.Ident(node.pos, "GLOBAL"),
              node.left.name
            ),
            node.walk(walker)
          );
        }
      };
      body = body.walk(walker);
      body = body.mutateLast(
        function (node) {
          scope.addHelper("GLOBAL");
          return ast.Assign(
            node.pos,
            ast.Access(
              node.pos,
              ast.Ident(node.pos, "GLOBAL"),
              ast.Const(node.pos, "_")
            ),
            node
          );
        },
        { "return": true }
      );
    }
    body = propagateFilenames(body);
    if (scope.options.bare) {
      if (scope.hasHelper("GLOBAL")) {
        scope.addVariable(ast.Ident(body.pos, "GLOBAL"));
        bareInit.unshift(ast.Assign(
          body.pos,
          ast.Ident(body.pos, "GLOBAL"),
          scope.macros.getHelper("GLOBAL")
        ));
      }
      if (scope.options.undefinedName != null) {
        scope.addVariable(scope.options.undefinedName);
      }
      return propagateFilenames(ast.Root(
        body.pos,
        ast.Block(body.pos, comments.concat(bareInit, init, [body])),
        scope.getVariables(),
        ["use strict"]
      ));
    } else {
      callFunc = ast.Call(
        body.pos,
        ast.Access(
          body.pos,
          ast.Func(
            body.pos,
            null,
            (scope.hasHelper("GLOBAL")
              ? [ast.Ident(body.pos, "GLOBAL")]
              : []).concat(scope.options.undefinedName != null
              ? [ast.Ident(body.pos, scope.options.undefinedName, true)]
              : []),
            scope.getVariables(),
            ast.Block(body.pos, init.concat([body])),
            ["use strict"]
          ),
          "call"
        ),
        [ast.This(body.pos)].concat(scope.hasHelper("GLOBAL") ? [scope.macros.getHelper("GLOBAL")] : [])
      );
      if (scope.options["return"]) {
        callFunc = ast.Return(body.pos, callFunc);
      }
      return ast.Root(
        body.pos,
        ast.Block(body.pos, comments.concat(bareInit, [callFunc])),
        [],
        []
      );
    }
  }
  module.exports = function (node, macros, getPosition, options) {
    var endTime, result, scope, startTime;
    if (options == null) {
      options = {};
    }
    startTime = new Date().getTime();
    try {
      scope = Scope(options, macros, false);
      result = translateRoot(node, scope, getPosition);
      scope.releaseTmps();
    } catch (e) {
      if (typeof callback !== "undefined" && callback !== null) {
        return callback(e);
      } else {
        throw e;
      }
    }
    endTime = new Date().getTime();
    if (typeof options.progress === "function") {
      options.progress("translate", endTime - startTime);
    }
    return { node: result, time: endTime - startTime };
  };
  module.exports.defineHelper = function (macros, getPosition, name, value, type, dependencies) {
    var helper, ident, scope;
    scope = Scope({}, macros, false);
    getPos = makeGetPos(getPosition);
    if (typeof name === "string") {
      ident = ast.Ident(
        makePos(0, 0),
        name
      );
    } else if (name instanceof ParserNode.Symbol.ident) {
      ident = translate(name, scope, "leftExpression")();
    } else {
      throw new TypeError("Expecting name to be a String or Ident, got " + __typeof(name));
    }
    if (!(ident instanceof ast.Ident)) {
      throw new Error("Expected name to be an Ident, got " + __typeof(ident));
    }
    if (value instanceof AstNode) {
      helper = value;
    } else if (value instanceof ParserNode) {
      helper = translate(value, scope, "expression")();
    } else {
      throw new TypeError("Expected value to be a parser or ast Node, got " + __typeof(value));
    }
    if (dependencies == null) {
      dependencies = scope.getHelpers();
    }
    macros.addHelper(ident.name, helper, type, dependencies);
    getPos = null;
    return { helper: helper, dependencies: dependencies };
  };
}.call(this));
