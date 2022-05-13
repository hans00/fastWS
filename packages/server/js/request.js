const os = require('os')
const qs = require('qs')
const accepts = require('accepts')
const parseRange = require('range-parser')
const utils = require('./utils')

class Request {
  constructor (connection) {
    this._accepts = accepts(connection)
    this.connection = connection
    this._cache = {}
  }

  static create(connection) {
    return new Request(connection)
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
    const forwardIps = utils.trust(app.getParam('trust proxy'), headers['x-forwarded-for'])
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
    return this._accepts.type(type)
  }

  accepts (types) {
    return this._accepts.types(types)
  }

  acceptsCharsets () {
    return this._accepts.charsets()
  }

  acceptsEncodings () {
    return this._accepts.encodings()
  }

  acceptsLanguages () {
    return this._accepts.languages()
  }

  range (size, options) {
    return parseRange(size, this.connection.headers.range, options)
  }
}

module.exports = Request
