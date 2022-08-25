const logLevelNum = {
  error: 3,
  warn: 2,
  info: 1,
  verbose: 0,
  default: 1
}

module.exports = class Logger {
  constructor (logLevel) {
    this.logLevel = logLevelNum[logLevel] || logLevelNum.default
  }

  verbose () {
    if (this.logLevel === 0) {
      console.log.apply(undefined, arguments)
    }
  }

  info () {
    if (this.logLevel <= 1) {
      console.info.apply(undefined, arguments)
    }
  }

  warn () {
    if (this.logLevel <= 2) {
      console.warn.apply(undefined, arguments)
    }
  }

  error () {
    if (this.logLevel <= 3) {
      console.error.apply(undefined, arguments)
    }
  }
}
