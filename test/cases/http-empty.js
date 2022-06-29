const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/empty`)
  if (res.status !== 204) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.headers['content-length']) {
    throw new Error('204 should not have Content-Length')
  }
  if (res.data !== '') {
    throw new Error('Response data mismatch')
  }
}
