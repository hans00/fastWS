const { EventEmitter } = require('events')
const inet = require('../inet')
const ServerError = require('../errors')

const nullParser = {
  parse (payload) {
    return payload
  },
  stringify (payload) {
    return payload
  }
}

class WSClient extends EventEmitter {
  constructor (socket, request, { parser = nullParser } = {}) {
    super()
    this.socket = socket
    this.requestHeaders = {}
    request.forEach((k, v) => {
      this.requestHeaders[k] = v
    })
    this.internalEvents = ['message', 'binary', 'drained', 'close', 'ping', 'pong']
    this.parser = parser
  }

  incomingPacket (payload, isBinary) {
    if (isBinary) {
      super.emit('binary', payload)
    } else {
      super.emit('message', this.parser.parse(payload))
    }
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
    return inet.ntop(Buffer.from(this.socket.getRemoteAddress()))
  }

  drain () {
    if (this.socket.getBufferedAmount() === 0) {
      super.emit('drained')
    }
  }

  _publish (topic, data, isBinary, compress) {
    this.socket.publish(topic, data, isBinary, compress)
  }

  async _send (data, isBinary, compress) {
    if (this.socket.getBufferedAmount() === 0) {
      return this.socket.send(data, isBinary, compress)
    } else {
      await new Promise((resolve) => {
        super.once('drained', async () => {
          await this._send(data, isBinary, compress)
          resolve()
        })
      })
    }
  }

  join (channel) {
    return this.socket.subscribe(channel)
  }

  quit (channel) {
    return this.socket.unsubscribe(channel)
  }

  send (data, compress = true) {
    return this._send(this.parser.stringify(data), false, compress)
  }

  sendBinary (data, compress = true) {
    return this._send(data, true, compress)
  }

  sendToChannel (channel, data, compress = true) {
    this._publish(channel, this.parser.stringify(data), false, compress)
  }

  sendBinaryToChannel (channel, data, compress = true) {
    this._publish(channel, data, true, compress)
  }

  close () {
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

  newClient (socket, request) {
    return new WSClient(socket, request, this.options)
  }
}

module.exports = WSProtocol
module.exports.WSClient = WSClient
