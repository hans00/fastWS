const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  {
    const res = await axios.post(`http://localhost:${HTTP_PORT}/header-value`, { key: 'val', num: 1, bool: true })
    if (res.headers['test'] !== 'key=val, num=1, bool') {
      throw new Error('QValue is not match (1)')
    }
  }
  {
    const res = await axios.post(`http://localhost:${HTTP_PORT}/header-value`, [ 'a', 'b', ['c', { q: 1 }] ])
    if (res.headers['test'] !== 'a, b, c;q=1') {
      throw new Error('QValue is not match (2)')
    }
  }
}
