const ServerError = require('./errors')
const { buildHeaderValue } = require('./utils')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const { Writable } = require('stream')
const parseRange = require('range-parser')
const rangeStream = require('ranges-stream')

const staticPath = path.resolve(process.cwd(), 'static')

function toArrayBuffer (buffer) {
  if (typeof buffer === 'object' && buffer.constructor.name === 'Buffer') {
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  } else {
    return buffer
  }
}

const httpStatusCode = {
  // Informational
  100: 'Continue',
  101: 'Switching Protocols',
  // Successful
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  // Redirection
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  // Client Error
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Request Entity Too Large',
  414: 'Request-URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Requested Range Not Satisfiable',
  417: 'Expectation Failed',
  418: 'I\'m a teapot',
  // Server Error
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable'
}

class Response extends Writable {
  constructor (connection) {
    super()
    this.connection = connection
    this._totalSize = 0
    this._status = 200
    this._headers = {}
    this.headersSent = false
    this.on('pipe', (src) => this._pipe(src))
    this.on('finish', () => this._end())
    this.corkPipe = false
    this.connection.onAborted(() => {
      this.destroy()
    })
  }

  static create (connection) {
    return new Response(connection)
  }

  status (code) {
    this._status = code
    return this
  }

  staticFile (filePath, cache = 'max-age=86400') {
    if (filePath.endsWith('/')) {
      filePath += 'index.html'
    }
    const fullPath = path.join(staticPath, filePath)
    const isSecurePath = fullPath.startsWith(staticPath)
    const checkModifyTime = this.connection.headers['if-modified-since']
    if (isSecurePath && !fullPath.match(/\/\./)) {
      // if cache found file, send file in cache
      if (this.connection.cacheProvider.has(fullPath)) {
        const file = this.connection.cacheProvider.get(fullPath)
        if (checkModifyTime && checkModifyTime === file.mtime) {
          return this.status(304).end()
        } else {
          this.setHeader('Last-Modified', file.mtime)
            .setHeader('Cache-Control', cache)
            .send(file.content, file.contentType)
        }
      } else {
        const contentType = mime.lookup(fullPath)
        const mtime = new Date(fs.statSync(fullPath).mtime).toGMTString()
        const content = fs.readFileSync(fullPath)
        this.connection.cacheProvider.set(fullPath, { content, contentType, mtime })
        if (checkModifyTime && checkModifyTime === mtime) {
          return this.status(304).end()
        } else {
          this.setHeader('Last-Modified', mtime)
            .setHeader('Cache-Control', cache)
            .send(content, contentType)
        }
      }
    } else {
      throw new ServerError({ code: 'SERVER_NOT_FOUND', message: 'The static file not found.', httpCode: 404 })
    }
  }

  renderFile (filePath, data) {
    if (!this.connection.renderer) {
      throw new ServerError({ code: 'SERVER_ERROR', message: 'The render function is disabled.', httpCode: 500 })
    }
    const fullPath = path.resolve(path.join('template', filePath))
    const isInTemplate = fullPath.startsWith(path.resolve('template'))
    if (isInTemplate && fs.existsSync(fullPath)) {
      // if cache found file, send file in cache
      if (this.connection.cacheProvider.has(fullPath)) {
        const file = this.connection.cacheProvider.get(fullPath)
        this.send(this.connection.renderer(file.content, data), file.contentType)
      } else {
        const contentType = mime.lookup(fullPath)
        const content = fs.readFileSync(fullPath).toString()
        this.connection.cacheProvider.set(fullPath, { content, contentType })
        this.send(this.connection.renderer(content, data), contentType)
      }
    } else {
      throw new ServerError({ code: 'SERVER_NOT_FOUND', message: 'The template file not found.', httpCode: 404 })
    }
  }

  render (content, data) {
    if (!this.connection.renderer) {
      throw new ServerError({ code: 'SERVER_ERROR', message: 'The render function is disabled.', httpCode: 500 })
    } else {
      this.send(this.connection.renderer(content, data))
    }
  }

  writeHead (status = this._status, headers = this._headers) {
    if (this._writableState.destroyed) {
      return
    }
    if (!this.headersSent) {
      this.headersSent = true
      if (status !== 200) {
        if (httpStatusCode[status]) {
          this.connection.writeStatus(`${status} ${httpStatusCode[status]}`)
        } else {
          this.connection.writeStatus(status.toString())
        }
      }
      Object.keys(headers).forEach(key => {
        if (headers[key] instanceof Array) {
          headers[key].forEach(data => {
            this.connection.writeHeader(key, data)
          })
        } else {
          this.connection.writeHeader(key, headers[key])
        }
      })
    }
  }

