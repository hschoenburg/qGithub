const subject = require('../runner')
require('dotenv').config()
const tokenServer = require('../handshake/token_server')
const dbHelper = require('./helpers/db_helper')
const passingScore = Number(process.env.USER_SCORE_MIN) + 1
const passingFossScore = Number(process.env.FOSS_SCORE_MIN) + 1
const db = require('../handshake/db')

describe('start', () => {
  let qualifiedUser = 'chjj'
  let realUser = 'willzeng'
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
      process.env.AUTO_APPROVE='true'
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('reviewed')
        expect(result.rows[0].foss_score).toBeGreaterThan(passingFossScore)
        expect(tokenServer.redeemQualification).toHaveBeenCalled()
        done()
      }).catch(e => { throw e })
    })

    it('when AUTO_APPROVE is false it does not call token server but still updates the job status ', (done) => {
      process.env.AUTO_APPROVE=false
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('reviewed')
        expect(result.rows[0].foss_score).toBeGreaterThan(passingFossScore)
        expect(tokenServer.redeemQualification).not.toHaveBeenCalled()
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

    it('updates the job status to reviewse and calls tokenServer', (done) => {
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('reviewed')
        expect(result.rows[0].real_score).toBeGreaterThan(passingScore)
        //  expect(tokenServer.redeemQualification).not.toHaveBeenCalled()
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
