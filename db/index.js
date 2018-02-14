'use strict'

require('dotenv').config()

const pg = require('pg')
const pool = new pg.Pool()

module.exports = {
  query: (text, params) => {
    return pool.query(text, params)
  },

  getClient: (callback) => {
    pool.connect((err, client, done) => {
      callback(err, client, done)
    })
  },
  getPool: () => {
    return pool
  }
}
