const fastWS = require('fast-ws-server')

const app = new fastWS()

app.ws('/echo', ws => null, {
  protocol: 'echo'
})

app.ws('/fws', ws => {
  ws.on('echo', ({ data, reply }) => {
    reply(data)
  })
})

app.get('/hello/:name', (req, res, { name }) => {
  res.end(`Hello ${name}`)
})

app.serve('/')

app.listen(3000, () => {
  console.log('Listen on 3000')
})
