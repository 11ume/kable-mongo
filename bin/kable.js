const arg = require('arg')
const path = require('path')
const run = require('../main')
const { version } = require('../package.json')

const args = arg({
    '--help': Boolean
    , '-h': '--help'
    , '--version': Boolean
    , '-v': '--version'
    , '--uri': String
    , '-u': '--uri'
    , '--id': String
    , '-i': '--id'
    , '--key': String
    , '-k': '--key'
})

if (args['--help']) {
    console.error(`
  kable-mongo-node - Custom kable node prepared to work redundantly whit Mongodb server.
  USAGE
      $ kable --help
      $ kable --version
      $ kable -u <mongo_uri> entry_point.js
      By default kable will recibe and deliver packets on udp/0.0.0.0:5000 and will look first
      for the "main" property in package.json and subsequently for index.js
      as the default entry_point.
  OPTIONS
      --help                      shows this help message
      -v, --version               displays the current used version
      -u, --uri <mongo_uri>       specify a URI of Mongodb server
      -i, --id <node id>          specify a unique id to indentificate this node
      -k, --key <key>             specify a 32 character key to ensure the communication between all connected nodes
`)
    process.exit(2)
}

if (args['--version']) {
    console.log(version)
    process.exit()
}

if (!args['--uri']) {
    throw new Error('The arg --uri is required')
}

let file = ''

try {
    const packageJson = require(path.resolve(process.cwd(), 'package.json'))
    file = packageJson.main || 'index.js'
} catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
        console.error(`Could not read \`package.json\`: ${err.message}`)
        process.exit(1)
    }
}

const mod = async (file) => {
    let modul
    try {
        // Await to support exporting Promises
        modul = await require(`./${file}`)
        // Await to support es6 module's default export
        if (modul && typeof modul === 'object') {
            modul = await modul.default
        }
    } catch (err) {
        console.error(`Error when importing ${file}: ${err.stack}`)
        process.exit(1)
    }

    if (typeof modul !== 'function') {
        console.error(`The file "${file}" does not export a function.`)
        process.exit(1)
    }

    return modul
}

const start = async () => {
    const k = await run({
        uri: args['--uri']
        , id: args['--id']
        , key: args['--key']
    });

    (await mod(file))(k)
}

start()
