# GorillaScript Community Release v1.0.0

## June 15th, 2016 (v1.0.2)

Fixed bugs with async functions

## June 14th, 2016 (v1.0.1)

Added an `async!` macro ala `promise!`

## June 14th, 2016 (v1.0.0)

Made #** produce an async function and added await keyword. Usage:

	#**
		await abc()

The old syntax of:

  # -> promise!
	    yield abc()

Is still valid.

## April 8th, 2015 (v0.10.0)

GorillaScript community release 0.10.0 aimed to erridcate built-in generators and add iojs support. I'm happy to say that GorillaScript now defaults to using ES6 generator/yields and is fully compatable with iojs!

