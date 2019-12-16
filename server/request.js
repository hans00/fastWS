const qs = require('qs')
const iconv = require('iconv-lite')
const contentType = require('content-type')
const multipart = require('multipart-formdata')
const inet = require('./inet')
const ServerError = require('./errors')

const methodsWithBody = ['POST', 'PUT', 'PATCH']

class Request {
  constructor (request, response) {
    this.request = request
    this.response = response
    this.url = this.request.getUrl()
    this.headers = {}
    this.request.forEach((k, v) => {
      this.headers[k] = v
    })
    this.query = qs.parse(this.request.getQuery())
    this.method = this.request.getMethod().toUpperCase()
  }

  // default limit in 4MB
  body (limit = 4194304) {
    if (!methodsWithBody.includes(this.method)) {
      throw new ServerError({ code: 'SERVER_NOT_ALLOWED', message: 'The method never with data.', httpCode: 405 })
    }
    const _contentType = this.getHeader('Content-Type')
    // Verify Content-Type
    if (!_contentType) {
      throw new ServerError({ code: 'CLIENT_NO_CONTENT_TYPE', message: '', httpCode: 400 })
    }
    const _contentLength = this.getHeader('Content-Length')
    // Verify Content-Length
    if (!_contentLength) {
      throw new ServerError({ code: 'CLIENT_NO_LENGTH', message: '', httpCode: 411 })
    } else if (!/^[1-9]\d*$/.test(_contentLength)) {
      throw new ServerError({ code: 'CLIENT_LENGTH_INVALID', message: '', httpCode: 400 })
    } else if (limit && Number(_contentLength) > limit) {
      throw new ServerError({ code: 'CLIENT_LENGTH_TOO_LARGE', message: '', httpCode: 413 })
    }
    const contentLength = Number(_contentLength)
    return new Promise((resolve, reject) => {
      let data = null; let bodyLength = 0
      this.response.onData((chunk, isLast) => {
        data = data !== null ? Buffer.concat([data, Buffer.from(chunk)]) : Buffer.from(chunk)
        bodyLength += chunk.byteLength
        if (bodyLength >= contentLength) {
          try {
            const contentData = data.slice(0, contentLength)
            const content = contentType.parse(_contentType)
            // In RFC, charset default is ISO-8859-1, and it equal to latin1
            const charset = content.parameters.charset || 'latin1'
            if (content.type.startsWith('text/')) {
              resolve(iconv.decode(contentData, charset))
            } else if (content.type === 'application/json') {
              resolve(JSON.parse(iconv.decode(contentData, charset)))
            } else if (content.type === 'application/x-www-form-urlencoded') {
              resolve(qs.parse(iconv.decode(contentData, charset)))
            } else if (content.type === 'multipart/form-data') {
              if (!content.parameters.boundary) {
                throw 'NO_BOUNDARY'
              }
              resolve(multipart.parse(contentData, content.parameters.boundary))
            } else {
              resolve(contentData)
            }
          } catch (e) {
            reject(new ServerError({ code: 'SERVER_BODY_PARSE', originError: e, httpCode: 400 }))
          }
        }
      })
      this.response.onAborted(() => {
        reject(new ServerError({ code: 'SERVER_ABORTED' }))
      })
    })
  }

  get remoteAddress () {
    return inet.ntop(Buffer.from(this.response.getRemoteAddress()))
  }

  hasHeader (name) {
    return name.toLowerCase() in this.headers
  }

  getHeader (name) {
    return this.headers[name.toLowerCase()]
  }
}

module.exports = Request
