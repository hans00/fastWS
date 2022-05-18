const WS = require('ws')

module.exports = function ({ HTTP_PORT }) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`ws://localhost:${HTTP_PORT}/drain`)

    let indexToWait = 0
    const count = 80000

    ws.on('error', (e) => {
      reject(e)
      ws.close()
    })

    ws.on('close', (e) => {
      if (indexToWait >= count) {
        resolve()
      } else {
        reject(new Error('Unexpected socket close'))
      }
    })

    ws.on('message', message => {
      const index = JSON.parse(message)
      if (indexToWait === index) {
        indexToWait += 1
      } else {
        reject(new Error(`Data missmatch (${indexToWait})`))
        ws.close()
      }
      if (indexToWait >= count) {
        ws.close()
      }
    })
  })
}
