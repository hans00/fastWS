const BasicProtocol = require('./basic')

class WSProtocol extends BasicProtocol {
  newClient (socket, request) {
    const client = new BasicProtocol.WSClient(socket, request)
    client.on('message', data => {
      client.send(data)
    })
    return client
  }
}

module.exports = WSProtocol
