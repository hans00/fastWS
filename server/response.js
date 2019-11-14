const ServerError = require('./errors')
const fs = require('fs')
const path = require('path')

const http_status_code = {
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
  503: 'Service Unavailable',
}

class Response {
  constructor(request, response, cache) {
    this.request = request
    this.response = response
    this._status = 200
    this._headers = {
      'content-type': 'text/plain'
    }
    this.isEnd = false
    this._cache = cache
  }

  cork(callback) {
    this.response.experimental_cork(callback)
  }

  status(code) {
    this._status = code
    return this
  }

  staticFile(file_path, cache='max-age=86400') {
    if (file_path.endsWith('/')) {
      file_path += 'index.html'
    }
    let cache_control = undefined
    if (typeof cache === 'string') {
      cache_control = cache
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
    const check_modify_time = this.request.getHeader('if-modified-since')
    if (this.cache.has(file_path)) {
      const file = this.cache.get(file_path)
      if (check_modify_time && check_modify_time === file.mtime) {
        return this.state(304).end('', undefined)
      } else {
        this.set('Last-Modified', file.mtime)
          .set('Cache-Control', cache_control)
          .end(file.content, file.contentType)
      }
    }
    const full_path = path.resolve('static', file_path)
    const isInStatic = full_path.startsWith(path.resolve('static'))
    const file_name = full_path.split('/').pop()
    if (isInStatic && fs.existsSync(full_path) && file_name[0] === '.') {
      let contentType = 'text/plain'
      if (file_path.endsWith('.html')) {
        contentType = 'text/html'
      }
      const mtime = new Date(fs.statSync(full_path).mtime).toGMTString()
      const content = fs.readFileSync(full_path)
      this.cache.set(file_path, { content, contentType, mtime })
      if (check_modify_time && check_modify_time === mtime) {
        return this.state(304).end('', undefined)
      } else {
        this.set('Last-Modified', mtime)
          .set('Cache-Control', cache_control)
          .end(content, contentType)
      }
    } else {
      throw new ServerError({ code: 'SERVER_STATIC_FILE_NOT_FOUND', suggestCode: 404 })
    }
  }

  end(data='', contentType=null) {
    if (contentType !== null) {
      this._headers['content-type'] = contentType
    }
    this.cork(() => {
      if (this._status !== 200) {
        if (http_status_code[this._status]) {
          this.response.writeStatus(this._status + ' ' + http_status_code[this._status])
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

  send(data) {
    if (data.includes('<html>')) {
      this._headers['content-type'] = 'text/html'
    }
    this.end(data.toString())
  }

  json(data) {
    this.end(JSON.stringify(data), 'application/json')
  }

  set(key, value) {
    this._headers[key.toLowerCase()] = value
    return this
  }

  location(loc, code=302) {
    this.set('Location', loc).status(code)
    return this
  }
}

module.exports = Response
