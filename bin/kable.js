const arg = require('arg')
const run = require('../main')
const packageJson = require('../package.json')

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
      --help                              shows this help message
      -v, --version                       displays the current used version of kable
      -u, --uri <mongo_uri>               specify a URI of Mongodb server
      -i, --id <node id>                  specify a unique id to indentificate this node
      -k, --key <key>                     specify a 32 character key to ensure the communication between all connected nodes
`)
    process.exit(2)
}

if (args['--version']) {
    console.log(packageJson.dependencies.kable)
    process.exit()
}

if (!args['--uri']) {
    throw new Error('The arg --uri is required')
}

run({
    id: args['--id']
    , key: args['--key']
    , uri: args['--uri']
})