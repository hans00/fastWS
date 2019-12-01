const basic = require('./basic')

class WSClient extends basic {
  constructor (session, request) {
    super(session, request)
    this.on('message', ({ data }) => {
      this.send(data)
    })
  }
}

module.exports = WSClient
