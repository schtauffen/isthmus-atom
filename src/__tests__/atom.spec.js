/* eslint-env jest */
import R from 'ramda'
import Atom, {
  combine,
  get,
  end,
  isAtom,
  map,
  modify,
  view,
  log,
  scan,
  merge,
  remove,
  scanMerge,
  set,
  over,
  HALT
} from '../'
import sinon from 'sinon'

describe('Atom', () => {
  describe('returned atom', () => {
    it('should have type @@isthmus/atom', () => {
      const atom = Atom('abc')
      expect(atom.type).toBe('@@isthmus/atom')
    })

    it('should be initialized with value', () => {
      expect(Atom(123)()).toBe(123)
      expect(Atom()()).toBe(undefined)
    })

    it('should allow setting', () => {
      const atom = Atom([1, 2, 3])
      atom([4, 5, 6])
      expect(atom()).toEqual([4, 5, 6])
    })

    it('should have toJSON method', () => {
      const atom = Atom({ a: { b: 1 } })
      expect(atom.toJSON()).toEqual({ a: { b: 1 } })
    })

    it('should have valueOf method', () => {
      const atom = Atom({ a: { b: 1 } })
      expect(atom.valueOf()).toEqual({ a: { b: 1 } })
    })
  })
})

describe('combine', () => {
  it('should be curried', () => {
    expect(combine(R.__, [Atom(2), Atom(3)])(R.add)()).toBe(5)
  })

  it('should throw if not given array of atoms', () => {
    expect(() => combine(R.add, null)).toThrow()
    expect(() => combine(R.add, [null, 0])).toThrow()
    expect(() => combine(R.add, [{ a: 1 }])).toThrow()
  })

  describe('returned atom', () => {
    it('should initialize immediately', () => {
      const sources = [Atom(3), Atom(4)]
      const atom = combine((a1, a2) => a1 - a2, sources)
      expect(atom()).toBe(-1)
    })

    it('should not initialize if given HALT as initial source value', () => {
      const sources = [Atom(3), Atom(HALT)]
      const fn = sinon.spy((a1, a2) => a1 - a2)
      const atom = combine(fn, sources)
      expect(fn.called).toBe(false)
      expect(atom()).toBe(undefined)
      sources[1](4)
      expect(fn.calledOnce).toBe(true)
      expect(atom()).toBe(-1)
    })

    it('should have type @isthmus/atom/computed', () => {
      const sources = [Atom(3), Atom(4)]
      const atom = combine((a1, a2) => a1 - a2, sources)
      expect(atom.type).toBe('@@isthmus/atom/computed')
    })

    it('should be readonly', () => {
      const sources = [Atom(3), Atom(4)]
      const atom = combine((a1, a2) => a1 - a2, sources)
      expect(() => atom(7)).toThrow()
    })

    it('should update when one of its sources does', () => {
      const sources = [Atom(3), Atom(4)]
      const atom = combine((a1, a2) => a1 - a2, sources)
      sources[0](5)
      expect(atom()).toBe(1)
      sources[1](3)
      expect(atom()).toBe(2)
    })

    it('should work in diamond dependencies', () => {
      const a = Atom(1)
      const b = a.view(null)
      const c = a.view(null)
      const d = combine(R.add, [b, c])
      const e = d.map(R.identity)

      const steps = [
        [1, 2],
        [2, 4],
        [3, 6],
        [4, 8],
        [5, 10],
        [-1, -2]
      ]

      steps.forEach(([val, doubled]) => {
        a(val)
        expect(b()).toBe(val)
        expect(c()).toBe(val)
        expect(d()).toBe(doubled)
        expect(e()).toBe(doubled)
      })
    })
  })
})

