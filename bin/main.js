const arg = require('arg')
const run = require('../main')

const args = arg({
    '--uri': String
    , '-u': '--uri'
    , '--id': String
    , '-i': '--id'
    , '--key': String
    , '-k': '--key'
})

run({
    id: args['--id']
    , key: args['--key']
    , uri: args['--uri']
})