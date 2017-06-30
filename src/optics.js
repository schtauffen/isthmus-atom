export function _view (lens, target) {
  if (target == null) return undefined

  if (Array.isArray(lens)) {
    if (lens.length === 1) return target[lens[0]]
    return _view(lens.slice(1), target[lens[0]])
  }

  return target[lens]
}

export function setPath (path, value, target) {
  if (path.length === 0) return value

  var result

  if (target == null) {
    var key = path[0]
    result = typeof key === 'string' ? {} : []
    result[key] = setPath(path.slice(1), value, null)
    return result
  }

  return set(path[0], setPath(path.slice(1), value, target[path[0]]), target)
}

export function set (path, value, target) {
  var result, i, il

  if (typeof path === 'string') {
    var key
    var keys = Object.keys(target)
    result = {}

    if (value === undefined) {
      if (Object.hasOwnProperty.call(target, path)) {
        for (i = 0, il = keys.length; i < il; ++i) {
          key = keys[i]
          if (key !== path) result[key] = target[key]
        }

        return result
      }
      return target
    }

    for (i = 0, il = keys.length; i < il; ++i) {
      key = keys[i]
      if (key === path) continue
      result[key] = target[key]
    }
    result[path] = value

    return result
  }

  if (typeof path === 'number') {
    i = 0
    il = target.length
    if (path < 0) {
      path = il + path
      if (path < 0) return target
    } else if (path >= il) {
      return target
    }

    if (il === undefined) {
      result = Array(path)
      result[path] = value
      return result
    }

    if (value === undefined) {
      result = Array(il - 1)

      for (i = 0; i < il; ++i) {
        if (i < path) result[i] = target[i]
        else if (i > path) result[i - 1] = target[i]
      }

      return result
    }

    result = Array(il)

    for (i = 0; i < il; ++i) {
      if (i === path) {
        result[i] = value
        continue
      }
      result[i] = target[i]
    }

    return result
  }

  if (Array.isArray(path)) {
    return setPath(path, value, target)
  }

  throw new TypeError('`set` expects a number, string or array. Given: ', path)
}