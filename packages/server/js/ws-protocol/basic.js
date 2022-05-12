const { EventEmitter } = require('events')
const ServerError = require('../errors')
const utils = require('../utils')

const nullParser = {
  parse (payload) {
    return payload
  },
  stringify (payload) {
    return payload
  }
}

class WSClient extends EventEmitter {
  constructor (connection, options = {}) {
    super()
    this.connection = connection
    this.socket = null
    this.internalEvents = ['message', 'binary', 'drained', 'close', 'ping', 'pong']
    this.parser = options.parser || nullParser
  }

  upgrade (upgradeProtocol) {
    if (this.socket) throw new Error('WS_IS_UPGRADED')
    if (upgradeProtocol) {
      if (this.connection.headers['sec-websocket-protocol'].includes(upgradeProtocol)) return
      this.connection.upgrade(
        {
          client: this
        },
        this.connection.headers['sec-websocket-key'],
        upgradeProtocol,
        this.connection.headers['sec-websocket-extensions'],
        this.nativeContext
      )
    } else {
      this.connection.upgrade(
        {
          client: this
        },
        this.connection.headers['sec-websocket-key'],
        this.connection.headers['sec-websocket-protocol'],
        this.connection.headers['sec-websocket-extensions'],
        this.nativeContext
      )
    }
  }

  incomingPacket (payload, isBinary) {
    if (isBinary) {
      super.emit('binary', payload)
    } else {
      super.emit('message', this.parser.parse(payload))
    }
  }

  onOpen (socket) {
    this.socket = socket
    super.emit('open')
  }

  onClose (code, message) {
    super.emit('close', code, Buffer.from(message))
  }

  onPing () {
    super.emit('ping')
  }

  onPong () {
    super.emit('pong')
  }

  get remoteAddress () {
    return this.socket
      ? utils.toFraindlyIP(Buffer.from(this.socket.getRemoteAddressAsText()).toString())
      : this.connection.remoteAddress
  }

  onDrain () {
    if (this.socket.getBufferedAmount() === 0) {
      super.emit('drained')
    }
  }

  doPublish (topic, data, isBinary, compress) {
    if (!this.socket) throw new Error('WS_NOT_UPGRADED')
    this.socket.publish(topic, data, isBinary, compress)
  }

  async doSend (data, isBinary, compress) {
    if (!this.socket) throw new Error('WS_NOT_UPGRADED')
    if (this.socket.getBufferedAmount() === 0) {
      return this.socket.send(data, isBinary, compress)
    } else {
      await new Promise((resolve) => {
        super.once('drained', async () => {
          await this.doSend(data, isBinary, compress)
          resolve()
        })
      })
    }
  }

  join (channel) {
    if (!this.socket) throw new Error('WS_NOT_UPGRADED')
    return this.socket.subscribe(channel)
  }

  quit (channel) {
    if (!this.socket) throw new Error('WS_NOT_UPGRADED')
    return this.socket.unsubscribe(channel)
  }

  send (data, compress = true) {
    if (!this.socket) throw new Error('WS_NOT_UPGRADED')
    return this.doSend(this.parser.stringify(data), false, compress)
  }

  sendBinary (data, compress = true) {
    return this.doSend(data, true, compress)
  }

  sendToChannel (channel, data, compress = true) {
    this.doPublish(channel, this.parser.stringify(data), false, compress)
  }

  sendBinaryToChannel (channel, data, compress = true) {
    this.doPublish(channel, data, true, compress)
  }

  close () {
    if (!this.socket) throw new Error('WS_NOT_UPGRADED')
    return this.socket.close()
  }
}

class WSProtocol {
  constructor (options = {}) {
    if (options.parser) {
      if (typeof options.parser.parse !== 'function') {
        throw new ServerError({
          code: 'INVALID_OPTIONS',
          message: 'Invalid WebSocket protocol options.'
        })
      }
      if (typeof options.parser.stringify !== 'function') {
        throw new ServerError({
          code: 'INVALID_OPTIONS',
          message: 'Invalid WebSocket protocol options.'
        })
      }
    }
    this.options = options
  }

  newClient (connection) {
    return new WSClient(connection, this.options)
  }
}

module.exports = WSProtocol
module.exports.WSClient = WSClient
