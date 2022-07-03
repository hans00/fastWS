const axios = require('axios')

module.exports = async function ({ HTTP_PORT }) {
  {
    const res = await axios.get(`http://localhost:${HTTP_PORT}/address`)
    if (res.status !== 200) {
      throw new Error(`Response ${res.status}`)
    }
    if (!['::1', '127.0.0.1'].includes(res.data.client)) {
      throw new Error(`"${res.data.client}" is not local IP address.`)
    }
  }
  {
    const res = await axios.get(`http://localhost:${HTTP_PORT}/address`, {
      headers: {
        'x-real-ip': '1.1.1.1'
      }
    })
    if (res.status !== 200) {
      throw new Error(`Response ${res.status}`)
    }
    if (res.data.realIp !== '1.1.1.1') {
      throw new Error(`"${res.data.realIp}" is not match "1.1.1.1".`)
    }
  }
  {
    const res = await axios.get(`http://localhost:${HTTP_PORT}/address`, {
      headers: {
        'x-forwarded-for': '1.1.1.1'
      }
    })
    if (res.status !== 200) {
      throw new Error(`Response ${res.status}`)
    }
    if (res.data.ips[1] !== '1.1.1.1') {
      throw new Error(`"${res.data.ips}" is not includes "1.1.1.1".`)
    }
  }
  {
    const res = await axios.get(`http://localhost:${HTTP_PORT}/address`, {
      headers: {
        'x-forwarded-for': '1.1.1.1, 2.2.2.2'
      }
    })
    if (res.status !== 200) {
      throw new Error(`Response ${res.status}`)
    }
    if (res.data.ips[2] === '2.2.2.2') {
      throw new Error(`"${res.data.ips}" contains untrusted proxy.`)
    }
  }
}
