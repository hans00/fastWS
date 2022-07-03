const BasicWSProtocol = require('./ws-protocol/basic')
const Request = require('./request')
const Response = require('./response')
const WebSocketResponse = require('./websocket')
const Connection = require('./connection')
const ServerError = require('./errors')

class Routes {
  constructor () {
    this._routes = {}
    this.lock = false
  }

  build (prefix = '') {
    this.lock = true
    const results = []
    Object.keys(this._routes).forEach(path => {
      Object.keys(this._routes[path]).forEach(method => {
        results.push([method, path, this._routes[path][method]])
      })
    })
    return results
  }

  route (method, path, callbacks) {
    if (this.lock) {
      throw new ServerError({
        code: 'SERVER_ALREADY_STARTED',
        message: 'Cannot add route after sterver started.'
      })
    }
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
        const conn = Connection.create(this, request, response)
        const req = Request.create(conn)
        const res = Response.create(conn)
        try {
          await callbacks(req, res, params)
        } catch (e) {
          this.log.error('Server Internal Error', e)
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

  ws (path, connHandler, optOrOpenHandler = {}, options = null) {
    let openHandler = optOrOpenHandler
    if (typeof optOrOpenHandler === 'object') {
      options = optOrOpenHandler
      openHandler = connHandler
      connHandler = null
    } else if (!options) {
      options = {}
    }
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
      options.protocol = BasicWSProtocol
    }
    if (options.protocolOptions) {
      if (typeof options.protocolOptions !== 'object') {
        throw new ServerError({ code: 'INVALID_OPTIONS', message: 'Invalid websocket option' })
      }
    } else {
      options.protocolOptions = {}
    }
    const Protocol = options.protocol
    options.protocolInstance = new Protocol(options.protocolOptions)
    options.protocolName =
      (options.restrictProtocol && typeof options.protocol === 'string')
        ? options.protocol
        : null
    let URLParams = path.match(/:\w+/g)
    if (URLParams) {
      URLParams = URLParams.map(key => key.slice(1))
    }
    this.route('ws', path, {
      compression: options.compression,
      idleTimeout: options.idleTimeout,
      maxPayloadLength: options.maxPayloadLength,
      upgrade: async (response, request, context) => {
        const params = {}
        if (URLParams) {
          URLParams.forEach((key, index) => {
            params[key] = decodeURIComponent(request.getParameter(index))
          })
        }
        const conn = Connection.create(this, request, response, context)
        const client = options.protocolInstance.newClient(conn)
        const res = WebSocketResponse.create(conn, {
          client,
          params
        })
        try {
          if (!connHandler) {
            await openHandler(client, params)
            res.upgrade(options.protocolName)
          } else {
            const req = Request.create(conn)
            await connHandler(req, res, params)
          }
        } catch (error) {
          console.error(error)
          res.status(500).end('Server Internal Error')
        }
      },
      open: async (ws) => {
        try {
          if (connHandler) {
            await openHandler(ws.client, ws.params)
          }
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

  serve (path, optOrPath = {}) {
    const cache = optOrPath.cache || 'max-age=86400'
    const targetPath = typeof optOrPath === 'string' ? optOrPath : optOrPath.targetPath
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
}

module.exports = Routes
