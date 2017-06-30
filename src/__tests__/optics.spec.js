/* eslint-env jest */
import { set, _view } from '../optics'
import deepFreeze from 'deep-freeze'

describe('set', () => {
  describe('null or undefined lens', () => {
    it('should act as an identity lens', () => {
      const target = { a: 3 }
      deepFreeze(target)
      expect(set(null, 3, target)).toBe(3)
    })

    it('should work inside path', () => {
      const target = { a: [0, 1] }
      deepFreeze(target)
      expect(set(['a', undefined], 'foo', target)).toEqual({ a: 'foo' })
      expect(set(['a', undefined, 1], 'foo', target)).toEqual({ a: [0, 'foo'] })
    })
  })

  describe('prop', () => {
    it('should error if given null or undefined', () => {
      expect(() => set('a', 1, null)).toThrow()
      expect(() => set('foo', 'bar', undefined)).toThrow()

      expect(() => set(0, 1, null)).toThrow()
      expect(() => set(2, 'bar', undefined)).toThrow()
    })

    it('should set prop on target when given string', () => {
      const target = { a: 1, b: 2 }
      deepFreeze(target)
      expect(set('c', 3, target)).toEqual({ a: 1, b: 2, c: 3 })
    })

    it('should override prop if it already exists', () => {
      const target = { a: 1, b: 2 }
      deepFreeze(target)
      expect(set('b', 7, target)).toEqual({ a: 1, b: 7 })
    })

    it('should make into object', () => {
      expect(set('a', 7, [])).toEqual({ a: 7 })
    })

    describe('remove', () => {
      it('should remove a prop if given value is undefined', () => {
        const target = { a: 1, b: 2, c: 3 }
        deepFreeze(target)
        expect(set('b', undefined, target)).toEqual({ a: 1, c: 3 })
      })

      it('should do nothing if given value is undefined', () => {
        const target = { a: 'foo', b: 'bar' }
        deepFreeze(target)
        expect(set('c', undefined, target)).toBe(target)
      })
    })
  })

  describe('index', () => {
    it('should set index on target when given number', () => {
      const target = [0, 1, 2]
      deepFreeze(target)
      expect(set(1, 'foo', target)).toEqual([0, 'foo', 2])
    })

    it('should allow negatives as "from end"', () => {
      const target = [0, 1, 2]
      deepFreeze(target)
      expect(set(-3, 'foo', target)).toEqual(['foo', 1, 2])
    })

    it('should do nothing if index isn\'t in range', () => {
      const target = [0, 1, 2]
      deepFreeze(target)
      expect(set(3, 'foo', target)).toBe(target)
      expect(set(-4, 'foo', target)).toBe(target)
    })

    it('should make into array', () => {
      expect(set(1, 7, {})).toEqual([undefined, 7])
    })

    describe('remove', () => {
      it('should remove index from target when given value is undefined', () => {
        const target = [0, 'foo', 2]
        deepFreeze(target)
        expect(set(1, undefined, target)).toEqual([0, 2])
      })

      it('should allow negatives as "from end"', () => {
        const target = [0, 'foo', 2]
        deepFreeze(target)
        expect(set(-1, undefined, target)).toEqual([0, 'foo'])
      })

      it('should do nothing if index isn\'t in range', () => {
        const target = [0, 'foo', 2]
        deepFreeze(target)
        expect(set(-4, undefined, target)).toBe(target)
        expect(set(3, undefined, target)).toBe(target)
      })
    })
  })

  describe('array', () => {
    it('should change value at path if it already exists', () => {
      const target = { a: [0, { b: 'foo', c: 'bar' }] }
      deepFreeze(target)

      const result = set(['a', 1, 'c'], 'biz', target)
      expect(result).toEqual({ a: [0, { b: 'foo', c: 'biz' }] })
    })

    it('should autovivify objects', () => {
      expect(set(['a', 1, 'b'], 7, null)).toEqual({ a: [undefined, { b: 7 }] })

      const target = { a: { b: null } }
      deepFreeze(target)
      expect(set(['a', 'b', 'c'], 7, { a: { b: null } }))
        .toEqual({ a: { b: { c: 7 } } })
    })

    it('should remove if supplied value is undefined and it exists', () => {
      const target = { a: [0, { b: 7 }] }
      deepFreeze(target)
      expect(set(['a', 1, 'b'], undefined, target)).toEqual({ a: [0, {}] })
      expect(set(['a', -1], undefined, target)).toEqual({ a: [0] })
    })

    it('should do nothing if value undefined and does not exist', () => {
      const target = { a: [0, { c: 7 }] }
      deepFreeze(target)
      expect(set(['a', 1, 'b'], undefined, target)).toEqual(target)
      expect(set(['a', 2], undefined, target)).toEqual(target)
    })
  })

  describe('other values', () => {
    it('should throw error', () => {
      expect(() => set(true, 5, { a: 1 })).toThrow()
      expect(() => set({ a: 2 }, 5, { a: 1 })).toThrow()
    })
  })
})

describe('_view', () => {
  it('should retrieve appropriate target', () => {
    const target = { a: [0, { b: 7 }] }
    deepFreeze(target)

    expect(_view('a', target)).toEqual([0, { b: 7 }])
  })
})
