const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/address`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (!['::1', '127.0.0.1'].includes(res.data)) {
    throw new Error(`"${res.data}" is not local IP address.`)
  }
}
