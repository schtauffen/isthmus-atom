// @isthmus/atom - Copyright (c) 2017, Zach Dahl; This source code is licensed under the ISC-style license found in the LICENSE file in the root directory of this source tree
import { __, curry, curryN } from 'crry'
import { set as _set, view as _view } from './optics'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./assert')
}

export { __, curry, curryN }
export var HALT = '@@isthmus/atom/halt'
export var TYPES = {
  ATOM: '@@isthmus/atom',
  COMPUTED: '@@isthmus/atom/computed',
  LENSED: '@@isthmus/atom/lensed',
  ENDED: '@@isthmus/atom/ended'
}

export var end = curry(_end)
export var isAtom = curry(_isAtom)
export var combine = curry(_combine)
export var remove = curry(_remove)

export var set = curry(function set (lens, value, atom) {
  return atom(_set(lens, value, atom.value))
})

function _isAtom (atom) {
  return Boolean(atom && atom.isAtom)
}

export function log () {
  var il = arguments.length
  var result = Array(il)

  for (var i = 0; i < il; ++i) {
    var item = arguments[i]
    result[i] = _isAtom(item) ? item.value : item
  }

  console.log.apply(console, result)
}

function addToSinkStack (stack, sinks) {
  for (var i = 0, il = sinks.length; i < il; ++i) {
    var sink = sinks[i]
    if (sink.updateIndex !== null) {
      for (var j = sink.updateIndex, jl = stack.length; j < jl; ++j) {
        stack[j] = stack[j + 1]
      }
      stack[sink.updateIndex = stack.length - 1] = sink
    } else {
      stack[sink.updateIndex = stack.length] = sink
    }

    addToSinkStack(stack, sink.sinks)
  }
  return stack
}

function preventOffspring (sinks) {
  for (var i = 0, il = sinks.length; i < il; ++i) {
    sinks[i].updateIndex = null
    preventOffspring(sinks[i].sinks)
  }
}

function updateSinks (value, atom) {
  if (atom.readonly) {
    throw new Error('Cannot manually set readonly atom')
  }

  if (value === HALT) {
    throw new Error('Cannot manually set HALT')
  }

  if (atom.type === TYPES.LENSED) {
    value = _set(atom.lens, value, atom.source.value)
    atom = atom.source
  }

  atom.updateIndex = -1
  atom.value = value

  const stack = addToSinkStack([], atom.sinks)

  for (var i = 0, il = stack.length; i < il; ++i) {
    var item = stack[i]
    if (item.updateIndex !== null) {
      item.update()
      if (item.value === HALT) {
        preventOffspring(item.sinks)
      }
    }
  }

  for (var j = 0, jl = stack.length; j < jl; ++j) {
    stack[j].updateIndex = null
  }

  atom.updateIndex = null
}

function _end (atom) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('end', atom)
  }

  for (var i = 0, il = atom.sources.length; i < il; ++i) {
    var source = atom.sources[i]
    var index = source.sinks.indexOf(atom)
    source.sinks.splice(index, 1)
  }

  for (var j = 0, jl = atom.sinks.length; j < jl; ++j) {
    _end(atom.sinks[j])
  }

  atom.type = TYPES.ENDED
  atom.readonly = true
  atom.value = null
  atom.update = null
  atom.compute = null
  atom.lens = null
  atom.source = null
  atom.sources = []
}

function toJSON (atom) {
  return atom.value != null && typeof atom.value.toJSON === 'function'
    ? atom.value.toJSON()
    : atom.value
}
function valueOf (atom) {
  return atom.value
}
function _remove (atom) {
  return atom(undefined)
}

export var Atom = function Atom (value) {
  atom.isAtom = true
  atom.type = TYPES.ATOM
  atom.readonly = false
  atom.value = value
  atom.sinks = []

  atom.updateIndex = null

  atom.sources = []
  atom.update = null
  atom.compute = null
  atom.lens = null
  atom.source = null

  atom.map = map(__, atom)
  atom.view = view(__, atom)
  atom.scan = scan(__, __, atom)
  atom.modify = modify(__, atom)
  atom.end = _end.bind(null, atom)
  atom.remove = _remove.bind(null, atom)
  atom.log = log.bind(null, atom)
  atom.set = set(__, __, atom)

  atom.toJSON = toJSON.bind(null, atom)
  atom.valueOf = valueOf.bind(null, atom)
  atom.toString = atom.valueOf

  return atom
  function atom () {
    return arguments.length > 0
      ? (updateSinks(arguments[0], atom), atom)
      : atom.value
  }
}

export default Atom

function _combine (compute, sources) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtomList('combine', sources)
  }
  var atom = Atom()

  atom.type = TYPES.COMPUTED
  atom.readonly = true
  atom.compute = compute
  atom.sources = sources

  for (var i = 0, il = sources.length; i < il; ++i) {
    sources[i].sinks.push(atom)
  }

  atom.update = function update () {
    var jl = atom.sources.length
    var values = Array(jl)
    for (var j = 0; j < jl; ++j) {
      values[j] = atom.sources[j].value
    }
    atom.value = atom.compute.apply(null, values)
  }

  var kl = atom.sources.length
  var values = Array(kl)
  for (var k = 0; k < kl; ++k) {
    var value = atom.sources[k].value
    if (value === HALT) {
      return atom
    }
    values[k] = value
  }

  atom.value = atom.compute.apply(null, values)
  return atom
}

export var view = curry(function view (lens, source) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('view', source)
  }
  var atom = Atom()

  atom.type = TYPES.LENSED
  atom.readonly = source.readonly

  if (source.type === TYPES.LENSED) {
    atom.lens = Array.isArray(source.lens)
      ? source.lens.concat(lens)
      : [source.lens].concat(lens)
    atom.source = source.source
  } else {
    atom.lens = lens
    atom.source = source
  }

  atom.sources = [source]
  source.sinks.push(atom)
  atom.update = function update () {
    atom.value = _view(atom.lens, atom.source.value)
  }
  atom.update()

  return atom
})

export var map = curry(function map (fn, source) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('map', source)
  }
  return _combine(fn, [source])
})

export var scan = curry(function scan (fn, acc, source) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('scan', source)
  }

  const atom = _combine(function (s) {
    return (acc = fn(acc, s))
  }, [source])

  if (source.value === HALT) {
    atom.value = acc
  }

  return atom
})

export var merge = curry(function merge (source1, source2) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtomList('merge', [source1, source2])
  }
  return _combine(function (s1, s2) {
    if (source2.updateIndex !== null) {
      return s2
    }
    if (source1.updateIndex !== null) {
      return s1
    }
    return s2
  }, [source1, source2])
})

export var scanMerge = curry(function scanMerge (pairs, seed) {
  var len = pairs.length
  var fns = Array(len)
  var sources = Array(len)

  for (var i = 0; i < len; ++i) {
    fns[i] = pairs[i][0]
    sources[i] = pairs[i][1]
  }

  var atom = _combine(function () {
    for (var j = 0; j < len; ++j) {
      if (sources[j].updateIndex !== null) {
        seed = fns[j](seed, sources[j].value)
      }
    }
    return seed
  }, sources)

  var values = Array(len)
  var pSeed = seed
  for (var k = 0; k < len; ++k) {
    var value = sources[k].value
    if (value === HALT) {
      atom.value = seed
      return atom
    }
    values[k] = value
    pSeed = fns[k](pSeed, value)
  }

  atom.value = pSeed
  return atom
})

export var modify = curry(function modify (fn, atom) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('modify', atom)
  }
  return atom(fn(atom.value))
})
