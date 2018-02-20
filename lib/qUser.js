require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const token = process.env.TOKEN
const qOrg = require('./qOrg')
const qRepo = require('./qRepo')
const utils = require('./qUtils')
const octokit = require('@octokit/rest')({
  headers: {
    'user-agent': process.env.GITHUB_REFERENCE
  }
})

octokit.authenticate({
  type: 'token',
  token: token
})

function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve(true), ms))
}

const defaultOpts = {
  method: 'GET',
  uri: 'https://api.github.com/users/',
  json: true,
  resolveWithFullResponse: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'token ' + token,
    'User-Agent': process.env.GITHUB_REFERENCE
  }
}

/*
 * returns BOOL
 * params: STRING username
 */

async function fossScore (params) {
  try {
    let repos = 0
    let orgs = 0

    let megaReady = timeout(Math.round(Math.random() * 10) * 1000)
    if (megaReady) {
    // wait for up to 10 seconds

      let reallyReady = timeout(Math.round(Math.random() * 10) * 1000)
      if (reallyReady) {
        orgs = await orgScore(params)
      }

      let moreReady = timeout(Math.round(Math.random() * 10) * 1000)
      if (moreReady) {
        repos = await fullRepoScore(params)
      }

      let total = repos + orgs
      console.log('FOSS:' + params.username + ' REPOS:' + repos + ' ORGS:' + orgs + ' TOTAL:' + total)
      return total
    }
  } catch (err) {
    throw err
  }
}

/* returns BOOL
 * params: STRING username
 */

async function realUser (params) {
  let score = 0
  let pass = false
    score = await quickScoreUser(params)
    pass = score > process.env.USER_SCORE_MIN
    return {user: params.username, score: score, pass: pass}
  }
}

async function quickScoreUser (params) {
  var opts = Object.assign({}, defaultOpts)
  opts.uri = defaultOpts.uri + params.username

  try {
    let userData = await rp(opts)

    if (userData.error) { throw new Error('Github users/username Error' + userData.error) }

    let attrs = attrsScore(userData.body)

    let events = await eventsScore(params)

    let repos = await quickRepoScore(userData.body.repos_url)

    let receivedEvents = await receivedEventsScore(params)

    var total = receivedEvents + events + attrs + repos

    // console.log(params.username + 'ATTRS: ' + attrs + ' EVENTS: ' + events + ' REC_EVENTS: ' + receivedEvents + ' REPOS:' + repos + ' TOTAL SCORE: ' + total)

    return total
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

async function orgScore (params) {
  var opts = Object.assign({}, defaultOpts)
  opts.uri = defaultOpts.uri + params.username + '/orgs'

  let score = 0
  let scores = []
  try {
    let response = await rp(opts)

    if (response.body.length === 0) {
      return 0
    }
    let orgs = response.body.slice(0, 2)
    orgs.forEach(o => {
      scores.push(qOrg.scoreOrg(o.login))
    })

    let results = await Promise.all(scores)
    score = Math.max(...results)
    return score
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

async function quickRepoScore (url) {
  try {
    let score = 0
    var opts = Object.assign({}, defaultOpts)
    opts.uri = url

    let response = await rp(opts)
    let repos = response.body

    if (repos.length < 2) { return 0 }

    let top = qRepo.getTopRepos(repos)
    top = top.slice(0, 3)
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

async function getAll (response) {
  let data = []
  try {
    while (octokit.hasNextPage(response)) {
      response = await octokit.getNextPage(response)
      data = data.concat(response.data)
    }
    return data
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}
/*
 * returning 0 - 10
 */
async function eventsScore (params) {
  var score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = 'https://api.github.com/users/' + params.username + '/events?page=2'

  try {
    let result = await rp(opts)

    if (result.error) { throw new Error('Github users/username/events Error') }

    score = result.body.length

    score += utils.totalPages(result.headers.link)

    return score
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

/*
 * returning 0-10
 */

async function receivedEventsScore (params) {
  var score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = 'https://api.github.com/users/' + params.username + '/received_events?page=10'

  try {
    let result = await rp(opts)

    if (result.error) { throw new Error('Github users/username/received_events Error') }

    score = result.body.length

    score += utils.totalPages(result.headers.link)

    return score
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

async function fakeCheck (members) {
  let checks = []
  let pass = true
  try {
    members = members.slice(0, 3)
    members.forEach(m => {
      checks.push(realUser({username: m.login}))
    })
    let results = await Promise.all(checks)
    let passes = results.map(r => { return r.pass })
    if (passes.indexOf(true) < 0) { pass = false }
    return pass
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
  }
}

/*
 * returning 0 -10
 */

function attrsScore (data) {
  var score = 0

  if (data.created_at > moment().subtract(1, 'year')) { return 0 }

  if (data.bio && data.bio.length < 7) { score += 1 }
  if (data.blog) { score += 1 }

  score += (data.public_repos / 3)
  score += (data.public_gists / 3)
  score += (data.following / 10)
  score += (data.followers / 10)

  const tally = Math.min(score, 10)
  return tally
}

module.exports.realUser = realUser
module.exports.fossScore = fossScore
module.exports.fakeCheck = fakeCheck
module.exports.quickScoreUser = quickScoreUser
