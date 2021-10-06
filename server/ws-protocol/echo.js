const BasicProtocol = require('./basic')

class WSProtocol extends BasicProtocol {
  newClient (socket) {
    const client = new BasicProtocol.WSClient(socket)
    client.on('message', data => {
      client.send(data)
    })
    return client
  }
}

module.exports = WSProtocol
