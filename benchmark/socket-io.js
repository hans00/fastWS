const io = require('socket.io')(3000)

io.on('connection', ws => {
  ws.on('echo', (message, reply) => {
    reply(message)
  })
})
