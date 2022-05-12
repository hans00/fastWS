const WS = require('ws')

module.exports = function ({ HTTPS_PORT }) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`wss://127.0.0.1:${HTTPS_PORT}/echo`, 'echo')

    ws.on('error', (e) => {
      reject(e)
      ws.close()
    })

    ws.on('open', () => {
      try {
        ws.send('Hello World')
      } catch (e) {
        ws.close()
        reject(e)
      }
    })

    ws.on('message', message => {
      if (message.toString() !== 'Hello World') {
        reject('Response data mismatch')
      } else {
        resolve()
      }
      ws.close()
    })
  })
}
