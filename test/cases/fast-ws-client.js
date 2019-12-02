const WS = require('../../client')

module.exports = function (port) {
  return new Promise((resolve, reject) => {
    const ws = new WS(`ws://localhost:${port}/fast-ws`)

    ws.on('error', reject)

    ws.on('ready', async () => {
      try {
        {
          const data = { 'Hello': 'World' }
          const res = await ws.send('echo', data, true)
          if (JSON.stringify(res) !== JSON.stringify(data)) {
            throw new Error('Response data mismatch (1)')
          }
        }
        {
          const data = "Test string"
          const res = await ws.send('echo', data, true)
          if (JSON.stringify(res) !== JSON.stringify(data)) {
            throw new Error('Response data mismatch (2)')
          }
        }
        {
          const data = 123
          const res = await ws.send('echo', data, true)
          if (JSON.stringify(res) !== JSON.stringify(data)) {
            throw new Error('Response data mismatch (3)')
          }
        }
        resolve()
      } catch (e) {
        reject(e)
      } finally {
        ws.close()
      }
    })
  })
}