  _write (chunk, encoding, callback) {
    try {
      this.writeHead()
      if (!chunk || chunk.length === 0 || chunk.byteLength === 0) {
        process.nextTick(callback)
      }
      const data = encoding === 'buffer' ? toArrayBuffer(chunk) : chunk
      const initOffset = this.connection.getWriteOffset()
      const ok = this.connection.writeBody(data, this._totalSize)
      if (!ok) {
        this.connection.onWritable((offset) => {
          try {
            const ok = this.connection.writeBody(data.slice(offset - initOffset), this._totalSize)
            if (ok) {
              process.nextTick(callback)
            }
            return ok
          } catch (e) {
            callback(e)
            return true
          }
        })
      } else {
        process.nextTick(callback)
      }
      return true
    } catch (e) {
      callback(e)
      super.destroy()
      return false
    }
  }

  _pipeError (error) {
    this.corkPipe = false
    this.emit('error', error)
  }

  _setupStreamMeta (stream) {
    if (this._streamMeta) return
    this._streamMeta = true
    let contentType = this._headers['content-type']
    if (stream.headers) { // HTTP
      if (!this._totalSize) {
        this._totalSize = Number(stream.headers['content-length'])
      }
      if (!contentType && stream.headers['content-type']) {
        contentType = stream.headers['content-type']
      }
    } else if (stream.path) { // FS
      if (!this._totalSize) {
        const { size } = fs.statSync(stream.path)
        this._totalSize = size
      }
      if (!contentType) {
        contentType = mime.lookup(stream.path) || 'application/octet-stream'
      }
    } else if (stream.bodyLength) { // Known size body
      this._totalSize = stream.bodyLength
    }
    if (contentType) {
      this.setHeader('Content-Type', contentType)
    }
  }

  _pipe (stream) {
    // In RFC these status code must not have body
    if (this._status < 200 || this._status === 204 || this._status === 304) {
      throw new ServerError({
        code: 'SERVER_INVALID_OPERATE',
        message: `The status ${this._status} must no content.`,
        httpCode: 500
      })
    }
    this._setupStreamMeta(stream)
    this.corkPipe = true
    stream.on('error', this._pipeError.bind(this))
  }

  pipeFrom (stream, allowRange = true) {
    if (this._writableState.destroyed) {
      return
    }
    this._setupStreamMeta(stream)
    const ranges = allowRange && this._status === 200 &&
      parseRange(this._totalSize, this.connection.headers.range || '', { combine: true })
    // TODO: Support for multipart/byteranges
    if (Array.isArray(ranges) && ranges.length === 1 && ranges.type === 'bytes') {
      const [{ start, end }] = ranges
      if (this._totalSize && end <= this._totalSize) {
        this.status(206)
          .setHeader('Content-Range', `bytes ${start}-${end}/${this._totalSize}`)
        this._totalSize = end - start
        return stream.pipe(rangeStream(ranges)).pipe(this)
      }
    }
    return stream.pipe(this)
  }

  _end () {
    if (!this.headersSent) {
      if (!this._totalSize && this._status === 200) {
        this._status = 204
      }
      this.connection.cork(() => {
        this.writeHead()
        this.connection.end()
      })
    } else if (!this._totalSize) {
      this.connection.end()
    }
  }

  send (data, contentType = null) {
    if (!contentType && !this._headers['content-type'] && typeof data === 'string') {
      this._headers['content-type'] = data.includes('<html>') ? 'text/html' : 'text/plain'
    } else if (contentType) {
      this._headers['content-type'] = contentType
    }
    this._totalSize = data.length
    this.write(data)
    this.end()
  }

  json (data) {
    this.send(JSON.stringify(data), 'application/json')
  }

  flushHeaders () {
    this._headers = {}
    return this
  }

  getHeader (key) {
    return this._headers[key.toLowerCase()]
  }

  getHeaderNames () {
    return Object.keys(this._headers)
  }

  getHeaders () {
    return this._headers
  }

  hasHeader (key) {
    return key.toLowerCase() in this._headers
  }

  removeHeader (key) {
    delete this._headers[key.toLowerCase()]
    return this
  }

  setHeader (key, value) {
    this._headers[key.toLowerCase()] = buildHeaderValue(value)
    return this
  }

  location (loc, code = 302) {
    this.setHeader('Location', loc).status(code)
    return this
  }
}

module.exports = Response
