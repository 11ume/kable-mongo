const runCommand = (conn, bson, { ns, command, socketTimeout = 36000 }) => {
    const query = new Query(bson, ns, command, {
        numberToSkip: 0
        , numberToReturn: 1
    })

    conn.setTimeout(socketTimeout)
    conn.write(query.toBin())
}

const getSaslSupportedMechs = (mechanism, username, dbName = 'admin') => {
    if (mechanism !== 'default') return {}
    if (!username) return {}
    return {
        getSaslSupportedMechs: `${dbName}.${user}`
    }
}

const handSheke = (conn, bson, options) => {
    const payload = {
        ismaster: true
        , compression: []
        , client: createClientInfo()
        , getSaslSupportedMechs: getSaslSupportedMechs(credentials.mechanism, credentials.username, credentials.source)
    }

    runCommand(conn, bson, options)
}

module.exports = {
    runCommand
}