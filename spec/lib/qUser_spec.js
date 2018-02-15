const subject = require('../../lib/qUser')

const INDEX = 2

// Refactor this to be recursive?
const accts = {
  real: ['hschoenburg', 'mandatoryprogrammer', 'pzb', 'kokubun', 'nfultz'],
  fake: ['fakehandshake'],
  thin: ['chrisjj'],
  tooThin: ['josephpoon'],
  foss_boss: ['chjj']
}

describe('qUser', () => {
  describe('realScore()', () => {
    xit('returns true for ALL of the real user accounts', (done) => {
      var i = accts.real.length
      while (i > -1) {
        i--
        var a = accts.real[i]
        console.log(a)
        subject.realUser({username: a})
          .then(real => {
            expect(real).toBe(true)
            if (i === 0) { done() }
          }).catch(e => { throw e })
      }
    })

    it('return true when given a real user account', (done) => {
      subject.realUser({username: accts.real[INDEX]})
      .then(real => {
        expect(real).toEqual(true)
        done()
      })
    })

    it('returns false for a thin account', (done) => {
      subject.realUser({username: accts.thin[INDEX]})
      .then(real => {
        expect(real).toEqual(false)
        done()
      })
    })

    it('returns false for a fake account', (done) => {
      subject.realUser({username: accts.fake[INDEX]})
      .then(real => {
        expect(real).toEqual(false)
        done()
      })
    })

    it('returns false with a toothin account', (done) => {
      subject.realUser({username: accts.tooThin[INDEX]})
      .then(real => {
        expect(real).toBe(false)
        done()
      })
    })
  })

  describe('fossScore', () => {
    xit('returns a 10 when given a legit homie', (done) => {
      done()
    })
  })
})
