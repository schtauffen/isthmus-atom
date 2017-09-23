import { curryN } from 'crry'
import combine from './internal/combine'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(2, function map (fn, source) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtom('map', source)
  }

  return combine(fn, [source])
})
