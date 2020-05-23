const V4Prefix = Buffer.from([0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0xff, 0xff])

exports.ntop = (buf) => {
  if (buf.length === 4) {
    return buf.join('.') // to v4 string
  } else if (!Buffer.compare(buf.slice(0, 12), V4Prefix)) {
    return buf.slice(12).join('.') // to v4 string
  } else {
    return buf.reduce((str, num, i) => {
      str += num.toString(16).padStart(2, '0')
      if (i % 2 && i < 15) {
        str += ':'
      }
      return str
    }, '') // to full v6 string
      .replace(/(0000|:0000)+/, ':') // collapse multiple zeroes
      .replace(/0+([\dabcdef]+)/g, '$1') // drop leading zeroes
  }
}
