const fastWS = require('../server')

const app = new fastWS()

app.ws('/fast-ws', ws => {
  ws.on('echo', ({ reply, data }) => {
    reply(data)
  })
})

app.ws('/echo', ws => null, { protocol: 'echo' })

app.post('/post', async (req, res) => {
  const data = await req.body()
  res.json(data)
})

app.get('/param/:data', (req, res, { data }) => {
  res.end(data)
})

app.get('/xml/:message', (req, res, { message }) => {
  res.render('<message>${escapeHTML(message)}</message>', { message })
})

app.get('/js/:message', (req, res, { message }) => {
  res.render('response("${escapeVar(message, String)}")', { message })
})

app.serve('/*')

module.exports = function (port) {
  return new Promise((resolve, reject) => {
    app.listen(port, () => {
      console.log(`Listen on ${port}`)
      resolve()
    })
    setTimeout(() => reject(), 10)
  })
}
