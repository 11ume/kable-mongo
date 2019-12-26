const { networkInterfaces } = require('os')
const { MongoClient } = require('mongodb')
const url = 'mongodb://admin:Kimagure232@192.168.0.2:27017/admin'
// const url = 'mongodb://localhost:27017'
const dbName = 'admin'

const getIps = () => {
    const interfaces = networkInterfaces()
    const locals = ['localhost', '0.0.0.0']
    let ips = []
    Object.keys(interfaces)
        .forEach((i) => {
            const e = interfaces[i].map((i) => i.address)
            ips = ips.concat(e)
        })

    return ips.concat(locals)
}

console.log(getIps())
// MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
//     const db = client.db(dbName)
//     // db.collection('oplog.rs', console.log).find({ tailable: true })
//     db.executeDbAdminCommand({ "currentOp": 1, "$all": true }, (err, data) => {
//         // const print = (conn) => console.log(conn.client, conn.connectionId)
//         data.inprog.forEach((d) => {
//             if (d.client) {
//                 const ip = d.client.split(':')[0]
//                 console.log(d.client, d.connectionId)
//             }
//         })
//     })

//     // db.command({ ping: 1 }).then((data) => {
//     //     console.log(data)
//     //     client.close()
//     // })
//     // db.command({ whatsmyuri: 1 }).then((data) => {
//     //     console.log(data)
//     // })

//     // db.command({ serverStatus: 1 }).then(console.log)
//     // db.listDatabases((err, dbs) => {
//     //     if (err) return console.error(err)
//     //     console.log(dbs)
//     //     // client.close()
//     // })
// })