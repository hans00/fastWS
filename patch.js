const fs = require('fs')
const path = require('path')

// Patch OpenSSL (support for BoringSSL)
{
  const filePath = path.resolve(__dirname, 'src/uWebSockets.js/uWebSockets/uSockets/src/crypto/openssl.c')
  const content = fs.readFileSync(filePath).toString()
  fs.writeFileSync(filePath, content.replace(/BIO_get_flags\(([a-z0-9_]+)\)/ig, 'BIO_test_flags($1, ~(0x0))'))
}