describe('fantasyland', () => {
  describe('Functor', () => {
    it('should do identity', () => {
      const u = Atom(7)
      expect(u()).toBe(u.map(a => a)())
    })

    it('should compose', () => {
      const u = Atom(7)
      const f = x => x * x
      const g = x => x - 9

      const a = u.map(x => f(g(x)))
      const b = u.map(g).map(f)

      expect(a()).toBe(4)
      expect(b()).toBe(4)
    })
  })

  describe('Apply', () => {
    it('should compose', () => {
      const v = Atom(7)
      const u = Atom(x => x + x)
      const a = Atom(x => x - 4)

      const r1 = v.ap(u.ap(a.map(f => g => x => f(g(x)))))
      const r2 = v.ap(u).ap(a)

      expect(r1()).toBe(10)
      expect(r2()).toBe(10)
    })
  })

  describe('Applicative', () => {
    it('should adhere to identity', () => {
      const v = Atom('a')
      const r = v.ap(Atom.of(x => x))
      expect(r()).toBe('a')
    })

    it('should be homomorphic', () => {
      const x = 'a'
      const f = s => s.toUpperCase()

      const r1 = Atom.of(x).ap(Atom.of(f))
      expect(r1()).toBe('A')

      const r2 = Atom.of(f(x))
      expect(r2()).toBe('A')
    })

    it('should interchange', () => {
      const y = []
      const u = Atom(a => a.concat(9))

      const r1 = Atom.of(y).ap(u)
      expect(r1()).toEqual([9])

      const r2 = u.ap(Atom.of(f => f(y)))
      expect(r2()).toEqual([9])
    })
  })
})

describe('get', () => {
  it('should return value at lens', () => {
    const atom = Atom({ foo: [7, 9, 11] })
    expect(get('foo', atom)).toEqual([7, 9, 11])
    expect(get(['foo', 1], atom)).toBe(9)
  })

  it('should be bound to atoms', () => {
    const atom = Atom({ foo: [7, 9, 11] })
    expect(atom.get('foo')).toEqual([7, 9, 11])
    expect(atom.get(['foo', 1])).toBe(9)
  })
})

describe('view', () => {
  it('should throw if not given atom', () => {
    expect(() => view(0, 123)).toThrow()
    expect(() => view(0, '123')).toThrow()
    expect(() => view(0, [7])).toThrow()
    expect(() => view(0, { foo: 'bar' })).toThrow()
  })

  describe('returned atom', () => {
    it('should have type @isthmus/atom/lensed', () => {
      const source = Atom({ a: 7 })
      const atom = view('a', source)
      expect(atom.type).toBe('@@isthmus/atom/lensed')
    })

    it('should initialize immediately', () => {
      const source = Atom({ a: 7 })
      const atom = view('a', source)
      expect(atom()).toBe(7)
    })

    it('should update when source does', () => {
      const source = Atom({ a: 7 })
      const atom = view('a', source)
      source({ a: 52 })
      expect(atom()).toBe(52)
    })

    it('should be set-able', () => {
      const source = Atom({ a: 7 })
      const atom = view('a', source)
      atom(12)
      expect(atom()).toBe(12)
      expect(source()).toEqual({ a: 12 })
    })

    it('should allow shorthand lenses', () => {
      const source = Atom({ foo: [0, 0, 7] })
      const foo = view('foo', source)
      expect(foo()).toEqual([0, 0, 7])

      const lastDigit = view(2, foo)
      expect(lastDigit()).toBe(7)

      const path = view(['foo', 2], source)
      expect(path()).toBe(7)
    })

    it('should work on computed', () => {
      const source = Atom(2)
      const computed = map(x => ({ x }), source)
      const lensed = view('x', computed)

      expect(lensed()).toBe(2)
      expect(() => lensed(7)).toThrow()
    })
  })

  describe('lensing a readonly atom', () => {
    it('should initialize correctly', () => {
      const source = Atom(3)
      const computed = combine(x => ({ x }), [source])
      const atom = view('x', computed)
      expect(computed()).toEqual({ x: 3 })
      expect(atom()).toBe(3)
    })

    it('should be readonly', () => {
      const source = Atom(3)
      const computed = combine(x => ({ x }), [source])
      const atom = view('x', computed)
      expect(() => atom(7)).toThrow()
    })

    it('should update when its source does', () => {
      const source = Atom(3)
      const computed = combine(x => ({ x }), [source])
      const atom = view('x', computed)
      source(4)
      expect(computed()).toEqual({ x: 4 })
      expect(atom()).toBe(4)
    })
  })

  describe('lensing a (non-readonly) lensed atom', () => {
    it('should compose lens', () => {
      const source = Atom({ foo: [3, 6, 9] })
      const middle = view('foo', source)
      const atom = view(2, middle)
      expect(atom()).toBe(9)
    })

    it('should set all the way to source', () => {
      const source = Atom({ foo: [3, 6, 9] })
      const middle = view('foo', source)
      const atom = view(2, middle)
      atom(7)
      expect(atom()).toBe(7)
      expect(middle()).toEqual([3, 6, 7])
      expect(source()).toEqual({ foo: [3, 6, 7] })
    })

    it('should work for computed', () => {
      const source = Atom({ foo: 7 })
      const lensed = view('foo', source)
      const atom = map(x => 2 * x, lensed)
      expect(atom()).toBe(14)
      lensed(2)
      expect(atom()).toBe(4)
    })
  })

  describe('bound view', () => {
    it('should function', () => {
      const source = Atom({ foo: 'bar' })
      const lensed = source.view('foo')
      expect(lensed()).toBe('bar')
    })
  })
})

