/**
 * @param {{
 *  mechanism: string
 *  , source: string
 *  , username: string 
 * }} credentials
 * @param {string} dbName
 * @param {string} user
 * @returns
 */
const getSaslSupportedMechs = (credentials, dbName, user) => {
    if (!credentials) {
        return {}
    }

    const authMechanism = credentials.mechanism
    const authSource = credentials.source || dbName || 'admin'
    const user = credentials.username || user

    if (typeof authMechanism === 'string' && authMechanism.toUpperCase() !== 'DEFAULT') {
        return {}
    }

    if (!user) {
        return {}
    }

    return {
        saslSupportedMechs: `${authSource}.${user}`
    }
}