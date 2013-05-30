require! ast: './jsast'

module.exports := #(root, sources)
  let done-lines-by-file = { extends null }
  let walker(node, parent, position)
    let pos = node.pos
    let {file, line} = pos
    if file and sources[file] and line > 0
      let done-lines = done-lines-by-file[file] ?= []
      if not done-lines[line]
        unless (node instanceof ast.Binary and node.op == "." and parent instanceof ast.Call and position == \func) or (parent instanceof ast.Func and position == \param) or (parent instanceof ast.TryCatch and position == \catch-ident) or (parent instanceof ast.ForIn and position == \key) or (parent instanceof ast.Binary and parent.is-assign() and position == \left) or (parent instanceof ast.Switch and position == \case-node) or (parent instanceofsome [ast.IfStatement, ast.IfExpression] and position == \test and parent.test.pos.line == parent.when-true.pos.line) or node instanceof ast.Noop or (node instanceof ast.Func and node.body.pos.line == line) or (parent instanceof ast.Unary and parent.is-assign())
          done-lines[line] := true
          ast.Block pos, [
            ast.Unary pos, "++", ast.Access pos,
              ast.Ident pos, \_$jscoverage
              ast.Const pos, file
              ast.Const pos, line
            node.walk walker
          ]
  let walked = root.walk walker
  let pos = root.pos
  ast.Root pos, ast.Block(pos, [
    ast.TryCatch pos,
      ast.If pos,
        ast.And pos,
          ast.Binary pos,
            ast.Unary pos, \typeof, ast.Ident pos, \top
            "==="
            ast.Const pos, \object
          ast.Binary pos,
            ast.Ident pos, \top
            "!=="
            ast.Const pos, null
          ast.Binary pos,
            ast.Unary pos, \typeof, ast.Access pos,
              ast.Ident pos, \top
              ast.Const pos, \opener
            "==="
            ast.Const pos, \object
          ast.Binary pos,
            ast.Access pos,
              ast.Ident pos, \top
              ast.Const pos, \opener
            "!=="
            ast.Const pos, null
          ast.Unary pos, "!", ast.Access pos,
            ast.Ident pos, \top
            ast.Const pos, \opener
            ast.Const pos, \_$jscoverage
        ast.Assign pos,
          ast.Access pos,
            ast.Ident pos, \top
            ast.Const pos, \opener
            ast.Const pos, \_$jscoverage
          ast.Obj pos
      ast.Ident pos, \e
      ast.Noop pos
    
    ast.TryCatch pos,
      ast.If pos,
        ast.And pos,
          ast.Binary pos,
            ast.Unary pos, \typeof, ast.Ident pos, \top
            "==="
            ast.Const pos, \object
          ast.Binary pos,
            ast.Ident pos, \top
            "!=="
            ast.Const pos, null
        ast.Block pos, [
          ast.TryCatch pos,
            ast.If pos,
              ast.And pos,
                ast.Binary pos,
                  ast.Unary pos, \typeof, ast.Access pos,
                    ast.Ident pos, \top
                    ast.Const pos, \opener
                  "==="
                  ast.Const pos, \object
                ast.Binary pos,
                  ast.Access pos,
                    ast.Ident pos, \top
                    ast.Const pos, \opener
                  "!=="
                  ast.Const pos, null
                ast.Access pos,
                  ast.Ident pos, \top
                  ast.Const pos, \opener
                  ast.Const pos, \_$jscoverage
              ast.Assign pos,
                ast.Access pos,
                  ast.Ident pos, \top
                  ast.Const pos, \_$jscoverage
                ast.Access pos,
                  ast.Ident pos, \top
                  ast.Const pos, \opener
                  ast.Const pos, \_$jscoverage
            ast.Ident pos, \e
            ast.Noop pos
          ast.If pos,
            ast.Unary pos, "!", ast.Access pos,
              ast.Ident pos, \top
              ast.Const pos, \_$jscoverage
            ast.Assign pos,
              ast.Access pos,
                ast.Ident pos, \top
                ast.Const pos, \_$jscoverage
              ast.Obj pos
        ]
      ast.Ident pos, \e
      ast.Noop pos
    
    ast.TryCatch pos,
      ast.If pos,
        ast.And pos,
          ast.Binary pos,
            ast.Unary pos, \typeof, ast.Ident pos, \top
            "==="
            ast.Const pos, \object
          ast.Binary pos,
            ast.Ident pos, \top
            "!=="
            ast.Const pos, null
          ast.Access pos,
            ast.Ident pos, \top
            ast.Const pos, \_$jscoverage
      ast.Ident pos, \e
      ast.Noop pos
    
    ast.If pos,
      ast.Binary pos,
        ast.Unary pos, \typeof, ast.Ident pos, \_$jscoverage
        "!=="
        ast.Const pos, \object
      ast.Assign pos,
        ast.Ident pos, \_$jscoverage
        ast.Obj pos
    
    ...(for file, lines of done-lines-by-file
      let line-numbers = []
      for line, i in lines
        if line
          line-numbers.push i
      ast.If pos,
        ast.Unary pos, "!", ast.Access pos,
          ast.Ident pos, \_$jscoverage
          ast.Const pos, file
        ast.Call pos, ast.Func pos,
          null
          []
          [\cov, \i, \lines]
          ast.Block pos, [
            ast.Assign pos,
              ast.Access pos,
                ast.Ident pos, \_$jscoverage
                ast.Const pos, file
              ast.Ident pos, \cov
              ast.Arr pos, []
            ast.For pos,
              ast.Block pos, [
                ast.Assign pos,
                  ast.Ident pos, \i
                  ast.Const pos, 0
                ast.Assign pos,
                  ast.Ident pos, \lines
                  ast.Arr pos, for line in line-numbers
                    ast.Const pos, line
              ]
              ast.Binary pos,
                ast.Ident pos, \i
                "<"
                ast.Const pos, line-numbers.length
              ast.Unary pos, "++", ast.Ident pos, \i
              ast.Assign pos,
                ast.Access pos,
                  ast.Ident pos, \cov
                  ast.Access pos,
                    ast.Ident pos, \lines
                    ast.Ident pos, \i
                ast.Const pos, 0
            ast.Assign pos,
              ast.Access pos,
                ast.Ident pos, \cov
                ast.Const pos, \source
              ast.Arr pos,
                for line in sources[file].split r"(?:\r\n?|[\n\u2028\u2029])"g
                  ast.Const pos, line
          ])
    walked.body
  ]), walked.variables, walked.declarations