describe('map', () => {
  it('should be curried', () => {
    expect(map(R.__, Atom(2))(R.add(7))()).toBe(9)
  })

  it('should throw if not given atom', () => {
    expect(() => map(x => x + 1, 1)).toThrow()
    expect(() => map(x => x + 'b', 'a')).toThrow()
    expect(() => map(x => [...x, 1], [0])).toThrow()
  })

  it('should return computed atom', () => {
    const source = Atom(7)
    const atom = map(x => 2 * x, source)
    expect(atom()).toBe(14)
    source(3)
    expect(atom()).toBe(6)
    expect(() => atom(1)).toThrow()
  })

  it('should not initialize if given HALTed atom', () => {
    const source = Atom(HALT)
    const fn = sinon.spy(R.multiply(2))
    const atom = map(fn, source)
    expect(fn.called).toBe(false)
    expect(atom()).toBe(undefined)
    source(7)
    expect(fn.calledOnce).toBe(true)
    expect(atom()).toBe(14)
  })

  it('should work on lensed', () => {
    const source = Atom({ foo: 'ta' })
    const middle = view('foo', source)
    const atom = map(x => x + 'co', middle)
    expect(atom()).toBe('taco')
  })

  it('should work on readonly', () => {
    const source = Atom('ta')
    const middle = map(x => x + 'co', source)
    const atom = map(x => x + ' salad', middle)
    expect(atom()).toBe('taco salad')
  })

  describe('bound map', () => {
    it('should function', () => {
      const source = Atom(7)
      const mapped = source.map(R.multiply(2))
      expect(mapped()).toBe(14)
    })
  })
})

describe('modify', () => {
  it('should be curried', () => {
    expect(modify(R.__, Atom(3))(R.add(7))()).toBe(10)
  })

  it('should throw if not given atom', () => {
    expect(() => modify(R.add, 7)).toThrow()
    expect(() => modify(x => x + 'd', 'abc')).toThrow()
    expect(() => modify(x => ({ ...x, b: 2 }), { a: 1 })).toThrow()
  })

  it('should update value based on current', () => {
    const atom = Atom(7)
    modify(x => x * x, atom)
    expect(atom()).toBe(49)
  })

  it('should work on lensed', () => {
    const source = Atom({ foo: 3 })
    const atom = view('foo', source)
    modify(x => x + 2, atom)
    expect(source()).toEqual({ foo: 5 })
  })

  it('should not work on readonly', () => {
    const source = Atom(2)
    const atom = map(x => x * x, source)
    expect(() => modify(x => x + 1, atom)).toThrow()
  })

  describe('bound modify', () => {
    it('should function', () => {
      const source = Atom(3)
      source.modify(R.add(4))
      expect(source()).toBe(7)
    })
  })
})

