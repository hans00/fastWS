const fastWS = require('../../server')
const app = require('./app')
const fs = require('fs')
const mkcert = require('mkcert')
const tempfile = require('tempfile')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

module.exports = function (port) {
  return new Promise(async (resolve, reject) => {
    const ca = await mkcert.createCA({
      organization: 'Test CA',
      countryCode: 'NA',
      state: 'Not Avaliable',
      locality: 'Not Avaliable',
      validityDays: 1
    })
    const cert = await mkcert.createCert({
      domains: [ '127.0.0.1', 'localhost' ],
      validityDays: 1,
      caKey: ca.key,
      caCert: ca.cert
    })
    const key_file_name = tempfile('.pem')
    const cert_file_name = tempfile('.pem')
    fs.writeFileSync(key_file_name, cert.key)
    fs.writeFileSync(cert_file_name, cert.cert)
    try {
      app(new fastWS({
        ssl: {
          key_file_name,
          cert_file_name,
        },
      }))
      .listen('127.0.0.1', port, () => {
        console.log(`Listen on ${port}`)
        resolve()
      })
      setTimeout(() => reject(), 10)
    } catch (e) {
      reject(e)
    }
  })
}
