require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const token = process.env.TOKEN
const octokit = require('@octokit/rest')({
  timeout: 5000, // 0 means no request timeout
  requestMedia: 'application/vnd.github.v3+json',
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
    //let repos = await repoScore(params)

      // let orgs = await orgScore(params)

      // let keys = await keyScore(params)

    // console.log(repos)
    return 0
  } catch (err) {
    throw err
  }
}

async function orgScore (params) {
  params.type = 'orgs'
  try {
    let orgs = await getRepos(params)
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

async function repoScore (params) {
  try {
    let firstPage = await octokit.repos.getForUser(params)

    let data = firstPage.data

    let all = await getAll(firstPage)

    data = data.concat(all)

    // data.forEach(d => { console.log(d.stargazers_count) })

    // let top = data.filter(d => { d.watchers_count > 100 })

    let top = data.sort((a, b) => {
      return b.stargazers_count - a.stargazers_count
    })

    let three = top.slice(0, 3)
    return three
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

    let receivedEvents = await receivedEventsScore(params)
    var total = receivedEvents + events + attrs

    if (total < 25) {
      // console.log(params.username + 'ATTRS: ' + attrs + ' EVENTS: ' + events + ' REC_EVENTS: ' + receivedEvents + ' TOTAL SCORE: ' + total)
    }
    return total > 20
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

// Not sure if we need this one
async function keyScore (params) {
  var score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = 'https://api.github.com/users/' + params.username + '/keys'

  try {
    let result = await rp(opts)
    score += Math.min(result.body.length, 5)
    return score
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
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
