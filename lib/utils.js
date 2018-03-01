
const moment = require('moment')
const bounce = require('bounce')

// header content is different if initial request includes a page number
module.exports.totalPages = (link) => {
  let total
  if (!link) { return 0 } else {
    const pattern = new RegExp(/=\d>/, 'g')
    var pages = link.match(pattern)
    if (pages.length > 1) {
      total = pages[1].match(/\d/)[0]
    } else {
      total = pages[0].match(/\d/)[0]
    }
    return Number(total)
  }
}

// no forks. must be over 3 months old
module.exports.filterRepos = (repos) => {
  if(process.env.NODE_ENV === 'test') { return repos }
  let filtered = repos.filter(r => { return !r.fork && (new Date(r.created_at) < moment().subtract(3, 'months')) })
  return filtered
}

module.exports.rankRepos = (repos) => {
  let ranked = repos.sort((a, b) => {
    return b.stargazers_count - a.stargazers_count
  })
  return ranked
}

module.exports.filterOrgs = (orgs) => {
  if(process.env.NODE_ENV === 'test') { return orgs }
  let filtered = orgs.filter(o => { return (new Date(o.created_at) < moment().subtract(3, 'months')) })
  return filtered
}

module.exports.rankOrgs = (orgs) => {
  let ranked = orgs.sort((a, b) => {
    return b.public_repos - a.public_repos
  })
  return ranked
}

module.exports.filterEvents = (params) => {
  let cleaned = []
  params.events.forEach(e => {
    if (params.actor !== e.actor) {
      cleaned.push(e)
    }
  })
  return cleaned
}

module.exports.sumStars = (repos) => {
  let totalStars = repos.reduce((a, r) => { return a + r.stargazers_count }, 0)
  return totalStars
}

module.exports.realUsers = async (users) => {
  let checks = []
  let pass = true
  try {
    users = users.slice(0, 3)
    users.forEach(u => {
      // checks.push(realUser({username: m.login}))
      // TODO FIX THIS
    })
    let results = await Promise.all(checks)
    let passes = results.map(r => { return r.pass })
    if (passes.indexOf(true) < 0) { pass = false }
    return pass
  } catch (err) {
    bounce.rethrow(err, 'system')
    console.log(err)
  }
}
module.exports.timeout = (ms) => {
  return new Promise(resolve => setTimeout(resolve(true), ms))
}
