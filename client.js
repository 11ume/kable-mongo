const bson = require('bson')
const Query = require('./lib/query')
const createConnection = require('./lib/connection')
const authenticate = require('./lib/auth/authenticate')
const { createClientInfo } = require('./lib/shared')

const eventEmitter = require('events')
const emitterHandler = new eventEmitter()

const credentials = {
    mechanism: 'default'
    // mechanism: 'scram-sha-256'
    , mechanismProperties: undefined
    // , password: 'Kimagure232'
    , source: 'admin'
    , username: 'admin'
}

const handshake = {
    ismaster: true
    , compression: []
    , client: createClientInfo()
    // , getSaslSupportedMechs: getSaslSupportedMechs(credentials.mechanism, credentials.username, credentials.source)
}

const queryOptions = {
    numberToSkip: 0
    , numberToReturn: 1
}

//db admin
const ns = 'admin.$cmd'
// const auth = authenticate(credentials, (err) => {
//     console.error(err)
// })

// auth(function test(db, saslStartCmd, callback) {
//     console.log(saslStartCmd)
//     callback()
// })
const queryHandshake = new Query(bson, ns, handshake, queryOptions)
// const queryServerStatus = new Query(bson, ns, queryOptions)

const connection = createConnection(emitterHandler, { host: 'localhost', port: 27017 })
connection.connect().catch(console.error)
connection.write(queryHandshake.toBin())