const Repo = require('../../lib/qRepo')

const subject = new Repo({token: process.env.TEST_TOKEN})

// these specs are slow
jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

const INDEX = 1

const repos = {
  real: ['ruby/ruby', 'chjj/compton', 'level/leveldown', 'cmars/pystdf', 'keybase/client', 'rails/rails', 'geekcomputers/Python', 'google/pprof'],
  thin: ['chrisjj/trackfind', 'chjj/rocksdown', 'hschoenburg/mybitbit', 'spacebaconllc/repoman', 'akalin/gopar', 'zanderz/memcached'],
  fake: ['hschoenburg/ruby', 'fakehandshake/hockeypuck', 'hschoenburg/stellar_utils', 'teamFake/notReal', 'hansjeffrey/cashmoney', 'hansjeffrey/bcoin', 'hansjeffrey/fakeshit', 'kirazara/openvpn', 'hanschencodes/json']

}

describe('qRepo', () => {
  describe('realScore()', () => {
    it('returns true with real repo', (done) => {
      subject.realRepo(repos.real[INDEX])
      .then(real => {
        expect(real.pass).toBe(true)
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
        let passes = real.map(r => { return r.pass })
        expect(passes.indexOf(false)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false with a thin repo', (done) => {

      subject.realRepo(repos.thin[INDEX])
      .then(thin => {
        expect(thin.pass).toBe(false)
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
        let passes = thin.map(r => { return r.pass })
        expect(passes.indexOf(true)).toEqual(-1)
        done()
      }).catch(e => { throw e })
    })

    it('returns false with a fake repo', (done) => {
      subject.realRepo(repos.fake[INDEX])
      .then(fake => {
        expect(fake.pass).toBe(false)
        done()
      })
    })

    it('RETURNs false for ALL of the fake repos', (done) => {
      var i = repos.fake.length
      var promises = []
      while (i > 0) {
        i--
        var r = repos.fake[i]
        promises.push(subject.realRepo(r))
      }
      Promise.all(promises)
      .then(fake => {
        let passes = fake.map(r => { return r.pass })
        expect(passes.indexOf(true)).toEqual(-1)
        done()
        done()
      }).catch(e => { throw e })
    })
  })
})
