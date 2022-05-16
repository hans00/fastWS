const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/stream/error`).catch(e => e.response)
  if (res.status !== 500) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.data !== 'OOPS') {
    throw new Error('Response data mismatch')
  }
}
