require('dotenv').config({path: '.env'})
const rp = require('request-promise')
const logger = require('./logger')
const Bounce = require('bounce')
const stats = require('./stats').namespace('tokenserver_api')

/*
 * Wrapper lib for communicating with the Token Server
 */

function timedTokenServerCall (opts, metric, metricTags) {
  let reqTimer = stats.timer(metric, metricTags)

  // Keep track if we want to return a JSON object so that we can temporarily disable
  // that flag. It should be disabled so that request-promise can return the raw body
  // and statusCode for our internal logging, and only then do we convert to JSON ourselves.
  let returnJson = !!opts.json
  opts.json = false
  opts.resolveWithFullResponse = true

  // If using json, request-promise expects the body to be an object that can be stringified.
  // But since we have overridden the .json flag that won't happen, so manually check that and
  // stringify as needed.
  if (returnJson && opts.body) {
    opts.body = JSON.stringify(opts.body)
    opts.headers['Content-Type'] = 'application/json'
  }

  return rp(opts)
    .then((response) => {
      // Ship stat metrics off before handing back the promise
      reqTimer.tags.responsecode = response.statusCode || 0
      reqTimer.end()
      stats.increment('request', reqTimer.tags)

      if (returnJson) {
        let obj = null
        try {
          obj = JSON.parse(response.body)
        } catch (err) {
        }

        return obj
      } else {
        return response.body
      }
    })
}

async function postQualification (params) {
  const opts = {
    method: 'POST',
    uri: process.env.TOKEN_SERVER_API + '/qualification',
    headers: {
      'Content-Type': 'application/json',
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    body: {
      email: params.email,
      service: params.service,
      identifier: params.identifier || null
    },
    json: true
  }

  try {
    const response = await timedTokenServerCall(opts, 'requesttime', {
      job: 'qualificationpost'
    })

    return {
      success: true,
      code: response.result.code,
      service: response.result.service,
      identifier: response.result.identifier,
      email: response.result.email
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR POST /qualification: ' + err.message)
    return {success: false, code: '', service: ''}
  }
}

async function redeemQualification (params) {
  const opts = {
    method: 'POST',
    uri: process.env.TOKEN_SERVER_API + '/qualification/redeem',
    headers: {
      'Content-Type': 'application/json',
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    body: {
      email: params.email,
      service: params.service,
      code: params.code,
      identifier: params.identifier
    },
    json: true
  }

  try {
    const response = await timedTokenServerCall(opts, 'requesttime', {
      job: 'qualificationredeem'
    })

    return {
      success: true,
      email: response.result.email,
      service: response.result.service,
      identifier: response.result.identifier
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR POST /qualification/redeem: ' + err.message)
    return {success: false, code: '', service: '', error: err}
  }
}

async function getQualifications (params) {
  const opts = {
    method: 'GET',
    uri: process.env.TOKEN_SERVER_API + '/qualifications',
    headers: {
      'Content-Type': 'application/json',
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    qs: {
      email: params.email
    },
    json: true
  }
  try {
    const response = await timedTokenServerCall(opts, 'requesttime', {
      job: 'qualificationsget'
    })

    return {
      success: true,
      email: response.result.email,
      qualifications: response.result.qualifications
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER CONNECTION ERROR GET /qualifications: ' + err.message)
    return {success: false, qualifications: [], service: '', error: err}
  }
}

async function postPubKey (params) {
  const opts = {
    method: 'POST',
    uri: process.env.TOKEN_SERVER_API + '/pubkey',
    headers: {
      'Content-Type': 'application/json',
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    body: {
      email: params.email,
      key: params.key,
      wave: process.env.CURRENT_AIRDROP_COHORT
    },
    json: true
  }

  try {
    const response = await timedTokenServerCall(opts, 'requesttime', {
      job: 'pubkeyadd'
    })

    return {
      success: true,
      email: response.email,
      key: response.key
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR POST /pubkey: ' + err.message)
    return {success: false, code: '', key: '', service: '', error: err}
  }
}

async function getPubKey (params) {
  const opts = {
    method: 'GET',
    uri: process.env.TOKEN_SERVER_API + '/pubkey',
    headers: {
      'Content-Type': 'application/json',
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    qs: {email: params.email},
    json: true
  }

  try {
    const response = await timedTokenServerCall(opts, 'requesttime', {
      job: 'pubkeyget'
    })

    if (response.result[0]) {
      return {
        success: true,
        key: response.result[0].key,
        email: response.result[0].email
      }
    } else {
      return {success: false, key: '', email: ''}
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR GET /pubkey: ' + err.message)
    return {success: false, key: '', email: ''}
  }
}

async function getStats (params) {
  const opts = {
    method: 'GET',
    uri: process.env.TOKEN_SERVER_API + '/stat/' + params.type,
    headers: {
      'Content-Type': 'application/json',
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    json: true,
    qs: {
      redeemed: params.redeemed
    }
  }
  try {
    const response = await timedTokenServerCall(opts, 'requesttime', {
      job: 'statsget'
    })

    let stats = {
      github: 0,
      freenode: 0,
      pgpwot: 0,
      survey: 0,
      total: 0
    }
    response.forEach(r => {
      stats[r.service] += Number(r.count)
      stats.total += Number(r.count)
    })

    return stats
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR GET /stat: ' + err.message)
    return { success: false }
  }
}

module.exports.postQualification = postQualification
module.exports.getQualifications = getQualifications
module.exports.redeemQualification = redeemQualification
module.exports.getPubKey = getPubKey
module.exports.postPubKey = postPubKey
module.exports.getStats = getStats
