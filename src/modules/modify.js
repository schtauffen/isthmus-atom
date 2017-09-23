import { curryN } from 'crry'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(2, function modify (fn, atom) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('modify', atom)
  }

  return atom(fn(atom.value))
})
