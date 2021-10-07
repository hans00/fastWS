const WS = require('fast-ws-client')

module.exports = function ({ HTTPS_PORT }) {
  return new Promise((resolve, reject) => {
    const b = new WS(`wss://127.0.0.1:${HTTPS_PORT}/fast-ws`)
    const a = new WS(`wss://127.0.0.1:${HTTPS_PORT}/fast-ws`)

    a.on('error', reject)

    a.on('connect', async () => {
      a.emit('join', 'test')
      setTimeout(() => {
        a.send('test-message')
        a.close()
      }, 100)
    })

    b.on('error', reject)

    b.on('connect', async () => {
      b.emit('join', 'test')
      b.on('someone said', data => {
        if (data === 'test-message') {
          resolve()
        } else {
          reject('Data mismatch')
        }
        b.close()
      })
    })
  })
}
