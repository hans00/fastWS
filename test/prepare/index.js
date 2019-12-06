const http = require('./http')
const https = require('./https')

module.exports = async function ({ HTTP_PORT, HTTPS_PORT }) {
  await http(HTTP_PORT)
  await https(HTTPS_PORT)
}
