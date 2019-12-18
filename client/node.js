const Base = require('./base')
const WebSocket = require('ws')

class WSClient extends Base {
  constructor (endpoint, options = {}) {
    super(options)
    this.client = new WebSocket(endpoint, 'fast-ws', options)
    this.client.on('error', error => {
      this.emit('error', error)
    })
    this.client.on('open', () => {
      this.connectState = 1
      this._heartbeat = setInterval(() => {
        this.ping()
      }, options.pingInterval || 30000)
    })
    this.client.on('close', () => {
      this.connectState = -1
      clearInterval(this._heartbeat)
      this.emit('disconnect')
    })
    this.client.on('message', (message) => {
      if (this.connectState !== 2) {
        if (message === '\x00\x02') {
          this.connectState = 2
          this.emit('connect')
        } else {
          this.emit('error', new Error('Client version mismatch.'))
        }
      } else {
        this.incomingPacket(message)
      }
    })
    this.client.on('ping', () => {
      this.emit('ping')
    })
    this.client.on('pong', (data) => {
      if (data.length) {
        this.emit('pong', new Date().valueOf() - data.toString())
      } else {
        this.emit('pong')
      }
    })
  }

  ping () {
    this.client.ping(new Date().valueOf())
  }
}

module.exports = WSClient
