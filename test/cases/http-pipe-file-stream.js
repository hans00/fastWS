const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/stream/file`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (!res.data.startsWith('TEST')) {
    throw new Error('Response data mismatch')
  }
}
