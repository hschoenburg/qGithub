var db = require('../../handshake/db')

async function seedJob (opts) {
  const insert = "INSERT INTO jobs (token, qualcode, username, status) VALUES($1, $2, $3, $4) RETURNING *"
  let result = await db.query(insert, ['blah', 'yup', 'hackerMe', opts.status])
  return result.rows[0]
}

module.exports.seedJob = seedJob
