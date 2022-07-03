module.exports = class Logger {
  constructor (logLevel) {
    switch (logLevel) {
      case 'error':
        this.logLevel = 3
        break
      case 'warn':
        this.logLevel = 2
        break
      case 'info':
        this.logLevel = 1
        break
      case 'verbose':
        this.logLevel = 0
        break
      default:
        this.logLevel = 1
    }
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
