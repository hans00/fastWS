const axios = require('axios')

module.exports = async function (port) {
  const res = await axios.get(`http://localhost:${port}/stream/file`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.data !== 'TEST\n') {
    throw new Error('Response data mismatch')
  }
}
