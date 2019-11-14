const v4_prefix = Buffer.from([00, 00, 00, 00, 00, 00, 00, 00, 00, 00, 0xff, 0xff])

exports.ntop = (buf) => {
  if (!Buffer.compare(buf.slice(0, 12), v4_prefix)) {
    return buf.slice(12).join('.')
  } else {
    return buf.reduce((str, num, i) => {
      str += num.toString(16).padStart(2, '0')
      if (i % 2 && i < 15) {
        str += ':'
      }
      return str
    }, '')
  }
}
