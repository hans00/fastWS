const express = require('express')
const Protocol = require('fast-ws-server/ws/fast-ws')
const { Readable } = require('stream')
const bodyParser = require('body-parser')

const app = express()
require('express-ws')(app)

app.ws('/echo', (ws, req) => {
  ws.on('message', data => {
    ws.send(data)
  })
})

const fWS_protocol = new Protocol()
app.ws('/fws', (ws, req) => {
  ws.getBufferedAmount = () => 0
  const client = fWS_protocol.newClient(req)
  client.onOpen(ws)
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

const bufString = Buffer.alloc(10240).fill(0x20).toString()

app.get('/stream', (req, res) => {
  const stream = Readable.from(bufString)
  stream.pipe(res)
})

app.post('/stream', (req, res) => {
  req.pipe(res)
})

app.post('/stream/send', bodyParser.text({ type: 'text/*', limit: '10MB' }), (req, res) => {
  res.send(req.body)
})

app.use('/', express.static('static'))

console.time('STARTUP')

app.listen(3000, () => {
  console.timeEnd('STARTUP')
  console.log('Listen on 3000')
})
