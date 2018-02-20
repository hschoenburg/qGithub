const subject = require('../runner')

describe('getJobs()', () => {
  it('returns true when no jobs are present', (done) => {
    subject.getJobs()
    .then(j => {
      expect(j).toBe(true)
      done()
    })
  })
})
