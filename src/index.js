//! @isthmus/atom - Copyright (c) 2017, Zach Dahl; This source code is licensed under the ISC-style license found in the LICENSE file in the root directory of this source tree
import R from 'ramda'

export var HALT = '@@isthmus/atom/halt'
export var isAtom = R.curry(function isAtom (atom) {
  return Boolean(atom && atom.isAtom)
})

export var log = R.curry(function log (...atoms) {
  console.log(...atoms.map(function (atom) {
    return isAtom(atom) ? atom.value : atom
  }))
})

function assertAtom (fn, atom) {
  if (!isAtom(atom)) {
    throw new TypeError(fn + ' expected atom, received ' + atom)
  }
}

function assertAtomList (fn, atoms) {
  if (!Array.isArray(atoms)) {
    throw new TypeError(fn + ' expected atom[], received ' + atoms)
  }
  atoms.forEach(function (a, idx) {
    assertAtom(fn + ' sources array[' + idx + ']', a)
  })
}

export var TYPES = {
  ATOM: '@@isthmus/atom',
  COMPUTED: '@@isthmus/atom/computed',
  LENSED: '@@isthmus/atom/lensed',
  ENDED: '@@isthmus/atom/ended'
}

function addToSinkStack (stack, sinks) {
  sinks.forEach(function (sink) {
    if (sink.updateIndex !== null) {
      for (var i = sink.updateIndex, il = stack.length; i < il; ++i) {
        stack[i] = stack[i + 1]
      }
      stack[sink.updateIndex = stack.length - 1] = sink
    } else {
      stack[sink.updateIndex = stack.length] = sink
    }

    addToSinkStack(stack, sink.sinks)
  })
  return stack
}

function preventOffspring (sinks) {
  sinks.forEach(function (sink) {
    sink.updateIndex = null
    preventOffspring(sink.sinks)
  })
}

function triggerStackUpdates (stack) {
  stack.forEach(function (atom) {
    if (atom.updateIndex !== null) {
      atom.update()
      if (atom.value === HALT) {
        preventOffspring(atom.sinks)
      }
    }
  })
  stack.forEach(function (atom) {
    atom.updateIndex = null
  })
}

function updateSinks (value, atom) {
  if (atom.readonly) {
    throw new Error('Cannot manually set readonly atom')
  }

  if (value === HALT) {
    throw new Error('Cannot manually set HALT')
  }

  if (atom.type === TYPES.LENSED) {
    value = R.set(atom.lens, value, atom.source.value)
    atom = atom.source
  }

  atom.updateIndex = -1
  atom.value = value

  const stack = addToSinkStack([], atom.sinks)
  triggerStackUpdates(stack)
  atom.updateIndex = null
}

export var end = R.curry(function end (atom) {
  assertAtom('end', atom)

  atom.sources.forEach(function (source) {
    var index = source.sinks.indexOf(atom)
    source.sinks.splice(index, 1)
  })

  atom.sinks.forEach(end)
  atom.type = TYPES.ENDED
  atom.readonly = true
  atom.value = null
  atom.update = null
  atom.compute = null
  atom.lens = null
  atom.source = null
  atom.sources = []
})

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

  atom.map = R.flip(map)(atom)
  atom.view = R.flip(view)(atom)
  atom.scan = scan(R.__, R.__, atom)
  atom.modify = R.flip(scan)(atom)
  atom.end = end.bind(null, atom)
  atom.log = log.bind(null, atom)

  atom.toJSON = function toJSON () { return atom.value }
  atom.valueOf = function valueOf () { return atom.value }

  return atom
  function atom () {
    return arguments.length > 0
      ? (updateSinks(arguments[0], atom), atom)
      : atom.value
  }
}

export default Atom

export var combine = R.curry(function combine (compute, sources) {
  assertAtomList('combine', sources)
  var atom = Atom()

  atom.type = TYPES.COMPUTED
  atom.readonly = true
  atom.compute = compute
  atom.sources = sources
  sources.forEach(function (source) {
    source.sinks.push(atom)
  })
  atom.update = function update () {
    var values = atom.sources.map(function (s) { return s.value })
    atom.value = atom.compute.apply(null, values)
  }

  var values = atom.sources.map(function (s) { return s.value })
  if (values.indexOf(HALT) < 0) {
    atom.value = atom.compute.apply(null, values)
  }

  return atom
})

export var view = R.curry(function view (lens, source) {
  assertAtom('view', source)
  var atom = Atom()

  atom.type = TYPES.LENSED
  atom.readonly = source.readonly

  if (typeof lens === 'string') {
    lens = R.lensProp(lens)
  } else if (typeof lens === 'number') {
    lens = R.lensIndex(lens)
  } else if (Array.isArray(lens)) {
    lens = R.lensPath(lens)
  }

  if (source.type === TYPES.LENSED) {
    atom.lens = R.compose(source.lens, lens)
    atom.source = source.source
  } else {
    atom.lens = lens
    atom.source = source
  }

  atom.sources = [source]
  source.sinks.push(atom)
  atom.update = function update () {
    atom.value = R.view(atom.lens, atom.source.value)
  }
  atom.update()

  return atom
})

export var map = R.curry(function map (fn, source) {
  assertAtom('map', source)
  return combine(fn, [source])
})

export var scan = R.curry(function scan (fn, acc, source) {
  assertAtom('scan', source)

  const atom = combine(function (s) {
    return (acc = fn(acc, s))
  }, [source])

  if (source.value === HALT) {
    atom.value = acc
  }

  return atom
})

export var merge = R.curry(function merge (source1, source2) {
  assertAtomList('merge', [source1, source2])
  return combine(function (s1, s2) {
    if (source2.updateIndex !== null) {
      return s2
    }
    if (source1.updateIndex !== null) {
      return s1
    }
    return s2
  }, [source1, source2])
})

export var scanMerge = R.curry(function scanMerge (pairs, seed) {
  var temp = pairs.reduce(function (out, pair, idx) {
    out[0][idx] = pair[0]
    out[1][idx] = pair[1]
    return out
  }, [Array(pairs.length), Array(pairs.length)])
  var fns = temp[0]
  var sources = temp[1]

  var atom = combine(function () {
    sources.forEach(function (s, idx) {
      if (s.updateIndex !== null) {
        seed = fns[idx](seed, s.value)
      }
    })
    return seed
  }, sources)

  var values = sources.map(function (s) { return s.value })
  if (values.indexOf(HALT) < 0) {
    values.forEach(function (v, idx) {
      seed = fns[idx](seed, v)
    })
  }

  atom.value = seed

  return atom
})

export var modify = R.curry(function modify (fn, atom) {
  assertAtom('modify', atom)
  return atom(fn(atom.value))
})
