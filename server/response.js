const ServerError = require('./errors')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

function toArrayBuffer(buffer) {
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

class Response {
  constructor ({ _cache, _templateRender }, request, response) {
    this.request = request
    this.response = response
    this._status = 200
    this._headers = {}
    this._cache = _cache
    this._templateRender = _templateRender
  }

  cork (callback) {
    this.response.experimental_cork(callback)
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
    const checkModifyTime = this.request.getHeader('if-modified-since')
    if (isInStatic && fs.existsSync(fullPath) && !fullPath.match(/\/\./)) {
      // cache control
      let cacheControl
      if (typeof cache === 'string') {
        cacheControl = cache
      } else if (typeof cache === 'object') {
        cache = Object.keys(cache).map(key => {
          if (cache[key]) {
            if (['number', 'string'].includes(typeof cache[key])) {
              return key + '=' + cache[key]
            } else {
              return cache[key]
            }
          }
        }).filter(x => x).join(', ')
      }
      // if cache found file, send file in cache
      if (this._cache.has(fullPath)) {
        const file = this._cache.get(fullPath)
        if (checkModifyTime && checkModifyTime === file.mtime) {
          return this.status(304).end('', undefined)
        } else {
          this.set('Last-Modified', file.mtime)
            .set('Cache-Control', cacheControl)
            .end(file.content, file.contentType)
        }
      } else {
        const contentType = mime.lookup(fullPath)
        const mtime = new Date(fs.statSync(fullPath).mtime).toGMTString()
        const content = toArrayBuffer(fs.readFileSync(fullPath))
        this._cache.set(fullPath, { content, contentType, mtime })
        if (checkModifyTime && checkModifyTime === mtime) {
          return this.status(304).end('', false)
        } else {
          this.set('Last-Modified', mtime)
            .set('Cache-Control', cacheControl)
            .end(content, contentType)
        }
      }
    } else {
      throw new ServerError({ code: 'SERVER_NOT_FOUND', message: 'The static file not found.', httpCode: 404 })
    }
  }

  renderFile (filePath, data) {
    if (!this._templateRender) {
      throw new ServerError({ code: 'SERVER_ERROR', message: 'The render function is disabled.', httpCode: 500 })
    }
    const fullPath = path.resolve(path.join('template', filePath))
    const isInTemplate = fullPath.startsWith(path.resolve('template'))
    if (isInTemplate && fs.existsSync(fullPath)) {
      // if cache found file, send file in cache
      if (this._cache.has(fullPath)) {
        const file = this._cache.get(fullPath)
        this.end(this._templateRender(file.content, data), file.contentType)
      } else {
        const contentType = mime.lookup(fullPath)
        const content = fs.readFileSync(fullPath).toString()
        this._cache.set(fullPath, { content, contentType })
        this.end(this._templateRender(content, data), contentType)
      }
    } else {
      throw new ServerError({ code: 'SERVER_NOT_FOUND', message: 'The template file not found.', httpCode: 404 })
    }
  }

  render (content, data) {
    if (!this._templateRender) {
      throw new ServerError({ code: 'SERVER_ERROR', message: 'The render function is disabled.', httpCode: 500 })
    } else {
      this.send(this._templateRender(content, data))
    }
  }

  end (data = '', contentType = null) {
    if (typeof contentType === 'string') {
      this._headers['content-type'] = contentType
    }
    this.cork(() => {
      if (this._status !== 200) {
        if (httpStatusCode[this._status]) {
          this.response.writeStatus(this._status + ' ' + httpStatusCode[this._status])
        } else {
          this.response.writeStatus(this._status.toString())
        }
      }
      Object.keys(this._headers).forEach(key => {
        this.response.writeHeader(key, this._headers[key])
      })
      this.response.end(data)
    })
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

  set (key, value) {
    this._headers[key.toLowerCase()] = value
    return this
  }

  location (loc, code = 302) {
    this.set('Location', loc).status(code)
    return this
  }
}

module.exports = Response
