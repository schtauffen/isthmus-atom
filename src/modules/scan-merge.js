import { curryN } from 'crry'
import { HALT } from './constants'
import combine from './internal/combine'

export default curryN(2, function scanMerge (pairs, seed) {
  var len = pairs.length
  var fns = Array(len)
  var sources = Array(len)

  for (var i = 0; i < len; ++i) {
    fns[i] = pairs[i][0]
    sources[i] = pairs[i][1]
  }

  var atom = combine(function () {
    for (var j = 0; j < len; ++j) {
      if (sources[j].updateIndex !== null) {
        seed = fns[j](seed, sources[j].value)
      }
    }
    return seed
  }, sources)

  var values = Array(len)
  var pSeed = seed
  for (var k = 0; k < len; ++k) {
    var value = sources[k].value
    if (value === HALT) {
      atom.value = seed
      return atom
    }
    values[k] = value
    pSeed = fns[k](pSeed, value)
  }

  atom.value = pSeed
  return atom
})
