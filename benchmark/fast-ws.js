const fastWS = require('fast-ws-server')
const { Readable } = require('stream')

const app = new fastWS()

app.ws('/echo', ws => null, {
  protocol: 'echo'
})

app.ws('/fws', (ws) => {
  ws.on('echo', (e) => {
    e.reply(e.data)
  })
}, {
  protocol: 'fast-ws'
})

app.get('/hello/:name', (req, res, params) => {
  const { name } = params
  res.end(`Hello ${name}`)
})

const bufString = Buffer.alloc(10240).fill(0x20).toString()

app.get('/stream', (req, res) => {
  const stream = Readable.from(bufString)
  stream.pipe(res)
})

app.post('/stream', (req, res) => {
  req.bodyStream.pipe(res)
})

app.post('/stream/send', async (req, res) => {
  res.send(await req.body)
})

app.serve('/')

console.time('STARTUP')

app.listen(3000, () => {
  console.timeEnd('STARTUP')
  console.log('Listen on 3000')
})
