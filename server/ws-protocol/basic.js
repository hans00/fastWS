const inet = require('../inet')
const { EventEmitter } = require('events')

class WSClient extends EventEmitter {
  constructor (session, request) {
    super()
    this.session = session
    this.requestHeaders = request.headers
  }

  incomingPacket (payload) {
    this.emit('message', { data: payload.toString() })
  }

  get remoteAddress () {
    return inet.ntop(Buffer.from(this.session.getRemoteAddress()))
  }

  drain () {
    if (this.session.getBufferedAmount() === 0) {
      this.emit('drained')
    }
  }

  _publish (topic, data, isBinary, compress) {
    this.session.publish(topic, data, isBinary, compress)
  }

  async _send (data, isBinary, compress) {
    if (this.session.getBufferedAmount() === 0) {
      return this.session.send(data, isBinary, compress)
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
    return this.session.subscribe(channel)
  }

  quit (channel) {
    return this.session.unsubscribe(channel)
  }

  send (data, compress = true) {
    return this._send(data, false, compress)
  }

  sendBinary (data, compress = true) {
    return this._send(data, true, compress)
  }

  broadcast (channel, event, data, compress = true) {
    this._publish(channel, data, false, compress)
  }

  broadcastBinary (channel, data, compress = true) {
    this._publish(channel, data, true, compress)
  }

  close () {
    return this.session.close()
  }
}

module.exports = WSClient