describe('end', () => {
  it('should be curried', () => {
    const atom = Atom()
    end()(atom)
    expect(atom.type).toBe('@@isthmus/atom/ended')
  })

  it('should throw if not given atom', () => {
    expect(() => end(123)).toThrow()
    expect(() => end('abc')).toThrow()
    expect(() => end(null)).toThrow()
    expect(() => end({ a: 1 })).toThrow()
  })

  it('should turn the stream off', () => {
    const atom = Atom(123)
    end(atom)
    expect(atom()).toBe(123)
    expect(atom.type).toBe('@@isthmus/atom/ended')
    expect(() => atom(7)).toThrow()
  })

  it('should remove from ancestor\'s sinks', () => {
    const source = Atom(4)
    const middle = map(s => [s], source)
    const atom = view(0, middle)
    end(atom)
    expect(middle.sinks.indexOf(atom)).toBe(-1)
    expect(source.sinks.indexOf(atom)).toBe(-1)
  })

  it('should end downstream atoms', () => {
    const source = Atom(4)
    const middle = map(s => [s], source)
    const atom = view(0, middle)
    end(middle)
    expect(middle.type).toBe('@@isthmus/atom/ended')
    expect(atom.type).toBe('@@isthmus/atom/ended')
    expect(source.sinks.indexOf(middle)).toBe(-1)
    expect(source.sinks.indexOf(atom)).toBe(-1)
  })

  it('should work for chained lenses', () => {
    const source = Atom({ a: 1 })
    const second = view(undefined, source)
    const third = view(undefined, second)
    const atom = view('a', third)
    end(third)
    expect(third.type).toBe('@@isthmus/atom/ended')
    expect(atom.type).toBe('@@isthmus/atom/ended')
    expect(source.sinks.indexOf(third)).toBe(-1)
    expect(source.sinks.indexOf(atom)).toBe(-1)
  })

  describe('bound end', () => {
    it('should function', () => {
      const source = Atom({ a: 1 })
      const second = source.view('a')
      source.end()
      expect(source.type).toBe('@@isthmus/atom/ended')
      expect(second.type).toBe('@@isthmus/atom/ended')
    })
  })
})

describe('isAtom', () => {
  it('should be curried', () => {
    expect(isAtom()(Atom(1))).toBe(true)
  })

  it('should return true for atoms', () => {
    const atom = Atom({ a: 7 })
    const lensed = view('a', atom)
    const computed = map(x => ({ ...x, b: 9 }), atom)
    expect(isAtom(atom)).toBe(true)
    expect(isAtom(lensed)).toBe(true)
    expect(isAtom(computed)).toBe(true)
  })

  it('should return false for non-atoms', () => {
    expect(isAtom(1)).toBe(false)
    expect(isAtom(null)).toBe(false)
    expect(isAtom(undefined)).toBe(false)
    expect(isAtom({})).toBe(false)
    expect(isAtom([])).toBe(false)
  })
})

describe('scan', () => {
  it('should fire immediately', () => {
    const source = Atom(1)
    const scanned = scan((prev, next) => prev + next, 2, source)
    expect(scanned()).toBe(3)
  })

  it('should not intialize if given HALTed source, but should use seed as default value', () => {
    const source = Atom(HALT)
    const fn = sinon.spy((a, b) => a + b)
    const scanned = scan(fn, 2, source)
    expect(fn.called).toBe(false)
    expect(scanned()).toBe(2)
    source(1)
    expect(fn.calledOnce).toBe(true)
    expect(scanned()).toBe(3)
  })

  it('should accumulate', () => {
    const source = Atom(1)
    const scanned = scan((prev, next) => prev + next, 2, source)
    source(3)
    expect(scanned()).toBe(6)
    source(4)
    expect(scanned()).toBe(10)
  })

  describe('bound scan', () => {
    it('should function', () => {
      const source = Atom(0)
      const scanned = source.scan(R.add, 0)
      source(1)(2)(3)(4)
      expect(scanned()).toBe(10)
    })
  })
})

describe('merge', () => {
  it('should take on last updated value', () => {
    const source1 = Atom(1)
    const source2 = Atom('a')
    const merged = merge(source1, source2)
    expect(merged()).toBe('a')
    source1(7)
    expect(merged()).toBe(7)
    source2('b')
    expect(merged()).toBe('b')
    source2('c')
    expect(merged()).toBe('c')
    source1(8)
    expect(merged()).toBe(8)
  })
})

describe('scanMerge', () => {
  it('should accumulate when there are changes', () => {
    const s1 = Atom(1)
    const s2 = Atom(2)
    const s3 = Atom(3)

    const scanmerged = scanMerge([
      [(prev, next) => prev + next, s1],
      [(prev, next) => prev * next, s2],
      [(prev, next) => prev - next, s3]
    ], 1)

    expect(scanmerged()).toBe(1)
    s1(2)
    expect(scanmerged()).toBe(3)
    s2(3)
    expect(scanmerged()).toBe(9)
    s3(8)
    expect(scanmerged()).toBe(1)
  })

  it('should use seed when one of its sources is HALTed', () => {
    const s1 = Atom(HALT)
    const s2 = Atom(2)

    const scanmerged = scanMerge([
      [R.add, s1],
      [R.subtract, s2]
    ], 10)

    expect(scanmerged()).toBe(10)
  })
})

