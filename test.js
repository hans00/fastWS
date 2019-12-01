const fastWS = require('./server')

const app = new fastWS({ /* options */ })

app.ws('/ws', ws => {
  console.log(`Connected ${ws.remoteAddress}`)

  ws.on('message', ({ data }) => {
    ws.sendMessage(data)
  })

  ws.on('echo', async ({ reply, data }) => {
    console.log(data)
    reply(data)
  })
})

app.post('/post', async (req, res) => {
  const data = await req.body()
  res.json(data)
})

app.get('/ip', (req, res) => {
  res.send(req.remoteAddress)
})

app.get('/xml/:message', (req, res, { message }) => {
  res.render('<message>${escape(message)}</message>', { message })
})

app.serve('/*')

app.listen(3000, () => {
  console.log('Listen on 3000')
})
