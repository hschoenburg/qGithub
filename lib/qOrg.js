require('dotenv').config()
const bounce = require('bounce')
const rp = require('request-promise')
const moment = require('moment')
const utils = require('./utils')
const octokit = require('@octokit/rest')

function Org (params) {
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
    uri: 'https://api.github.com/orgs/',
    json: true,
    resolveWithFullResponse: true,
    headers: {
      'gccept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'token ' + this.token,
      'User-Agent': process.env.GITHUB_REFERENCE
    }
  }

  this.realOrg = async(org) => {
    let score = await this.scoreOrg(org)
    let pass = score > process.env.ORG_SCORE_MIN
    return {pass: pass, score: score, org: org}
  }

  this.scoreOrg = async (org) => {
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = this.defaultOpts.uri + org

    try {
      let orgData = await rp(opts)

      if (orgData.error) { throw new Error('Github /orgs Error ' + orgData.error) }

      let attrs = this.attrsScore(orgData.body)

      let events = await this.eventsScore(org)

      let members = await this.memberScore(org)

      let repos = await this.repoScore(org)

      let total = attrs + members + events + repos

      // console.log('ORG: ' + org + ' ATTRS:' + attrs + ' MEMBERS:' + members + ' EVENTS:' + events + ' REPOS:' + repos)
      return Math.min(Math.round(total), 30)
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

  this.repoScore = async (org) => {
    try {
      let score

      let response = await this.octokit.repos.getForOrg({org: org})
      let data = response.data
      while (this.octokit.hasNextPage(response)) {
        if (data.length > 50) { break }
        response = await this.octokit.getNextPage(response)
        data = data.concat(response.data)
      }

      if (data.length > 1) {
        let filtered = utils.filterRepos(data)
        let ranked = utils.rankRepos(filtered)
        let top = ranked.slice(0, 2)
        score = utils.sumStars(top)
      } else { score = 0 }
      return Math.min(Math.round(score), 10)
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
    }
  }

  this.memberScore = async (org) => {
    let score = 0
    try {
      var opts = Object.assign({}, this.defaultOpts)
      opts.uri = this.defaultOpts.uri + org + '/public_members'

      let members = await rp(opts)
      score += members.body.length

      let pages = utils.totalPages(members.headers.link)
      score += pages

      let check = true
        // await utils.realUsers(members.body)

      if (check) {
        return Math.min(Math.round(score), 10)
      } else {
        return 0
      }
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }

  this.attrsScore = (data) => {
    var score = 0

    if (data.created_at < moment().subtract(6, 'months')) { score += 3 }
    if (data.updated_at > moment().subtract(3, 'months')) { score += 3 }

    score += (data.public_repos / 2)

    const tally = Math.min(Math.round(score), 10)
    return tally
  }

  this.eventsScore = async (org) => {
    var score = 0
    var opts = Object.assign({}, this.defaultOpts)
    opts.uri = 'https://api.github.com/orgs/' + org + '/events'

    try {
      let result = await rp(opts)
      let events = result.body

      if (result.error) { throw new Error('Github orgs/org/events Error') }

      score += events.length

      score += utils.totalPages(result.headers.link)

      var tally = Math.min(Math.round(score), 10)
      return tally
    } catch (err) {
      bounce.rethrow(err, 'system')
      console.log(err)
      return err
    }
  }
}

module.exports = Org
