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

// db.command({ ping: 1 }).then((data) => {
//     if (data.ok === 1) k.start()
// })

const connect = ({ k, uri, client, options }) => new Promise((resolve, reject) => {
    client.connect(uri, options, (err, conn) => {
        if (err) return reject(err)
        const db = conn.db('admin')

        conn.once('error', (err) => {
            k.stop()
            reject(err)
        })

        conn.once('close', () => {
            k.stop()
            resolve()
        })

        conn.once('disconnected', () => {
            k.stop()
            reject()
        })

        db.command({ ping: 1 })
            .then((data) => {
                if (data.ok === 1) {
                    k.start()
                    resolve()
                }
            })
            .catch(reject)
    })
})

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
    let retry = null

    const connectObj = { k, uri, client: MongoClient, options }
    connect(connectObj)
        .then(() => {
            retry && clearInterval(retry)
        })
        .catch((err) => {
            retry = setInterval(() => connect(connectObj), 2000)
        })
}

start({
    uri: 'mongodb://admin:Kimagure232@192.168.0.2:27017/admin' || args['--uri']
    , id: args['--id']
    , key: args['--key']
})