const { ScramSHA256 } = require('./providers/scram')

const authProviderFactory = (provider, bson) => {
  const providers = {
    'scram-sha-256': new ScramSHA256(bson)
  }

  return providers[provider]
}

module.exports = authProviderFactory
