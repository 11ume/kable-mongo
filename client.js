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

const connect = (k, uri, options) => {
    const waitToRetryTime = 2000
    let retry = false
    client.connect(uri, options, (err, conn) => {
        if (err) {
            connect(k, uri, options)
            return
        }

        conn.on('serverClosed', () => {
            if (retry) return
            retry = true
            conn.close()
            k.stop('server closed')
            setTimeout(() => connect(k, uri, options), waitToRetryTime)
        })

        k.start()
    })
}

const start = async ({ id = 'mongo', key = null }) => {
    const { host, port } = parseUri(uri, options)
    const k = kable(id, { host, port, key })
    await k.run(true)
    connect(k, uri, options)
}

start({
    id: args['--id']
    , key: args['--key']
})