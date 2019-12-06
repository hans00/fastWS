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

  toJSON () {
    return {
      code: this.code,
      message: this.message
    }
  }

  toString () {
    if (this.originError) {
      return this.originError.toString()
    } else {
      return 'ServerError: ' + this.code + ': ' + this.message
    }
  }
}
