const Replicator = require('replicator')
const basic = require('./basic')
const ServerError = require('../errors')

const replicator = new Replicator()

const PING = '\x0F'
const PONG = '\x0E'
const DATA_START = '\x01'
const DATA_END = '\x02'
const EVENT = '\x05'
const RESPONSE = '\x06'
const IDLE = '\x16'

const eventId = (str) => str.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0).toString(16)

function parsePayload (payload) {
  if (payload[0] === DATA_START && payload[payload.length - 1] === DATA_END) {
    return { type: 'message', data: replicator.decode(payload.slice(1, -1)) }
  } else if (payload[0] === PING) {
    return { type: 'ping', data: Number(payload.slice(1)) }
  } else if (payload[0] === PONG) {
    return { type: 'pong', data: new Date() - Number(payload.slice(1)) }
  } else if (payload[0] === EVENT) {
    const eventSplitIndex = payload.indexOf(IDLE)
    const replySplitIndex = payload.indexOf(DATA_START)
    if (eventSplitIndex === -1 || replySplitIndex === -1) {
      throw new ServerError({ code: 'WS_INVALID_PAYLOAD' })
    }
    const event = payload.slice(1, eventSplitIndex)
    const replyId = payload.slice(eventSplitIndex + 1, replySplitIndex)
    const dataPayload = payload.slice(replySplitIndex)
    return {
      type: 'event',
      name: event,
      reply_id: replyId,
      data: parsePayload(dataPayload).data
    }
  } else {
    throw new ServerError({ code: 'WS_INVALID_PAYLOAD' })
  }
}

function getPayload (data, type = 'message') {
  if (type === 'reply') {
    return RESPONSE + data.replyId + getPayload(data.data)
  } else if (type === 'event') {
    return EVENT + eventId(data.event) + getPayload(data.data)
  } else if (type === 'ping') {
    return PING + new Date().valueOf().toString()
  } else if (type === 'pong') {
    return PONG + data.toString()
  } else if (type === 'message') {
    return DATA_START + replicator.encode(data) + DATA_END
  } else {
    return ''
  }
}

class WSClient extends basic {
  constructor (session, request) {
    super(session, request)
    this._send('\x00\x02', 0, 0)
  }

  incomingPacket (payload, isBinary) {
    if (isBinary) {
      this.emit('binary', payload)
    } else {
      const incoming = parsePayload(payload.toString())
      if (incoming.type === 'event') {
        incoming.reply = (data) => {
          if (incoming.reply_id) {
            this._send(getPayload({ replyId: incoming.reply_id, data }, 'reply'))
          }
        }
        this.emit(incoming.name, incoming)
      } else {
        if (incoming.type === 'ping') {
          this._send(getPayload(incoming.data, 'pong'))
        }
        this.emit(incoming.type, incoming.data)
      }
    }
  }

  ping () {
    this._send(getPayload(null, 'ping'))
  }

  on (event, listener) {
    if (this.internalEvents.includes(event)) {
      super.on(event, listener)
    } else {
      super.on(eventId(event), listener)
    }
  }

  addListener (event, listener) {
    if (this.internalEvents.includes(event)) {
      super.addListener(event, listener)
    } else {
      super.addListener(eventId(event), listener)
    }
  }

  off (event, listener) {
    if (this.internalEvents.includes(event)) {
      super.off(event, listener)
    } else {
      super.off(eventId(event), listener)
    }
  }

  removeListener (event, listener) {
    if (this.internalEvents.includes(event)) {
      super.removeListener(event, listener)
    } else {
      super.removeListener(eventId(event), listener)
    }
  }

  removeAllListener (event) {
    if (this.internalEvents.includes(event)) {
      super.removeAllListener(event)
    } else {
      super.removeAllListener(eventId(event))
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
