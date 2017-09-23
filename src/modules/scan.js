import { curryN } from 'crry'
import { HALT } from './constants'
import combine from './internal/combine'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(3, function scan (fn, acc, source) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('scan', source)
  }

  const atom = combine(function (s) {
    return (acc = fn(acc, s))
  }, [source])

  if (source.value === HALT) {
    atom.value = acc
  }

  return atom
})
