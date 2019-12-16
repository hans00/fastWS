const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios.get(`http://localhost:${HTTP_PORT}/get?hello=world&test[]=1`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.headers['content-type'] !== 'application/json') {
    throw new Error('Content-Type is not "application/json"')
  }
  if (JSON.stringify(res.data) !== JSON.stringify({ hello: 'world', test: [ '1' ] })) {
    throw new Error('Response data mismatch')
  }
}
