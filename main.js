const kable = require('kable-core')
const client = require('mongodb').MongoClient
const { parseUri } = require('./lib/utils')
const { description } = require('./package.json')

function retry(k, options, config, uri) {
    const call = () => {
        k.doing(`Retrying connect to the server in ${options.host}:${options.port}`)
        connect(k, options, config, uri)
    }

    setTimeout(call, options.waitToRetryTime)
}

function connect(k, options, config, uri) {
    client.connect(uri, config, (err, conn) => {
        if (err) {
            connect(k, options, config, uri)
            return
        }
        conn.on('serverClosed', () => {
            if (k.state === 'STOPPED') return
            k.stop('The server closed the connection')
            conn.close()
            retry(k, options, config, uri)
        })
        k.start()
    })
}

function run({
    uri
    , id
    , key = null
    , waitToRetryTime = 2000
}) {
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
    })

    return k.up(false).then(() => {
        k.doing('Starting')
        connect(k, options, config, uri)
        return k
    })
}

module.exports = run 