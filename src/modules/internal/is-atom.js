export default function isAtom (atom) {
  return Boolean(atom && atom.isAtom)
}
