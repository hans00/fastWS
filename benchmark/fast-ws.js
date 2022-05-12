const fastWS = require('fast-ws-server')

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

app.serve('/')

console.time('STARTUP')

app.listen(3000, () => {
  console.timeEnd('STARTUP')
  console.log('Listen on 3000')
})
