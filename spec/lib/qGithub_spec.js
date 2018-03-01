require('dotenv').config()
require('../helpers/helpers')
const Github = require('../../lib/qGithub')
const token = process.env.TEST_TOKEN
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000


const INDEX = 1

const accts = {
  real: ['janovergoor', 'hschoenburg', 'mandatoryprogrammer', 'pzb', 'k0kubun', 'nfultz', 'nobu', 'cmars', 'matthew-mcateer', 'maxtaco', 'malgorithms', 'jinyangli', 'akalin', 'oconnor663', 'mlsteele', 'zapu', 'buoyad', 'songgao', 'zanderz'],

  fake: ['pringleLips', 'fakehandshake', 'chrisjj', 'josephpoon', 'hansjeffrey', 'hanschencodes', 'kirazara'],

  foss: ['mandatoryprogrammer', 'k0kubun', 'nfultz', 'nobu', 'cmars', 'matthew-mcateer', 'maxtaco', 'malgorithms', 'jinyangli', 'cecileboucheron', 'oconnor663', 'mlsteele', 'zapu', 'buoyad', 'songgao', 'zanderz'],

  out: ['cecileboucheron']
}

describe('run()', () => {

  describe('with a real user', () => {

    const subject = new Github({token: token, username: accts.real[INDEX]})

    it('returns a real score and a foss score', (done) => {
      subject.run()
        .then(result => {
          expect(result.real).toBeGreaterThan(process.env.USER_SCORE_MIN)
          expect(result.foss).toBeGreaterThan(process.env.FOSS_SCORE_MIN)
          done()
        }).catch(e => {
          console.log(e)
          done()
        })
    })

    it('returns true for ALL of the real users', (done) => {
      let i = accts.real.length
      let promises = []
      while (i > 0) {
        i--
        var u = accts.real[i]
        const subject = new Github({token: token, username: u})
        promises.push(subject.run())
      }
      Promise.all(promises)
      .then(scores => {
        console.log(scores)
        done()
      }).catch(e => { throw e })
    })

  })

  describe('with a fake user', () => {

    const subject = new Github({token: token, username: accts.fake[INDEX]})

    it('returns a real score and a foss score', (done) => {
      subject.run()
        .then(result => {
          expect(result.real).toBeLessThan(process.env.USER_SCORE_MIN)
          expect(result.foss).toBeLessThan(process.env.FOSS_SCORE_MIN)
          done()
        }).catch(e => {
          console.log(e)
          done()
        })
    })
  })
})

