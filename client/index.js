if ((global && global.WebSocket) || (window && window.WebSocket)) {
  module.exports = require('./browser')
} else {
  module.exports = require('./node')
}
