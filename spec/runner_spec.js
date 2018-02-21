const subject = require('../runner')
const qUser = require('../lib/qUser')
const tokenServer = require('../handshake/token_server')
const dbHelper = require('./helpers/db_helper')
const passingScore = process.env.USER_SCORE_MIN + 1
const passingFossScore = process.env.FOSS_SCORE_MIN + 1
const failingScore = process.env.USER_SCORE_MIN - 1
const failingFossScore = process.env.FOSS_SCORE_MIN - 1
const db = require('../handshake/db')

describe('start', () => {
  let testUser = 'testMcTesty'

  describe('with a qualified user waiting in the job queue', () => {
    beforeEach(done => {
      spyOn(qUser, 'realUser').and.returnValue({username: testUser, score: passingScore, pass: true})
      spyOn(qUser, 'fossScore').and.returnValue(passingFossScore)
      spyOn(tokenServer, 'redeemQualification').and.returnValue(new Promise((resolve, reject) => { resolve(true) }))
      dbHelper.seedJob({username: testUser, status: 'pending'}).then(job => {
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
        expect(tokenServer.redeemQualification).toHaveBeenCalled()
        done()
      }).catch(e => { throw e })
    })
  })

  describe('with a real but unqualified user waiting in the job queue', () => {
    beforeEach(done => {
      spyOn(qUser, 'realUser').and.returnValue({username: testUser, score: passingScore, pass: true})
      spyOn(qUser, 'fossScore').and.returnValue(failingFossScore)
      spyOn(tokenServer, 'redeemQualification')
      dbHelper.seedJob({username: testUser, status: 'pending'}).then(job => {
        done()
      })
    })

    it('updates the job status to completed and calls tokenServer', (done) => {
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('reviewed')
        expect(tokenServer.redeemQualification).not.toHaveBeenCalled()
        expect(qUser.fossScore).toHaveBeenCalled()
        done()
      }).catch(e => { throw e })
    })
  })

  describe('with a fake user', () => {
    beforeEach(done => {
      spyOn(qUser, 'realUser').and.returnValue({username: testUser, score: failingScore, pass: false})
      spyOn(qUser, 'fossScore')
      spyOn(tokenServer, 'redeemQualification')
      dbHelper.seedJob({username: testUser, status: 'pending'}).then(job => {
        done()
      })
    })

    it('updates the job status to completed and calls tokenServer', (done) => {
      subject.start()
      .then(finished => {
        const check = 'SELECT * FROM jobs'
        return db.query(check)
      }).then(result => {
        expect(result.rows[0].status).toEqual('rejected')
        expect(result.rows[0].real_score).toEqual(failingScore)
        expect(result.rows[0].foss_score).toEqual(null)
        expect(qUser.fossScore).not.toHaveBeenCalled()
        expect(tokenServer.redeemQualification).not.toHaveBeenCalled()
        done()
      }).catch(e => { throw e })
    })
  })
})
