require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const utils = require('./utils')

/*
 * Repos are specified by  'owner/repo'
 * e.g. chjj/compton
 */

function Repo (params) {
  this.token = params.token
  this.defaultOpts = {
    method: 'GET',
    uri: 'https://api.github.com/repos/',
    json: true,
    resolveWithFullResponse: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'token ' + this.token,
      'User-Agent': process.env.GITHUB_REFERENCE
    }
  }

  this.realRepo = async (repo) => {
    let score = await this.scoreRepo(repo)
    let pass = score > process.env.REPO_SCORE_MIN
    return {pass: pass, score: score, repo: repo}
  }

  this.scoreRepo = async (repo) => {
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = opts.uri + repo

    try {
      let repoData = await rp(opts)

      if (repoData.error) { throw new Error('Github /repos Error ' + repoData.error) }

      let attrs = this.attrsScore(repoData.body)
      let contribs = await this.contribScore(repoData.body.contributors_url)
      let events = await this.eventsScore(repo)

      console.log(repo + ' CONTRIBS:' + contribs + ' ATTRS:' + attrs + ' EVENTS:' + events)

      let total = attrs + events + contribs

      // no forks allowed
      if (repoData.body.fork) { return 1 }

      if (repoData.body.created_at < moment().subtract(1, 'year')) { total += 3 }
      if (repoData.body.updated_at < moment().subtract(6, 'months')) { total += 3 }

      return total
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err.message)
      return err
    }
  }

  this.contribScore = async (url) => {
    let score = 0
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = url
    try {
      let query = await rp(opts)

      score += query.body.length

      let pages = utils.totalPages(query.headers.link)
      score += pages

      let check = true
        // await utils.realUsers(contribs)
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

  this.attrsScore = (data) => {
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

  this.eventsScore = async (repo) => {
    var score = 0
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = 'https://api.github.com/repos/' + repo + '/events'
    const actor = repo.split('/')[0]

    try {
      let result = await rp(opts)

      if (result.error) { throw new Error('Github repos/repo/events Error') }
      let events = result.body
      if (events.length === 0) { return 0 }

      events = utils.filterEvents({events: events, actor: actor})

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
}

module.exports = Repo
