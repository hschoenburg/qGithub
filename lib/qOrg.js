require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const token = process.env.TOKEN
const qUser = require('./qUser')

/*
 */

const defaultOpts = {
  method: 'GET',
  uri: 'https://api.github.com/orgs/',
  json: true,
  resolveWithFullResponse: true,
  headers: {
    'gccept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'token ' + token,
    'User-Agent': process.env.GITHUB_REFERENCE
  }
}

async function realOrg (org) {
  let score = await scoreOrg(org)
  return score > 10
}

async function scoreOrg (org) {
  var opts = Object.assign({}, defaultOpts)
  opts.uri = defaultOpts.uri + org

  try {
    let orgData = await rp(opts)

    if (orgData.error) { throw new Error('Github /orgs Error ' + orgData.error) }

    let attrs = await attrsScore(orgData.body)

    let members = await memberScore(org)
    let events = await eventsScore(org)

    let total = attrs + members + events

    return total
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err.message)
    return err
  }
}

// give this function an array of users to check for real
// returns false if ALL THREE checks fail
async function memberCheck (members) {
  let checks = []
  let pass = true
  try {
    members = members.slice(0, 3)
    members.forEach(m => {
      checks.push(qUser.realUser({username: m.login}))
    })

    let results = await Promise.all(checks)
    if (results.indexOf(true) < 0) { pass = false }
    return pass
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
  }
}

async function memberScore (org) {
  let score = 0
  try {
    var opts = Object.assign({}, defaultOpts)
    opts.uri = defaultOpts.uri + org + '/public_members'

    let members = await rp(opts)

    score += members.body.length

    let pages = totalPages(members.headers.link)

    let check = await memberCheck(members.body)

    score += pages

    if (check) {
      return score
    } else {
      return 0
    }
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err.message)
    return err
  }
}

function attrsScore (data) {
  var score = 0

  if (data.created_at < moment().subtract(6, 'months')) { score += 3 }
  if (data.updated_at > moment().subtract(3, 'months')) { score += 3 }

  score += (data.public_repos / 2)

  const tally = Math.min(score, 10)
  return tally
}

async function eventsScore (org) {
  var score = 0
  var opts = Object.assign({}, defaultOpts)
  opts.uri = 'https://api.github.com/orgs/' + org + '/events?page=2'

  try {
    let result = await rp(opts)

    if (result.error) { throw new Error('Github orgs/org/events Error') }

    let events = result.body

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

function totalPages (link) {
  if (!link) { return 0 }

  const pages = new RegExp(/=\d>/, 'g')
  var lastPage = link.match(pages)[1].match(/\d/)[0]
  return Number(lastPage)
}

module.exports.realOrg = realOrg
