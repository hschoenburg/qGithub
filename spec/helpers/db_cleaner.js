const db = require('../../handshake/db')

const truncateAllTables = 'TRUNCATE TABLE jobs'

module.exports = {
  truncateTables: () => {
    return db.query(truncateAllTables)
  }
}
