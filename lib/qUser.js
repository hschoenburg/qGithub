require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const utils = require('./utils')

const defaultOpts = {
  method: 'GET',
  uri: 'https://api.github.com/users/',
  json: true,
  resolveWithFullResponse: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'token ',
    'User-Agent': process.env.GITHUB_REFERENCE
  }
}

async function scoreUser (params) {
  var opts = Object.assign({}, defaultOpts)
  opts.uri = defaultOpts.uri + params.username

  try {
    let userData = await rp(opts)

    if (userData.error) { throw new Error('Github users/username Error' + userData.error) }

    let attrs = attrsScore(userData.body)

    let events = await eventsScore(params)

    let receivedEvents = await receivedEventsScore(params)

    var total = receivedEvents + events + attrs
    // TODO sum orgs - with public_repos and craeted_at more than 6 months
    // TODO sum repos - not forks, more than 3 month old

    // TODO put created_at eval here

    // console.log(params.username + 'ATTRS: ' + attrs + ' EVENTS: ' + events + ' REC_EVENTS: ' + receivedEvents + ' REPOS:' + repos + ' TOTAL SCORE: ' + total)

    return total
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

    return Math.min(score, 10)
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

    return Math.min(score, 10)
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

module.exports.scoreUser = scoreUser
