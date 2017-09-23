import { curryN } from 'crry'
import combine from './internal/combine'

export default curryN(2, combine)
