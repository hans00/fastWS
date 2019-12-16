const axios = require('axios')
const qs = require('qs')

module.exports = async function ({ HTTP_PORT }) {
  const data = {
    'hello': 'world'
  }
  const res = await axios.post(`http://localhost:${HTTP_PORT}/post`, qs.stringify(data), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.headers['content-type'] !== 'application/json') {
    throw new Error('Content-Type is not "application/json"')
  }
  if (JSON.stringify(res.data) !== JSON.stringify(data)) {
    throw new Error('Response data mismatch')
  }
}
