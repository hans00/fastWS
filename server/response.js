const ServerError = require('./errors')
const fs = require('fs')
const path = require('path')
const mime = require('mime-types')

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
  constructor({ _cache, _template_render }, request, response) {
    this.request = request
    this.response = response
    this._status = 200
    this._headers = {}
    this.isEnd = false
    this._cache = _cache
    this._template_render = _template_render
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
    const full_path = path.resolve('static', file_path)
    const isInStatic = full_path.startsWith(path.resolve('static'))
    const file_name = full_path.split('/').pop()
    const check_modify_time = this.request.getHeader('if-modified-since')
    if (isInStatic && fs.existsSync(full_path) && full_path.match(/\/\./)) {
      // cache control
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
      // if cache found file, send file in cache
      if (this._cache.has(full_path)) {
        const file = this._cache.get(full_path)
        if (check_modify_time && check_modify_time === file.mtime) {
          return this.state(304).end('', undefined)
        } else {
          this.set('Last-Modified', file.mtime)
            .set('Cache-Control', cache_control)
            .end(file.content, file.contentType)
        }
      } else {
        const contentType = mime.lookup(full_path)
        const mtime = new Date(fs.statSync(full_path).mtime).toGMTString()
        const content = fs.readFileSync(full_path)
        this._cache.set(full_path, { content, contentType, mtime })
        if (check_modify_time && check_modify_time === mtime) {
          return this.state(304).end('', false)
        } else {
          this.set('Last-Modified', mtime)
            .set('Cache-Control', cache_control)
            .end(content, contentType)
        }
      }
    } else {
      throw new ServerError({ code: 'SERVER_NOT_FOUND', message: 'The static file not found.', suggestCode: 404 })
    }
  }

  renderFile(file_path, data) {
    if (!this._template_render) {
      throw new ServerError({ code: 'SERVER_ERROR', message: 'The render function is disabled.', suggestCode: 500 })
    }
    const full_path = path.resolve('template', file_path)
    const isInTemplate = full_path.startsWith(path.resolve('template'))
    const file_name = full_path.split('/').pop()
    if (isInTemplate && fs.existsSync(full_path)) {
      // if cache found file, send file in cache
      if (this._cache.has(full_path)) {
        const file = this._cache.get(full_path)
        this.end(this._template_render(file.content, data), file.contentType)
      } else {
        const contentType = mime.lookup(full_path)
        const content = fs.readFileSync(full_path)
        this._cache.set(full_path, { content, contentType })
        this.end(this._template_render(content, data), contentType)
      }
    } else {
      throw new ServerError({ code: 'SERVER_NOT_FOUND', message: 'The template file not found.', suggestCode: 404 })
    }
  }

  render(content, data) {
    if (!this._template_render) {
      throw new ServerError({ code: 'SERVER_ERROR', message: 'The render function is disabled.', suggestCode: 500 })
    } else {
      this.send(this._template_render(content, data))
    }
  }

  end(data='', contentType=null) {
    if (typeof contentType === 'string') {
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
      this.end(data.toString(), 'text/html')
    } else {
      this.end(data.toString(), 'text/plain')
    }
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
