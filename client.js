const arg = require('arg')
const kable = require('kable')
const uriParser = require('./node_modules/mongodb/lib/core/uri_parser')
const { MongoClient } = require('mongodb')

const args = arg({
    '--uri': String
    , '-u': '--uri'
    , '--id': String
    , '-i': '--id'
    , '--key': String
    , '-k': '--key'
})

const connect = ({ uri, client, options }, callback) => {
    client.connect(uri, options, (err, conn) => {
        if (err) return callback(err, null)
        conn.on('serverClosed', () => callback(null, 'closed'))
        conn.on('serverHeartbeatSucceeded', () => callback(null, 'succeeded'))
        callback(null, 'connected')
    })
}

// se puede intentar connectar y ya estar connectado
const start = ({ uri, id = 'mongo', key = null }) => {
    const options = { useUnifiedTopology: true }
    let host = ''
    let port = 0

    uriParser(uri, options, (err, args) => {
        if (err) throw err
        if (args.hosts && args.hosts[0]) {
            const address = args.hosts[0]
            host = address.host
            port = address.port
        }
    })

    const k = kable(id, { host, port, key })
    const connectArgs = { client: MongoClient, uri, options }
    const call = (err, event) => {
        if (event === 'succeeded') {
            if (k.state !== 'UP') {
                k.start()
            }
            return
        }

        if (err) {
            k.stop()
            connect(connectArgs, call)
            return
        }

        if (event === 'closed') {
            k.stop()
            return
        }

        k.start()
    }

    connect(connectArgs, call)
}

start({
    uri: 'mongodb://admin:Kimagure232@192.168.0.2:27017/admin' || args['--uri']
    , id: args['--id']
    , key: args['--key']
})