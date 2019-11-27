module.exports = class ServerError extends Error {
  constructor ({
    code,
    message,
    httpCode,
    originError
  }) {
    super()
    this.code = code
    this.message = message
    this.httpCode = httpCode
    this.originError = originError
  }

  toString () {
    return this.message
  }

  toJSON () {
    return {
      code: this.code,
      message: this.message
    }
  }
}
