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

const connect = ({ uri, id = 'mongo', key = null }) => {
    const options = { useUnifiedTopology: true }
    let host = ''
    let port = 0

    uriParser(uri, options, (err, args) => {
        if (err) throw err
        const address = args.hosts[0]
        if (address) {
            host = address.host
            port = address.port
        }
    })

    const k = kable(id, { host, port, key })
    client.connect(uri, options, (err, conn) => {
        if (err) throw err
        const db = conn.db('admin')
        db.command({ ping: 1 }).then((data) => {
            if (data.ok === 1) k.start()
        })
    })
}

connect({
    uri: 'mongodb://admin:Kimagure232@192.168.0.2:27017/admin' || args['--uri']
    , id: args['--id']
    , key: args['--key']
})