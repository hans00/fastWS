const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/stream/file`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (!res.headers['content-type']) {
    throw new Error('Unknown Content-Type')
  }
  if (Number(res.headers['content-length']) < 4) {
    throw new Error(`Invalid Content-Length ${res.headers['content-length']}`)
  }
  if (!res.data.startsWith('TEST')) {
    throw new Error('Response data mismatch')
  }
}
