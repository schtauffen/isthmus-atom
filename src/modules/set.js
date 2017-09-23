import { curryN } from 'crry'
import { set as _set } from '@isthmus/optics'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(3, function set (lens, value, atom) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('set', atom)
  }

  return atom(_set(lens, value, atom.value))
})
