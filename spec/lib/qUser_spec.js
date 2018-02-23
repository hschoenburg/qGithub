const User = require('../../lib/qUser')
const subject = new User({token: process.env.TEST_TOKEN})

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

const INDEX = 1

// Refactor this to be recursive?
const accts = {
  real: ['hschoenburg', 'mandatoryprogrammer', 'pzb', 'k0kubun', 'nfultz', 'nobu', 'cmars', 'matthew-mcateer', 'maxtaco', 'malgorithms', 'jinyangli', 'akalin', 'oconnor663', 'mlsteele', 'zapu', 'buoyad', 'songgao', 'zanderz'],
  fake: ['fakehandshake', 'chrisjj', 'josephpoon', 'hansjeffrey', 'hanschencodes', 'kirazara'],
  foss: ['mandatoryprogrammer', 'k0kubun', 'nfultz', 'nobu', 'cmars', 'matthew-mcateer', 'maxtaco', 'malgorithms', 'jinyangli', 'cecileboucheron', 'oconnor663', 'mlsteele', 'zapu', 'buoyad', 'songgao', 'zanderz'],
  out: ['cecileboucheron']
}

const sample = {
  real: ['hschoenburg', 'mandatoryprogrammer', 'pzb', 'k0kubun', 'nfultz', 'nobu', 'cmars']
}

describe('qUser', () => {
  describe('fakeCheck()', () => {
    xit('returns false for a set of fake users', (done) => {
      subject.fakeCheck(accts.fake)
      .then(result => {
        expect(result).toBe(false)
        done()
      })
    })

    xit('returns true for a set of real users', (done) => {
      subject.fakeCheck(accts.real)
      .then(result => {
        expect(result).toBe(true)
        done()
      })
    })

    xit('returns true for a single real user', (done) => {
      subject.fakeCheck(['chjj', 'pzb'])
      .then(result => {
        expect(result).toBe(true)
        done()
      })
    })
  })
  describe('fossScore()', () => {
    xit('returns a value grater than 20', (done) => {
      subject.fossScore({username: 'hschoenburg'})
      .then(score => {
        expect(score).toBeGreaterThan(20)
        done()
      }).catch(e => { throw e })
    })

    xit('for top users it returns generally accurate scores', (done) => {
      let truePromises = []
      var i = sample.real.length
      while (i > 0) {
        i--
        var a = sample.real[i]
        truePromises.push(subject.fossScore({username: a}))
      }

      Promise.all(truePromises)
      .then(real => {
        expect(Math.min(...real)).toBeGreaterThan(30)
        done()
      }).catch(e => { throw e })
    })

    xit('return true when given a real user account', (done) => {
      subject.realUser({username: 'buoyad'})
      .then(real => {
        expect(real).toEqual(true)
        done()
      })
    })
  })

  describe('realUser()', () => {
    it('returns true for ALL of the real user accounts', (done) => {
      let truePromises = []
      var i = accts.real.length
      while (i > 0) {
        i--
        var a = accts.real[i]
        truePromises.push(subject.realUser({username: a}))
      }

      Promise.all(truePromises)
      .then(real => {
        console.log(real)
        let passes = real.map(r => { return r.pass })
        expect(passes.indexOf(false)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('return true when given a real user account', (done) => {
      subject.realUser({username: 'pzb'})
      .then(real => {
        expect(real.pass).toEqual(true)
        done()
      })
    })

    it('returns false for ALL of the fake user accounts', (done) => {
      let promises = []
      var i = accts.fake.length
      while (i > 0) {
        i--
        var a = accts.fake[i]
        promises.push(subject.realUser({username: a}))
      }
      Promise.all(promises)
      .then(fake => {
        let passes = fake.map(r => { return r.pass })
        expect(passes.indexOf(true)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false for a fake account', (done) => {
      subject.realUser({username: accts.fake[INDEX]})
      .then(real => {
        expect(real.pass).toEqual(false)
        done()
      })
    })
  })
})
