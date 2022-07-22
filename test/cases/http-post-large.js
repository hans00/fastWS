const axios = require('axios')
const FormData = require('form-data')

module.exports = async function ({ HTTP_PORT }) {
  const res = await axios({
    method: 'post',
    url: `http://localhost:${HTTP_PORT}/post`,
    data: 'A'.repeat(2048000),
  }).catch(e => e.response)
  if (res.status !== 413) {
    throw new Error(`Response ${res.status}`)
  }
}