/*
JSCoverage 0.5.1 writes out a prelude that looks something like this:  

    try {
      if (typeof top === 'object' && top !== null && typeof top.opener === 'object' && top.opener !== null) {
        // this is a browser window that was opened from another window

        if (! top.opener._$jscoverage) {
          top.opener._$jscoverage = {};
        }
      }
    }
    catch (e) {}

    try {
      if (typeof top === 'object' && top !== null) {
        // this is a browser window

        try {
          if (typeof top.opener === 'object' && top.opener !== null && top.opener._$jscoverage) {
            top._$jscoverage = top.opener._$jscoverage;
          }
        }
        catch (e) {}

        if (! top._$jscoverage) {
          top._$jscoverage = {};
        }
      }
    }
    catch (e) {}

    try {
      if (typeof top === 'object' && top !== null && top._$jscoverage) {
        _$jscoverage = top._$jscoverage;
      }
    }
    catch (e) {}
    if (typeof _$jscoverage !== 'object') {
      _$jscoverage = {};
    }
    if (! _$jscoverage['collection.js']) {
      _$jscoverage['collection.js'] = [];
      _$jscoverage['collection.js'][1] = 0;
      _$jscoverage['collection.js'][2] = 0;
      _$jscoverage['collection.js'][5] = 0;
      _$jscoverage['collection.js'][9] = 0;
      _$jscoverage['collection.js'][14] = 0;
      _$jscoverage['collection.js'][15] = 0;
      _$jscoverage['collection.js'][16] = 0;
      _$jscoverage['collection.js'][22] = 0;
      _$jscoverage['collection.js'][27] = 0;
    }
    
*/