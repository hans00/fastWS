const inet = require('./inet')
const { EventEmitter } = require('events')
const ServerError = require('./errors')

const builtinEvents = [ 'disconnect', 'drained', 'message', 'binary', 'ping', 'pong' ]

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
    const type = payload[0], content = payload.slice(2)
    if (type === 's') {
      return { type: 'string', data: content }
    } else if (type === 'b') {
      return { type: 'boolean', data: content === '1' }
    } else if (type === 'n') {
      return { type: 'number', data: Number(content) }
    } else if (type === 'o') {
      return { type: 'object', data: JSON.parse(content) }
    } else if (type === 'e') {
      const eventSplitIndex = content.indexOf(';')
      if (eventSplitIndex === -1) {
        throw new ServerError({ code: 'INVALID_WS_PAYLOAD' })
      }
      const event = content.slice(0, eventSplitIndex)
      const replySplitIndex = content.slice(eventSplitIndex+1).indexOf(';')
      const replyId = content.slice(eventSplitIndex+1, eventSplitIndex+replySplitIndex+1)
      const dataPayload = content.slice(eventSplitIndex+replySplitIndex+2)
      if (!event) {
        throw new ServerError({ code: 'INVALID_WS_PAYLOAD' })
      }
      if (dataPayload[0] === 'e') {
        throw new ServerError({ code: 'INVALID_WS_PAYLOAD' })
      }
      return {
        type: 'event',
        name: event,
        reply_id: replyId,
        data: WSClient.parsePayload(dataPayload).data
      }
    } else {
      return { type: 'unknown', data: '' }
    }
  }

  emitPayload(payload) {
    const incoming = WSClient.parsePayload(payload)
    if (incoming.type === 'event') {
      incoming.reply = (data) => {
        if (incoming.reply_id) {
          this._send('R:'+incoming.reply_id+';'+WSClient.getPayload(data))
        }
      }
      this.emit(incoming.name, incoming)
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
    return inet.ntop(Buffer.from(this.session.getRemoteAddress()))
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
    if (this.session.getBufferedAmount() === 0) {
      this.emit('drained')
    }
  }

  _publish(topic, data, isBinary, compress) {
    this.session.publish(topic, data, isBinary, compress)
  }

  async _send(data, isBinary, compress) {
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

module.exports = WSClient
