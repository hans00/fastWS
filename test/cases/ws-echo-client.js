const WS = require('ws')

module.exports = function ({ HTTP_PORT }) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`ws://localhost:${HTTP_PORT}/echo`)

    ws.on('error', () => {
      reject()
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
