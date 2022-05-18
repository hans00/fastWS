const WS = require('ws')

module.exports = function ({ HTTP_PORT }) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`ws://localhost:${HTTP_PORT}/drain`)

    let indexToWait = 0
    let waitTarget = null

    ws.on('error', (e) => {
      reject(e)
      ws.close()
    })

    ws.on('close', () => {
      reject(new Error('Unexpected socket close'))
    })

    ws.on('message', message => {
      const data = JSON.parse(message)
      if (typeof data === 'number') {
        if (indexToWait === data) {
          indexToWait += 1
        } else {
          reject(new Error(`Data missmatch (${indexToWait})`))
          ws.close()
          return
        }
      } else {
        waitTarget = data.index
      }
      if (waitTarget && indexToWait >= waitTarget) {
        resolve()
        ws.close()
      }
    })
  })
}
