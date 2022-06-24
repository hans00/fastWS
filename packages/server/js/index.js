const uWS = require('bindings')('uWS')
const ServerError = require('./errors')
const Routes = require('./routes')
const render = require('./render')

class fastWS extends Routes {
  constructor (options) {
    super()
    let {
      ssl = null,
      verbose = false,
      cache = false,
      templateRender = render,
      bodySize = '4mb',
      forceStopTimeout = 5000
    } = options || {}
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
    this._options = {
      ssl,
      verbose,
      bodySize,
      templateRender,
      cache,
      forceStopTimeout
    }
    this._server = null
    this._socket = null
    this.params = {}
    process.on('SIGINT', () => this.gracefulStop(true))
    process.on('SIGTERM', () => this.gracefulStop(true))
    process.on('SIGHUP', () => this.reload())
  }

  listen (hostOrPort, portOrCallback, callback) {
    let host, port
    if (typeof hostOrPort === 'number' && typeof portOrCallback === 'function') {
      port = hostOrPort
      callback = portOrCallback
    } else if (typeof hostOrPort === 'string' && typeof portOrCallback === 'number') {
      host = hostOrPort
      port = portOrCallback
    }
    if (!port) {
      if (this._listenTo) {
        [host, port] = this._listenTo
      } else {
        throw new ServerError({
          code: 'INVALID_ARG',
          message: 'Invalid arguments'
        })
      }
    } else {
      this._listenTo = [host, port]
    }
    // init app
    this._server = this.options.ssl ? uWS.SSLApp(this.options.ssl) : uWS.App()
    super.build()
      .forEach(([method, path, callback]) => {
        this._server[method](path, callback)
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

  getParam (key, defaultValue = null) {
    return this.params[key] || defaultValue
  }

  setParam (key, value) {
    this.params[key] = value
  }
}

module.exports = fastWS
