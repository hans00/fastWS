const fs = require('fs')
const path = require('path')

const basePath = process.argv[2]
const ext = process.argv[3] || ''
const exclude = process.argv[4] || ''

function walk (dir) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    if (fs.lstatSync(fullPath).isDirectory() && (!exclude || !name.includes(exclude))) {
      walk(fullPath)
    } else if (name.endsWith(ext) && (!exclude || !name.includes(exclude))) {
      console.log(fullPath)
    }
  }
}

walk(basePath)
