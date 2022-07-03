# Response

## `cork(callback)`

> Mapping to uWebSockets `experimental_cork`

## `status(code_number)`

> HTTP status

## `staticFile(file_path[, cache_control = 'max-age=86400'])`

> Send static file.
```js
cache_control = 'max-age=86400', // cache control string
cache_control = { public: true, 'max-age': 31536000 }, // cache control as object
cache_control = false // Turn off Cache-Control
```

## `send(data)`

> Send data

## `json(data)`

> Send JSON format

## `flushHeaders(key, value)`

> Flush headers

## `getHeaderNames()`

> Get header names

## `getHeader(key)`

> Get header

## `getHeaders()`

> Get headers

## `setHeader(key, value)`

> Set header

## `removeHeader(key)`

> Remove header

## `location(path_or_url[, status = 302])`

> Redirect, default 302

## `writeHead([status_code = 200, headers = {}])`

> Start write header.
> Default value is internal status

```js
res.status(404).setHeader('TEST', 'CONTENT').writeHead()
```

## `write(data[, callback])`

> Write body data. For (SSE)[https://developer.mozilla.org/docs/Web/API/Server-sent_events/Using_server-sent_events] or stream write.

## `end([data = '', content_type = null])`

> End response, content type default `null`.

## `render(content, data)`

> Render data into content and send.

## `renderFile(file_path, data)`

> Render data into file content and send.
> The content of file will be cached.
> And file must in `template`

## Pipe stream

```js
fs.createReadStream('/path/to/file').pipe(res)
```
