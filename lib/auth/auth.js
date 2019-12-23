const authProviderFactory = require('./authProviderFactory')

const authenticate = (runCommand) => (conn, credentials, callback) => {
    const provider = authProviderFactory[credentials.mechanism]
    provider.auth(runCommand, [conn], credentials, (err) => {
        if (err) return callback(err)
        callback(null, conn)
    })
}

module.exports = authenticate
