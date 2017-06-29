export function isAtom (fn, atom) {
  if (!atom || !atom.isAtom) {
    throw new TypeError(fn + ' expected atom, received ' + atom)
  }
}

export function isAtomList (fn, atoms) {
  if (!Array.isArray(atoms)) {
    throw new TypeError(fn + ' expected atom[], received ' + atoms)
  }
  for (var i = 0, il = atoms.length; i < il; ++i) {
    isAtom(fn + ' sources array[' + i + ']', atoms[i])
  }
}
