fastWS
=====

[![npm](https://img.shields.io/npm/v/fast-ws.svg)](https://www.npmjs.com/package/fast-ws)
[![Node version](https://img.shields.io/node/v/fast-ws.svg)](https://www.npmjs.com/package/fast-ws)
[![Travis](https://img.shields.io/travis/hans00/fastWS.svg)](https://travis-ci.org/hans00/fastWS)

Simple Node.js server based on uWebSockets

---

# Usage

`npm i fast-ws`

```js
const fastWS = require('fast-ws')

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
- [ ] Response from pipe stream

# Recommends

> The HTTP response performance of uWebSockets seems slow.
> But WebSocket performance is very fast.

# Options

- `verbose`

> Verbose log message

- `ssl`

> SSL cert

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

- `serve(path[, target path])`

> Serve static file(s)
> The file must in `/static`

- `ws(path, ws => { /**/ }[, options])`

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

- `cork( callback )`

> Mapping to uWebSockets `experimental_cork`

- `status(code number)`

> HTTP status

- `staticFile(file path[, cache object])`

> Send static file.

- `send(data)`

> Send data

- `json(data)`

> Send JSON format

- `set(key, value)`

> Set header

- `location(path or url[, status])`

> Redirect, default 302

- `end(data[, content type])`

> End response, content type default `text/plain`.

## `WSClient`

- `remoteAddress`

> Remote IP address. (Full length)

- `requestHeaders`

> Request headers

- `on(event name, callback)`

> Listen on builtin event or custom event.
> Builtin events: `disconnect`, `drained`, `message`, `binary`, `ping`, `pong`

- `off(event name, callback)`

> Remove listener

- `removeAllListeners(event name)`

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
