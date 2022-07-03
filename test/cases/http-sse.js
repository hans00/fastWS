const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/sse`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.headers['content-type'] !== 'text/event-stream') {
    throw new Error('Content-Type is not "text/event-stream"')
  }
  if (res.data !== '0123456789') {
    throw new Error('Response data mismatch')
  }
}
