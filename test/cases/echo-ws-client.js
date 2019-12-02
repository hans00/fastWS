const WS = require('ws')

module.exports = function (port) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`ws://localhost:${port}/echo`)

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
      if (message !== 'Hello World') {
        reject('Response data mismatch')
      } else {
        resolve()
      }
      ws.close()
    })
  })
}
