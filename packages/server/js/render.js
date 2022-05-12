const ServerError = require('./errors')

function render (_template, _data) {
  /* eslint no-unused-vars: 0 */
  function escapeVar (data, type) { // type = [ String, Number, Object, Array ]
    if (type) {
      if (type === String) {
        return data.toString().replace(/(['"\\/])/g, '\\$1')
      } else if (type === Number) {
        return Number(data)
      } else {
        return JSON.stringify(data).replace(/\//g, '\\/')
      }
    } else {
      throw new ServerError({
        code: 'SERVER_RENDER_ERROR',
        message: 'The type of data must be set.'
      })
    }
  }
  function escapeHTML (data) {
    return data.toString().replace(/[\u00A0-\u9999<>&"']/gim, (i) => `&#${i.charCodeAt(0)};`)
  }
  /* eslint no-eval: 0 */
  return eval(
    'const ' +
    Object.keys(_data).map(key => `${key} = ${JSON.stringify(_data[key])}`).join() + ';' +
    '(`' + _template.toString().replace(/([`\\])/g, '\\$1') + '`)'
  )
}

module.exports = render
