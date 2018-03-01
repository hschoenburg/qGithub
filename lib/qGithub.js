require('dotenv').config()
const bounce = require('bounce')
const Repo = require('./qRepo')
const Org = require('./qOrg')
const User = require('./qUser')

// pass token and username
//
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

function Github (params) {
  this.token = params.token
  this.username = params.username
  this.job_id = params.job_id

  this.qUser = new User(params)
  this.qOrg = new Org(params)
  this.qRepo = new Repo(params)


  this.run = async () => {
    try {
      let repoScore = 0
      let orgScore = 0

      let userScore = await this.qUser.scoreUser()
      let topRepo   = await this.qUser.topRepo()
      let topOrg    = await this.qUser.topOrg()


      if(topRepo) { 
        repoScore = await this.qRepo.scoreRepo(topRepo.full_name)
        console.log(topRepo.full_name + ":" + topRepo.full_name)
      }
      if(topOrg) {
        orgScore  = await this.qOrg.scoreOrg(topOrg.login)
        console.log(topOrg.login + ":"+orgScore)
      }

      console.log(this.username + " USER:" + userScore + " REPO:"  + repoScore + " ORG:" + ":" + orgScore)

      let foss = Math.max(repoScore, orgScore)
      return { real: userScore, repo: repoScore, org: orgScore, foss: foss}

    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err.message)
      return err
    }
  }
}


  /*
  if (userScore < process.env.MIN_USER_SCORE) {
    return {pass: false, real: userScore, foss: 0}
  }

  if (repoScore > process.env.USER_REPO_SCORE_MIN) {
    return { pass: true, real: userScore, foss: repoScore }
  }

  // maybe some kind of combo here rather then either/org?

  if (orgScore > process.env.USER_ORG_SCORE_MIN) {
    return {pass: true, real: userScore, foss: orgScore}
  }

  return {pass: false, real: userScore, foss: 0}

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
*/

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

/*
 * returns sum
async function quickRepoScore (url) {
  try {
    let score = 0
    var opts = Object.assign({}, defaultOpts)
    opts.uri = url

    let response = await rp(opts)
    let repos = response.body

    if (repos.length < 2) { return 0 }

    let top = utils.rankRepos(repos)
    top = top.slice(0, 2)
    let totalStars = top.reduce((a, r) => { return a + r.stargazers_count }, 0)
    score = totalStars
    return Math.min(score, 10)
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
  }
}

// Returns the sum of scoreRepo on their top 3 repos
async function fullRepoScore (params) {
  try {
    let firstPage = await octokit.repos.getForUser(params)

    let data = firstPage.data

    let all = await getAll(firstPage)

    data = data.concat(all)

    let top = qRepo.getTopRepos(data)

    top = top.slice(0, 3)
    let topScores = []
    top.forEach(r => {
      console.log(r.full_name)
      topScores.push(qRepo.scoreRepo(r.full_name))
    })

    let scores = await Promise.all(topScores)
    console.log('$')
    console.log(scores)

    let total = scores.reduce((a, b) => { return a + b }, 0)
    return Math.min(total, 30)
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

*/
module.exports = Github
