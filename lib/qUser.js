require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const token = process.env.TOKEN
const qOrg = require('./qOrg')
const qRepo = require('./qRepo')
const octokit = require('@octokit/rest')({
  headers: {
    'user-agent': process.env.GITHUB_REFERENCE
  }
})

octokit.authenticate({
  type: 'token',
  token: token
})

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
    let repos = await fullRepoScore(params)

    let orgs = await orgScore(params)

    console.log('FOSS:' + params.username + ' REPOS:' + repos + ' ORGS:' + orgs)

    return repos + orgs
  } catch (err) {
    throw err
  }
}

async function orgScore (params) {
  try {
    let orgs = await octokit.orgs.getForUser(params)

    let top = orgs.sort((a, b) => {
      return b.public_repos - a.public_repos
    })

    let score = qOrg.scoreOrg(top[0].login)
    return score
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

async function fastRepoScore (url) {
  try {
    let score = 0
    var opts = Object.assign({}, defaultOpts)
    opts.uri = url

    let response = await rp(opts)
    let repos = response.body
    if (repos.length > 0) {
      let starred = repos.filter(r => r.stargazers_count > 5)
      score += starred.length
    } else { score = 0 }
    return score
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
  }
}

async function fullRepoScore (params) {
  try {
    let avg
    let firstPage = await octokit.repos.getForUser(params)

    let data = firstPage.data

    let all = await getAll(firstPage)

    data = data.concat(all)

    let top = data.sort((a, b) => {
      return b.stargazers_count - a.stargazers_count
    })

    top = top.slice(0, 3)
    let topScores = []
    top.forEach(r => {
      topScores.push(qRepo.scoreRepo(r.full_name))
    })

    let scores = await Promise.all(topScores)
    scores.forEach(s => {
      avg += s
    })

    return avg / 3
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

/* returns BOOL
 * params: STRING username
 */
async function realUser (params) {
  var opts = Object.assign({}, defaultOpts)
  opts.uri = defaultOpts.uri + params.username

  try {
    let userData = await rp(opts)

    if (userData.error) { throw new Error('Github users/username Error' + userData.error) }

    let attrs = attrsScore(userData.body)

    let events = await eventsScore(params)

    let repos = await fastRepoScore(userData.body.repos_url)

    let receivedEvents = await receivedEventsScore(params)

    var total = receivedEvents + events + attrs + repos

    // console.log(params.username + 'ATTRS: ' + attrs + ' EVENTS: ' + events + ' REC_EVENTS: ' + receivedEvents +  " REPOS:" + repos + ' TOTAL SCORE: ' + total)
    if (total < 25) {
      // console.log(params)
      // console.log("@@@@@@@")
    }
    return total > 19
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

    score += totalPages(result.headers.link)

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

    score += totalPages(result.headers.link)

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
    if (results.indexOf(true) < 0) { pass = false }
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

function totalPages (link) {
  if (!link) { return 0 }

  const pages = new RegExp(/=\d>/, 'g')
  var lastPage = link.match(pages)[1].match(/\d/)[0]
  return Number(lastPage)
}

module.exports.realUser = realUser
module.exports.fossScore = fossScore
module.exports.fakeCheck = fakeCheck
