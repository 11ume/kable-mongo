const arg = require('arg')
const kable = require('kable')
const uriParser = require('./node_modules/mongodb/lib/core/uri_parser')
const client = require('mongodb').MongoClient

const args = arg({
    '--uri': String
    , '-u': '--uri'
    , '--id': String
    , '-i': '--id'
    , '--key': String
    , '-k': '--key'
})

const uri = 'mongodb://admin:Kimagure232@192.168.0.2:27017/admin' || args['--uri']
const options = { useUnifiedTopology: true }

const parseUri = (uriIn, opts) => {
    let host = ''
    let port = 0

    uriParser(uriIn, opts, (err, args) => {
        if (err) throw err
        if (args.hosts && args.hosts[0]) {
            const address = args.hosts[0]
            host = address.host
            port = address.port
        }
    })

    return {
        host
        , port
    }
}

const onSucces = (k) => k.state !== 'UP' && k.start()

const onClosed = (k) => k.stop()

const onConnect = (k) => k.start()

const onError = (k, conn, _err) => {
    // add stop reason to kable
    k.stop()
    conn(k, uri, options)
}

const connect = (k, uri, options) => {
    client.connect(uri, options, (err, conn) => {
        if (err) return onError(k, connect, err)
        conn.on('serverClosed', () => onClosed(k))
        conn.on('serverHeartbeatSucceeded', () => onSucces(k))
        onConnect(k)
    })
}

const start = ({ id = 'mongo', key = null }) => {
    const { host, port } = parseUri(uri, options)
    const k = kable(id, { host, port, key })
    connect(k, uri, options)
}

start({
    id: args['--id']
    , key: args['--key']
})