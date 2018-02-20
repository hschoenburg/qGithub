require('dotenv').config({path: '.env'})
// override with test env vars
process.env.NODE_ENV = 'test'
process.env.PGDATABASE = 'handshake_test'

var dbCleaner = require('./db_cleaner')

afterEach(done => {
  dbCleaner.truncateTables()
    .then(val => {
      done()
    }).catch(e => {
      throw e
    })
  done()
})
