require('dotenv').config()
const Repo = require('qRepo')
const Org = require('qOrg')
const User = require('qUser')

// pass token and username

module.exports.qGithub = async (params) => {
  const qUser = new User(params)
  const qRepo = new Repo(params)
  const qOrg = new Org(params)

  let userScore = qUser.scoreUser()

  if (userScore < process.env.MIN_USER_SCORE) {
    return {pass: false, real: userScore, foss: 0}
  }

  let topRepo = qUser.topRepo

  let topOrg = qUser.topOrg

  let repoScore = qRepo.scoreRepo(topRepo)

  if (repoScore > process.env.USER_REPO_SCORE_MIN) {
    return { pass: true, real: userScore, foss: repoScore }
  }

  let orgScore = qOrg.scoreOrg(topOrg)

  // maybe some kind of combo here rather then either/org?

  if (orgScore > process.env.USER_ORG_SCORE_MIN) {
    return {pass: true, real: userScore, foss: orgScore}
  }

  return {pass: false, real: userScore, foss: 0}
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
