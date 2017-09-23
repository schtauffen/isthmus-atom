import { curryN } from 'crry'
import { over as _over } from '@isthmus/optics'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(3, function over (lens, visitor, atom) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('over', atom)
  }

  return atom(_over(lens, visitor, atom.value))
})
