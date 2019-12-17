# WSClient

## Supported protocols

- basic
- echo
- fast-ws

## basic

### `remoteAddress`

> Remote IP address. (Full length)

### `requestHeaders`

> Request headers

### `on(event_name, callback)`

> Listen on builtin event.
> Builtin events: `disconnect`, `drained`, `message`, `binary`

### `off(event_name, callback)`

> Remove listener

### `removeAllListeners(event_name)`

> Remove all listener

### `join(channel)`

> Join channel

### `quit(channel)`

> Quit channel

### `send(message[, compress=true])`

> Send message to client

### `sendBinary(data[, compress=true])`

> Send binary to client

### `broadcast(channel, message[, compress=true])`

> Broadcast message to channel

### `broadcastBinary(data[, compress=true])`

> Broadcast binary to channel

### `close()`

> Close connection


## fast-ws

> Extends basic. But support event, reply and object serialize.

### `on(event_name, callback)`

> Listen on builtin event or **custom event**.

```js
ws.on('hello', ({ data, reply }: WSEvent) => {
  reply(`Hello ${data}`)
})
```

### `send(event, data[, compress=true])`

> Send event to client

### `sendMessage(data[, compress=true])`

> Send message to client

### `sendBinary(data[, compress=true])`

> Send binary to client

### `broadcast(channel, event, data[, compress=true])`

> Broadcast event to channel

### `broadcastMessage(channel, data[, compress=true])`

> Broadcast message to channel

### `broadcastBinary(channel, data[, compress=true])`

> Broadcast binary to channel

### `WSEvent`

#### `type`

> Message data type (`event` or `message`)

#### `data`

> Data send from client

#### `name`

> Event name

#### `reply(data)`

> Reply data.
> If client don't want reply, this function will not work.
> And only custom event can reply.
> Node: Reply ID could timeout, you can set longer reply timeout at client.