describe('log', () => {
  let stub

  // TODO - not stub console.log
  beforeEach(() => {
    stub = sinon.stub(console, 'log')
  })

  afterEach(() => {
    stub.restore()
  })

  describe('atom', () => {
    it('should log value', () => {
      log(Atom(7))
      expect(stub.calledWith(7)).toBe(true)
    })
  })

  describe('non-atom', () => {
    it('should call as-is on console.log', () => {
      log(123)
      expect(stub.calledWith(123)).toBe(true)
    })
  })

  describe('variable arity', () => {
    it('should work for more than 1 argument', () => {
      log(1, Atom(2), 3)
      expect(stub.calledWith(1, 2, 3)).toBe(true)
    })
  })

  describe('bound log', () => {
    it('should work', () => {
      Atom(7).log()
      expect(stub.calledWith(7)).toBe(true)
    })
  })
})

describe('complicated atom dependency graphs', () => {
  it('should update each atom max once each', () => {
    const a = Atom(2)
    const b = map(R.add(1), a)
    const b2 = map(R.multiply(3), b)
    const c = map(R.add(2), a)
    const bc = combine((b, c) => b + c, [b, c])
    const c2 = map(R.multiply(2), c)
    const ac = combine((a, c) => a + c, [a, c])

    expect(a()).toBe(2)
    expect(b()).toBe(3)
    expect(b2()).toBe(9)
    expect(c()).toBe(4)
    expect(bc()).toBe(7)
    expect(c2()).toBe(8)
    expect(ac()).toBe(6)

    const sandbox = sinon.sandbox.create()
    const spies = [
      sandbox.spy(b, 'update'),
      sandbox.spy(b2, 'update'),
      sandbox.spy(c, 'update'),
      sandbox.spy(c2, 'update'),
      sandbox.spy(bc, 'update'),
      sandbox.spy(ac, 'update')
    ]

    expect(a(3)()).toBe(3)
    expect(b()).toBe(4)
    expect(b2()).toBe(12)
    expect(c()).toBe(5)
    expect(bc()).toBe(9)
    expect(c2()).toBe(10)
    expect(ac()).toBe(8)

    spies.forEach(spy => expect(spy.calledOnce).toBe(true))
    sandbox.restore()
  })
})

describe('HALT', () => {
  it('should error if set manually', () => {
    const source = Atom({ x: 1 })
    const lensed = view('x', source)
    const mapped = map(R.identity, source)
    expect(() => source(HALT)).toThrow()
    expect(() => lensed(HALT)).toThrow()
    expect(() => mapped(HALT)).toThrow()
  })

  it('should prevent sinks from updating', () => {
    const a = Atom(2)
    const b = map(R.add(1), a)
    const b2 = map(R.multiply(3), b)
    const c = map(x =>
      x % 2 === 0
        ? R.add(2, x)
        : HALT
    )(a)
    const bc = combine((b, c) => b + c, [b, c])
    const c2 = map(R.multiply(2), c)
    const ac = combine((a, c) => a + c, [a, c])
    const aac = combine((a, ac) => a + ac, [a, ac])

    expect(a()).toBe(2)
    expect(b()).toBe(3)
    expect(b2()).toBe(9)
    expect(c()).toBe(4)
    expect(bc()).toBe(7)
    expect(c2()).toBe(8)
    expect(ac()).toBe(6)
    expect(aac()).toBe(8)

    const sandbox = sinon.sandbox.create()
    const called = [
      sandbox.spy(b, 'update'),
      sandbox.spy(b2, 'update')
    ]
    const notCalled = [
      sandbox.spy(c2, 'update'),
      sandbox.spy(bc, 'update'),
      sandbox.spy(ac, 'update'),
      sandbox.spy(aac, 'update')
    ]

    a(3)
    expect(b()).toBe(4)
    expect(b2()).toBe(12)
    called.forEach(spy => expect(spy.called).toBe(true))

    expect(c()).toBe(HALT)
    expect(bc()).toBe(7)
    expect(c2()).toBe(8)
    expect(ac()).toBe(6)
    notCalled.forEach(spy => expect(spy.called).toBe(false))

    a(4)
    expect(b()).toBe(5)
    expect(b2()).toBe(15)
    expect(c()).toBe(6)
    expect(bc()).toBe(11)
    expect(c2()).toBe(12)
    expect(ac()).toBe(10)

    sandbox.restore()
  })
})

