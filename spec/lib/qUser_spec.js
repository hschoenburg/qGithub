const User = require('../../lib/qUser')
const token = process.env.TEST_TOKEN

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

const INDEX = 1

const accts = {
  real: ['janovergoor', 'hschoenburg', 'mandatoryprogrammer', 'pzb', 'k0kubun', 'nfultz', 'nobu', 'cmars', 'matthew-mcateer', 'maxtaco', 'malgorithms', 'jinyangli', 'akalin', 'oconnor663', 'mlsteele', 'zapu', 'buoyad', 'songgao', 'zanderz'],
  fake: ['fakehandshake', 'chrisjj', 'josephpoon', 'hansjeffrey', 'hanschencodes', 'kirazara'],
  foss: ['mandatoryprogrammer', 'k0kubun', 'nfultz', 'nobu', 'cmars', 'matthew-mcateer', 'maxtaco', 'malgorithms', 'jinyangli', 'cecileboucheron', 'oconnor663', 'mlsteele', 'zapu', 'buoyad', 'songgao', 'zanderz'],
  out: ['cecileboucheron']
}

const sample = {
  real: ['hschoenburg', 'mandatoryprogrammer', 'pzb', 'k0kubun', 'nfultz', 'nobu', 'cmars']
}

describe('qUser', () => {

  describe('realUser()', () => {
    it('returns true for ALL of the real user accounts', (done) => {
      let truePromises = []
      var i = accts.real.length
      while (i > 0) {
        i--
        var a = accts.real[i]
        const subject = new User({token: token, username: a})
        truePromises.push(subject.realUser())
      }

      Promise.all(truePromises)
      .then(real => {
        let passes = real.map(r => { return r.pass })
        expect(passes.indexOf(false)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('return true when given a real user account', (done) => {
      const subject = new User({token: token, username: accts.real[17]})
      subject.realUser()
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
        var subject = new User({token: token, username: a})
        promises.push(subject.realUser())
      }
      Promise.all(promises)
      .then(fake => {
        let passes = fake.map(r => { return r.pass })
        expect(passes.indexOf(true)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false for a fake account', (done) => {
      var subject = new User({token: token, username: accts.fake[INDEX]})
      subject.realUser()
      .then(real => {
        expect(real.pass).toEqual(false)
        done()
      })
    })
  })
})
