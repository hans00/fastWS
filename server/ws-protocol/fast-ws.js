const basic = require('./basic')
const ServerError = require('../errors')

function parsePayload (payload) {
  if (payload[1] !== ':') {
    throw new ServerError({ code: 'WS_INVALID_PAYLOAD' })
  }
  const type = payload[0]; const content = payload.slice(2)
  if (type === 's') {
    return { type: 'message', data: content }
  } else if (type === 'b') {
    return { type: 'message', data: content === '1' }
  } else if (type === 'n') {
    return { type: 'message', data: Number(content) }
  } else if (type === 'o') {
    return { type: 'message', data: JSON.parse(content) }
  } else if (type === 'e') {
    const eventSplitIndex = content.indexOf(';')
    if (eventSplitIndex === -1) {
      throw new ServerError({ code: 'WS_INVALID_PAYLOAD' })
    }
    const event = content.slice(0, eventSplitIndex)
    const replySplitIndex = content.slice(eventSplitIndex + 1).indexOf(';')
    const replyId = content.slice(eventSplitIndex + 1, eventSplitIndex + replySplitIndex + 1)
    const dataPayload = content.slice(eventSplitIndex + replySplitIndex + 2)
    if (!event) {
      throw new ServerError({ code: 'WS_INVALID_PAYLOAD' })
    }
    if (dataPayload[0] === 'e') {
      throw new ServerError({ code: 'WS_INVALID_PAYLOAD' })
    }
    return {
      type: 'event',
      name: event,
      reply_id: replyId,
      data: parsePayload(dataPayload).data
    }
  } else {
    return { type: 'unknown', data: '' }
  }
}

function getPayload (data, type = '') {
  if (type === 'returnId') {
    return 'r:' + data.event + ';n:' + data.id
  } else if (type === 'returnData') {
    return 'R:' + data.id + ';' + getPayload(data.data)
  } else if (type === 'event') {
    return 'e:' + data.event + ';' + getPayload(data.data)
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

class WSClient extends basic {
  constructor (session, request) {
    super(session, request)
    this._send('\x00\x01', 0, 0)
  }

  incomingPacket (payload) {
    const incoming = parsePayload(payload.toString())
    if (incoming.type === 'event') {
      incoming.reply = (data) => {
        if (incoming.reply_id) {
          this._send('R:' + incoming.reply_id + ';' + getPayload(data))
        }
      }
      this.emit(incoming.name, incoming)
    } else {
      this.emit('message', incoming)
    }
  }

  send (event, data, compress = true) {
    return this._send(getPayload({ event, data }, 'event'), false, compress)
  }

  sendMessage (data, compress = true) {
    return this._send(getPayload(data), false, compress)
  }

  sendBinary (data, compress = true) {
    return this._send(data, true, compress)
  }

  broadcast (channel, event, data, compress = true) {
    this._publish(channel, getPayload({ event, data }, 'event'), false, compress)
  }

  broadcastMessage (channel, data, compress = true) {
    this._publish(channel, getPayload(data), false, compress)
  }

  broadcastBinary (channel, data, compress = true) {
    this._publish(channel, data, true, compress)
  }
}

module.exports = WSClient
