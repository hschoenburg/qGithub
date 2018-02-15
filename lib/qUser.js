require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const token = process.env.TOKEN

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

    console.log(params.username)
    console.log('ATTRS: ' + attrs)
    console.log('EVENTS: ' + events)
    console.log('REC_EVENTS: ' + receivedEvents)
    console.log('TOTAL SCORE: ' + total)

    return total > 25
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
  opts.uri = 'https://api.github.com/users/' + params.username + '/events?page=1'

  try {
    let result = await rp(opts)

    if (result.error) { throw new Error('Github users/username/events Error') }
    debugger

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
