import { __, curryN } from 'crry'
import { HALT, TYPES } from './constants'
import { set as _set } from '@isthmus/optics'
import combine from './internal/combine'
import end from './internal/end'
import get from './get'
import log from './log'
import map from './map'
import modify from './modify'
import over from './over'
import scan from './scan'
import set from './set'
import view from './view'
import remove from './internal/remove'

function addToSinkStack (stack, sinks) {
  for (var i = 0, il = sinks.length; i < il; ++i) {
    var sink = sinks[i]

    if (sink.updateIndex == null) {
      stack[sink.updateIndex = stack.length] = sink
    } else {
      for (var j = sink.updateIndex, jl = stack.length - 1; j < jl; ++j) {
        stack[stack[j + 1].updateIndex = j] = stack[j + 1]
      }
      stack[sink.updateIndex = stack.length - 1] = sink
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
  var i, il

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

  for (i = 0, il = stack.length; i < il; ++i) {
    var item = stack[i]
    if (item.updateIndex !== null) {
      item.update()
      if (item.value === HALT) {
        preventOffspring(item.sinks)
      }
    }
  }

  for (i = 0, il = stack.length; i < il; ++i) {
    stack[i].updateIndex = null
  }

  atom.updateIndex = null
}

function toJSON (atom) {
  return atom.value != null && typeof atom.value.toJSON === 'function'
    ? atom.value.toJSON()
    : atom.value
}

function valueOf (atom) {
  return atom.value
}

var ap = curryN(2, function _ap (x, f) {
  return combine(function (a, b) {
    return a(b)
  }, [f, x])
})

Atom.of = Atom
Atom['fantasyland/of'] = Atom.of

export default function Atom (value) {
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

  atom.get = get(__, atom)
  atom.view = view(__, atom)
  atom.scan = scan(__, __, atom)
  atom.modify = modify(__, atom)
  atom.end = end.bind(null, atom)
  atom.remove = remove.bind(null, atom)
  atom.log = log.bind(null, atom)
  atom.set = set(__, __, atom)
  atom.over = over(__, __, atom)

  // fantasyland
  atom.map = map(__, atom)
  atom.ap = ap(atom)
  atom.constructor = Atom
  atom['fantasyland/map'] = atom.map
  atom['fantasyland/ap'] = atom.ap

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
