const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/empty`)
  if (res.status !== 204) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.data !== '') {
    throw new Error('Response data mismatch')
  }
}
