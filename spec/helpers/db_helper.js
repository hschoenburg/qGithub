require('dotenv').config()
var db = require('../../handshake/db')

async function seedJob (opts) {
  try {
    const insert = 'INSERT INTO jobs (token, qualcode, username, status) VALUES($1, $2, $3, $4) RETURNING *'
    let result = await db.query(insert, [process.env.TEST_TOKEN, 'yup', opts.username, opts.status])
    return result.rows[0]
  } catch (err) {
    console.log(err)
  }
}

module.exports.seedJob = seedJob
