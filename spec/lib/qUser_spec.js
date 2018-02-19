const subject = require('../../lib/qUser')
jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000

const INDEX = 1

// Refactor this to be recursive?
const accts = {
  real: ['hschoenburg', 'mandatoryprogrammer', 'pzb', 'k0kubun', 'nfultz', 'nobu', 'cmars', 'matthew-mcateer', 'maxtaco', 'malgorithms', 'jinyangli', 'akalin', 'cecileboucheron', 'oconnor663', 'mlsteele', 'zapu', 'buoyad', 'songgao', 'zanderz'],
  fake: ['fakehandshake', 'chrisjj', 'josephpoon']
}

describe('qUser', () => {
  describe('fossScore()', () => {
    xit('returns a value of 1 for users with no contributors to their owned repos', (done) => {
      subject.fossScore({username: 'hschoenburg'})
      .then(score => {
        expect(score).toEqual(1)
        done()
      }).catch(e => { throw e })
    })
  })

  describe('realUser()', () => {
    it('returns true for ALL of the real user accounts', (done) => {
      let truePromises = []
      var i = accts.real.length
      while (i > 0) {
        i--
        var a = accts.real[i]
        console.log(a)
        truePromises.push(subject.realUser({username: a}))
      }

      Promise.all(truePromises)
      .then(real => {
        console.log(real)
        expect(real.indexOf(false)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('return true when given a real user account', (done) => {
      subject.realUser({username: accts.real[INDEX]})
      .then(real => {
        expect(real).toEqual(true)
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

        Promise.all(promises)
        .then(fake => {
          expect(fake.indexOf(true)).toEqual(-1)
          done()
        }).catch(e => { throw e })
      }
    })

    it('returns false for a fake account', (done) => {
      subject.realUser({username: accts.fake[INDEX]})
      .then(real => {
        expect(real).toEqual(false)
        done()
      })
    })
  })

  describe('fossScore', () => {
    it('returns a 10 when given a legit homie', (done) => {
      done()
    })
  })
})
