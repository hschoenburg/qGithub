require('dotenv').config()
const bounce = require('bounce')
const rp = require('request-promise')
const moment = require('moment')
const token = process.env.TOKEN
const qUser = require('./qUser')
const qRepo = require('./qRepo')

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

    let events = await eventsScore(org)

    let members = await memberScore(org)

    let repos = await scoreRepos(orgData.body.repos_url)

    let total = attrs + members + events + repos

    // console.log('ORG: ' + org + ' ATTRS:' + attrs + ' MEMBERS:' + members + ' EVENTS:' + events + ' REPOS:' + repos)
    return total
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err.message)
    return err
  }
}

async function scoreRepos (url) {
  try {
    let score
    var opts = Object.assign({}, defaultOpts)
    opts.uri = url

    let response = await rp(opts)

    let repos = response.body
    if (repos.length > 0) {
      let top = repos.sort((a, b) => {
        return b.stargazers_count - a.stargazers_count
      })
      score = await qRepo.scoreRepo(top[0].full_name)
    } else { score = 0 }
    return score
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

    let check = await qUser.fakeCheck(members.body)

    score += pages

    // console.log("MEMBERSCORE:"+score + " PAGES:" +pages +" CHECK:"+check)

    if (check) {
      return score
    } else {
      return 0
    }
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
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
module.exports.scoreOrg = scoreOrg
