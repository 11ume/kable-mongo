const net = require('net')
const bson = require('bson')
const Query = require('./lib/query')
const { createClientInfo } = require('./lib/shared')

const write = (socket, buffer) => () => {
    for (let i = 0; i < buffer.length; i++) {
        socket.write(buffer[i], 'binary')
    }
}

const create = (host, port, buffer) => {
    return new Promise((resolve, reject) => {
        const socketTimeout = 360000
        const socket = new net.Socket()
        socket.connect(port, host, write(socket, buffer))
        socket.setTimeout(socketTimeout)
        socket.on('data', resolve)
        socket.on('end', () => socket.destroy())
        socket.on('close', resolve)
        socket.on('error', reject)
        // socket.setKeepAlive(true)
    })
}

const credentials = {
    mechanism: "default"
    , mechanismProperties: undefined
    , password: "Kimagure232"
    , source: "admin"
    , username: "admin"
}

const handshakeDoc = {
    ismaster: true
    , client: createClientInfo()
    , compression: []
    , getSaslSupportedMechs(credentials)
}

const query = new Query(bson, 'admin.$cmd', handshakeDoc, {
    numberToSkip: 0
    , numberToReturn: 1
})

const parseBody = (parser, index, data, opts) => {
    const numberReturned = data.readInt32LE(16)
    const deserializedData = []
    let bsonSize = 0
    for (let i = 0; i < numberReturned; i++) {
        bsonSize =
            data[index] |
            (data[index + 1] << 8) |
            (data[index + 2] << 16) |
            (data[index + 3] << 24)

        deserializedData.push(parser.deserialize(data.slice(index, index + bsonSize)), opts)
    }

    return deserializedData
}

// Position within OP_REPLY at which documents start
// (See https://docs.mongodb.com/manual/reference/mongodb-wire-protocol/#wire-op-reply)
const INDEX = 20
const MESSAGE_HEADER_SIZE = 16

create('localhost', 27017, query.toBin())
    .then((data) => parseBody(bson, INDEX, data.slice(MESSAGE_HEADER_SIZE), {
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
