const qs = require('qs')
const iconv = require('iconv-lite')
const contentType = require('content-type')
const multipart = require('multipart-formdata')
const { Readable } = require('stream')
const ServerError = require('./errors')
const utils = require('./utils')
const { cache, templateEngine, maxBodySize } = require('./constants')

const methodsWithBody = ['POST', 'PUT', 'PATCH', 'OPTIONS']

const emptyBuffer = Buffer.alloc(0)

class Connection {
  constructor (app, request, response, wsContext) {
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
    this._req_info = {}
    this._method = null
    this._body = null
    this._body_stream = null
    this._reject_data = null
    this._on_aborted = []
    this._on_writable = null
    this.aborted = false
    this.upgraded = false
    this.response.onAborted(() => {
      this._on_aborted.forEach(call => call())
      this.aborted = true
    })
    this.response.onWritable((offset) =>
      this._on_writable ? this._on_writable(offset) : true)
    this.wsContext = wsContext
    this._remote_address = null
  }

  static create (app, request, response, wsContext = null) {
    return new Connection(app, request, response, wsContext)
  }

  bodyDataStream () {
    if (!this.response) {
      throw new ServerError({ code: 'SERVER_INVALID_CONNECTION' })
    }
    if (!methodsWithBody.includes(this.method)) {
      throw new ServerError({
        code: 'SERVER_INVALID_OPERATE',
        message: `The method "${this.method}" should not have body.`
      })
    }
    if (this._body_stream !== null) {
      return this._body_stream
    }
    const contentLength = this.headers['content-length']
    // Verify Content-Length
    if (!contentLength) {
      throw new ServerError({ code: 'CLIENT_NO_LENGTH', message: '', httpCode: 411 })
    } else if (!/^[1-9]\d*$/.test(contentLength)) {
      throw new ServerError({ code: 'CLIENT_LENGTH_INVALID', message: '', httpCode: 400 })
    } else if (this.bodyLimit && Number(contentLength) > this.bodyLimit) {
      throw new ServerError({ code: 'CLIENT_LENGTH_TOO_LARGE', message: '', httpCode: 413 })
    }
    const length = Number(contentLength || 0)
    const chunks = []
    let received = 0
    let isEnd = false
    let error = null
    let callback = null
    this._body_stream = new Readable({
      read (size) {
        if (error) {
          this.destroy(error)
        } else {
          if (!chunks.length && !isEnd) {
            callback = () => {
              if (error) {
                this.destroy(error)
              } else {
                const chunk = chunks.shift()
                this.push(chunk)
              }
            }
          } else {
            const chunk = chunks.shift()
            if (!chunk && isEnd) this.push(null)
            else this.push(chunk || emptyBuffer)
          }
        }
      }
    })
    this._body_stream.bodyLength = length
    this.onAborted(() => {
      isEnd = true
      error = new ServerError({ code: 'CONNECTION_ABORTED' })
      if (callback) {
        callback()
      }
    })
    this.response.onData((chunk, isLast) => {
      if (isEnd) return
      received += chunk.byteLength
      if (length && received > length) {
        isEnd = true
        error = new ServerError({ code: 'CLIENT_BAD_REQUEST', httpCode: 400 })
      } else if (length && isLast && received < length) {
        isEnd = true
        error = new ServerError({ code: 'CLIENT_BAD_REQUEST', httpCode: 400 })
      } else {
        chunks.push(Buffer.from(chunk))
        isEnd = isLast
      }
      if (callback) {
        callback()
      }
    })
    return this._body_stream
  }

  bodyData () {
    if (this._body !== null) {
      return this._body
    }
    const type = this.headers['content-type']
    if (!type) return null
    const stream = this.bodyDataStream()
    this._body = new Promise((resolve, reject) => {
      let data = null
      stream.on('error', reject)
      stream.on('data', (chunk) => {
        data = data !== null ? Buffer.concat([data, chunk]) : chunk
      })
      stream.on('end', () => {
        try {
          const content = contentType.parse(type)
          // In RFC, charset default is ISO-8859-1, and it equal to latin1
          const charset = content.parameters.charset || 'latin1'
          if (content.type.startsWith('text/')) {
            resolve(iconv.decode(data, charset))
          } else if (content.type === 'application/json') {
            resolve(JSON.parse(iconv.decode(data, charset)))
          } else if (content.type === 'application/x-www-form-urlencoded') {
            resolve(qs.parse(iconv.decode(data, charset)))
          } else if (content.type === 'multipart/form-data') {
            if (!content.parameters.boundary) {
              throw new Error('NO_BOUNDARY')
            }
            resolve(multipart.parse(data, content.parameters.boundary))
          } else {
            resolve(data)
          }
        } catch (e) {
          reject(new ServerError({ code: 'SERVER_BODY_PARSE', originError: e, httpCode: 400 }))
        }
      })
    })
    return this._body
  }

  get cacheProvider () {
    return this.app.getParam(cache)
  }

  get renderer () {
    return this.app.getParam(templateEngine)
  }

  get bodyLimit () {
    return this.app.getParam(maxBodySize)
  }

  get remoteAddress () {
    return this.getInfo(
      'remoteAddress',
      () => utils.toFraindlyIP(Buffer.from(this.response.getRemoteAddressAsText()).toString())
    )
  }

  get url () {
    return this.getInfo('url', () => this.request.getUrl())
  }

  get method () {
    return this.getInfo('method', () => this.request.getMethod().toUpperCase())
  }

  getInfo (name, valueFn) {
    if (!this._req_info[name]) this._req_info[name] = valueFn()
    return this._req_info[name]
  }

  onWritable (callback) {
    this._on_writable = callback
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
    if (this.upgraded) {
      throw new ServerError({ code: 'SERVER_CONNECTION_HAD_UPGRADED' })
    }
    return this.response.writeStatus(statusText)
  }

  writeHeader (key, value) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    if (this.upgraded) {
      throw new ServerError({ code: 'SERVER_CONNECTION_HAD_UPGRADED' })
    }
    return this.response.writeHeader(key, value)
  }

  writeBody (data, totalSize = 0) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    if (this.upgraded) {
      throw new ServerError({ code: 'SERVER_CONNECTION_HAD_UPGRADED' })
    }
    if (totalSize) {
      const [ok, done] = this.response.tryEnd(data, totalSize)
      if (done) {
        this.aborted = true
      }
      return ok
    } else {
      return this.response.write(data)
    }
  }

  getWriteOffset () {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    if (this.upgraded) {
      throw new ServerError({ code: 'SERVER_CONNECTION_HAD_UPGRADED' })
    }
    return this.response.getWriteOffset()
  }

  end (data) {
    if (!data && this.aborted) return
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    if (this.upgraded) {
      throw new ServerError({ code: 'SERVER_CONNECTION_HAD_UPGRADED' })
    }
    return data ? this.response.end(data) : this.response.endWithoutBody()
  }

  cork (callback) {
    if (this.aborted) {
      throw new ServerError({ code: 'CONNECTION_ABORTED' })
    }
    if (this.upgraded) {
      throw new ServerError({ code: 'SERVER_CONNECTION_HAD_UPGRADED' })
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
    if (this.upgraded) {
      throw new ServerError({ code: 'SERVER_CONNECTION_HAD_UPGRADED' })
    }
    this.upgraded = true
    return this.response.upgrade(data, key, protocol, extension, this.wsContext)
  }
}

module.exports = Connection
