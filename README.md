=== GorillaScript (Active Development) ===

The aim of this fork is to make improvments to the wondeful langauge GorillaScript. Currently ckknight hasn't made any changes to GorillaScript in over two years and isn't merging pull requests.

##Goals

1. Clean up the parser code, add comments.
2. Fix contextual bugs (such as yielding from a scoped for loop)
3. Allow for multiline expressions (if statements, for loops, etc)
4. Add in compile time type checking, or use something like [closure compiler](https://developers.google.com/closure/compiler/)/[Flow](http://flowtype.org)
    This would allow the removal of a lot of helper functions.
5. Remove the support for dashed identifiers as it can cause confusion:
    Example: a-b, should it mean variable a-b, or a minus b?
    We should use the latter.
6. Bring back native bitwise operations syntax. (<<,>>,|,etc)

I'm sure there is much more that could be added to really make GS a great language. I'm accepting pull requests!

##Achievements

-	Remove all built-in generator support and rely on ES6 generators/3rd party shims.

##Release

As of April 8th, a community release of GorillaScript has been made, upping the version from 0.9.10 to 0.10.0. Check out the [release](RELEASE.md) for details.

=== Original Readme ===

GorillaScript is a compile-to-JavaScript language designed to empower the user while attempting to prevent some common errors.

To install:
  sudo npm install -g gorillascript

Run a script:
  gorilla /path/to/script.gs

Compile a script:
  gorilla -c /path/to/script.gs

More options:
  gorilla --help

For documentation, see http://ckknight.github.io/gorillascript/

To suggest a feature or report a bug:
http://github.com/ckknight/gorillascript/issues/

If you have questions or would like to chat about GorillaScript, join us at #gorillascript on Freenode IRC or on http://webchat.freenode.net/?channels=gorillascript.

Source repository:
git://github.com/ckknight/gorillascript.git
