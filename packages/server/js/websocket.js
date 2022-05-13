const Response = require('./response')

class WebSocketResponse extends Response {
  constructor(connection, socket) {
    super(connection)
    this.socket = socket
  }

  static create(connection, socket) {
    return new WebSocketResponse(connection, socket)
  }

  upgrade (upgradeProtocol) {
    if (upgradeProtocol) {
      if (this.connection.headers['sec-websocket-protocol'].includes(upgradeProtocol)) return
      this.connection.upgrade(
        {
          client: this.socket
        },
        this.connection.headers['sec-websocket-key'],
        upgradeProtocol,
        this.connection.headers['sec-websocket-extensions']
      )
    } else {
      this.connection.upgrade(
        {
          client: this.socket
        },
        this.connection.headers['sec-websocket-key'],
        this.connection.headers['sec-websocket-protocol'],
        this.connection.headers['sec-websocket-extensions']
      )
    }
    this._upgraded = true
  }
}

module.exports = WebSocketResponse
