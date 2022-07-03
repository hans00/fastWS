const CIDRMatcher = require('cidr-matcher')

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

exports.toFraindlyIP = (rawIpAddress) => {
  if (rawIpAddress.includes('.')) {
    return rawIpAddress
  } else if (rawIpAddress.startsWith('0000:0000:0000:0000:0000:ffff:')) {
    return Buffer.from(rawIpAddress.split(/:/).slice(-2).join(''), 'hex').join('.')
  } else {
    return rawIpAddress
      .replace(/(0000|:0000)+/, ':') // collapse multiple zeroes
      .replace(/0+([\dabcdef]+)/g, '$1') // drop leading zeroes
  }
}

const buildHeaderValue = (params, delimiter = ', ') => {
  switch (typeof params) {
    case 'string':
    case 'number':
      return params.toString()
    case 'object':
      return Array.isArray(params)
        ? params
          .filter(Boolean)
          .map((p) => buildHeaderValue(p, ';'))
          .join(delimiter)
        : Object.entries(params)
          .map(([key, val]) =>
            val
              ? ((typeof val === 'boolean') ? key : `${key}=${val}`)
              : null)
          .filter(x => x)
          .join(delimiter)
    default: return undefined
  }
}

exports.buildHeaderValue = buildHeaderValue

const namedCidrs = {
  loopback: ['127.0.0.1/8', '::1/128'],
  linklocal: ['169.254.0.0/16', 'fe80::/10'],
  uniquelocal: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'fc00::/7']
}

exports.createCidrMatcher = (CIDRs) =>
  new CIDRMatcher(
    CIDRs
      .map((rangeOrName) => namedCidrs[rangeOrName] || rangeOrName)
      .flat()
  )
