require('dotenv').config()
require('../helpers/helpers')
const Github = require('../../lib/qGithub')
const token = process.env.TEST_TOKEN
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

const INDEX = 0

const accts = {
  real: process.env.REAL_USERS,
  fake: process.env.FAKE_USERS,
  foss: process.env.FOSS_USERS
}

describe('score()', () => {
  describe('with a real user', () => {
    const subject = new Github({token: token, username: accts.real[INDEX]})

    it('returns a real score and a foss score', (done) => {
      subject.score()
        .then(result => {
          expect(result.real).toBeGreaterThan(Number(process.env.USER_SCORE_MIN))
          expect(result.foss).toBeGreaterThan(Number(process.env.FOSS_SCORE_MIN))
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
        promises.push(subject.score())
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
      subject.score()
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
