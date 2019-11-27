const WebSocket = require('ws')
const { EventEmitter } = require('events')

class WSClient extends EventEmitter {
  constructor (endpoint, options = {}) {
    super()
    this.options = options
    this.connectState = 0
    this.client = new WebSocket(endpoint)
    this.client.on('error', error => {
      this.emit('error', error)
    })
    this.client.on('open', () => {
      this.connectState = 1
      this._heartbeat = setInterval(() => {
        this.ping()
      }, options.pingInterval || 30000)
      this.emit('connected')
    })
    this.client.on('close', () => {
      this.connectState = -1
      clearInterval(this._heartbeat)
      this.emit('disconnected')
    })
    this.client.on('message', (message) => {
      if (message === '\x00') {
        this.connectState = 2
        this.emit('ready')
      } else {
        this.onMessage(message)
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
    this._return_id_counter = 0
    this._event_return = {}
  }

  static getPayload (data, type = '') {
    if (type === 'event') {
      if (data.replyId === undefined || data.replyId === null) {
        data.replyId = ''
      }
      return 'e:' + data.event + ';' + data.replyId + ';' + WSClient.getPayload(data.data)
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

  static parsePayload (payload) {
    const type = payload[0]; const content = payload.slice(2)
    if (type === 's') {
      return { type: 'string', data: content }
    } else if (type === 'b') {
      return { type: 'boolean', data: content === '1' }
    } else if (type === 'n') {
      return { type: 'number', data: Number(content) }
    } else if (type === 'o') {
      return { type: 'object', data: JSON.parse(content) }
    } else if (type === 'R') {
      const splitIndex = content.indexOf(';')
      const id = Number(content.slice(0, splitIndex)); const data = content.slice(splitIndex + 1)
      return { type: 'returnData', id, data: WSClient.parsePayload(data).data }
    } else if (type === 'e') {
      const splitIndex = content.indexOf(';')
      const event = content.slice(0, splitIndex); const data = content.slice(splitIndex + 1)
      return { type: 'event', event, data: WSClient.parsePayload(data).data }
    } else {
      return { type: 'unknown', data: '' }
    }
  }

  ping () {
    this.client.ping(new Date().valueOf())
  }

  onMessage (message) {
    if (message.constructor.name === 'ArrayBuffer') {
      this.emit('binary', message)
    } else {
      const incoming = WSClient.parsePayload(message)
      if (incoming.type === 'event') {
        this.emit(incoming.event, incoming.data)
      } else if (incoming.type === 'returnData') {
        if (this._event_return[incoming.id]) {
          this._event_return[incoming.id](incoming)
        }
      } else {
        this.emit('message', incoming.data)
      }
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
      this.client.send(WSClient.getPayload({ event, data, replyId }, 'event'))
      if (waitReturn) {
        const timeOut = setTimeout(() => {
          reject(new Error({ code: 'WAIT_REPLY_TIMEOUT', message: 'Response timeout.' }))
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
    this.client.send(WSClient.getPayload(data))
  }

  sendBinary (data) {
    if (data.constructor.name !== 'ArrayBuffer') {
      throw new Error('Binary data must be ArrayBuffer')
    }
    this.client.send(data)
  }
}

module.exports = WSClient
