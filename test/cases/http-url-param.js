const axios = require('axios')

module.exports = async function (port) {
  const res = await axios.get(`http://localhost:${port}/param/TEST`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.data !== 'TEST') {
    throw new Error('Response data mismatch')
  }
}
