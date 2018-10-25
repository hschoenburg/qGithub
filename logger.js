const { createLogger, format, transports } = require('winston')
const { combine, timestamp } = format

const logger = createLogger({
  level: process.env.LOG_LEVEL,
  format: combine(format.json(), timestamp()),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV === 'development') {
  logger.add(new transports.Console({
    format: format.simple()
  }))
}

module.exports = logger

