#!/bin/sh
":" //# comment; exec /usr/bin/env node --experimental-worker "$0" "$@"
const os = require('os')
const { Worker, isMainThread, threadId, parentPort } = require('worker_threads')


function parseArgs(options) {
  const args = process.argv.slice(2)
  const constRequired = options.filter(x => !x.short && x.required)
  const tagged = options.filter(x => x.short)
  const allRequired = options.filter(x => x.required)
  let argData = {}
  let arg
  while (arg = args.shift()) {
    let argObj = null
    if (arg === '-h' || arg === '--help') {
      console.log(`Usage: ${process.argv[1]} [options] ${constRequired.map(x => `<${x.name}>`).join(' ')}`)
      console.log('\nOptions:')
      const maxLen = tagged.reduce((max, item) => Math.max(max, item.name.length + item.short.length + 12), 10)
      tagged.forEach(item => {
        const prepend = (item.required ? '(required' + (item.default !== undefined ? `, default=${item.default}` : '') + ') ' : '')
        if (item.type === Boolean) {
          console.log('  %s: %s', (`--${item.name}, -${item.short}`).padEnd(maxLen), prepend + item.description)
        } else if (item.type === Number) {
          console.log('  %s: %s', (`--${item.name}, -${item.short} <num>`).padEnd(maxLen), prepend + item.description)
        } else if (item.type === String) {
          console.log('  %s: %s', (`--${item.name}, -${item.short} <str>`).padEnd(maxLen), prepend + item.description)
        }
      })
      console.log('  %s: %s', (`--help, -h`).padEnd(maxLen), 'This message.')
      process.exit(0)
    }
    if (arg.startsWith('--')) {
      argObj = tagged.find(x => x.name === arg.slice(2))
    } else if (arg.startsWith('-')) {
      argObj = tagged.find(x => x.short === arg.slice(1))
    } else {
      argObj = constRequired.shift()
    }
    if (!argObj) {
      throw new Error(`Unknown options (${arg})`)
    } else {
      if (argObj.type === Boolean) {
        argData[argObj.name] = true
      } else if (argObj.type === Number) {
        const argVal = arg.startsWith('-') ? args.shift() : arg
        if (isNaN(argVal)) {
          throw new Error(`Is not number (${argVal})`)
        } else {
          if (argObj.min && argObj.min > Number(argVal)) {
            throw new Error(`Min is ${argObj.min}`)
          } else if (argObj.max && argObj.max < Number(argVal)) {
            throw new Error(`Max is ${argObj.max}`)
          }
          argData[argObj.name] = Number(argVal)
        }
      } else if (argObj.type === String) {
        const argVal = arg.startsWith('-') ? args.shift() : arg
        if (argObj.test) {
          if (!argObj.test.test(argVal)) {
            throw new Error(`String format invalid`)
          }
        }
        argData[argObj.name] = argVal
      }
    }
  }
  allRequired.forEach(item => {
    if (!argData[item.name]) {
      if (!item.default) {
        throw new Error(`The option ${item.name} is required.`)
      }  else {
        argData[item.name] = item.default
      }
    }
  })
  return argData
}

