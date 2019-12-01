const http = require('http')
const WebSocket = require('ws')

const app = express()
const server = http.createServer(app)

const wss = new WebSocket.Server({ server, path: '/ws' })

wss.on('connection', ws => {
  ws.on('message', data => {
    ws.send(data)
  })
})

app.get('/hello/:name', (req, res) => {
  res.end(`Hello ${req.params.name}`)
})

app.use('/', express.static('static'))

server.listen(3000, () => {
  console.log('Listen on 3000')
})
