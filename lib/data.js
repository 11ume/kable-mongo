const bson = require('bson')

const parseData = (payload, opts) => {
    // Position within OP_REPLY at which documents start
    // (See https://docs.mongodb.com/manual/reference/mongodb-wire-protocol/#wire-op-reply)
    const index = 20
    const messageHeaderSize = 16
    const data = payload.slice(messageHeaderSize)
    const numberReturned = data.readInt32LE(16)
    const deserializedData = []
    let bsonSize = 0

    for (let i = 0; i < numberReturned; i++) {
        bsonSize =
            data[index] |
            (data[index + 1] << 8) |
            (data[index + 2] << 16) |
            (data[index + 3] << 24)

        deserializedData.push(bson.deserialize(data.slice(index, index + bsonSize)), opts)
    }

    return deserializedData
}

module.exports = {
    parseData
}