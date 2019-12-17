# fast-ws protocol client

```js
const Client = require('fast-ws/client')

const ws = new Client(
  ws_url, // 'ws://host:port/path' or 'wss://host:port/path'
  // options
  {
    // Ping Interval (not less then server `idleTimeout`)
    pingInterval: 30000, // Default (ms)
    // Reply Timeout (Event reply)
    replyTimeout: 5000, // Default (ms)
    ...// Others options for package 'ws'
  }
)
```

## Methods

### `on(event, listener)`

> Add single listener

### `off(event, listener)`

> Remove single listener

### `removeAllListeners(event)`

> Remove all listeners by event name

### `send(event, data)`

> Send custom event to server

### `sendMessage(data)`

> Send message to server

### `sendBinary(data)`

> Send binary to server

### `close()`

> Cllose WebSocket

## Events

### `open`

> 'ws' open event

### `error`

> Connection error

### `connect`

> Connect success

### `close`

> 'ws' close event

### `ping`

> 'ws' ping event

### `pong`

> Pong event with latency (ms)

```js
ws.on('pong', (latency) => {
  console.log(`Ping latency ${latency}`)
})
```

### `message`

> Normal message event

### `binary`

> Binary event

### Others

> Custom event send from server
