const Replicator = require('replicator')
const { EventEmitter } = require('events')

const replicator = new Replicator()

const PING = '\x0F'
const PONG = '\x0E'
const DATA_START = '\x01'
const DATA_END = '\x02'
const EVENT = '\x05'
const RESPONSE = '\x06'
const IDLE = '\x16'

const eventId = (str) => str.split('').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 1), 0).toString(16)

class WSClientBase extends EventEmitter {
  constructor (options = {}) {
    super()
    this.options = options
    this.connectState = 0
    this.internalEvents = ['open', 'close', 'disconnect', 'connect', 'ping', 'pong', 'message', 'binary', 'error']
    this.client = null
    this._return_id_counter = 0
    this._event_return = {}
  }

  static getPayload (data, type = 'message') {
    if (type === 'event') {
      if (data.replyId === undefined || data.replyId === null) {
        data.replyId = ''
      }
      return EVENT + eventId(data.event) + IDLE + data.replyId + WSClientBase.getPayload(data.data)
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

  static parsePayload (payload) {
    if (payload[0] === DATA_START && payload[payload.length - 1] === DATA_END) {
      return { type: 'message', data: replicator.decode(payload.slice(1, -1)) }
    } else if (payload[0] === PING) {
      return { type: 'ping', data: Number(payload.slice(1)) }
    } else if (payload[0] === PONG) {
      return { type: 'pong', data: new Date() - Number(payload.slice(1)) }
    } else if (payload[0] === RESPONSE) {
      const splitIndex = payload.indexOf(DATA_START)
      const id = Number(payload.slice(1, splitIndex))
      const data = payload.slice(splitIndex)
      return { type: 'returnData', id, data: WSClientBase.parsePayload(data).data }
    } else if (payload[0] === EVENT) {
      const splitIndex = payload.indexOf(DATA_START)
      const data = payload.slice(splitIndex)
      return { type: 'event', event: payload.slice(1, splitIndex), data: WSClientBase.parsePayload(data).data }
    }
  }

  ping () {
    throw new Error('No implement')
  }

  incomingPacket (payload) {
    if (payload.constructor.name === 'ArrayBuffer' || payload.constructor.name === 'Blob') {
      this.emit('binary', payload)
    } else {
      const incoming = WSClientBase.parsePayload(payload)
      if (incoming.type === 'event') {
        this.emit(incoming.event, incoming.data)
      } else if (incoming.type === 'returnData') {
        if (this._event_return[incoming.id]) {
          this._event_return[incoming.id](incoming)
        }
      } else {
        this.emit(incoming.type, incoming.data)
      }
    }
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

  removeAllListeners (event) {
    if (this.internalEvents.includes(event)) {
      super.removeAllListeners(event)
    } else {
      super.removeAllListeners(eventId(event))
    }
  }

  close () {
    this.client.close()
  }

  send (event, data, waitReturn = false) {
    return new Promise((resolve, reject) => {
      let replyId
      if (waitReturn) {
        replyId = this._return_id_counter++
        if (this._return_id_counter >> 16) {
          this._return_id_counter = 0
        }
      }
      this.client.send(WSClientBase.getPayload({ event, data, replyId }, 'event'))
      if (waitReturn) {
        const timeOut = setTimeout(() => {
          reject(new Error('Response timeout.'))
          delete this._event_return[replyId]
        }, this.options.replyTimeout || 5000)
        const getData = (payload) => {
          clearTimeout(timeOut)
          delete this._event_return[replyId]
          resolve(payload.data)
        }
        this._event_return[replyId] = getData
      } else {
        resolve()
      }
    })
  }

  sendMessage (data) {
    this.client.send(WSClientBase.getPayload(data))
  }

  sendBinary (data) {
    if (data.constructor.name !== 'ArrayBuffer') {
      throw new Error('Binary data must be ArrayBuffer')
    }
    this.client.send(data)
  }
}

module.exports = WSClientBase
