/*
 * GithubQ
 */

require('dotenv').config()
const db = require('./handshake/db')
const logger = require('./handshake/logger')
const tokenServer = require('./handshake/token_server')
const Github = require('./lib/qGithub')
const bounce = require('bounce')


async function start () {
  try {
    console.log('running loopppp!')
    let jobs = await getJobs()
    let running = []

    if (jobs.length === 0) {
      console.log('no jobs!')
      return true
    } else {
      console.log('jobs! ' + jobs.length)
      jobs.forEach(j => {
        const qGithub = new Github({token: j.token, username: j.username, job: j})
        running.push(qGithub.score())
      })
    }
    let scores = await Promise.all(running)

    let finished = []

    scores.forEach(s => {
      finished.push(saveScore(s))
    })

    let results = await Promise.all(finished)
    return results
  } catch (err) {
    logger.error(err.message)
    return err
  }
}

async function getJobs () {
  try {
    const lookup = 'SELECT * FROM jobs where status = $1'
    const result = await db.query(lookup, ['pending'])
    return result.rows
  } catch (err) {
    logger.error(err.message)
    return err
  }
}

async function saveScore (s) {
  try {
    var result

    if (s.real < process.env.USER_SCORE_MIN) {
      result = await reviewUser(s)
      return {username: s.username, status: 'reviewed'}
    } else if (s.foss < process.env.FOSS_SCORE_MIN) {
      result = await reviewUser(s)
      return {username: s.username, status: 'reviewed'}
    } else if (s.foss > process.env.FOSS_SCORE_MIN) {
      result = await reviewUser(s)
      if(process.env.AUTO_APPROVE === 'true') {
        result = await redeemUser(s)
        await tokenServer.redeemQualification({code: s.job.qualcode, identifier: s.job.username, service: 'github'})
      }
      return result.rows[0]
    } else {
      return false
    }
  } catch (err) {
    bounce.rethrow(err, 'system')
    logger.error(err.message)
    return err
  }
}

async function rejectUser (s) {
  try {
    const reject = 'UPDATE jobs SET status = $1, real_score = $2, foss_score = $3 WHERE id = $4 RETURNING *'
    let result = await db.query(reject, ['rejected', s.real, s.foss, s.job.id])
    return result
  } catch (err) {
    bounce.rethrow(err, 'system')
    logger.error(err.message)
    return err
  }
}

async function reviewUser (s) {
  try {
    const review = 'UPDATE jobs SET status = $1, real_score = $2, foss_score = $3 WHERE id = $4 RETURNING *'
    let result = await db.query(review, ['reviewed', s.real, s.foss, s.job.id])
    return result
  } catch (err) {
    bounce.rethrow(err, 'system')
    logger.error(err.message)
    return err
  }
}

async function redeemUser (s) {
  try {
    const redeem = 'UPDATE jobs SET status = $1, real_score = $2, foss_score = $3 WHERE id = $4 RETURNING *'
    let result = await db.query(redeem, ['completed', s.real, s.foss, s.job.id])
    return result
  } catch (err) {
    bounce.rethrow(err, 'system')
    logger.error(err.message)
    return err
  }
}

module.exports.start = start
