const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 100)
  try {
    const res = await axios.get(`http://localhost:${HTTP_PORT}/stream/`, { signal: controller.signal })
    throw new Error('Connection should aborted')
  } catch (e) {
    if (e.constructor.name !== 'CanceledError') {
      throw e
    }
  }
}
