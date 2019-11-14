module.exports = class ServerError extends Error {
  constructor({ code, message, suggestCode, originError }) {
    super()
    this.code = code
    this.message = message
    this.suggestCode = suggestCode
    this.originError = originError
  }

  toString() {
    return this.message
  }

  toJSON() {
    return { code: this.code, message: this.message }
  }
}
