const bson = require('bson')
const authProviderFactory = require('./authProviderFactory')

const authenticate = (credentials, callback) => (runCommand) => {
    const provider = authProviderFactory(credentials.mechanism, bson)
    provider.auth(runCommand, credentials, (err) => {
        if (err) return callback(err)
        callback(null)
    })
}

module.exports = authenticate
