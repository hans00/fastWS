const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const body = '__TEST__STRING__'.repeat(4096)

  const res = await axios.post(`http://localhost:${HTTP_PORT}/stream/body-later-1`, body)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.headers['content-length'] !== body.length.toString()) {
    throw new Error('Content-Length mismatch')
  }
  if (res.data !== body) {
    throw new Error('Response data mismatch')
  }
}
