const uWS = require('bindings')('uWS')
const LRU = require('lru-cache')
const WSClient = require('./ws')
const Request = require('./request')
const Response = require('./response')
const ServerError = require('./errors')

if (!process.nextTick) {
  process.nextTick = (f, ...args) => {
    Promise.resolve().then(() => {
      f(...args)
    })
  }
}
process.on('exit', uWS.free)

function render (_template, _data) {
  /* eslint no-unused-vars: 0 */
  function quote (data, type) {
    if (type) {
      if (type === String) {
        return '"' + data.toString().replace(/("|\\)/g, '\\$1') + '"'
      } else if (type === Number) {
        return Number(data)
      } else {
        return JSON.stringify(data)
      }
    } else {
      return JSON.stringify(data)
    }
  }
  function escapeHTML (data) {
    return data.toString().replace(/[\u00A0-\u9999<>&]/gim, (i) => `&#${i.charCodeAt(0)};`)
  }
  function escapeURL (data) {
    return encodeURI(data.toString())
  }
  /* eslint no-eval: 0 */
  return eval(
    'const ' +
    Object.keys(_data).map(key => `${key} = ${JSON.stringify(_data[key])}`).join() + ';' +
    '(`' + _template.toString().replace(/(`|\\)/g, '\\$1') + '`)'
  )
}

class fastWS {
  constructor ({
    ssl = null,
    verbose = false,
    cache = 50,
    templateRender
  } = {}) {
    this.options = {
      ssl,
      verbose
    }
    this._server = null
    this._socket = null
    this._port = null
    this._routes = []
    if (typeof templateRender === 'function') {
      this._templateRender = templateRender
    } else {
      this._templateRender = render
    }
    if (typeof cache === 'object' && !(cache instanceof Object)) {
      this._cache = cache
    } else {
      this._cache = new LRU(cache)
    }
    process.on('SIGINT', () => this.gracefulStop())
    process.on('SIGTERM', () => this.gracefulStop())
    process.on('SIGHUP', () => this.reload())
  }

  listen (port, callback) {
    if (!port && !this._port) {
      throw new ServerError({ code: 'INVALID_NO_PORT', message: 'Invalid, must specify port' })
    } else if (!port) {
      port = this._port
    } else {
      this._port = port
    }
    this._server = this.options.ssl ? uWS.SSLApp(this.options.ssl) : uWS.App()
    Object.keys(this._routes).forEach(path => {
      Object.keys(this._routes[path]).forEach(method => {
        this._server[method](path, this._routes[path][method])
      })
    })
    this.gracefulStop()
    this._server.listen(port, (listenSocket) => {
      this._socket = listenSocket
      if (listenSocket) {
        this.options.verbose && console.log('Started')
      } else {
        this.options.verbose && console.log('Failed')
      }
      if (callback) {
        callback(listenSocket)
      }
    })
  }

  broadcast (channel, event, data, compress = true) {
    this._server.publish(channel, WSClient.getPayload({ event, data }, 'event'), false, compress)
  }

  broadcastMessage (channel, data, compress = true) {
    this._server.publish(channel, WSClient.getPayload(data), false, compress)
  }

  broadcastBinary (channel, data, compress = true) {
    this._server.publish(channel, data, true, compress)
  }

  route (method, path, callbacks) {
    if (!this._routes[path]) {
      this._routes[path] = {}
    }
    let URLParams = path.match(/:\w+/g)
    if (URLParams) {
      URLParams = URLParams.map(key => key.slice(1))
    }
    if (method === 'ws') {
      this._routes[path][method] = callbacks
    } else {
      this._routes[path][method] = async (response, request) => {
        const params = {}
        if (URLParams) {
          URLParams.forEach((key, index) => {
            params[key] = decodeURIComponent(request.getParameter(index))
          })
        }
        const req = new Request(request, response)
        const res = new Response(this, request, response)
        try {
          await callbacks(req, res, params)
        } catch (e) {
          if (e instanceof ServerError && e.httpCode) {
            if (e.originError) {
              console.error(e.originError)
            }
            res.status(e.httpCode).end(e.message)
          } else {
            console.error(e)
            res.status(500).end('Server Internal Error')
          }
        }
      }
    }
  }

  ws (path, callback, options = {}) {
    if (options.compression) {
      if (options.compression === false || options.compression === 'disable') {
        options.compression = 0
      } else if (['default', 'shared'].includes(options.compression)) {
        options.compression = 1
      } else if (['dedicated'].includes(options.compression)) {
        options.compression = 2
      } else {
        throw new ServerError({ code: 'INVALID_OPTIONS', message: 'Invalid websocket option' })
      }
    }
    if (options.idleTimeout && !Number.isInteger(options.idleTimeout)) {
      throw new ServerError({ code: 'INVALID_OPTIONS', message: 'Invalid websocket option' })
    }
    if (options.maxPayloadLength && !Number.isInteger(options.maxPayloadLength)) {
      throw new ServerError({ code: 'INVALID_OPTIONS', message: 'Invalid websocket option' })
    }
    this.route('ws', path, {
      ...options,
      open: async (ws, req) => {
        const client = new WSClient(ws, new Request(req))
        this.options.verbose && console.log('[open]', client.remoteAddress)
        ws._client = client
        try {
          await callback(client)
          ws.send('\x00', 0, 0)
        } catch (error) {
          console.error(error)
          // disconnect when error
          ws.close()
        }
      },
      message: (ws, message, isBinary) => {
        if (!isBinary) {
          try {
            // decode message
            ws._client.emitPayload(Buffer.from(message).toString())
          } catch (error) {
            if (error === 'INVALID_PAYLOAD') {
              this.options.verbose && console.log('[error]', 'Invalid message payload')
            } else {
              console.error(error)
            }
            // kick user when error
            ws.close()
          }
        } else {
          ws._client.emit('binary', message)
        }
      },
      drain: (ws) => {
        ws._client.drain()
      },
      ping: (ws) => {
        ws._client.emit('ping')
      },
      pong: (ws) => {
        ws._client.emit('pong')
      },
      close: (ws, code, message) => {
        ws._client.emit('disconnect')
        setImmediate(() => delete ws._client)
      }
    })
  }

  get (path, callback) {
    this.route('get', path, callback)
  }

  post (path, callback) {
    this.route('post', path, callback)
  }

  patch (path, callback) {
    this.route('patch', path, callback)
  }

  del (path, callback) {
    this.route('del', path, callback)
  }

  delete (path, callback) {
    this.route('del', path, callback)
  }

  put (path, callback) {
    this.route('put', path, callback)
  }

  head (path, callback) {
    this.route('head', path, callback)
  }

  trace (path, callback) {
    this.route('trace', path, callback)
  }

  connect (path, callback) {
    this.route('connect', path, callback)
  }

  options (path, callback) {
    this.route('options', path, callback)
  }

  any (path, callback) {
    this.route('any', path, callback)
  }

  serve (path, { targetPath, cache = 'max-age=86400', encoding = 'utf8' } = {}) {
    if (targetPath) {
      this.route('get', path, (req, res) => {
        res.staticFile(targetPath, encoding, cache)
      })
    } else {
      this.route('get', path, (req, res) => {
        res.staticFile(req.url, encoding, cache)
      })
    }
  }

  gracefulStop () {
    if (this._socket) {
      this.options.verbose && console.log('Shutting down...')
      uWS.us_listen_socket_close(this._socket)
      this._socket = null
    }
  }

  reload () {
    if (this._server) {
      this.options.verbose && console.log('Reloading...')
      this.listen()
    }
  }
}

module.exports = fastWS
