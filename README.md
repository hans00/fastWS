fastWS
=====

[![npm](https://img.shields.io/npm/v/fast-ws.svg)](https://www.npmjs.com/package/fast-ws)
[![Node version](https://img.shields.io/node/v/fast-ws.svg)](https://www.npmjs.com/package/fast-ws)
[![GitHub Action](https://github.com/hans00/fastWS/workflows/publish%20package/badge.svg)](https://github.com/hans00/fastWS)

Simple Node.js server based on uWebSockets

---

# Usage

`npm i fast-ws`

```js
const fastWS = require('fast-ws/server')

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
    '<head><title>Hello</title></head>'
    '<body><h1>Hello, ${escapeHTML(name)}</h1></body>',
    '</html>'
  ].join(''), params)
})

app.get('/hello/:name/alert', async (req, res, params) => {
  res.render([
    '<html>',
    '<head><title>Hello</title></head>'
    '<body><script>alert("Hello, ${escapeVar(name, String)}")</script></body>',
    '</html>'
  ].join(''), params)
})

app.serve('/*') // auto serve project /static/*

app.listen(3000, err => {
  if (!err) {
    console.log('Listen on 3000')
  }
})
```

# Feature

- [x] Simple to use
- [x] Auto serve static file and cache.
- [x] WebSocket reply event
- [x] Auto reload SSL when signal(1)
- [x] Auto graceful shutdown
- [x] Auto parse message
- [x] URL params to object
- [x] Can use built-in template engine or custom template engine
- [ ] Response from pipe stream

# Recommends

> The HTTP response performance of uWebSockets seems slow.
> But WebSocket performance is very fast.

# Options

- `verbose`

> Verbose log message

- `ssl`

> SSL cert
```js
{
  cert_file_name: 'path/to/cert',
  key_file_name: 'path/to/key',
}
```

- `cache`

> LRU cache option or any other cache object.
> Note: cache object must have `get`, `has` and `set` methods.

- `templateRender`

> Pass template render function, or default is base on eval and template literals.

```js
// default render function
function render (_template, _data) {
  /* eslint no-unused-vars: 0 */
  function escapeVar (data, type) { // type = [ String, Number, Object, Array ]
    if (type) {
      if (type === String) {
        return data.toString().replace(/(['"\\/])/g, '\\$1')
      } else if (type === Number) {
        return Number(data)
      } else {
        return JSON.stringify(data).replace(/\//g, '\\/')
      }
    } else {
      throw new ServerError({
        code: 'SERVER_RENDER_ERROR',
        message: 'The type of data must be set.'
      })
    }
  }
  function escapeHTML (data) {
    return data.toString().replace(/[\u00A0-\u9999<>&"']/gim, (i) => `&#${i.charCodeAt(0)};`)
  }
  /* eslint no-eval: 0 */
  return eval(
    'const ' +
    Object.keys(_data).map(key => `${key} = ${JSON.stringify(_data[key])}`).join() + ';' +
    '(`' + _template.toString().replace(/([`\\])/g, '\\$1') + '`)'
  )
}
```

# Methods

## `fastWS`

- `get`
- `post`
- `patch`
- `del`
- `delete`
- `put`
- `head`
- `trace`
- `connect`
- `options`
- `any(path, (req, res) => { /* ... */ })`

> Basic HTTP methods

- `serve(path[, options])`

> Serve static file(s)
> The file must in `/static`
```js
options = {
  targetPath: 'some/path/in/static', // If real path is not equal to request path.
  encoding: 'utf8', // The file encoding
  cache: 'max-age=86400', // cache control string
  cache: { public: true, 'max-age': 31536000 }, // cache control as object
  cache: null, // Turn off cache control
}
```

- `ws(path, ws => { /* your code */ }[, options])`

> WebSocket
```js
options = {
  compression: 'default', // 'disable' / 'default' == 'shared' / 'dedicated'
  idleTimeout: 300, // (sec)
  maxPayloadLength: 4096
}
```

- `broadcast(channel, event, data[, compress=true])`

> Broadcast event to WebSocket channel

- `broadcastMessage(channel, message[, compress=true])`

> Broadcast message to WebSocket channel

- `broadcastBinary(channel, message[, compress=true])`

> Broadcast binary to WebSocket channel

## `Request`

- `remoteAddress`

> Remote IP address. (Full length)

- `headers`

> Get all header.

- `header(key)`

> Get specify header.

- `body(limit=4096)`

> Get body. Default limit 4MB, `0` is unlimit.
> Only `POST`, `PUT`, `PATCH` can receive body.
> Auto parse JSON data, but no parse form data.

- `url`

> Request URL.

- `method`

> Get method all uppercase.

- `query`

> Get query string

- `params(index)`

> Get params in URL

## `Response`

- `cork(callback)`

> Mapping to uWebSockets `experimental_cork`

- `status(code_number)`

> HTTP status

- `staticFile(file_path[, encoding='utf8', cache_control='max-age=86400'])`

> Send static file.
```js
cache_control = 'max-age=86400', // cache control string
cache_control = { public: true, 'max-age': 31536000 }, // cache control as object
cache_control = null // Turn off Cache-Control
```

- `send(data)`

> Send data

- `json(data)`

> Send JSON format

- `set(key, value)`

> Set header

- `location(path_or_url[, status])`

> Redirect, default 302

- `end(data[, content_type])`

> End response, content type default `text/plain`.

- `render(content, data)`

> Render data into content and send.

- `renderFile(file_path, data[, encoding='utf8'])`

> Render data into file content and send.
> The content of file will be cached.
> And file must in `template`

## `WSClient`

- `remoteAddress`

> Remote IP address. (Full length)

- `requestHeaders`

> Request headers

- `on(event_name, callback)`

> Listen on builtin event or custom event.
> Builtin events: `disconnect`, `drained`, `message`, `binary`, `ping`, `pong`

- `off(event_name, callback)`

> Remove listener

- `removeAllListeners(event_name)`

> Remove all listener

- `join(channel)`

> Join channel

- `quit(channel)`

> Quit channel

- `send(event, data[, compress=true])`

> Send event to client

- `sendMessage(data[, compress=true])`

> Send message to client

- `sendBinary(data[, compress=true])`

> Send binary to client

- `broadcast(channel, event, data[, compress=true])`

> Broadcast event to channel

- `broadcastMessage(channel, data[, compress=true])`

> Broadcast message to channel

- `broadcastBinary(channel, data[, compress=true])`

> Broadcast binary to channel

- `close()`

> Close connection

### WS Event

- `type`

> Message data type

- `data`

> Data send from client

- `name`

> Event name

- `reply(data)`

> Reply data.
> If client don't want reply, this function will not work.
> And only custom event can reply.
> Node: Reply ID is rotating, if too late the client may cannot receive your reply.
