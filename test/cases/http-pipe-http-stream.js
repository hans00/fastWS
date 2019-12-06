const axios = require('axios')

module.exports = async function (port) {
  const res = await axios.get(`http://localhost:${port}/stream/http`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (!res.data.match(/www\.google\.com/i)) {
    throw new Error('Response data mismatch')
  }
}
