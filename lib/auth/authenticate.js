const bson = require('bson')
const authProviderFactory = require('./authProviderFactory')

const authenticate = (conn, credentials, callback) => (runCommand) => {
    const provider = authProviderFactory(credentials.mechanism, bson)
    provider.auth(runCommand, [conn], credentials, (err) => {
        if (err) return callback(err)
        callback(null, conn)
    })
}

module.exports = authenticate
