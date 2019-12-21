const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const success = chalk.bold.green
const error = chalk.bold.red
const warning = chalk.keyword('orange')

const config = {
  HTTP_PORT: 3000,
  HTTPS_PORT: 3001,
}

const TIMEOUT = 10 * 1000

process.chdir(__dirname)

async function tests() {
  try {
    await require('./prepare')(config)
  } catch (e) {
    console.log(warning('Prepare Failed!'))
    console.log(error(e))
    process.exit(1)
  }
  let pass = true
  const files = fs.readdirSync(path.resolve('cases'))
  for (const file of files) {
    if (file.endsWith('.js') && file[0] !== '.') {
      const caseName = file.slice(0, -3).replace(/[-_]/ig, ' ')
      try {
        await new Promise(async (resolve, reject) => {
          setTimeout(() => {
            reject('Timeout')
          }, TIMEOUT)
          try {
            await require(`./cases/${file}`)(config)
            resolve()
          } catch (error) {
            reject(error)
          }
        })
        console.log(success(`[success] ${caseName}`))
      } catch (e) {
        console.log(warning(`[failed] ${caseName}`))
        console.log(warning(' Reason:'), error(e))
        pass = false
      }
    }
  }
  if (pass) {
    process.exit(0)
  } else {
    process.exit(1)
  }
}
tests()
