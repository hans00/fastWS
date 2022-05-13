const ServerError = require('./errors')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')
const { Writable } = require('stream')

function toArrayBuffer (buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
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
    this._status = 200
    this._headers = {}
    this.headersSent = false
    this.on('pipe', (src) => this.pipeFrom(src))
    this.corkPipe = false
    this.connection.onAborted(() => {
      this.destroy()
    })
  }

  static create(connection) {
    return new Response(connection)
  }

  cork (callback) {
    this.connection.cork(callback)
  }

  status (code) {
    this._status = code
    return this
  }

  staticFile (filePath, cache = 'max-age=86400') {
    if (filePath.endsWith('/')) {
      filePath += 'index.html'
    }
    const fullPath = path.resolve(path.join('static', filePath))
    const isInStatic = fullPath.startsWith(path.resolve('static'))
    const checkModifyTime = this.connection.headers['if-modified-since']
    if (isInStatic && fs.existsSync(fullPath) && !fullPath.match(/\/\./)) {
      // cache control
      let cacheControl
      if (typeof cache === 'string') {
        cacheControl = cache
      } else if (typeof cache === 'object') {
        cacheControl = Object.entries(cache)
          .map(([key, val]) =>
            val
              ? ((typeof val === 'boolean') ? key : `${key}=${val}`)
              : null)
          .filter(x => x)
          .join(', ')
      }
      // if cache found file, send file in cache
      if (this.connection.cacheProvider.has(fullPath)) {
        const file = this.connection.cacheProvider.get(fullPath)
        if (checkModifyTime && checkModifyTime === file.mtime) {
          return this.status(304).end()
        } else {
          this.setHeader('Last-Modified', file.mtime)
            .setHeader('Cache-Control', cacheControl)
            .end(file.content, file.contentType)
        }
      } else {
        const contentType = mime.lookup(fullPath)
        const mtime = new Date(fs.statSync(fullPath).mtime).toGMTString()
        const content = toArrayBuffer(fs.readFileSync(fullPath))
        this.connection.cacheProvider.set(fullPath, { content, contentType, mtime })
        if (checkModifyTime && checkModifyTime === mtime) {
          return this.status(304).end()
        } else {
          this.setHeader('Last-Modified', mtime)
            .setHeader('Cache-Control', cacheControl)
            .end(content, contentType)
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
        this.end(this.connection.renderer(file.content, data), file.contentType)
      } else {
        const contentType = mime.lookup(fullPath)
        const content = fs.readFileSync(fullPath).toString()
        this.connection.cacheProvider.set(fullPath, { content, contentType })
        this.end(this.connection.renderer(content, data), contentType)
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

  writeHead () {
    if (this._writableState.destroyed) {
      return
    }
    if (!this.headersSent) {
      this.headersSent = true
      if (this._status !== 200) {
        if (httpStatusCode[this._status]) {
          this.connection.writeStatus(this._status + ' ' + httpStatusCode[this._status])
        } else {
          this.connection.writeStatus(this._status.toString())
        }
      }
      Object.keys(this._headers).forEach(key => {
        if (this._headers[key] instanceof Array) {
          this._headers[key].forEach(data => {
            this.connection.writeHeader(key, data)
          })
        } else {
          this.connection.writeHeader(key, this._headers[key])
        }
      })
    }
  }

  _write (chunk, encoding, next) {
    if (this._writableState.destroyed) {
      return
    }
    const data = toArrayBuffer(chunk)
    const ok = this.connection.writeBody(data)
    if (!ok) {
      this.connection.onWritable((offset) => {
        this._write(data.slice(offset - this.connection.getWriteOffset()), encoding, next)
        this.emit('drain')
      })
    } else {
      next()
    }
  }

  pipeFrom (readable) {
    if (this._writableState.destroyed) {
      return
    }
    readable.on('error', error => {
      this.emit('error', error)
    })
    readable.on('end', () => {
      this.connection.end('')
      super.end()
    })
    // In RFC these status code must not have body
    if (this._status < 200 || this._status === 204 || this._status === 304) {
      throw new ServerError({
        code: 'SERVER_INVALID_OPERATE',
        message: `The status ${this._status} must no content.`,
        httpCode: 500
      })
    }
    this.writeHead()
    this.corkPipe = true
    return this
  }

  end (data = '', contentType = null) {
    if (this._writableState.destroyed) {
      return
    }
    // In RFC these status code must not have body
    if (this._status < 200 || this._status === 204 || this._status === 304) {
      data = ''
    }
    if (!this.corkPipe) {
      if (typeof contentType === 'string') {
        this._headers['content-type'] = contentType
      }
      this.cork(() => {
        this.writeHead()
        this.connection.end(data)
        super.end()
      })
    } else {
      super.end()
    }
    return this
  }

  send (data) {
    if (data.includes('<html>')) {
      this.end(data.toString(), 'text/html')
    } else {
      this.end(data.toString(), 'text/plain')
    }
  }

  json (data) {
    this.end(JSON.stringify(data), 'application/json')
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
    this._headers[key.toLowerCase()] = value
    return this
  }

  location (loc, code = 302) {
    this.setHeader('Location', loc).status(code)
    return this
  }
}

module.exports = Response
