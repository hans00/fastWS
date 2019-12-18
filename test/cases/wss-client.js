const WS = require('../../client')

module.exports = function ({ HTTPS_PORT }) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`wss://127.0.0.1:${HTTPS_PORT}/fast-ws`)

    ws.on('error', reject)

    ws.on('connect', () => {
      ws.send('join', 'test')
      ws.send('broadcast', { room: 'test', message: 'test-message' })
      ws.on('someone said', (data) => {
        if (data === 'test-message') {
          resolve()
        } else {
          reject('Data mismatch')
        }
        ws.close()
      })
    })
  })
}
