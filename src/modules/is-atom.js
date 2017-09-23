import { curryN } from 'crry'
import isAtom from './internal/is-atom'

export default curryN(1, isAtom)
