const qs = require('qs')
const iconv = require('iconv-lite')
const contentType = require('content-type')
const multipart = require('multipart-formdata')
const { Readable } = require('stream')
const ServerError = require('./errors')
const utils = require('./utils')
const { cache, templateEngine, maxBodySize } = require('./constants')

const methodsWithBody = ['POST', 'PUT', 'PATCH', 'OPTIONS']

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
    this.url = this.request.getUrl()
    this.method = this.request.getMethod().toUpperCase()
    this.rawQuery = this.request.getQuery()
    this._req_info = {}
    this._method = null
    this._body = null
    this._bodyStream = null
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

  processBodyData () {
    if (!this.response) return
    if (!methodsWithBody.includes(this.method)) return
    const contentLength = this.headers['content-length']
    // Verify Content-Length
    if (!contentLength) {
      throw new ServerError({ code: 'CLIENT_NO_LENGTH', message: '', httpCode: 411 })
    } else if (!/^[1-9]\d*$/.test(contentLength)) {
      throw new ServerError({ code: 'CLIENT_LENGTH_INVALID', message: '', httpCode: 400 })
    } else if (this.bodyLimit && Number(contentLength) > this.bodyLimit) {
      throw new ServerError({ code: 'CLIENT_LENGTH_TOO_LARGE', message: '', httpCode: 413 })
    }
    this.bodyLength = Number(contentLength || 0)
    this._buffer = []
    this._dataEnd = false
    this._received = 0
    this._onData = null
    this._dataError = null
    this.onAborted(() => {
      this._dataEnd = true
      this._dataError = new ServerError({ code: 'CONNECTION_ABORTED' })
      if (this._onData) {
        this._onData()
      }
    })
    this.response.onData((chunk, isLast) => {
      if (this._dataEnd) return
      this._received += chunk.byteLength
      if (this.bodyLength && this._received > this.bodyLength) {
        this._dataEnd = true
        this._dataError = new ServerError({ code: 'CLIENT_BAD_REQUEST', httpCode: 400 })
      } else if (this.bodyLength && isLast && this._received < this.bodyLength) {
        this._dataEnd = true
        this._dataError = new ServerError({ code: 'CLIENT_BAD_REQUEST', httpCode: 400 })
      } else {
        // Copy buffer to avoid memory release
        this._buffer.push(Buffer.from(Buffer.from(chunk)))
        this._dataEnd = isLast
      }
      if (this._onData) {
        this._onData()
      }
    })
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
    if (this._bodyStream !== null) {
      return this._bodyStream
    }
    const readData = (callback) => {
      if (this._dataError) {
        callback(this._dataError)
      } else {
        if (!this._buffer.length && !this._dataEnd) {
          this._onData = () => readData(callback)
        } else {
          this._onData = null
          const chunk = this._buffer.shift()
          if (!chunk && this._dataEnd) callback(null, null)
          else callback(null, Buffer.from(chunk))
        }
      }
    }
    this._bodyStream = new Readable({
      read () {
        readData((err, chunk) => {
          if (err) this.destroy(err)
          else this.push(chunk)
        })
      }
    })
    this._bodyStream.bodyLength = this.bodyLength
    return this._bodyStream
  }

  bodyData () {
    if (this._body !== null) {
      return this._body
    }
    const type = this.headers['content-type'] || 'application/octet-stream'
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
