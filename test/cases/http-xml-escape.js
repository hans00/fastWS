const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/xml/<test>TEST<%2Ftest>`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (!res.data.match(/^<message>([^<>]+)<\/message>$/i)) {
    throw new Error('Escape test failed')
  }
}
