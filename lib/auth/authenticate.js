const authProviderFactory = require('./authProviderFactory')

const authenticate = (conn, credentials, callback) => (runCommand) => {
    const provider = authProviderFactory[credentials.mechanism]
    provider.auth(runCommand, [conn], credentials, (err) => {
        if (err) return callback(err)
        callback(null, conn)
    })
}

module.exports = authenticate
