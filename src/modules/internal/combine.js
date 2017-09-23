import { HALT, TYPES } from '../constants'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./assert')
}

export default function combine (compute, sources) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtomList('combine', sources)
  }

  var atom = sources[0].constructor()

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
