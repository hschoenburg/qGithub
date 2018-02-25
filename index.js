const runner = require('./runner')
const TIMEOUT = 10000

function runLoop (fn) {
  try {
    setTimeout(() => {
      fn().then(() => {
        console.log('loop')
        runLoop(fn)
      })
    }, TIMEOUT)
  } catch (err) {
    console.log(err)
  }
}
runLoop(runner.start)
