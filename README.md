# @isthmus/atom
This is intended to be a minimilistic implementation of Atoms. We will define an Atom as:
> A mutable reference to objects which are treated as immutable.  

It may be useful to also define 3 specific types of atoms.  
root atom:  
> The basic atom, which as no dependencies on other atoms. Always writable.  
lensed atom:  
> An atom which views a slice of another atom. It is writable if its source is writable. Writes will propagate to the top-most writable source atom.  
computed atom:  
> Computes from other atoms. Always readonly.  

## Why @isthmus/atom?
This library intends to focus on maintaing a small footprint and being understandable. If you would like to use streams/atoms but fear about bloat or have a hard time understanding other projects then this may be a good choice for you.   

The UMD build (as of 6/27/2017) clocks in just over 4kB gzipped:
```bash
> gzip -c dist/atom.js | wc -c
4310
```

## Installation
You can install _@isthmus/atom_ with:
```
npm install --save @isthmus/atom
```

Then to use in your JavaScript:
```js
import { Atom, combine, scanMerge } from '@isthmus/atom'

// and then use...
```

There is a umd version available under `@isthmus/atom/dist/atom.js`:
```html
<script src="https//unpkg.com/@isthmus/atom/dist/atom.js"></script>
```

## API
Note that all functions without optional arguments are curried with `R.curry`.

  * [Atom](#Atom)
  * [atom](#atom)
  * [combine](#combine)
  * [map](#map)
  * [view](#view)
  * [isAtom](#isAtom)
  * [modify](#modify)
  * [scan](#scan)
  * [merge](#merge)
  * [scanMerge](#scanMerge)
  * [end](#end)
  * [log](#log)
  * [toJSON](#toJSON)
  * [valueOf](#valueOf)
  * [HALT](#HALT)

### Atom
> Atom(any?) -> atom  
`Atom` is a function which returns a root atom. It optionally can receive an initial value as its argument.  
```js
const state = Atom({ foo: { bar: [1, 2, 3] } })
```

### atom
> atom(any?) -> atom | any  
`atom`s are functions which can be called with an argument to set its current value.  
```js
const atom = Atom(1) // 1
atom(7) // 7
```
or called with no argument to retrieve its value:  
```js
x = atom() + 1 // 8
```

### combine
> combine(fn, sources[]) -> computed atom  
`combine` is a function which returns a computed atom from one or more atoms.  
```js
const n = Atom(7) 
const m = Atom(2)
const sum = combine(R.add, [n, m]) // 9

m(3) // sum: 10
```

### map
> map(fn, source) -> computed atom  
`map` is an aliased version of combine for when mapping from just one atom.  
```js
const n = Atom(3)
const sqr = map(x => x * x, n) // 9
```
for convenience, each atom has a `map` method bound to it:  
```js
const doubled = n.map(R.multiply(2)) // 6
```

### view
> view(lens, atom) --> lensed atom  
`view` returns a lensed atom. It can receive a string, number or array of the two which will be passed onto `R.lensProp`, `R.lensIndex` and `R.lensPath`, resp.  
```js
const source = Atom({ foo: [1, 2, 3] })
const lensed = view(['foo', 1], source) // 2; is equivelant to: view(R.lensPath(['foo', 1]), source)
lensed(7) // 7; source: { foo: [1, 7, 3] }

const mapped = map(R.identity, source)
const readonly = view(['foo', 1], mapped) // 2; is readonly so readonly(7) -> Error
```
for convenience, each atom has a `view` method bound to it:
```js
const atom = Atom(['a', 'b', 'c'])
const head = atom.view(0) // 'a'
```

### isAtom
> isAtom(any) -> boolean  
`isAtom` is a helper function which returns if the given argument is an atom.  
```js
const source = Atom([1, 2, 3]) // [1, 2, 3]
const computed = map(x => ({ x }), source) // { x: [1, 2, 3] }
const lensed = view(['x', 1], computed) // 2

isAtom(source) // true
isAtom(computed) // true
isAtom(lensed) // true

isAtom(123) // false
isAtom('my string') // false
isAtom({ foo: 'bar' }) // false
```

### modify
> modify(fn, atom) -> atom  
`modify` accepts a function which will receive the current value of the given atom. Its returned value will be set on the atom.    
It returns the atom being modified so it can be chained.  
```js
const atom = Atom(7)
modify(R.add(3), atom) // atom: 10
```
for convenience, each atom has a `modify` method bound to it:
```js
atom.modify(R.add(10)) // atom: 20
```

### scan
> scan(fn, seed, atom) -> computed atom  
`scan` accepts an accumulator function and seed. Note that it fires immediately with any current value of its parent atom.  
```js
const nums = Atom(1)
const sum = scan((prev, next) => prev + next, 0, nums) // 1
```
for convenience, each atom has a `scan` method bound to it:
```js
const clicks = Atom()
const clickCount = clicks.scan(R.add(1), -1) // 0

document.addEventListener('click', clicks)
```

### merge
> merge(atom1, atom2) -> computed atom  
`merge` returns a computed atom from two sources. It has the value of whichever last updated. It will initialize as the value of the second atom passed in.  
```js
const atom1 = Atom(1)
const atom2 = Atom('a')
const merged = merge(atom1, atom2) // 'a'

atom1(1) // merged: 1
```

### scanMerge
> scanMerge(pairs, seed)  
`scanMerge` accepts an array of arrays which contain an accumulator function and its atom, and a seed.  
The resulting atom will update whenever one of its sources does according to the related accumulator function.  
```js
const s1 = Atom(0)
const s2 = Atom(0)
const s3 = Atom(0)

const scanmerged = scanMerge([
  [R.add, s1],
  [R.multiply, s2],
  [R.subtract, s2]
], 0) // 0

s1(2) // scanmerged: 2
s2(3) // scanmerged: 6
s3(8) // scanmerged: -2
```

### log
> log(values[])  
`log` is a helper function intended for development use which logs values given to it. If they are an atom, it will print its current value.  
```js
const atom = Atom('bar')
log('foo', atom) // > foo bar
```
for convenience, each atom has a `log` method bound to it:  
```js
atom.log() // > 'bar'
```

### atom.toJSON
For serialization, each atom has a `toJSON` method.  
```js
const value = Atom(123)
const serialized = JSON.stringify(value)
console.log(serialized) // > 123
```
(_example borrowed from mithril_)

### atom.valueOf
For serialization, each atom has a `valueOf` method.  
```js
const value = Atom(123)
console.log('test ' + value) // > "test 123"
```
(_example borrowed from mithril_)

### HALT
`HALT` is a string constant which has two purposes.  
1) To create "cold" Atoms, that is: computed atoms will not fire immediately (seeds will be used as intial values in the case of scan, scanMerge):  
```js
const atom = Atom(HALT)
const count = scan(R.add(1), 0, atom) // 0

document.addEventListener('click', atom)
// click -> 1
// click -> 2
```

2) To be returned in a computed atoms compute function in order to prevent children from updating.  
```js
const a = Atom(1)
const b = map(val => val % 2 === 0 ? HALT : val)(a)

const c = Atom(2)

const d = combine(R.add, [b, c]) // 3

a(2) // b: HALT, d: 3
c(4) // d: 3
a(3) // b: 3, d: 7
```
Notes:  
1. Even one source having a `HALT` value will stop all updates for descendants.  
1. `HALT` should not be set via `atom(HALT)`. This will throw an error.
1. `HALT` is not intended to be used with lensed atoms.

### end
> end(atom)  
`end` turns off an atom and its descendants. This will allow its data to be garbage collected.    
For convenience, each atom has a bound `end` method  
```js
const atom = Atom(foo)

// later
atom.end()
```

## Acknowledgements
_@isthmus/atom_ draws inspiration from [mithril streams](https://github.com/MithrilJS/mithril.js/blob/master/docs/stream.md), [flyd](https://github.com/paldepind/flyd) and [calmm-js](https://github.com/calmm-js/documentation/blob/master/introduction-to-calmm.md). It utilizes [ramda](https://github.com/ramda/ramda) as its only dependency.