describe('remove', () => {
  it('should set atom to undefined', () => {
    const source = Atom({ a: 7 })
    remove(source)
    expect(source()).toBe(undefined)
  })

  it('should remove items from parent', () => {
    const source = Atom({ foo: [0, 1], bar: 'biz' })

    const fooHead = source.view(['foo', 0])
    fooHead.remove()
    expect(source()).toEqual({ foo: [1], bar: 'biz' })

    const bar = source.view('bar')
    bar.remove()
    expect(source()).toEqual({ foo: [1] })
  })
})

describe('set', () => {
  it('should set atom by lens', () => {
    const source = Atom({ a: [] })
    const lensed = source.view('a')
    const mapped = lensed.map(x => x.concat(2))

    expect(set('a', [0, 1], source)).toBe(source)
    expect(source()).toEqual({ a: [0, 1] })
    expect(lensed()).toEqual([0, 1])
    expect(mapped()).toEqual([0, 1, 2])

    expect(set(1, 7, lensed)).toBe(lensed)
    expect(source()).toEqual({ a: [0, 7] })
    expect(lensed()).toEqual([0, 7])
    expect(mapped()).toEqual([0, 7, 2])

    expect(() => set(2, 9, mapped)).toThrow()

    expect(set(['a', 1], 11, source)()).toEqual({ a: [0, 11] })
  })

  describe('bound set', () => {
    it('should function', () => {
      const source = Atom({ a: [] })
      const lensed = source.view('a')
      const mapped = lensed.map(x => x.concat(2))

      source.set('a', [0, 1])
      expect(source()).toEqual({ a: [0, 1] })
      expect(lensed()).toEqual([0, 1])
      expect(mapped()).toEqual([0, 1, 2])

      lensed.set(1, 7)
      expect(source()).toEqual({ a: [0, 7] })
      expect(lensed()).toEqual([0, 7])
      expect(mapped()).toEqual([0, 7, 2])

      expect(() => mapped.set(2, 9)).toThrow()

      expect(source.set(['a', 1], 11)()).toEqual({ a: [0, 11] })
    })
  })
})

describe('over', () => {
  it('should modify atom at lens by function', () => {
    const source = Atom({ a: [] })
    const lensed = source.view('a')
    const mapped = lensed.map(x => x.concat(2))

    expect(over('a', a => a.concat(1), source)).toBe(source)
    expect(source()).toEqual({ a: [1] })
    expect(lensed()).toEqual([1])
    expect(mapped()).toEqual([1, 2])

    expect(over(0, x => x + 3, lensed)).toBe(lensed)
    expect(source()).toEqual({ a: [4] })
    expect(lensed()).toEqual([4])
    expect(mapped()).toEqual([4, 2])

    expect(() => over(1, x => x * 3, mapped)).toThrow()

    expect(over(['a', 0], x => x - 5, source)()).toEqual({ a: [-1] })
  })

  describe('bound over', () => {
    it('should function', () => {
      const source = Atom({ a: [] })
      const lensed = source.view('a')
      const mapped = lensed.map(x => x.concat(2))

      expect(source.over('a', a => a.concat(1))).toBe(source)
      expect(source()).toEqual({ a: [1] })
      expect(lensed()).toEqual([1])
      expect(mapped()).toEqual([1, 2])

      expect(lensed.over(0, x => x + 3)).toBe(lensed)
      expect(source()).toEqual({ a: [4] })
      expect(lensed()).toEqual([4])
      expect(mapped()).toEqual([4, 2])

      expect(() => mapped.over(1, x => x * 3)).toThrow()

      expect(source.over(['a', 0], x => x - 5)()).toEqual({ a: [-1] })
    })
  })
})
