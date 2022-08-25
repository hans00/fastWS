const http = require('http')

module.exports = async function ({ HTTP_PORT }) {
  await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: HTTP_PORT,
      path: '/head',
      method: 'HEAD',
    }, res => {
      if (res.statusCode !== 200) {
        reject(new Error(`Response ${res.statusCode}`))
      } else {
        const testHeadPos = res.rawHeaders.indexOf('Test')
        if (testHeadPos === -1 || res.rawHeaders[testHeadPos+1] !== 'A') {
          reject(new Error('Header "Test" mot match'))
        } else {
          resolve()
        }
      }
    })

    req.on('error', reject)
    req.end()
  })
}
