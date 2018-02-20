require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const token = process.env.TOKEN
const qUser = require('./qUser')
const utils = require('./qUtils')

/*
 * Repos are specified by  'owner/repo'
 * e.g. chjj/compton
 */

const defaultOpts = {
  method: 'GET',
  uri: 'https://api.github.com/repos/',
  json: true,
  resolveWithFullResponse: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'token ' + token,
    'User-Agent': process.env.GITHUB_REFERENCE
  }
}

function timeout (ms) {
  console.log('WAITING')
  return new Promise(resolve => setTimeout(resolve(true), ms))
}

async function realRepo (repo) {
  let score = 0
  let pass = false

  let reallyReady = timeout(Math.round(Math.random() * 10) * 1000)
  if (reallyReady) {
    score = await scoreRepo(repo)
  }

  let moreReady = timeout(Math.round(Math.random() * 10) * 1000)
  if (moreReady) {
    pass = score > process.env.REPO_SCORE_MIN
  }
  return {repo: repo, pass: pass, score: score}
}

async function scoreRepo (repo) {
  var opts = Object.assign({}, defaultOpts)
  opts.uri = defaultOpts.uri + repo

  try {
    let repoData = await rp(opts)

    if (repoData.error) { throw new Error('Github /repos Error ' + repoData.error) }

    let contribs = await contribScore(repoData.body.contributors_url)
    let attrs = await attrsScore(repoData.body)
    let events = await eventsScore(repo)

    console.log(repo + ' CONTRIBS:' + contribs + ' ATTRS:' + attrs + ' EVENTS:' + events)
    let total = attrs + events + contribs

    if (repoData.body.fork) { total -= 20 }
    if (total < 0) { total = 0 }

    if (repoData.body.created_at < moment().subtract(1, 'year')) { total += 3 }
    if (repoData.body.updated_at < moment().subtract(6, 'months')) { total += 3 }

    return total
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err.message)
    return err
  }
}

async function contribScore (url) {
  console.log(url)
  let score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = url
  try {
    let query = await rp(opts)

    score += query.body.length

    let pages = utils.totalPages(query.headers.link)
    score += pages

    let check = await qUser.fakeCheck(query.body)
    if (check) {
      return Math.min(score, 10)
    } else {
      console.log('CHECK FAIL')
      return 0
    }
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err.message)
    return err
  }
}

function attrsScore (data) {
  let score = 0

  score += (data.stargazers_count / 2)
  score += (data.forks_count / 3)
  score += (data.open_issues / 3)
  score += (data.subscribers_count / 3)
  score += (data.network_count / 3)

  if (score < 0) { score = 0 }

  const tally = Math.min(score, 10)
  return tally
}

async function eventsScore (repo) {
  var score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = 'https://api.github.com/repos/' + repo + '/events'
  const actor = repo.split('/')[0]

  try {
    let result = await rp(opts)

    if (result.error) { throw new Error('Github repos/repo/events Error') }

    let events = cleanEvents({events: result.body, actor: actor})

    score += events.length

    score += utils.totalPages(result.headers.link)

    var tally = Math.min(score, 10)
    return tally
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

function cleanEvents (params) {
  let cleaned = []
  params.events.forEach(e => {
    if (e.actor.login !== params.actor) {
      cleaned.push(e)
    }
  })
  return cleaned
}

function getTopRepos (repos) {
  let filtered = repos.filter(r => { return !r.fork && (new Date(r.created_at) < moment().subtract(6, 'days')) })
  let ranked = filtered.sort((a, b) => {
    return b.stargazers_count - a.stargazers_count
  })
  return ranked
}

module.exports.realRepo = realRepo
module.exports.scoreRepo = scoreRepo
module.exports.getTopRepos = getTopRepos
