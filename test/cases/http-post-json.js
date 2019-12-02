const axios = require('axios')

module.exports = async function (port) {
  const data = {
    'hello': 'world'
  }
  const res = await axios.post(
    `http://localhost:${port}/post`,
    data,
    {
      headers: {
       'Content-Type': 'application/json'
      }
    }
  )
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
