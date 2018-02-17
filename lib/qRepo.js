require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const token = process.env.TOKEN

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

async function realRepo (repo) {
  var opts = Object.assign({}, defaultOpts)
  opts.uri = defaultOpts.uri + repo

  try {
    let repoData = await rp(opts)

    if (repoData.error) { throw new Error('Github /repos Error ' + repoData.error) }

    let attrs = await attrsScore(repoData.body)
    let events = await eventsScore(repo)
    let total = attrs + events

    console.log(repo)
    console.log('ATTRS: ' + attrs + ' EVENTS: ' + events + ' TOTAL SCORE: ' + total)

    // must be at least 10
    return total > 10
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err.message)
    return err
  }
}

function attrsScore (data) {
  var score = 0

  if (data.created_at > moment().subtract(1, 'year')) { score += 3 }

  score += (data.stargazers_count / 2)
  score += (data.forks_count / 3)
  score += (data.open_issues / 3)
  score += (data.subscribers_count / 3)
  score += (data.network_count / 3)
  if (data.fork) { score -= 50 }

  if (score < 0) { score = 0 }

  const tally = Math.min(score, 10)
  return tally
}

async function eventsScore (repo) {
  var score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = 'https://api.github.com/repos/' + repo + '/events?page=2'
  const actor = repo.split('/')[0]

  try {
    let result = await rp(opts)

    if (result.error) { throw new Error('Github repos/repo/events Error') }

    let events = cleanEvents({events: result.body, actor: actor})

    score += events.length

    score += totalPages(result.headers.link)

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

function totalPages (link) {
  if (!link) { return 0 }

  const pages = new RegExp(/=\d>/, 'g')
  var lastPage = link.match(pages)[1].match(/\d/)[0]
  return Number(lastPage)
}

module.exports.realRepo = realRepo
