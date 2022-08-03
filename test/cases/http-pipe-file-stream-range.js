const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/stream/file`, {
    headers: {
      Range: 'bytes=0-4'
    }
  })
  if (res.status !== 206) {
    throw new Error(`Response ${res.status}`)
  }
  if (!res.headers['content-type']) {
    throw new Error('Unknown Content-Type')
  }
  if (Number(res.headers['content-length']) !== 4) {
    throw new Error(`Invalid Content-Length: ${res.headers['content-length']}`)
  }
  if (!['bytes 0-4/10', 'bytes 0-4/11'].includes(res.headers['content-range'])) {
    throw new Error(`Invalid Content-Range: ${res.headers['content-range']}`)
  }
  if (res.data !== 'TEST') {
    throw new Error('Response data mismatch')
  }
}
