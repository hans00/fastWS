const BasicProtocol = require('./basic')

class WSProtocol extends BasicProtocol {
  newClient (connection) {
    const client = new BasicProtocol.WSClient(connection)
    client.on('message', data => {
      client.send(data)
    })
    return client
  }
}

module.exports = WSProtocol
