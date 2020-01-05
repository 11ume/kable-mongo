const uriParser = require('mongodb/lib/core/uri_parser')

function parseUri(uriIn, opts) {
    let host = ''
    let port = 0

    uriParser(uriIn, opts, (err, args) => {
        if (err) throw err
        if (args.hosts && args.hosts[0]) {
            const address = args.hosts[0]
            host = address.host
            port = address.port
        }
    })

    return {
        host
        , port
    }
}

module.exports = {
    parseUri
}