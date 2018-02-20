/*
 * GithubQ
 */

require('dotenv').config()
const qUser = require('./lib/qUser')
const db = require('./handshake/db')
const tokenServer = require('./handshake/token_server')
const logger = require('./handshake/logger')

async function getJobs () {
  const lookup = 'SELECT * FROM jobs where status = $1'
  const result = await db.query(lookup, ['pending'])
  const jobs = result.rows
  if (jobs.length === 0) {
    return true
  } else {
    return false
  }
}

async function runJob (job) {

}

module.exports.getJobs = getJobs
module.exports.runJob = runJob
