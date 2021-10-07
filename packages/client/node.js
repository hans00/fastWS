const Base = require('./base')
const WebSocket = require('ws')

class WSClient extends Base {
  constructor (endpoint, options = {}) {
    super(options)
    this.client = new WebSocket(endpoint, 'fast-ws', options)
    this.client.on('error', error => {
      super.emit('error', error)
    })
    this.client.on('open', () => {
      this.connectState = 1
      this._heartbeat = setInterval(() => {
        this.ping()
      }, this.options.pingInterval)
    })
    this.client.on('close', () => {
      this.connectState = -1
      clearInterval(this._heartbeat)
      super.emit('disconnect')
    })
    this.client.on('message', (message, isBinary) => {
      if (!isBinary) message = message.toString()
      if (this.connectState !== 2) {
        if (message === '\x00\x02') {
          this.connectState = 2
          super.emit('connect')
        } else {
          super.emit('error', new Error('Client version mismatch.'))
        }
      } else {
        this.incomingPacket(message)
      }
    })
    this.client.on('ping', () => {
      super.emit('ping')
    })
    this.client.on('pong', (data) => {
      if (data.length) {
        super.emit('pong', new Date().valueOf() - data.toString())
      } else {
        super.emit('pong')
      }
    })
  }

  ping () {
    const autoTerminate = setTimeout(() => this.client.terminate(), this.options.pingTimeout)
    this.client.ping(new Date().valueOf())
    super.once('pong', () => {
      clearTimeout(autoTerminate)
    })
  }
}

module.exports = WSClient
