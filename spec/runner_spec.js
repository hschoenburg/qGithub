const subject = require('../runner')
require('dotenv').config()
const tokenServer = require('../handshake/token_server')
const dbHelper = require('./helpers/db_helper')
const passingScore = Number(process.env.USER_SCORE_MIN) + 1
const passingFossScore = Number(process.env.FOSS_SCORE_MIN) + 1
const db = require('../handshake/db')

describe('start', () => {
  let qualifiedUser = 'chjj'
  let realUser = 'pringleLips'
  let fakeUser = 'fakehandshake'

  describe('with a qualified user waiting in the job queue', () => {
    beforeEach(done => {
      spyOn(tokenServer, 'redeemQualification').and.returnValue(new Promise((resolve, reject) => { resolve(true) }))
      dbHelper.seedJob({username: qualifiedUser, status: 'pending'}).then(job => {
        done()
      })
    })

    it('has a job in the queue', (done) => {
      db.query('SELECT * FROM jobs')
        .then(result => {
          expect(result.rows.length).toEqual(1)
          done()
        })
    })

    it('updates the job status to completed and calls tokenServer', (done) => {
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('completed')
        expect(result.rows[0].foss_score).toBeGreaterThan(passingFossScore)
        expect(tokenServer.redeemQualification).toHaveBeenCalled()
        done()
      }).catch(e => { throw e })
    })
  })

  describe('with a real but unqualified user waiting in the job queue', () => {
    beforeEach(done => {
      spyOn(tokenServer, 'redeemQualification')
      dbHelper.seedJob({username: realUser, status: 'pending'}).then(job => {
        done()
      })
    })

    xit('updates the job status to completed and calls tokenServer', (done) => {
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('reviewed')
        expect(result.rows[0].real_score).toBeGreaterThan(passingScore)
        expect(tokenServer.redeemQualification).not.toHaveBeenCalled()
        done()
      }).catch(e => { throw e })
    })
  })

  describe('with a fake user', () => {
    beforeEach(done => {
      spyOn(tokenServer, 'redeemQualification')
      dbHelper.seedJob({username: fakeUser, status: 'pending'}).then(job => {
        done()
      })
    })

    it('updates the job status to rejected', (done) => {
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('rejected')
        expect(result.rows[0].real_score).toBeLessThan(passingScore)
        expect(result.rows[0].foss_score).not.toBe(null)
        expect(tokenServer.redeemQualification).not.toHaveBeenCalled()
        done()
      }).catch(e => { throw e })
    })
  })
})
