const Org = require('../../lib/qOrg')

const subject = new Org({token: process.env.TEST_TOKEN})

const INDEX = 0
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000

const orgs = {
  real: ['ruby', 'bcoin-org', 'google'],
  fake: ['teamFake', 'handshakecompany']
}

describe('qOrg', () => {
  describe('realOrg()', () => {
    it('returns true with real org', (done) => {
      subject.realOrg(orgs.real[INDEX])
      .then(real => {
        expect(real.pass).toBe(true)
        done()
      })
    })

    it('returns true for ALL of the real orgs', (done) => {
      let i = orgs.real.length
      let promises = []
      while (i > 0) {
        i--
        var r = orgs.real[i]
        promises.push(subject.realOrg(r))
      }
      Promise.all(promises)
      .then(real => {
        let passes = real.map(r => { return r.pass })
        expect(passes.indexOf(false)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false with a fake org', (done) => {
      subject.realOrg(orgs.fake[INDEX])
      .then(fake => {
        expect(fake.pass).toBe(false)
        done()
      })
    })

    it('returns false for ALL of the fake orgs', (done) => {
      var i = orgs.fake.length
      var promises = []
      while (i > 0) {
        i--
        var r = orgs.fake[i]
        promises.push(subject.realOrg(r))
      }
      Promise.all(promises)
      .then(fake => {
        let passes = fake.map(r => { return r.pass })
        expect(passes.indexOf(true)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })
  })
})
