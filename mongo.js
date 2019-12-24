const bson = require('bson')
const Query = require('./lib/query')
const createConnection = require('./lib/connection')
const authenticate = require('./lib/auth/authenticate')
const { createClientInfo } = require('./lib/shared')
const { parseBody } = require('./lib/response')

const credentials = {
    mechanism: 'scram-sha-256'
    , mechanismProperties: undefined
    , password: 'Kimagure232'
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
const auth = authenticate({}, credentials, (err) => {
    console.error(err)
})

auth(function test(connection, db, saslStartCmd, callback) {
    console.log(saslStartCmd)
    callback()
})
// const queryHandshake = new Query(bson, ns, handshake, queryOptions)
// const queryServerStatus = new Query(bson, ns, queryOptions)

// const connection = createConnection('localhost', 27017)

// connection.connect()
//     .then((data) => parseBody(data, {
//         promoteBuffers: false
//         , promoteLongs: true
//         , promoteValues: true
//     }))
//     .then((data) => {
//         console.log(data)
//     })
//     .catch((err) => {
//         console.error(err)
//     })

// connection.write(queryServerStatus.toBin())