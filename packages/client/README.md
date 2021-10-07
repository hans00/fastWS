Client for fastWS
=====

[![npm](https://img.shields.io/npm/v/fast-ws-ckient.svg)](https://www.npmjs.com/package/fast-ws-client)
[![Node version](https://img.shields.io/node/v/fast-ws-client.svg)](https://www.npmjs.com/package/fast-ws-client)
[![GitHub Action](https://github.com/hans00/fastWS/workflows/build/badge.svg)](https://github.com/hans00/fastWS)

[Documents](../../docs/README.md)

---

# Usage

`npm i fast-ws-client`

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

# Feature

- [x] Protocol version check
- [x] Event driven message
- [x] Customizable serialize
- [x] Awaitable event response
- [ ] Compatible previous protocol version
