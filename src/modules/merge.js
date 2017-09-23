import { curryN } from 'crry'
import combine from './internal/combine'

if (process.env.NODE_ENV !== 'production') {
  var assert = require('./internal/assert')
}

export default curryN(2, function merge (source1, source2) {
  if (process.env.NODE_ENV !== 'production') {
    assert.isAtomList('merge', [source1, source2])
  }

  return combine(function (s1, s2) {
    return source2.updateIndex !== null || source1.updateIndex == null
      ? s2
      : s1
  }, [source1, source2])
})
