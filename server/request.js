const os = require('os')
const qs = require('qs')
const utils = require('./utils')

class Request {
  constructor (connection) {
    this.connection = connection
    this._cache = {}
  }

  get body () {
    return this.connection.bodyData()
  }

  get hostname () {
    const headers = this.connection.headers
    return headers.host || headers['x-forwarded-host'] || os.hostname()
  }

  get subdomains () {
    return this.hostname.split(/\./g).slice(0, -2)
  }

  get query () {
    if (!this._cache.query) {
      this._cache.query = qs.parse(this.connection.rawQuery)
    }
    return this._cache.query
  }

  get ip () {
    return this.connection.remoteAddress
  }

  get ips () {
    const app = this.connection.app
    const headers = this.connection.headers
    const forwardIps = utils.trust(app.get('trust proxy'), headers['x-forwarded-for'])
    return [this.ip].concat(forwardIps)
  }

  get method () {
    return this.connection.method
  }

  has (name) {
    return name.toLowerCase() in this.connection.headers
  }

  get (name) {
    return this.connection.headers[name.toLowerCase()]
  }

  get xhr () {
    const value = this.connection.headers['x-requested-with'] || ''
    return value.toLowerCase() === 'xmlhttprequest'
  }

  is (type) {
    throw new Error('SERVER_NOT_IMPL')
  }

  accepts () {
    throw new Error('SERVER_NOT_IMPL')
  }

  acceptsCharsets () {
    throw new Error('SERVER_NOT_IMPL')
  }

  acceptsEncodings () {
    throw new Error('SERVER_NOT_IMPL')
  }

  acceptsLanguages () {
    throw new Error('SERVER_NOT_IMPL')
  }

  range (size, options) {
    throw new Error('SERVER_NOT_IMPL')
  }
}

module.exports = Request
