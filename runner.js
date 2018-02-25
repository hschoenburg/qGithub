/*
 * GithubQ
 */

require('dotenv').config()
const User = require('./lib/qUser')
const db = require('./handshake/db')
const tokenServer = require('./handshake/token_server')

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
      running.push(qGithub(j))
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

/*
 *  token      | character varying(250)   |
 *   qualcode   | character varying(250)   |
 *    username   | character varying(250)   |
 *     status     | character varying(250)   |
 *      real_score | integer                  |
 *       foss_score | integer                  |
 *        created_at | timestamp with time zone | default now()
 *         updated_at | timestamp with time zone | not null default now()
 */

async function qGithub (j) {
  let foss

  const qUser = new User({token: j.token, username: j.username})

  let real = await qUser.realUser({username: j.username})

  if (real < process.env.USER_SCORE_MIN) {
    await rejectUser(real)
    return false
  } else {
    foss = await qUser.scoreUser({username: j.username})

    if (foss > process.env.FOSS_SCORE_MIN) {
      await tokenServer.redeemQualification({code: j.qualcode, identifier: j.username, service: 'github'})
      await redeemUser({username: j.username, foss: foss, real: real.score})
      return true
    } else {
      await reviewUser({username: j.username, foss: foss, real: real.score})
      return false
    }
  }
}

async function rejectUser (params) {
  const reject = 'UPDATE jobs SET status = $1, real_score = $2 WHERE username = $3 RETURNING *'
  let result = await db.query(reject, ['rejected', params.score, params.username])
  return result
}

async function reviewUser (params) {
  const review = 'UPDATE jobs SET status = $1, real_score = $2, foss_score = $3 WHERE username = $4 RETURNING *'
  let result = await db.query(review, ['reviewed', params.real, params.foss, params.username])
  return result
}

async function redeemUser (params) {
  const redeem = 'UPDATE jobs SET status = $1, real_score = $2, foss_score = $3 WHERE username = $4 RETURNING *'
  let result = await db.query(redeem, ['completed', params.real, params.foss, params.username])
  return result
}

module.exports.start = start
