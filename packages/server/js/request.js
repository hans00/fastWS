const os = require('os')
const qs = require('qs')
const accepts = require('accepts')
const parseRange = require('range-parser')
const { trustProxy } = require('./constants')

class Request {
  constructor (connection) {
    this._accepts = accepts(connection)
    this.connection = connection
    this._cache = {}
  }

  static create (connection) {
    return new Request(connection)
  }

  get body () {
    return this.connection.bodyData()
  }

  get bodyStream () {
    return this.connection.bodyDataStream()
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

  get realIp () {
    const app = this.connection.app
    const trustMatcher = app.getParam(trustProxy)
    const headers = this.connection.headers
    const realIp = headers['x-real-ip']
    if (realIp && trustMatcher.contains(this.ip)) {
      return realIp
    }
    return this.ip
  }

  get ips () {
    const app = this.connection.app
    const matcher = app.getParam(trustProxy)
    const xff = (this.connection.headers['x-forwarded-for'] || '').split(/, */g)
      .filter(Boolean)
    const trusted = [this.ip]
    if (xff.length > 0 && matcher.contains(this.ip)) {
      for (const ip of xff) {
        if (matcher.contains(ip)) {
          trusted.push(ip)
        } else {
          break
        }
      }
      trusted.push(xff[trusted.length - 1])
    }
    return trusted
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
