import { curryN } from 'crry'
import { TYPES } from './constants'
import { view as _view } from '@isthmus/optics'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(2, function view (lens, source) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('view', source)
  }

  var atom = source.constructor()

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
