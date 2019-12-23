const os = require('os')

const opcodes = {
    OP_REPLY: 1
    , OP_UPDATE: 2001
    , OP_INSERT: 2002
    , OP_QUERY: 2004
    , OP_GETMORE: 2005
    , OP_DELETE: 2006
    , OP_KILL_CURSORS: 2007
    , OP_COMPRESSED: 2012
    , OP_MSG: 2013
}

const createClientInfo = () => {
    const driverVersion = '3.4.1'
    const nodejsVersion = `'Node.js ${process.version}, ${os.endianness}`
    const type = os.type()
    const release = os.release()
    return {
        os: {
            type
            , name: process.platform
            , architecture: process.arch
            , version: release
        }
        , driver: {
            name: 'nodejs',
            version: driverVersion
        }
        , platform: `${nodejsVersion} (unified)`
    }
}

module.exports = {
    createClientInfo
    , opcodes
}