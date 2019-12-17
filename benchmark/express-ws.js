const express = require('express')
const fWS_protocol = require('../server/ws-protocol/fast-ws')

const app = express()
require('express-ws')(app)

app.ws('/echo', (ws, req) => {
  ws.on('message', data => {
    ws.send(data)
  })
})

app.ws('/fws', (ws, req) => {
  ws.getBufferedAmount = () => 0
  const client = new fWS_protocol(ws, req)
  ws.on('message', data => {
    client.incomingPacket(data, false)
  })
  client.on('echo', ({ data, reply }) => {
    reply(data)
  })
})

app.get('/hello/:name', (req, res) => {
  res.end(`Hello ${req.params.name}`)
})

app.use('/', express.static('static'))

app.listen(3000, () => {
  console.log('Listen on 3000')
})