RegExp.escape = (s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

function worker(options) {
  const data = '0'.repeat(options.size)
  const payload = options.payload.replace('{DATA}', data)
  const rampUp = options['ramp-up']
  const messageCount = options.counts
  const WS = require(options.module === 'fast-ws' ? '../client' : options.module)
  const timeout = options.timeout
  const target = options.target
  const result = {
    conn: {
      success: [],
      failed: [],
    },
    echo: {
      success: [],
      failed: [],
    },
  }
  const clients = []
  const echo_event = options.module === 'ws' ? 'message' : 'echo'
  const connect_event = options.module === 'ws' ? 'open' : 'connect'
  const sender = setInterval(() => {
    let countDown = rampUp
    while (countDown--) {
      const connStart = new Date()
      let client
      if (options.module === 'ws') {
        client = new WS(target, { handshakeTimeout: timeout })
      } else if (options.module === 'socket.io-client') {
        client = WS(target, { timeout, transport: ['websocket'] })
      } else if (options.module === 'fast-ws') {
        client = new WS(target, { handshakeTimeout: timeout, replyTimeout: timeout })
      }
      clients.push(client)
      const send = () => {
        return new Promise(async (resolve, reject) => {
          if (options.module === 'ws') {
            client.on(echo_event, message => {
              if (message.includes(data)) {
                client.removeAllListeners(echo_event)
                resolve()
              }
            })
            client.send(payload)
            setTimeout(() => {
              client.removeAllListeners(echo_event)
              reject()
            }, timeout)
          } else if (options.module === 'socket.io-client') {
            client.emit(echo_event, payload, message => {
              if (message.includes(data)) {
                resolve()
              } else {
                reject()
              }
            })
          } else if (options.module === 'fast-ws') {
            try {
              const message = await client.send(echo_event, payload, true)
              if (message.includes(data)) {
                resolve()
              } else {
                reject()
              }
            } catch {
              reject()
            }
          }
        })
      }
      client.on('error', error => {
        options.verbose && console.log(error.toString())
        result.conn.failed.push(new Date() - connStart)
      })
      client.on(connect_event, async () => {
        result.conn.success.push(new Date() - connStart)
        let countDown = messageCount
        while (countDown--) {
          const sendStart = new Date()
          try {
            await send()
            result.echo.success.push(new Date() - sendStart)
          } catch {
            result.echo.failed.push(new Date() - sendStart)
          }
        }
        client.close()
      })
    }
  }, 1000)
  setTimeout(() => {
    clearInterval(sender)
    clients.forEach(client => {
      if (options.module === 'ws') {
        if (client.readyState !== client.CLOSED) {
          client.close()
        }
      } else if (options.module === 'socket.io-client') {
        if (client.readyState === 'open') {
          client.close()
        }
      } else if (options.module === 'fast-ws') {
        if (client.readyState !== -1) {
          client.close()
        }
      }
    })
    parentPort.postMessage(result)
  }, (options.duration + 1) * 1000)
}

function sum(values) {
  return values.reduce((sum, value) => sum + value, 0)
}

function min(values) {
  return values.reduce((min, value) => Math.min(min, value), Infinity)
}

function max(values) {
  return values.reduce((max, value) => Math.max(max, value), -Infinity)
}

function mean(values) {
  return sum(values) / values.length
}

function median(values) {
  if (values.length === 0) return NaN

  values.sort((a,b) => a - b)

  const half = Math.floor(values.length / 2)

  if (values.length % 2) {
    return values[half]
  }

  return (values[half - 1] + values[half]) / 2.0
}

function stddev(values){
  const avg = mean(values)

  const squareDiffs = values.map(value => {
    const diff = value - avg
    const sqrDiff = diff * diff
    return sqrDiff
  })

  return Math.sqrt(mean(squareDiffs))
}

if (isMainThread) {
  const args = parseArgs([
    {
      name: 'duration',
      short: 'd',
      type: Number,
      required: true,
      default: 10,
      min: 1,
      description: 'Benchmark duration (s).',
    },
    {
      name: 'ramp-up',
      short: 'r',
      type: Number,
      required: true,
      default: 10,
      min: 1,
      description: 'Ramp-up period (count/s).',
    },
    {
      name: 'counts',
      short: 'c',
      type: Number,
      required: true,
      default: 100,
      min: 1,
      description: 'Messages per connection.',
    },
    {
      name: 'threads',
      short: 'T',
      type: Number,
      default: os.cpus().length,
      min: 1,
      required: true,
      description: 'Total number of threads to use.'
    },
    {
      name: 'payload',
      short: 'p',
      type: String,
      required: true,
      default: '{DATA}',
      description: 'Message payload.',
    },
    {
      name: 'timeout',
      short: 't',
      type: Number,
      required: true,
      default: 1000,
      min: 1,
      description: 'Connection and echo timeout (ms).',
    },
    {
      name: 'size',
      short: 's',
      type: Number,
      required: true,
      default: 1024,
      description: 'Data size (bytes).',
    },
    {
      name: 'module',
      short: 'm',
      type: String,
      required: true,
      default: 'ws',
      test: /^(ws|socket\.io-client|fast-ws)$/,
      description: 'WebSocket module to use.',
    },
    {
      name: 'verbose',
      short: 'v',
      type: Boolean,
      description: 'Verbose output connection error.',
    },
    {
      name: 'target',
      type: String,
      required: true,
      test: /^wss?\:\/\/([\.-\w]+)(:\d{1,5})?(\/.*)?$/
    },
  ])
  console.log(`Start ${args.threads} threads, duration ${args.duration}s`)
  // create workers
  const workers = Array.from(Array(args.threads).keys()).map(() => new Worker(__filename))
  // start workers
  const results = []
  workers.forEach(worker => {
    worker.postMessage(args)
    worker.once('message', result => {
      results.push(result)
      if (results.length === args.threads) {
        const merged = results.reduce((total, result) => ({
          conn: {
            success: total.conn.success.concat(result.conn.success),
            failed: total.conn.failed.concat(result.conn.failed),
          },
          echo: {
            success: total.echo.success.concat(result.echo.success),
            failed: total.echo.failed.concat(result.echo.failed),
          },
        }), { conn: { success: [], failed: [] }, echo: { success: [], failed: [] } })
        console.log('')
        console.log('Connection Latency:')
        console.log('  Max:', max(merged.conn.success), 'ms')
        console.log('  Min:', min(merged.conn.success), 'ms')
        console.log('  Mean:', mean(merged.conn.success), 'ms')
        console.log('  Median:', median(merged.conn.success), 'ms')
        console.log('  StdDev:', stddev(merged.conn.success), 'ms')
        console.log('')
        console.log('Echo Latency:')
        console.log('  Max:', max(merged.echo.success), 'ms')
        console.log('  Min:', min(merged.echo.success), 'ms')
        console.log('  Mean:', mean(merged.echo.success), 'ms')
        console.log('  Median:', median(merged.echo.success), 'ms')
        console.log('  StdDev:', stddev(merged.echo.success), 'ms')
        console.log('')
        console.log('Connection/sec:', merged.conn.success.length / args.duration)
        console.log('Echo/sec:', merged.echo.success.length / args.duration)
        console.log('Transfer/sec:', merged.echo.success.length * (args.size - 6 + args.payload.length) / args.duration / 1024 / 1024, 'MB')
        process.exit(0)
      }
    })
  })
} else {
  parentPort.once('message', options => {
    worker(options)
  })
}
