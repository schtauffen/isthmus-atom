import { curry } from 'crry'

export const view = curry(_view)
export const set = curry(_set)
export const over = curry(_over)

function _over (lens, visitor, target) {
  return _set(lens, visitor(_view(lens, target)), target)
}

function _view (lens, target) {
  if (lens == null) return target
  if (target == null) return undefined

  if (Array.isArray(lens)) {
    var prop = lens[0]
    if (lens.length === 1) {
      if (prop == null) return target
      return target[prop]
    }
    if (prop == null) return _view(lens.slice(1), target)
    return _view(lens.slice(1), target[prop])
  }

  return target[lens]
}

function setPath (path, value, target) {
  if (path.length === 0) return value
  if (path[0] == null) return setPath(path.slice(1), value, target)

  var result

  if (target == null) {
    var key = path[0]
    result = typeof key === 'string' ? {} : []
    result[key] = setPath(path.slice(1), value, null)
    return result
  }

  return _set(path[0], setPath(path.slice(1), value, target[path[0]]), target)
}

function _set (path, value, target) {
  var result, i, il

  if (path == null) return value

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
