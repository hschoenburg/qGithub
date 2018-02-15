const subject = require('../../lib/qRepo')

const INDEX = 0

const repos = {
  real: ['ruby/ruby', 'chjj/compton', 'level/leveldown'],
  thin: ['chrisjj/trackfind', 'chjj/rocksdown'],
  fake: ['hschoenburg/ruby']
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

    it('returns false with a thin repo', (done) => {
      subject.realRepo(repos.thin[INDEX])
      .then(thin => {
        expect(thin).toBe(false)
        done()
      })
      done()
    })

    it('returns false with a fake repo', (done) => {
      subject.realRepo(repos.fake[INDEX])
      .then(fake => {
        expect(fake).toBe(false)
        done()
      })
    })
  })
})
