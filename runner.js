/*
 * GithubQ
 */


require('dotenv').config()
const db = require('./handshake/db')
const tokenServer = require('./handshake/token_server')
const Github = require('./lib/qGithub')

async function start () {
  console.log('running loopppp!')
  let jobs = await getJobs()
  let running = []
  if (jobs.length === 0) {
    console.log('no jobs!')
    return true
  } else {
    console.log('jobs! ' + jobs.length)
    jobs.forEach(j => {
      const qGithub = new Github({token: j.token, username: j.username, job_id: j.id})
      running.push(qGithub.run())
    })
  }
  let finished = await Promise.all(running)
  return finished
}

async function getJobs () {
  const lookup = 'SELECT * FROM jobs where status = $1'
  const result = await db.query(lookup, ['pending'])
  return result.rows
}

module.exports.start = start
