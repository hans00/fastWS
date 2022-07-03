const uWS = require('uWebSockets.js')
const bytes = require('bytes')
const ServerError = require('./errors')
const Routes = require('./routes')
const render = require('./render')
const constants = require('./constants')
const Logger = require('./logger')
const utils = require('./utils')

class fastWS extends Routes {
  constructor (options) {
    super()
    let {
      ssl = null,
      verbose = false,
      cache = false,
      templateRender = render,
      bodySize = '4mb',
      forceStopTimeout = 5000,
      logLevel = 'info'
    } = options || {}
    if (!['error', 'warn', 'info', 'verbose'].includes(logLevel)) {
      throw new ServerError({
        code: 'SERVER_INVALID_OPTIONS',
        message: 'The option `logLevel` must be in ["error", "warn", "info", "verbose"].'
      })
    }
    try {
      bodySize = bytes.parse(bodySize)
    } catch (e) {
      throw new ServerError({
        code: 'SERVER_INVALID_OPTIONS',
        message: 'The body size format is invalid.',
        originError: e
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
    this._createTime = Date.now()
    this.ssl = ssl
    this.forceStopTimeout = forceStopTimeout
    this._server = null
    this._socket = null
    this.log = new Logger(verbose ? 'verbose' : logLevel)
    this.params = {
      [constants.maxBodySize]: bodySize,
      [constants.templateEngine]: templateRender,
      [constants.cache]: cache,
      [constants.trustProxy]: utils.createCidrMatcher(['loopback'])
    }
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
    this._server = this.ssl ? uWS.SSLApp(this.ssl) : uWS.App()
    super.build()
      .forEach(([method, path, callback]) => {
        this._server[method](path, callback)
      })
    // ready to listen
    const listenCallback = (listenSocket) => {
      this._socket = listenSocket
      if (listenSocket) {
        this.log.verbose(`Started in ${Date.now() - this._createTime} ms`)
      } else {
        this.log.error('Bind failed!')
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
        this.log.verbose('Force stop')
        process.exit(0)
      }, this.forceStopTimeout)
      this.log.verbose('Shutting down...')
      uWS.us_listen_socket_close(this._socket)
      clearTimeout(forceStop)
      this._socket = null
    }
  }

  reload () {
    if (this._server) {
      this.log.verbose('Reloading...')
      this.listen()
    }
  }

  getParam (key, defaultValue = null) {
    return this.params[key] || defaultValue
  }

  setParam (key, value) {
    if (key === constants.trustProxy) {
      this.params[key] = utils.createCidrMatcher(value)
    } else {
      this.params[key] = value
    }
  }
}

module.exports = fastWS
