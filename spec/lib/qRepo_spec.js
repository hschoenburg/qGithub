const subject = require('../../lib/qRepo')

const INDEX = 1

const repos = {
  real: ['ruby/ruby', 'chjj/compton', 'level/leveldown', 'cmars/hockeypuck', 'keybase/client'],
  thin: ['chrisjj/trackfind', 'chjj/rocksdown', 'hschoenburg/mybitbit', 'spacebaconllc/repoman', 'akalin/gopar', 'zanderz/memcached'],
  fake: ['hschoenburg/ruby', 'fakehandshake/hockeypuck', 'hschoenburg/stellar_utils']

}

describe('qRepo', () => {
  describe('realScore()', () => {
    it('returns true with real repo', (done) => {
      subject.realRepo(repos.real[INDEX])
      .then(real => {
        expect(real).toBe(true)
        done()
      })
    })

    it('returns true for ALL of the real repos', (done) => {
      let i = repos.real.length
      let promises = []
      while (i > 0) {
        i--
        var r = repos.real[i]
        promises.push(subject.realRepo(r))
      }
      Promise.all(promises)
      .then(real => {
        expect(real.indexOf(false)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false with a thin repo', (done) => {
      subject.realRepo(repos.thin[INDEX])
      .then(thin => {
        expect(thin).toBe(false)
        done()
      })
      done()
    })

    it('returns false for ALL of the thin repos', (done) => {
      let i = repos.thin.length
      let promises = []
      while (i > 0) {
        i--
        var r = repos.thin[i]
        promises.push(subject.realRepo(r))
      }
      Promise.all(promises)
      .then(thin => {
        expect(thin.indexOf(true)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false with a fake repo', (done) => {
      subject.realRepo(repos.fake[INDEX])
      .then(fake => {
        expect(fake).toBe(false)
        done()
      })
    })

    it('returns false for ALL of the fake repos', (done) => {
      var i = repos.fake.length
      var promises = []
      while (i > 0) {
        i--
        var r = repos.fake[i]
        promises.push(subject.realRepo(r))
      }
      Promise.all(promises)
      .then(fake => {
        console.log(fake)
        expect(fake.indexOf(true)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })
  })
})
