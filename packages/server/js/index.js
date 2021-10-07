const uWS = require('bindings')('uWS')
const BasicWSProtocol = require('./ws-protocol/basic')
const Request = require('./request')
const Response = require('./response')
const Connection = require('./connection')
const ServerError = require('./errors')

if (process.env.EXPERIMENTAL_FASTCALL) {
  process.nextTick = (f, ...args) => {
    Promise.resolve().then(() => {
      f(...args)
    })
  }
}

function render (_template, _data) {
  /* eslint no-unused-vars: 0 */
  function escapeVar (data, type) { // type = [ String, Number, Object, Array ]
    if (type) {
      if (type === String) {
        return data.toString().replace(/(['"\\/])/g, '\\$1')
      } else if (type === Number) {
        return Number(data)
      } else {
        return JSON.stringify(data).replace(/\//g, '\\/')
      }
    } else {
      throw new ServerError({
        code: 'SERVER_RENDER_ERROR',
        message: 'The type of data must be set.'
      })
    }
  }
  function escapeHTML (data) {
    return data.toString().replace(/[\u00A0-\u9999<>&"']/gim, (i) => `&#${i.charCodeAt(0)};`)
  }
  /* eslint no-eval: 0 */
  return eval(
    'const ' +
    Object.keys(_data).map(key => `${key} = ${JSON.stringify(_data[key])}`).join() + ';' +
    '(`' + _template.toString().replace(/([`\\])/g, '\\$1') + '`)'
  )
}

class fastWS {
  constructor ({
    ssl = null,
    verbose = false,
    cache = false,
    templateRender = render,
    bodySize = '4mb',
    forceStopTimeout = 5000
  } = {}) {
    if (typeof bodySize === 'string') {
      // convert string to bytes number
      bodySize = bodySize.toLowerCase()
      if (!isNaN(bodySize.slice(0, -2))) {
        switch (bodySize.slice(-2)) {
          case 'kb':
            bodySize = Number(bodySize.slice(0, -2)) * 1024
            break
          case 'mb':
            bodySize = Number(bodySize.slice(0, -2)) * 1024 * 1024
            break
          case 'gb':
            bodySize = Number(bodySize.slice(0, -2)) * 1024 * 1024 * 1024
            break
          default:
            throw new ServerError({
              code: 'SERVER_INVALID_OPTIONS',
              message: 'The body size format is invalid.'
            })
        }
      } else {
        throw new ServerError({
          code: 'SERVER_INVALID_OPTIONS',
          message: 'The body size format is invalid.'
        })
      }
    } else if (typeof bodySize !== 'number') {
      throw new ServerError({
        code: 'SERVER_INVALID_OPTIONS',
        message: 'The body size format is invalid.'
      })
    }
    if (typeof templateRender !== 'function') {
      throw new ServerError({
        code: 'SERVER_INVALID_OPTIONS',
        message: 'The option `templateRender` must be function.'
      })
    }
    if (typeof cache === 'object') {
      if (typeof cache.has !== 'function' || typeof cache.set !== 'function' || typeof cache.get !== 'function') {
        throw new ServerError({
          code: 'SERVER_INVALID_OPTIONS',
          message: 'The option `cache` is invalid.'
        })
      }
      this._cache = cache
    } else if (typeof cache === 'string') {
      const CacheModule = require(cache)
      cache = new CacheModule()
    } else if (cache === false) {
      // disable cache
      cache = {
        has: (key) => false,
        set: () => false
      }
    } else {
      throw new ServerError({
        code: 'SERVER_INVALID_OPTIONS',
        message: 'The option `cache` is invalid.'
      })
    }
    this.options = {
      ssl,
      verbose,
      bodySize,
      templateRender,
      cache,
      forceStopTimeout
    }
    this._server = null
    this._socket = null
    this._routes = {}
    process.on('SIGINT', () => this.gracefulStop(true))
    process.on('SIGTERM', () => this.gracefulStop(true))
    process.on('SIGHUP', () => this.reload())
  }

  listen () {
    // parse arguments
    let host, port, callback
    if (arguments.length === 0) {
      if (this._listenTo) {
        [host, port] = this._listenTo
      } else {
        throw new ServerError({
          code: 'INVALID_ARG',
          message: 'Invalid, must specify host and port or port only.'
        })
      }
    } else if (arguments.length === 1) {
      port = arguments[0]
      this._listenTo = [host, port]
    } else if (arguments.length === 2) {
      if (typeof arguments[0] === 'number' && typeof arguments[1] === 'function') {
        port = arguments[0]
        callback = arguments[1]
      } else if (typeof arguments[0] === 'string' && typeof arguments[0] === 'function') {
        host = arguments[0]
        port = arguments[1]
      } else {
        throw new ServerError({
          code: 'INVALID_ARG',
          message: 'Invalid, argumrnts type is wrong.'
        })
      }
      this._listenTo = [host, port]
    } else if (arguments.length === 3) {
      host = arguments[0]
      port = arguments[1]
      callback = arguments[2]
      if (typeof host !== 'string' || typeof port !== 'number' || typeof callback !== 'function') {
        throw new ServerError({
          code: 'INVALID_ARG',
          message: 'Invalid, argumrnts type is wrong.'
        })
      }
      this._listenTo = [host, port]
    } else {
      throw new ServerError({
        code: 'INVALID_ARG',
        message: 'Invalid, argumrnt counts is wrong.'
      })
    }
    // init app
    this._server = this.options.ssl ? uWS.SSLApp(this.options.ssl) : uWS.App()
    Object.keys(this._routes).forEach(path => {
      Object.keys(this._routes[path]).forEach(method => {
        this._server[method](path, this._routes[path][method])
      })
    })
    // ready to listen
    const listenCallback = (listenSocket) => {
      this._socket = listenSocket
      if (listenSocket) {
        this.options.verbose && console.log('Started')
      } else {
        this.options.verbose && console.log('Failed')
      }
      if (callback) {
        callback(listenSocket)
      }
    }
    this.gracefulStop(false)
    if (host) {
      this._server.listen(host, port, listenCallback)
    } else {
      this._server.listen(port, listenCallback)
    }
  }

  route (method, path, callbacks) {
    if (!this._routes[path]) {
      this._routes[path] = {}
    }
    if (this._routes[path][method]) {
      throw new ServerError({
        code: 'INVALID_DUPLICATE_ROUTER',
        message: 'Invalid, duplicated router.'
      })
    }
    if (method === 'ws') {
      this._routes[path][method] = callbacks
    } else {
      let URLParams = path.match(/:\w+/g)
      if (URLParams) {
        URLParams = URLParams.map(key => key.slice(1))
      }
      this._routes[path][method] = async (response, request) => {
        const params = {}
        if (URLParams) {
          URLParams.forEach((key, index) => {
            params[key] = decodeURIComponent(request.getParameter(index))
          })
        }
        const conn = new Connection(this, request, response)
        const req = new Request(conn)
        const res = new Response(conn)
        try {
          await callbacks(req, res, params)
        } catch (e) {
          console.error(e.toString())
          if (!res._writableState.destroyed) {
            if (e instanceof ServerError && e.httpCode) {
              res.status(e.httpCode).end(e.message)
            } else {
              res.status(500).end('Server Internal Error')
            }
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
    if (options.protocol) {
      if (options.protocol === 'custom' || options.protocol === 'chat') {
        options.protocol = BasicWSProtocol
      } else if (typeof options.protocol === 'string') {
        options.protocol = require(`./ws-protocol/${options.protocol}`)
      } else if (!(options.protocol.prototype instanceof BasicWSProtocol)) {
        throw new ServerError({ code: 'INVALID_OPTIONS', message: 'Invalid websocket option' })
      }
    } else {
      options.protocol = require('./ws-protocol/fast-ws')
    }
    if (options.protocolOptions) {
      if (typeof options.protocolOptions !== 'object') {
        throw new ServerError({ code: 'INVALID_OPTIONS', message: 'Invalid websocket option' })
      }
    } else {
      options.protocolOptions = {}
    }
    const Protocol = options.protocol
    const protocol = new Protocol(options.protocolOptions)
    const autoUpgrade = options.autoUpgrade !== false
    const protocolName = typeof options.protocol === 'string' ? options.protocol : null
    let URLParams = path.match(/:\w+/g)
    if (URLParams) {
      URLParams = URLParams.map(key => key.slice(1))
    }
    this.route('ws', path, {
      compression: options.compression,
      idleTimeout: options.idleTimeout,
      maxPayloadLength: options.maxPayloadLength,
      upgrade: (response, request, context) => {
        const params = {}
        if (URLParams) {
          URLParams.forEach((key, index) => {
            params[key] = decodeURIComponent(request.getParameter(index))
          })
        }
        const conn = new Connection(this, request, response, context)
        const client = protocol.newClient(conn)
        this.options.verbose && console.log('[upgrade-req]', client.remoteAddress)
        try {
          callback(client, params)
          if (autoUpgrade) {
            client.upgrade(protocolName)
          }
        } catch (error) {
          console.error(error)
          const res = new Response(conn)
          res.status(500).end('Server Internal Error')
        }
      },
      open: (ws) => {
        this.options.verbose && console.log('[open]', ws.client.remoteAddress)
        try {
          ws.client.onOpen(ws)
        } catch (error) {
          console.error(error)
          // disconnect when error
          ws.close()
        }
      },
      message: (ws, message, isBinary) => {
        try {
          const buf = Buffer.from(message)
          ws.client.incomingPacket(isBinary ? buf : buf.toString(), isBinary)
        } catch (error) {
          console.error(error)
          // disconnect when error
          ws.close()
        }
      },
      drain: (ws) => {
        ws.client.onDrain()
      },
      ping: (ws) => {
        ws.client.onPing()
      },
      pong: (ws) => {
        ws.client.onPong()
      },
      close: (ws, code, message) => {
        ws.client.onClose(code, message)
        setImmediate(() => delete ws.client)
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

  serve (path, { targetPath, cache = 'max-age=86400' } = {}) {
    if (targetPath) {
      this.route('get', path, (req, res) => {
        res.staticFile(targetPath, cache)
      })
    } else {
      this.route('get', path, (req, res) => {
        res.staticFile(req.connection.url, cache)
      })
    }
  }

  gracefulStop (canForceExit = true) {
    if (this._socket) {
      const forceStop = canForceExit && setTimeout(() => {
        this.options.verbose && console.log('Force stop')
        process.exit(0)
      }, this.options.forceStopTimeout)
      this.options.verbose && console.log('Shutting down...')
      uWS.us_listen_socket_close(this._socket)
      clearTimeout(forceStop)
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
