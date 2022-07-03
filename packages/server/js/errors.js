module.exports = class ServerError extends Error {
  constructor (options = {}) {
    super()
    this.code = options.code || 'E_INTERNAL'
    this.message = options.message || 'Internal Error'
    this.httpCode = options.httpCode || 500
    this.originError = options.originError
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
      return `ServerError: ${this.code}: ${this.message}`
    }
  }
}
