require('dotenv').config()
const bounce = require('bounce')
const rp = require('request-promise')
const moment = require('moment')
const utils = require('./utils')
const octokit = require('@octokit/rest')

function User (params) {
  this.token = params.token

  this.octokit = octokit({
    headers: {
      'user-agent': process.env.GITHUB_REFERENCE
    }
  })

  this.octokit.authenticate({
    type: 'token',
    token: this.token
  })

  this.token = params.token

  this.defaultOpts = {
    method: 'GET',
    uri: 'https://api.github.com/users/',
    json: true,
    resolveWithFullResponse: true,
    timeout: process.env.REQUEST_TIMEOUT,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'token ' + this.token,
      'User-Agent': process.env.GITHUB_REFERENCE
    }
  }

  this.scoreUser = async (params) => {
    let username = params.username || params.username
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = this.defaultOpts.uri + username

    try {
      let userData = await rp(opts)

      if (userData.error) { throw new Error('Github users/username Error' + userData.error) }

      let attrs = this.attrsScore(userData.body)

      let events = await this.eventsScore(params)

      let receivedEvents = await this.receivedEventsScore(params)

      var total = receivedEvents + events + attrs

      // TODO sum orgs - with public_repos and craeted_at more than 6 months
      // TODO sum repos - not forks, more than 3 month old
      // //TODO together these make up the FOSS Score

      // TODO put created_at eval here

      console.log(username + 'ATTRS: ' + attrs + ' EVENTS: ' + events + ' REC_EVENTS: ' + receivedEvents + ' TOTAL SCORE: ' + total)

      return total
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

  // TODO turn this into fakeCheck
  this.realUser = async (params) => {
    let score = await this.scoreUser(params)
    let pass = score > process.env.USER_SCORE_MIN
    return {pass: pass, score: score, user: params.username}
  }

  this.topOrg = async () => {
    try {
      let response = await this.octokit.orgs.getForUser({username: params.username, per_page: 100})
      let data = response.data
      while (this.octokit.hasNextPage(response)) {
        if (data.length > 50) { break }
        response = await this.octokit.getNextPage(response)
        data = data.concat(response.data)
      }

      if (data.length === 0) { return null }
      let orgs = data.slice(0, 5)
      let promises = []
      orgs.forEach(o => {
        promises.push(this.octokit.orgs.get({org: o.login}))
      })
      let orgsWithData = await Promise.all(promises)
      orgsWithData = orgsWithData.map(o => { return o.data })
      let filtered = utils.filterOrgs(orgsWithData)
      let ranked = utils.rankOrgs(filtered)
      let top = ranked.slice(0, 2)
      return top[0] || false
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

  this.followerScore = async (params) => {
    let response = await this.octokit.users.getFollowersForUser({username: params.username})
    let followers = response.data.slice([5, 10])
    let promises = []
    followers.forEach(f => {
      promises.push(this.scoreUser({username: f.login}))
    })

    let scores = await Promise.all(promises)
    let passes = scores.filter(f => { return f > process.env.USER_SCORE_MIN })
    let total = passes.length * 10
    return Math.min(Math.round(total), 30)
  }

  this.topOwnedRepo = async (params) => {
    try {
      let response = await this.octokit.repos.getForUser({username: params.username})
      let data = response.data
      while (this.octokit.hasNextPage(response)) {
        if (data.length > 50) { break }
        response = await this.octokit.getNextPage(response)
        data = data.concat(response.data)
      }

      if (data.length < 1) { return false }
      // TODO make sure this filtering is right
      let filtered = utils.filterRepos(data)
      let ranked = utils.rankRepos(filtered)
      let top = ranked.slice(0, 2)
      return top[0] || false
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

  this.topPushedRepo = async (params) => {
    try {
      let response = await this.octokit.activity.getEventsForUser({username: params.username})
      let data = response.data
      while (this.octokit.hasNextPage(response)) {
        if (data.length > 50) { break }
        response = await this.octokit.getNextPage(response)
        data = data.concat(response.data)
      }

      if (data.length < 1) { return false }

      let repoNames = utils.getPushedRepos(data)
      return repoNames[0] || false
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

  this.eventsScore = async (params) => {
    var score = 0
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = 'https://api.github.com/users/' + params.username + '/events'

    try {
      let result = await rp(opts)

      if (result.error) { throw new Error('Github users/username/events Error') }

      score = result.body.length

      score += utils.totalPages(result.headers.link)

      return Math.min(Math.round(score), 10)
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

/*
 * returning 0-10
 */

  this.receivedEventsScore = async (params) => {
    var score = 0
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = 'https://api.github.com/users/' + params.username + '/received_events'

    try {
      let result = await rp(opts)

      if (result.error) { throw new Error('Github users/username/received_events Error') }

      score = result.body.length

      score += utils.totalPages(result.headers.link)

      return Math.min(Math.round(score), 10)
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

/*
 * returning 0 -10
 */

  this.attrsScore = (data) => {
    var score = 0

    if (process.env.NODE_ENV !== 'test') {
      if (new Date(data.created_at) > moment().subtract(1, 'year')) { return 0 }
    }

    if (data.bio && data.bio.length < 7) { score += 1 }
    if (data.blog) { score += 1 }

    score += (data.public_repos / 2)
    score += (data.public_gists / 2)
    score += (data.following / 10)
    score += (data.followers / 3)

    const tally = Math.min(Math.round(score), 10)
    return tally
  }
}

module.exports = User
