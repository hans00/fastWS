const path = require('path')
const fs = require('fs')
const http = require('http')

module.exports = function (app) {

  app.ws('/fast-ws', ws => {
    ws.on('echo', ({ reply, data }) => {
      reply(data)
    })
    ws.on('join', ({ data: channel }) => {
      ws.join(channel)
      ws.channel = channel
    })
    ws.on('message', message => {
      if (ws.channel) {
        ws.emitToChannel(ws.channel, 'someone said', message)
      }
    })
  }, {
    protocol: 'fast-ws'
  })

  app.ws('/echo', ws => null, { protocol: 'echo' })

  app.ws(
    '/ws-upgrade',
    (req, res) => res.upgrade(),
    ws => ws.on('open', () => ws.send('UPGRADED'))
  )

  app.get('/get', (req, res) => {
    res.json(req.query)
  })

  app.post('/post', async (req, res) => {
    const data = await req.body
    res.json(data)
  })

  app.post('/upload', async (req, res) => {
    const [file] = await req.body
    res.json({ size: file.data.length })
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

  app.get('/stream/file', (req, res) => {
    fs.createReadStream(path.resolve('static/index.html')).pipe(res)
  })

  app.get('/stream/http', (req, res) => {
    http.get('http://google.com/', response => {
      response.pipe(res)
    })
  })

  app.get('/address', (req, res) => {
    res.end(req.ip)
  })

  app.serve('/*')

  return app

}
