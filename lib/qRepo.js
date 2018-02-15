require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
//const moment = require('moment')
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
    console.log('ATTRS: ' + attrs)
    console.log('EVENTS: ' + events)
    console.log('TOTAL SCORE: ' + total)

    return total > 15
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

function attrsScore (data) {
  var score = 0

  // if(data.created_at > moment().subtract(1, 'year')) { return 0 }

  score += (data.stargazers_count / 100)
  score += (data.forks_count / 10)
  score += data.open_issues
  score += (data.subscribers_count / 10)

  const tally = Math.min(score, 10)
  return tally
}

async function eventsScore (repo) {
  var score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = 'https://api.github.com/repos/' + repo + '/events?page=2'

  try {
    let result = await rp(opts)

    if (result.error) { throw new Error('Github repos/repo/events Error') }

    score += result.body.length

    score += totalPages(result.headers.link)

    var tally = Math.min(score, 10)
    return tally
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
    return err
  }
}

function totalPages (link) {
  if (!link) { return 0 }

  const pages = new RegExp(/=\d>/, 'g')
  var lastPage = link.match(pages)[1].match(/\d/)[0]
  return Number(lastPage)
}

module.exports.realRepo = realRepo
