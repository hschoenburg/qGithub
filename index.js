require('dotenv').config()
const runner = require('./runner')

function runLoop (fn) {
  try {
    setTimeout(() => {
      fn().then(() => {
        console.log('loop')
        runLoop(fn)
      })
    }, process.env.LOOP_TIMEOUT)
  } catch (err) {
    console.log(err)
  }
}
runLoop(runner.start)
