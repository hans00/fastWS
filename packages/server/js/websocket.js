const Response = require('./response')

class WebSocketResponse extends Response {
  constructor (connection, ctx) {
    super(connection)
    this.ctx = ctx
  }

  static create (connection, ctx) {
    return new WebSocketResponse(connection, ctx)
  }

  upgrade (protocol) {
    const {
      'sec-websocket-protocol': requestProtocol,
      'sec-websocket-key': key,
      'sec-websocket-extensions': extensions
    } = this.connection.headers
    if (protocol) {
      if (requestProtocol.includes(protocol)) return
      this.connection.upgrade(this.ctx, key, protocol, extensions)
    } else {
      this.connection.upgrade(this.ctx, key, requestProtocol, extensions)
    }
    this._upgraded = true
  }
}

module.exports = WebSocketResponse
