const { inet_ntop } = require('inet_xtoy')
const { EventEmitter } = require('events')
const ServerError = require('./errors')

const builtinEvents = [ 'disconnect', 'drained', 'message', 'binary', 'ping', 'pong' ]

class WSEvent {
  constructor(ws, { event, data, reply_id }) {
    this.event = event
    this.data = data
    this.reply_id = reply_id
    this._ws = ws
  }

  reply(data) {
    if (this.reply_id) {
      this._ws._send('R:'+this.reply_id+';'+WSClient.getPayload(data))
    }
  }
}

class WSClient extends EventEmitter {
  constructor(session, request) {
    super()
    this.session = session
    this.requestHeaders = request.headers
    this.messageCounter = 0
  }

  static parsePayload(payload) {
    if (payload[1] !== ':') {
      throw new ServerError({ code: 'INVALID_WS_PAYLOAD' })
    }
    if (payload[0] === 's') {
      return { type: 'string', data: payload.slice(2) }
    } else if (payload[0] === 'b') {
      return { type: 'boolean', data: ayload.slice(2) === '1' }
    } else if (payload[0] === 'n') {
      return { type: 'number', data: Number(payload.slice(2)) }
    } else if (payload[0] === 'o') {
      return { type: 'object', data: JSON.parse(payload.slice(2)) }
    } else if (payload[0] === 'e') {
      const expand = payload.slice(2).split(/;/g)
      if (expand.length < 3) {
        throw new ServerError({ code: 'INVALID_WS_PAYLOAD' })
      }
      const event = expand[0]
      const replyId = expand[1]
      if (!event) {
        throw new ServerError({ code: 'INVALID_WS_PAYLOAD' })
      }
      const dataPayload = expand.slice(2).join(';')
      if (dataPayload[0] === 'e') {
        throw new ServerError({ code: 'INVALID_WS_PAYLOAD' })
      }
      return { type: 'event', name: event, data: WSEvent.parsePayload(dataPayload).data }
    } else {
      return { type: 'unknown', data: '' }
    }
  }

  emitPayload(payload) {
    const incoming = WSClient.parsePayload(payload)
    if (incoming.type === 'event') {
      this.emit(incoming.name, new WSEvent(this, incoming))
    } else {
      this.emit('message', incoming)
    }
  }

  static getPayload(data, type='') {
    if (type === 'returnId') {
      return 'r:'+data.event+';n:'+data.id
    } else if (type === 'returnData') {
      return 'R:'+data.id+';'+WSClient.getPayload(data.data)
    } else if (type === 'event') {
      return 'e:'+data.event+';'+WSClient.getPayload(data.data)
    } else {
      const type = typeof data
      if (type === 'string') {
        return 's:' + data
      } else if (type === 'number') {
        return 'n:' + String(data)
      } else if (type === 'boolean') {
        return 'b:' + (data ? '1' : '0')
      } else if (type === 'object') {
        return 'o:' + JSON.stringify(data)
      } else {
        return ''
      }
    }
  }

  get remoteAddress() {
    return inet_ntop(Buffer.from(this.session.getRemoteAddress()))
  }

  callback_wrapper(event, callback) {
    return (payload) => {
      const result = callback(payload)
      if (result && result instanceof Promise) {
        const id = this.messageCounter++
        if (this.messageCounter >> 8) {
          this.messageCounter = 0
        }
        this._send(WSClient.getPayload({ event, id }, 'returnId'), false, false)
        result.then(result => {
          this._send(WSClient.getPayload({ id, data: result }, 'returnData'), false, true)
        }).catch(error => {
          console.error(error)
          // kick user when error
          this.close()
        })
      } else if (result !== undefined) {
        this._send(WSClient.getPayload({ id: event, data: result }, 'returnData'), false, true)
      }
    }
  }

  drain() {
    if (!this.session.getBufferedAmount()) {
      this.emit('drained')
    }
  }

  _publish(topic, data, isBinary, compress) {
    this.session.publish(topic, data, isBinary, compress)
  }

  async _send(data, isBinary, compress) {
    if (this.session.send(data, isBinary, compress)) {
      return
    } else {
      await new Promise((resolve) => {
        super.once('drained', async () => {
          await this._send(data, isBinary, compress)
          resolve()
        })
      })
    }
  }

  join(channel) {
    return this.session.subscribe(channel)
  }

  quit() {
    return this.session.unsubscribe(channel)
  }

  send(event, data, compress=true) {
    return this._send(WSClient.getPayload({ event, data }, 'event'), false, compress)
  }

  sendMessage(data, compress=true) {
    return this._send(WSClient.getPayload(data), false, compress)
  }

  sendBinary(data, compress=true) {
    return this._send(data, true, compress)
  }

  broadcast(channel, event, data, compress=true) {
    this._publish(channel, WSClient.getPayload({ event, data }, 'event'), false, compress)
  }

  broadcastMessage(channel, data, compress=true) {
    this._publish(channel, WSClient.getPayload(data), false, compress)
  }

  broadcastBinary(channel, data, compress=true) {
    this._publish(channel, data, true, compress)
  }

  close() {
    return this.session.close()
  }

  end() {
    return this.session.end()
  }
}

module.exports = { WSClient, WSEvent }
