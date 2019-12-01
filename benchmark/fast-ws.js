const fastWS = require('fast-ws/server')

const app = new fastWS()

app.ws('/ws', ws => null, {
  protocol: 'echo'
})

app.get('/hello/:name', (req, res, { name }) => {
  res.end(`Hello ${name}`)
})

app.serve('/')

app.listen(3000, () => {
  console.log('Listen on 3000')
})
