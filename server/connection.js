const qs = require('qs')
const iconv = require('iconv-lite')
const contentType = require('content-type')
const multipart = require('multipart-formdata')
const ServerError = require('./errors')
const utils = require('./utils')

const methodsWithBody = ['POST', 'PUT', 'PATCH', 'OPTIONS']

class Connection {
  constructor (app, request, response, wsContext = null) {
    this.app = app
    this.request = request
    this.response = response
    this.headers = {}
    this.request.forEach((k, v) => {
      if (k in this.headers) {
        this.headers[k] = [].concat(this.headers[k], v)
      } else {
        this.headers[k] = v
      }
    })
    this.rawQuery = this.request.getQuery()
    this.method = this.request.getMethod().toUpperCase()
    this._body = null
    this._reject_data = null
    this._on_aborted = []
    this.aborted = false
    this.response.onAborted(() => {
      this._on_aborted.forEach(call => call())
      this.aborted = false
    })
    this.wsContext = wsContext
  }

  bodyData () {
    if (!this.response) {
      return null
    }
    if (!methodsWithBody.includes(this.method)) {
      return null
    }
    if (this._body !== null) {
      return this._body
    }
    const _contentType = this.headers['content-type']
    const _contentLength = this.headers['content-length']
    // exit if no Content-Type
    if (!_contentType) {
      return null
    }
    // Verify Content-Length
    if (!_contentLength) {
      throw new ServerError({ code: 'CLIENT_NO_LENGTH', message: '', httpCode: 411 })
    } else if (!/^[1-9]\d*$/.test(_contentLength)) {
      throw new ServerError({ code: 'CLIENT_LENGTH_INVALID', message: '', httpCode: 400 })
    } else if (this.bodyLimit && Number(_contentLength) > this.bodyLimit) {
      throw new ServerError({ code: 'CLIENT_LENGTH_TOO_LARGE', message: '', httpCode: 413 })
    }
    this._body = new Promise((resolve, reject) => {
      this.onAborted(() => reject(new ServerError({ code: 'CONNECTION_ABORTED' })))
      const contentLength = Number(_contentLength)
      let data = null; let bodyLength = 0
      this.response.onData((chunk, isLast) => {
        data = data !== null ? Buffer.concat([data, Buffer.from(chunk)]) : Buffer.concat([Buffer.from(chunk)])
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
                throw new Error('NO_BOUNDARY')
              }
              resolve(multipart.parse(contentData, content.parameters.boundary))
            } else {
              resolve(contentData)
            }
          } catch (e) {
            reject(new ServerError({ code: 'SERVER_BODY_PARSE', originError: e, httpCode: 400 }))
          }
        } else if (isLast) {
          reject(new ServerError({ code: 'SERVER_BODY_LENGTH', httpCode: 400 }))
        }
      })
    })
    return this._body
  }

  get cacheProvider () {
    return this.app.options.cache
  }

  get renderer () {
    return this.app.options.templateRender
  }

  get bodyLimit () {
    return this.app.options.bodySize
  }

  get remoteAddress () {
    return inet.toFraindlyIP(Buffer.from(this.response.getRemoteAddressAsText()).toString())
  }

  get url () {
    return this.request.getUrl()
  }

  onWritable (callback) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    return this.response.onWritable(callback)
  }

  onAborted (callback) {
    if (this.aborted) {
      callback()
    }
    this._on_aborted.push(callback)
  }

  writeStatus (statusText) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    return this.response.writeStatus(statusText)
  }

  writeHeader (key, value) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    return this.response.writeHeader(key, value)
  }

  writeBody (data) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    return this.response.write(data)
  }

  getWriteOffset () {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    return this.response.getWriteOffset()
  }

  end (data) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    return this.response.end(data)
  }

  cork (callback) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    return this.response.cork(callback)
  }

  upgrade (data, key, protocol, extension) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    if (!this.wsContext) {
      throw new ServerError({ code: 'SERVER_INVALID_OPERATE' })
    }
    return this.response.upgrade(data, key, protocol, extension, this.wsContext)
  }

}

module.exports = Connection
