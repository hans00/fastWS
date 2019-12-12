const fs = require('fs')

if (process.platform === 'darwin') {
  if (fs.existsSync('/usr/local/opt/openssl@1.1')) {
    console.log('/usr/local/opt/openssl@1.1')
  } else if (fs.existsSync('/usr/local/opt/openssl')) {
    console.log('/usr/local/opt/openssl')
  }
}
