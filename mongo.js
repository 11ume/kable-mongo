const Query = require('./lib/query')
const createConnection = require('./lib/connection')
const { createClientInfo } = require('./lib/shared')
const { parseBody } = require('./lib/response')

// const credentials = {
//     mechanism: 'default'
//     , source: 'admin'
//     , password: 'Kimagure232'
//     , username: 'admin'
// }

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
const queryHandshake = new Query(bson, ns, handshake, queryOptions)
// const queryServerStatus = new Query(bson, ns, queryOptions)

const connection = createConnection('localhost', 27017)

connection.connect()
    .then((data) => parseBody(bson, data, {
        promoteBuffers: false
        , promoteLongs: true
        , promoteValues: true
    }))
    .then((data) => {
        console.log(data)
    })
    .catch((err) => {
        console.error(err)
    })

connection.write(queryHandshake.toBin())