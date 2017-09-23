// @isthmus/atom - Copyright (c) 2017, Zach Dahl; This source code is licensed under the ISC-style license found in the LICENSE file in the root directory of this source tree
import Atom from './modules/atom'
import { HALT, TYPES } from './modules/constants'
import combine from './modules/combine'
import end from './modules/end'
import get from './modules/get'
import isAtom from './modules/is-atom'
import log from './modules/log'
import map from './modules/map'
import merge from './modules/merge'
import modify from './modules/modify'
import remove from './modules/remove'
import over from './modules/over'
import scan from './modules/scan'
import scanMerge from './modules/scan-merge'
import set from './modules/set'
import view from './modules/view'

export {
  Atom,
  combine,
  end,
  get,
  isAtom,
  log,
  map,
  merge,
  modify,
  over,
  remove,
  scan,
  scanMerge,
  set,
  view,
  HALT,
  TYPES
}

export default Atom
