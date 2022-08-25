const path = require('path')
const fs = require('fs')
const http = require('http')
const Stream = require('stream')

const delay = (ms) => new Promise(r => setTimeout(r, ms))

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

  app.ws('/drain', ws => {
    const count = 80000
    let isDraining = false
    let index = -1
    ws.on('open', async () => {
      while (!isDraining)
        await ws.send(JSON.stringify(++index))
      ws.send(JSON.stringify({ index: index + 10 }))
      for (let i=1; i <= 10; ++i)
        ws.send(JSON.stringify(index+i))
    })
    ws.on('drained', () => {
      isDraining = true
    })
  })

  app.get('/get', (req, res) => {
    res.json(req.query)
  })

  app.post('/header-value', async (req, res) => {
    const data = await req.body
    res.setHeader('Test', data).end()
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
    const file = path.resolve('static/index.html')
    res.pipeFrom(fs.createReadStream(file))
  })

  app.get('/stream/http', (req, res) => {
    http.get('http://google.com/', response => {
      response.pipe(res)
    })
  })

  app.get('/sse', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.writeHead()
    for (let i=0; i < 10; i++) {
      res.write(`${i}`)
    }
    res.end()
  })

  async function * gen () {
    for (let i = 0; i < 100; i++) {
      yield 'A'
      await delay(2)
    }
  }

  app.get('/stream/', (req, res) => {
    res.connection.onAborted(() => console.log('Client aborted'))
    Stream.Readable.from(gen()).pipe(res)
  })

  app.post('/stream/body', (req, res) => {
    req.bodyStream.pipe(res)
  })

  app.post('/stream/body-later-1', (req, res) => {
    setTimeout(() => req.bodyStream.pipe(res), 100)
  })

  app.post('/stream/body-later-2', (req, res) => {
    const stream = req.bodyStream
    setTimeout(() => stream.pipe(res), 100)
  })

  app.get('/stream/error', (req, res) => {
    const stream = new Stream.Readable({
      read: () => '',
    })
    setTimeout(() => stream.emit('error', new Error('OOPS')))
    stream
      .pipe(res)
      .on('error', e => {
        res.status(500).end(e.message)
      })
  })

  app.get('/address', (req, res) => {
    res.json({
      client: req.ip,
      realIp: req.realIp,
      ips: req.ips,
    })
  })

  app.head('/head', (req, res) => {
    res.set('Test', 'A').end()
  })

  app.serve('/*')

  return app

}
