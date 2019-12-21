# Server

## Usage

```js
const fastWS = require('fast-ws')
const app = new fastWS({...options})

app.any('/*', (req, res) => {
  res.end('')
})

app.listen(host, port, () => {
  console.log(`Listen on ${host}:${port}`)
})
```

## Directory Structure

> `@` is your execute dir (`process.cwd()`)

- `@/stctic/*` => Static files
- `@/template/*` => Template files

## Options

```js
{
  // POST body size limit
  bodySize: '4mb', // Default, size string
  bodySize: 102400, // size number (bytes)
  bodySize: 0, // Unlimited
  // setup HTTPS server
  ssl: {
    cert_file_name: '/path/to/cert.pem', // Required
    key_file_name: '/path/to/key.pem', // Required
    ca_file_name: '/path/to/ca.pem',
    dh_param_file_name: '/path/to/dh_param.pem', // Recommend, SSLLabs Test will grade A
    passphrase: 'Your cert passphrase, not set if not need',
    ssl_prefer_low_memory_usage: true or false // true if prefer low memory
  },
  // Cache
  cache: 'module-name', // e.g. `lru-cache`
  cache: Object, // Construct you preferred cache module (must have get, set and has)
  cache: false, // Default, disable cache
  // Template Render
  templateRender: Function // Pass you preferred template engine render function
}
```

## Internal Render Function

### Usage

```js
render('Hello ${name}', { name: 'World' }) // Hello World
```

### Escape Data

```js
// Quote data
`"${escapeVar(data, String)}"` // escape for string
`"${escapeVar(data, Number)}"` // escape for number
`"${escapeVar(data, Object)}"` // escape for object
`"${escapeVar(data, Array)}"` // escape for array
// HTML or XML
`"${escapeHTML(data, String)}"`
// URL encode
`"${escape(data)}"`
```

## Methods

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
- `any(path, (req: Request, res: Response) => { ... })`

[Request Object](Request.md)

[Response Object](Response.md)

```js
app.post('/path', async (req, res) => {
  res.json(await req.body)
})

app.get('/hello/:param', (req, res, { param }) => {
  res.end('Hello ' + param)
})

app.get('/*', (req, res) => {
  res.end(req.url)
})
```

## Serve static file

```js
// Serve all file (use `req.url` to serve)
app.serve('/*')
// specify target path (in @/static/)
app.serve('/test', { targetPath: 'special-file.html' })
// Disable cache-control
app.serve('/sw.js', { cache: false })
// Setup cache-control by string
app.serve('/*', { cache: 'max-age=86400' })
// Setup cache-control by object
app.serve('/*', {
  cache: {
    public: false,
    private: false,
    'max-age': 86400,
    // ... Other more
  }
})
```

[Detail of Cache-Control](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control)

## WebSocket

[WSClient Object](WSClient.md)

```js
app.ws(
  // Path
  '/path',
  // Callback
  (ws: WSClient) => {
    ws.send('Hello')
    ws.close()
  },
  // Options (not required)
  {
    /*== Protocol ==*/
    // Basic WebSocket protocol
    protocol: 'basic',
    // Echo WebSocket protocol
    protocol: 'echo',
    // (Default) This project implements WebSocket protocol
    protocol: 'fast-ws',
    // Custom protocol object (must extends `fast-ws/server/ws-protocol/basic`)
    protocol: Object,

    /*== Protocol Options : basic ==*/
    protocolOptions: {
      // Parse message (default)
      parser: {
        parse: (payload) => payload,
        stringify: (payload) => payload
      },
      // Parse message using JSON
      parser: JSON,
      // Or you can create wour own parser
    },

    /*== Protocol Options : fast-ws ==*/
    protocolOptions: {
      // parser options, serialize to BSON
      parserOptions: {
        serialize: (val) => BSON.serialize(val, false, true, false),
        deserialize: BSON.deserialize
      },
      // Detail see: https://github.com/inikulin/replicator#readme
    },

    /*== uWS options ==*/
    // Compression
    compression: 'default', // equal shared
    compression: 'disable', // disable compression
    compression: 'shared',
    compression: 'dedicated',
    // Idle timeout (sec)
    idleTimeout: 300, // Default
    // Max payload length (bytes)
    maxPayloadLength: 4096 // Default
  }
)
```

## Start Server

```js
// port only (listen on all ip)
app.listen(3000)
// port with callback (listen on all ip)
app.listen(3000, () => {
  console.log('Listen on 3000')
})
// host and port (accept v4 and v6 IP address)
app.listen('127.0.0.1', 3000)
// host and port and callback
app.listen('[::1]', 3000, () => {
  console.log('Listen on 127.0.0.1:3000')
})
```
