const io = require('socket.io')(3000)

console.time('STARTUP')

io.on('connection', ws => {
  ws.on('echo', (message, reply) => {
    reply(message)
  })
})

console.timeEnd('STARTUP')
