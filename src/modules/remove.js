import { curryN } from 'crry'
import remove from './internal/remove'

export default curryN(1, remove)
