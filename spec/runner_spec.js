const subject = require('../runner')
const qUser = require('../lib/qUser')
const tokenServer = require('../handshake/token_server')

describe('getJobs()', () => {
  beforeEach(done => {
    spyOn(subject, 'runJobs')
    done()
  })
  it('returns true when no jobs are present', (done) => {
    subject.getJobs()
    .then(j => {
      expect(j).toBe(true)
      done()
    })
  })

  it('does not call runJobs', (done) => {
    expect(subject.runJobs).not.toHaveBeenCalled()
    done()
  })

  describe('with one pending job in db', () => {
    var job
    beforeEach(done => {
      dbHelper.seedJob({status: 'pending'})
        .then(j => {
          job = j
          done()
        })
    })

    it('calls runJob', (done) => {
      expect(subject.runJob).toHaveBeenCalled
      done()
    })
  })
})

describe('runJobs()', () => {
  var job
  beforeEach(done => {
    dbHelper.seedJob({status: 'pending'})
    .then(j => {
      job = j
      done()
    })
  })


  it('calls the token server', (done) => {
    // with job.username
    done()
  })

  it('calls qUser.realUser()', (done) => {
    // with job.username
    done()
  })

  it('calls qUser.fossScore()', (done) => {
    done()
  })

  describe('with a not real user', () => {
    beforeEach(done => {
      spyOn(qUser, 'realUser').and.returnValue(false)
      done()
    })

    it('does not call fossScore', (done) => {
      expect(subject.fossScore).not.toHaveBeenCalled()
      done()
    })
  })
})
