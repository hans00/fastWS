const axios = require('axios')

module.exports = async function (port) {
  const res = await axios.get(`http://localhost:${port}/`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.data !== 'TEST') {
    throw new Error('Response data mismatch')
  }
  if (!res.headers['last-modified']) {
    throw new Error('No Last-Modified')
  }
  if (!res.headers['cache-control']) {
    throw new Error('No Cache-Control')
  }
  if (res.headers['content-type'] !== 'text/html') {
    throw new Error('Content-Type is not "test/html"')
  }
}
