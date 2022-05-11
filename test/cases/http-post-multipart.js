const axios = require('axios')
const FormData = require('form-data')

module.exports = async function ({ HTTP_PORT }) {
  const fileSize = 10240
  const form = new FormData()
  form.append('file', Buffer.alloc(fileSize).fill(0))
  const res = await axios({
    method: 'post',
    url: `http://localhost:${HTTP_PORT}/upload`,
    data: form,
    headers: {
      'content-length': form.getLengthSync(),
      ...form.getHeaders()
    }
  })
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (res.headers['content-type'] !== 'application/json') {
    throw new Error('Content-Type is not "application/json"')
  }
  if (res.data.size !== fileSize) {
    throw new Error('Response data mismatch')
  }
}
