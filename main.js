const kable = require('kable')
const client = require('mongodb').MongoClient
const uriParser = require('mongodb/lib/core/uri_parser')

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

const connect = (opts) => {
    const k = opts.k
    const uri = opts.uri
    const cliOptions = opts.cliOptions
    let retry = false

    client.connect(uri, cliOptions, (err, conn) => {
        if (err) {
            connect(opts)
            return
        }

        conn.on('serverClosed', () => {
            if (retry) return
            retry = true
            conn.close()
            k.stop('The server closed the connection')
            setTimeout(() => connect(opts), opts.waitToRetryTime)
        })

        k.start()
    })
}

const run = ({ uri, id, key = null, verbose = false, waitToRetryTime = 2000 }) => {
    const cliOptions = { useUnifiedTopology: true }
    const { host, port } = parseUri(uri, cliOptions)
    const meta = {
        id: 'mongo-node'
        , description: 'kable mongodb node'
    }
    const k = kable(id, { host, port, key, verbose, meta })
    return k.run(true).then(() => {
        connect({ k, uri, waitToRetryTime, cliOptions })
        return k
    })
}

module.exports = run 