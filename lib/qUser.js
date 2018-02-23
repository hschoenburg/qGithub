require('dotenv').config()
const rp = require('request-promise')
const bounce = require('bounce')
const moment = require('moment')
const utils = require('./utils')

function User (params) {
  this.token = params.token

  this.defaultOpts = {
    method: 'GET',
    uri: 'https://api.github.com/users/',
    json: true,
    resolveWithFullResponse: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'token ' + this.token,
      'User-Agent': process.env.GITHUB_REFERENCE
    }
  }

  this.scoreUser = async (params) => {
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = this.defaultOpts.uri + params.username

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

      console.log(params.username + 'ATTRS: ' + attrs + ' EVENTS: ' + events + ' REC_EVENTS: ' + receivedEvents + ' TOTAL SCORE: ' + total)

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

/*
 * returning 0 - 10
 */

  this.eventsScore = async (params) => {
    var score = 0
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = 'https://api.github.com/users/' + params.username + '/events'

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

  this.receivedEventsScore = async (params) => {
    var score = 0
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = 'https://api.github.com/users/' + params.username + '/received_events'

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

  this.attrsScore = (data) => {
    var score = 0

    if (data.created_at > moment().subtract(1, 'year')) { return 0 }

    if (data.bio && data.bio.length < 7) { score += 1 }
    if (data.blog) { score += 1 }

    score += (data.public_repos / 5)
    score += (data.public_gists / 5)
    score += (data.following / 10)
    score += (data.followers / 10)

    const tally = Math.min(Math.round(score), 10)
    return tally
  }
}

module.exports = User
