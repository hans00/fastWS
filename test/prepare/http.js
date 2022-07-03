const LRUCache = require('lru-cache')
const fastWS = require('../../packages/server')
const app = require('./app')

module.exports = function (port) {
  return new Promise((resolve, reject) => {
    try {
      app(new fastWS({
        logLevel: 'verbose',
        cache: new LRUCache({
          ttl: 1000 * 60 * 5,
        }),
      }))
      .listen(port, () => {
        console.log(`Listen on ${port}`)
        resolve()
      })
      setTimeout(() => reject(), 10)
    } catch (e) {
      reject(e)
    }
  })
}
