const nanoexpress = require('nanoexpress')
const staticServe = require('@nanoexpress/middleware-static-serve/cjs')
const Protocol = require('fast-ws-server/ws/fast-ws')

const app = nanoexpress()

app.ws('/echo', async (req, res) => {
  res.on('connection', (ws) => {
    ws.on('message', data => {
      ws.send(data)
    })
  })
})

const fWS_protocol = new Protocol()
app.ws('/fws', async (req, res) => {
  res.on('connection', (ws) => {
    const client = fWS_protocol.newClient(req)
    client.onOpen(ws)
    ws.on('message', data => {
      client.incomingPacket(data, false)
    })
    client.on('echo', e => {
      e.reply(e.data)
    })
  })
})

app.get('/hello/:name', async (req, res) => {
  const { name } = req.params
  res.end(`Hello ${name}`)
})

app.post('/stream/send', (req, res) => {
  res.send(req.body)
})

app.use('/', staticServe('./static', { mode: 'live' }))

app.listen(3000)
