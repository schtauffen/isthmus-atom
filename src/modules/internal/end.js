import { TYPES } from '../constants'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./assert')
}

export default function end (atom) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('end', atom)
  }

  for (var i = 0, il = atom.sources.length; i < il; ++i) {
    var source = atom.sources[i]
    var index = source.sinks.indexOf(atom)
    source.sinks.splice(index, 1)
  }

  while (atom.sinks.length) {
    end(atom.sinks[0])
  }

  atom.type = TYPES.ENDED
  atom.readonly = true
  atom.update = null
  atom.compute = null
  atom.lens = null
  atom.source = null
  atom.sources = []
}
