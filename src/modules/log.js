import isAtom from './internal/is-atom'

export default function log () {
  var il = arguments.length
  var result = Array(il)

  for (var i = 0; i < il; ++i) {
    var item = arguments[i]
    result[i] = isAtom(item) ? item.value : item
  }

  console.log.apply(console, result)
}
