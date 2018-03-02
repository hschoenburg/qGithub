require('dotenv').config()
const bounce = require('bounce')
const logger = require('../handshake/logger')
const Repo = require('./qRepo')
const Org = require('./qOrg')
const User = require('./qUser')

// pass token and username
//
/*
 *  token      | character varying(250)   |
 *   qualcode   | character varying(250)   |
 *    username   | character varying(250)   |
 *     status     | character varying(250)   |
 *      real_score | integer                  |
 *       foss_score | integer                  |
 *        created_at | timestamp with time zone | default now()
 *         updated_at | timestamp with time zone | not null default now()
 */

function Github (params) {
  this.token = params.token
  this.username = params.username
  this.job = params.job

  this.qUser = new User(params)
  this.qOrg = new Org(params)
  this.qRepo = new Repo(params)

  this.score = async () => {
    try {
      let ownedRepoScore = 0
      let pushedRepoScore = 0
      let orgScore = 0
      let followerScore = 0

      // TODO turn this into a cascading logic that exits as soon
      // as the user passes/fails via one step
      //
      // let followerScore = await this.qUser.followerScore({username: this.username})
      let userScore = await this.qUser.scoreUser({username: this.username})
      let topOwnedRepo = await this.qUser.topOwnedRepo({username: this.username})
      let topPushedRepo = await this.qUser.topPushedRepo({username: this.username})
      let topOrg = await this.qUser.topOrg({username: this.username})

      if (topOwnedRepo) {
        ownedRepoScore = await this.qRepo.scoreRepo(topOwnedRepo.full_name)
        logger.info(topOwnedRepo.full_name)
      }
      if (topPushedRepo) {
        pushedRepoScore = await this.qRepo.scoreRepo(topPushedRepo)
        logger.info(topPushedRepo)
      }
      if (topOrg) {
        orgScore = await this.qOrg.scoreOrg(topOrg.login)
        logger.info(topOrg.login + ':' + orgScore)
      }

      logger.info(this.username + ' USER:' + userScore + ' REPO:' + ownedRepoScore + ' ORG:' + ':' + orgScore + ' PUSHED: ' + pushedRepoScore + ' FOLLOWER:' + followerScore)

      let foss = Math.max(ownedRepoScore, pushedRepoScore, orgScore, followerScore)
      return { username: this.username, job: this.job, real: userScore, repo: ownedRepoScore, pushed_repo: pushedRepoScore, org: orgScore, follower: followerScore, foss: foss }
    } catch (err) {
      bounce.rethrow(err, 'system')
      logger.error(err)
      return err
    }
  }
}
module.exports = Github
