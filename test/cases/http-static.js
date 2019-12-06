const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (!res.data.startsWith('TEST')) {
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
