const kable = require('kable')
const client = require('mongodb').MongoClient
const uriParser = require('mongodb/lib/core/uri_parser')
const { description } = require('./package.json')

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

const connect = (k, options, config, uri) => {
    let retry = false
    client.connect(uri, config, (err, conn) => {
        if (err) {
            connect(k, options, config, uri)
            return
        }

        conn.on('serverClosed', () => {
            if (retry) return
            retry = true
            conn.close()
            k.stop('The server closed the connection')
            setTimeout(() => {
                const { host, port } = options
                k.doingSomething(`Retrying connect to the server in ${host}:${port}`)
                connect(k, options, config, uri)
            }, options.waitToRetryTime)
        })

        k.start()
    })
}

const run = ({
    uri
    , id
    , key = null
    , verbose = false
    , waitToRetryTime = 2000
}) => {

    const config = {
        useUnifiedTopology: true
    }

    const meta = {
        id: 'mongo-node'
        , description
    }

    const { host, port } = parseUri(uri, config)

    const options = {
        host
        , port
        , waitToRetryTime
    }

    const k = kable(id, {
        host
        , port
        , key
        , meta
        , verbose
    })

    return k.run(false).then(() => {
        k.doingSomething('Starting')
        connect(k, options, config, uri)
        return k
    })
}

module.exports = run 