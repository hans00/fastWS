# Request

## `remoteAddress`

> Remote IP address. (v6 is full length)

## `headers`

> Get all headers.

## `getHeader(key)`

> Get specify header.

## `hasHeader(key)`

> Check header exists.

## `body`

> Get body, return Promised.
> Only `POST`, `PUT`, `PATCH` can receive body.
> Will auto parse data.

## `url`

> Request path.

## `method`

> Request method (uppercase).

## `query`

> Query string (parsed)
