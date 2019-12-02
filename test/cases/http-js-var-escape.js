const axios = require('axios')

module.exports = async function (port) {
  const res = await axios.get(`http://localhost:${port}/js/${escape('");eval("')}`)
  if (res.status !== 200) {
    throw new Error(`Response ${res.status}`)
  }
  if (!res.data.match(/^response\("(.+)"\)$/i)) {
    throw new Error('Response data is strange')
  }
  const response = (data) => {
    if (data !== '");eval("') {
      throw new Error('Escape test failed')
    }
  }
  eval(res.data)
}
