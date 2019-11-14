const WS = require('./client')

const ws = new WS('ws://localhost:3000/ws')

ws.on('pong', (latency) => console.log('pong', latency))

ws.on('ready', async () => {
  const res = await ws.send('echo', { 'Hello': 'World' }, true)
  console.log(res)
  ws.close()
})
