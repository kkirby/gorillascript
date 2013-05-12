let iterator-to-array(iterator, values = [])
  values.reverse()
  values.push void
  let arr = []
  while true
    try
      arr.push if iterator.send
        iterator.send values.pop()
      else
        iterator.next()
    catch e
      if e == StopIteration
        return arr
      else
        throw e

test "single-value yield on single-line", #
  let fun(value)* -> yield value
  
  array-eq ["alpha"], iterator-to-array(fun("alpha"))
  array-eq ["bravo"], iterator-to-array(fun("bravo"))
  array-eq ["charlie"], iterator-to-array(fun("charlie"))

test "single-value yield this on single-line", #
  let fun()* -> yield this
  
  let obj = {}
  array-eq [obj], iterator-to-array(fun@(obj))

test "single-value bound yield this on single-line", #
  let get-iter()
    let fun()@* -> yield this
  
  let obj = {}
  array-eq [obj], iterator-to-array(get-iter@(obj)())

test "multi-valued yield", #
  let fun()*
    yield "alpha"
    yield "bravo"
    yield "charlie"
  
  array-eq ["alpha", "bravo", "charlie"], iterator-to-array(fun())

test "yield with conditional", #
  let fun(value)*
    yield "alpha"
    if value
      yield "bravo"
    yield "charlie"
  
  array-eq ["alpha", "bravo", "charlie"], iterator-to-array(fun(true))
  array-eq ["alpha", "charlie"], iterator-to-array(fun(false))

test "yield with variables", #
  let fun()*
    let mutable i = 0
    yield i
    i += 1
    yield i
    i += 1
    yield i
  
  array-eq [0, 1, 2], iterator-to-array(fun())

test "yield with conditional that has no inner yields", #
  let fun(value)*
    yield "alpha"
    let mutable next = void
    if value
      next := "bravo"
    else
      next := "charlie"
    yield next

  array-eq ["alpha", "bravo"], iterator-to-array(fun(true))
  array-eq ["alpha", "charlie"], iterator-to-array(fun(false))

test "yield with while", #
  let fun()*
    yield 0
    let mutable i = 1
    while i < 10
      yield i
      i += 1
    yield 10
  
  array-eq [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], iterator-to-array(fun())

test "yield with while and increment", #
  let fun()*
    yield 0
    let mutable i = 1
    while i < 10, i += 1
      yield i
    yield 10
  
  array-eq [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], iterator-to-array(fun())

test "yield with while and break", #
  let fun()*
    yield 0
    let mutable i = 1
    while i < 10
      if i > 5
        break
      yield i
      i += 1
    yield 10
  
  array-eq [0, 1, 2, 3, 4, 5, 10], iterator-to-array(fun())

test "yield with while and break that has no inner yields", #
  let fun(value)*
    yield "alpha"
    let mutable i = 1
    while i < 10
      if i > 5
        break
      i += 1
    yield i

  array-eq ["alpha", 6], iterator-to-array(fun())

test "yield with while and increment and continue", #
  let fun()*
    yield 0
    let mutable i = 1
    while i < 10, i += 1
      if i == 5
        i := 6
        continue
      yield i
    yield 10
  
  array-eq [0, 1, 2, 3, 4, 7, 8, 9, 10], iterator-to-array(fun())

test "yield with for-in", #
  let fun(arr)*
    yield "start"
    for x in arr
      yield x
    yield "end"
  
  array-eq ["start", "a", "b", "c", "d", "e", "end"], iterator-to-array(fun(["a", "b", "c", "d", "e"]))

test "yield with for-range", #
  let fun(start, finish)*
    yield start
    for i in start + 1 til finish
      yield i
    yield finish
  
  array-eq [1, 2, 3, 4, 5, 6], iterator-to-array(fun(1, 6))

test "yield with for-of", #
  let fun(obj)*
    yield ["start", 0]
    for k, v of obj
      yield [k, v]
    yield ["end", 1]
  
  array-eq [["alpha", "bravo"], ["charlie", "delta"], ["echo", "foxtrot"], ["end", 1], ["start", 0]], iterator-to-array(fun({ alpha: "bravo", charlie: "delta", echo: "foxtrot" })).sort #(a, b) -> a[0] <=> b[0]

test "yield with for-of with inheritance", #
  let fun(obj)*
    yield ["start", 0]
    for k, v of obj
      yield [k, v]
    yield ["end", 1]
  
  let Class()!
    @alpha := "bravo"
  Class::charlie := "delta"
  
  array-eq [["alpha", "bravo"], ["end", 1], ["start", 0]], iterator-to-array(fun(new Class)).sort #(a, b) -> a[0] <=> b[0]

test "yield with for-ofall with inheritance", #
  let fun(obj)*
    yield ["start", 0]
    for k, v ofall obj
      yield [k, v]
    yield ["end", 1]
  
  let Class()!
    @alpha := "bravo"
  Class::charlie := "delta"
  
  array-eq [["alpha", "bravo"], ["charlie", "delta"], ["end", 1], ["start", 0]], iterator-to-array(fun(new Class)).sort #(a, b) -> a[0] <=> b[0]

test "yield with for-from", #
  let range(start, finish)*
    for i in start til finish
      yield i
  
  let fun()*
    yield 0
    for item from range(1, 10)
      yield item
    yield 10
  
  array-eq [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], iterator-to-array fun()

test "yield*", #
  let range(start, finish)*
    for i in start til finish
      yield i
  
  let fun()*
    yield 0
    yield* range(1, 10)
    yield 10
  
  array-eq [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], iterator-to-array fun()

test "yield with try-catch", #  
  let obj = {}
  let fun(value)*
    yield "alpha"
    try
      yield "bravo"
      if value
        throw obj
      yield "charlie"
    catch e
      eq obj, e
      yield "delta"
    yield "echo"
  array-eq ["alpha", "bravo", "delta", "echo"], iterator-to-array fun(true)
  array-eq ["alpha", "bravo", "charlie", "echo"], iterator-to-array fun(false)

test "yield with try-finally", #
  let cleanup = runOnce void
  let obj = {}
  let fun-this = {}
  let fun()*
    eq this, fun-this
    yield "alpha"
    try
      eq this, fun-this
      yield "bravo"
      throw obj
      yield "charlie"
    finally
      eq this, fun-this
      cleanup()
    yield "delta"
  
  let g = fun@(fun-this)
  eq "alpha", g.next()
  eq "bravo", g.next()
  throws g.next, #(e) -> e == obj
  ok cleanup.ran
  throws g.next, #(e) -> e == StopIteration

test "yield with switch", #
  let fun(get-value)*
    switch get-value()
    case 0; yield 0
    case 1
      yield 1
      yield 2
    case 2
      yield 3
      fallthrough
    case 3
      yield 4
      yield 5
    default
      yield 6
      yield 7
  
  array-eq [0], iterator-to-array fun(run-once 0)
  array-eq [1, 2], iterator-to-array fun(run-once 1)
  array-eq [3, 4, 5], iterator-to-array fun(run-once 2)
  array-eq [4, 5], iterator-to-array fun(run-once 3)
  array-eq [6, 7], iterator-to-array fun(run-once 4)

test "yield in let statement", #
  let fun()*
    let x = yield 1
    yield x

  array-eq [1, 2], iterator-to-array fun(), [2]

test "yield in assign statement", #
  let order-list = []
  let order(value)
    order-list.push value
    value
  let obj = {}
  let fun()*
    obj[order(\key)] := yield order(\value)
    array-eq [\key, \value], order-list
    yield obj.key
  
  array-eq [\value, \alpha], iterator-to-array fun(), [\alpha]
