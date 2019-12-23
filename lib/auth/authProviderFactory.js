const { ScramSHA256 } = require('./providers/scram')

const authProviderFactory = (bson) => {
  return {
    'scram-sha-256': new ScramSHA256(bson)
  }
}

module.exports = authProviderFactory
