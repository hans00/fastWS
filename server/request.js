const inet = require('./inet')
const ServerError = require('./errors')

const with_body_methods = [ 'POST', 'PUT', 'PATCH' ]

class Request {
  constructor(request, response) {
    this.request = request
    this.response = response
  }

  // default limit in 4MB
  body(limit=4096) {
    if (!with_body_methods.includes(this.method)) {
      throw new ServerError({ code: 'SERVER_NOT_ALLOWED', message: 'The method never with data.', suggestCode: 405 })
    }
    const contentType = this.header('Content-Type')
    const contentLength = this.header('Content-Length')
    if (!contentLength) {
      throw new ServerError({ code: 'CLIENT_NO_LENGTH', message: '', suggestCode: 411 })
    }
    if (limit && contentLength > limit) {
      throw new ServerError({ code: 'CLIENT_LENGTH_TOO_LARGE', message: '', suggestCode: 413 })
    }
    return new Promise((resolve, reject) => {
      let data = null, body_length = 0
      this.response.onData((chunk, isLast) => {
        data = data !== null ? Buffer.concat([ data, Buffer.from(chunk) ]) : Buffer.from(chunk)
        body_length += chunk.byteLength
        if (body_length >= contentLength) {
          try {
            if (contentType.startsWith('text/')) {
              resolve(data.slice(0, contentLength).toString())
            } else if (contentType === 'application/json') {
              resolve(JSON.parse(data.slice(0, contentLength)))
            } else {
              resolve(data.slice(0, contentLength))
            }
          } catch (e) {
            reject(new ServerError({ code: 'SERVER_BODY_PARSE', originError: e, suggestCode: 400 }))
          }
        }
      })
      this.response.onAborted(() => {
        reject(new ServerError({ code: 'SERVER_ABORTED' }))
      })
    })
  }

  get remoteAddress() {
    return inet.ntop(Buffer.from(this.response.getRemoteAddress()))
  }

  get url() {
    return this.request.getUrl()
  }

  get method() {
    return this.request.getMethod().toUpperCase()
  }

  get query() {
    return this.request.getQuery()
  }

  get headers() {
    const headers = {}
    this.request.forEach((k, v) => {
      headers[k] = v
    })
    return headers
  }

  header(name) {
    return this.request.getHeader(name.toLowerCase())
  }
}

module.exports = Request
