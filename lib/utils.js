
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

module.exports.filterRepos = (repos) => {
  let filtered = repos.filter(r => { return !r.fork && (new Date(r.created_at) < moment().subtract(6, 'months')) })
  return filtered
}

module.exports.rankRepos = (repos) => {
  let ranked = filtered.sort((a, b) => {
    return b.stargazers_count - a.stargazers_count
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
    members = users.slice(0, 3)
    members.forEach(m => {
      checks.push(realUser({username: m.login}))
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
