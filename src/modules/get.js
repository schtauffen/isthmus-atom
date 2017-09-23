import { curryN } from 'crry'
import { view } from '@isthmus/optics'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(2, function get (lens, atom) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('view', atom)
  }

  return view(lens, atom.value)
})
