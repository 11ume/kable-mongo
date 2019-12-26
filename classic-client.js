const { MongoClient } = require('mongodb')
const url = 'mongodb://admin:Kimagure232@localhost:27017/admin'
// const url = 'mongodb://localhost:27017'
const dbName = 'admin'
const selfIp = 'localhost'

db.currentOp(true).inprog.forEach((d) => { print(d) })

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    const db = client.db(dbName)
    // db.collection('oplog.rs', console.log).find({ tailable: true })
    db.executeDbAdminCommand({ "currentOp": 1, "$all": true }, (err, data) => {
        const print = (conn) => console.log(conn.client, conn.connectionId)
        const conn = data.inprog
            .find((op) => {
                return op.client && op.connectionId && op.client.split(':')[0] !== selfIp
            })

        print(conn)
    })

    // db.command({ ping: 1 }).then((data) => {
    //     console.log(data)
    //     client.close()
    // })
    // db.command({ whatsmyuri: 1 }).then((data) => {
    //     console.log(data)
    // })

    // db.command({ serverStatus: 1 }).then(console.log)
    // db.listDatabases((err, dbs) => {
    //     if (err) return console.error(err)
    //     console.log(dbs)
    //     // client.close()
    // })
})