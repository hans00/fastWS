const WS = require('ws')

module.exports = function ({ HTTP_PORT }) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`ws://localhost:${HTTP_PORT}/ws-upgrade`)

    ws.on('error', (e) => {
      reject(e)
    })

    ws.on('close', () => {
      resolve()
    })

    ws.on('message', (message) => {
      if (message.toString() !== 'UPGRADED') {
        reject(new Error('Response data mismatch'))
      }
      ws.close()
    })
  })
}
