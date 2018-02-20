const rp = require('request-promise')
const logger = require('./logger')
const Bounce = require('bounce')
/*
 * Wrapper lib for communicating with the Token Server
 */

async function postQualification (params) {
  const opts = {
    method: 'POST',
    uri: process.env.TOKEN_SERVER_API + '/qualification',
    headers: {
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
    const response = await rp(opts)
    return {
      success: true,
      code: response.result.code,
      service: response.result.service,
      identifier: response.result.identifier,
      email: response.result.email
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR POST /qualification')
    return {success: false, code: '', service: ''}
  }
}

async function redeemQualification (params) {
  const opts = {
    method: 'POST',
    uri: process.env.TOKEN_SERVER_API + '/qualification/redeem',
    headers: {
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
    const response = await rp(opts)
    return {
      success: true,
      email: response.result.email,
      service: response.result.service,
      identifier: response.result.identifier
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR POST /qualification/redeem')
    return {success: false, code: '', service: '', error: err}
  }
}

async function getQualifications (params) {
  const opts = {
    method: 'GET',
    uri: process.env.TOKEN_SERVER_API + '/qualifications',
    headers: {
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    qs: {
      email: params.email
    },
    json: true
  }
  try {
    const response = await rp(opts)
    return {
      success: true,
      email: response.result.email,
      qualifications: response.result.qualifications
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER CONNECTION ERROR GET /qualifications')
    return {success: false, qualifications: [], service: '', error: err}
  }
}

async function postPubKey (params) {
  const opts = {
    method: 'POST',
    uri: process.env.TOKEN_SERVER_API + '/pubkey',
    headers: {
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
    const response = await rp(opts)
    return {
      success: true,
      email: response.email,
      key: response.key
    }
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR POST /pubkey')
    return {success: false, code: '', key: '', service: '', error: err}
  }
}

async function getPubKey (params) {
  const opts = {
    method: 'GET',
    uri: process.env.TOKEN_SERVER_API + '/pubkey',
    headers: {
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    qs: {email: params.email},
    json: true
  }

  try {
    const response = await rp(opts)
    if (response.success) {
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
    logger.error('TOKEN SERVER ERROR GET /pubkey')
    return {success: false, key: '', email: ''}
  }
}

async function getStats (params) {
  const opts = {
    method: 'GET',
    uri: process.env.TOKEN_SERVER_API + '/stat/' + params.type,
    headers: {
      'X-API-TOKEN': process.env.TOKEN_SERVER_KEY
    },
    json: true,
    qs: {
      redeemed: params.redeemed
    }
  }
  try {
    const response = rp(opts)
    return response
  } catch (err) {
    Bounce.rethrow(err, 'system')
    logger.error('TOKEN SERVER ERROR GET /stat')
    return { success: false }
  }
}

module.exports.postQualification = postQualification
module.exports.getQualifications = getQualifications
module.exports.redeemQualification = redeemQualification
module.exports.getPubKey = getPubKey
module.exports.postPubKey = postPubKey
module.exports.getStats = getStats
