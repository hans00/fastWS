fastWS
=====

[![GitHub Action](https://github.com/hans00/fastWS/workflows/build/badge.svg)](https://github.com/hans00/fastWS)
[![codecov](https://codecov.io/gh/hans00/fastWS/branch/master/graph/badge.svg?token=5P1YR45NCD)](https://codecov.io/gh/hans00/fastWS)

It's very fast Web Server Node.js server based on uWebSockets.

And very easy to use.

[Benchmark result](benchmark/README.md)

[Documents](docs/README.md)

[Server package](packages/server)

[Client package](packages/client)

Usage
---

`npm i fast-ws-client fast-ws-server`

### Server

```js
const fastWS = require('fast-ws-server')

const app = new fastWS({ /* options */ })

app.ws('/ws', ws => {
  console.log(`Connected ${ws.remoteAddress}`)

  ws.on('message', ({ data }) => {
    ws.sendMessage(data)
  })

  ws.on('echo', ({ reply, data }) => {
    reply(data)
  })
})

app.post('/post', async (req, res) => {
  const data = await req.body()
  res.json(data)
})

app.get('/hello/:name', async (req, res, params) => {
  res.render([
    '<html>',
    '<head><title>Hello</title></head>',
    '<body><h1>Hello, ${escapeHTML(name)}</h1></body>',
    '</html>'
  ].join(''), params)
})

app.get('/hello/:name/alert', async (req, res, params) => {
  res.render([
    '<html>',
    '<head><title>Hello</title></head>',
    '<body><script>alert("Hello, ${escapeVar(name, String)}")</script></body>',
    '</html>'
  ].join(''), params)
})

app.serve('/*') // auto serve project /static/*

app.listen(3000, () => {
  console.log('Listen on 3000')
})
```

### Client

```js
const Client = require('fast-ws-client')

const client = new Client('ws://server/fast-ws', options)

client.on('connect', () => {
  client.emit('event name', 'message')
})

client.on('event name', async () => {
  await client.emit('wait for remote', 'message', true)
})
```

Contributing
---

Follows [conventional commits](https://www.conventionalcommits.org/).

For example:

- `feat(Server): something` for server feature.

- `fix(Client): something` for client bug fix.
