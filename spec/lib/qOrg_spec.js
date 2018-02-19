const subject = require('../../lib/qOrg')

const INDEX = 0

const orgs = {
  real: ['ruby', 'bcoin-org'],
  fake: ['teamFake', 'handshakecompany']
}

describe('qOrg', () => {
  describe('realScore()', () => {
    beforeEach((done) => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000
      done()
    })

    it('returns true with real org', (done) => {
      subject.realOrg(orgs.real[INDEX])
      .then(real => {
        expect(real).toBe(true)
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
        expect(real.indexOf(false)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false with a fake org', (done) => {
      subject.realOrg(orgs.fake[INDEX])
      .then(fake => {
        expect(fake).toBe(false)
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
        expect(fake.indexOf(true)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })
  })
})
