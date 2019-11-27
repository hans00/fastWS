const V4Prefix = Buffer.from([0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0xff, 0xff])

exports.ntop = (buf) => {
  if (!Buffer.compare(buf.slice(0, 12), V4Prefix)) {
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
