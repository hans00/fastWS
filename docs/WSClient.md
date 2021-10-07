# WSClient

## Supported protocols

- basic
- echo
- fast-ws

## basic

### `connection`

> HTTP Connection

### `connection.remoteAddress`

> Remote IP address

### `upgrade([protocol = null])`

> Accept protocol upgrade

### `on(event_name, callback)`

> Listen on builtin event.
> Builtin events: `open`, `disconnect`, `drained`, `message`, `binary`

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

### `sendToChannel(channel, message[, compress=true])`

> Send message to channel

### `sendBinaryToChannel(data[, compress=true])`

> Send binary to channel

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

ws.on('message', (message) => {
  ws.sendMessage(message)
})
```

### `emit(event, data[, compress=true])`

> Emit event to client

### `emitToChannel(channel, event, data[, compress=true])`

> Emit event to channel

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
