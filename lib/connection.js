const net = require('net')
const { Transform } = require('stream')

class ConnBuffer extends Transform {
    constructor(options) {
        super(options)
    }
    _write(chunk, encoding, callback) {
        this.push(chunk, encoding)
        callback()
    }
    _read(_size) {
        this.push(null)
    }
}

const handleData = (buffer) => (chunk) => {
    buffer.write(chunk)
}

const handleEnd = (buffer, resolve) => () => {
    resolve(buffer.read())
}

const handleError = (reject) => (err) => {
    reject(err)
}

const handleClose = (resolve) => (err) => {
    if (err) return reject(err)
    resolve()
}

const write = (socket) => (data) => {
    if (data.length > 1) {
        for (let i = 0; i < data.length; i++) {
            socket.write(data[i], 'binary')
        }

        socket.end()
        return
    }

    socket.write(data, 'binary')
    socket.end()
}

const connect = (options) => () => new Promise((resolve, reject) => {
    const { socket, buffer, options: { host, port, socketTimeout } } = options
    socket.connect(port, host)
    socket.setTimeout(socketTimeout)
    socket.on('data', handleData(buffer))
    socket.on('end', handleEnd(buffer, resolve))
    socket.on('error', handleError(reject))
    socket.on('close', handleClose(resolve))
    socket.on('timeout', resolve)
})

const createConnection = (host, port) => {
    const socketTimeout = 360000
    const socket = new net.Socket()
    const buffer = new ConnBuffer()
    // socket.setKeepAlive(true)
    return {
        write: write(socket, buffer)
        , connect: connect({
            socket
            , buffer
            , options: {
                host
                , port
                , socketTimeout
            }
        })
    }
}

module.exports = createConnection