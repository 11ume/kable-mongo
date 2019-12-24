const net = require('net')
const { parseData } = require('./data')

const write = (socket) => (data) => {
    if (data.length > 1) {
        for (let i = 0; i < data.length; i++) {
            socket.write(data[i], 'binary')
        }

        return
    }

    socket.write(data, 'binary')
}

const onClose = (resolve) => (err) => {
    if (err) return reject(err)
    resolve()
}

const processData = (_reader, data) => {
    parseData(data, {
        promoteBuffers: false
        , promoteLongs: true
        , promoteValues: true
    })
}

const onData = (emitter, reader) => {
    return (dataIn) => {
        let data = Buffer.from(dataIn)
        // Parse until we are done with the data
        while (data.length > 0) {
            // If we still have bytes to read on the current message
            if (reader.bytesRead > 0 && reader.sizeOfMessage > 0) {
                // Calculate the amount of remaining bytes
                const remainingBytesToRead = reader.sizeOfMessage - reader.bytesRead
                // Check if the current chunk contains the rest of the message
                if (remainingBytesToRead > data.length) {
                    // Copy the new data into the exiting buffer (should have been allocated when we know the message size)
                    data.copy(reader.buffer, reader.bytesRead)
                    // Adjust the number of bytes read so it point to the correct index in the buffer
                    reader.bytesRead = reader.bytesRead + data.length

                    // Reset state of buffer
                    data = Buffer.alloc(0)
                } else {
                    // Copy the missing part of the data into our current buffer
                    data.copy(reader.buffer, reader.bytesRead, 0, remainingBytesToRead)
                    // Slice the overflow into a new buffer that we will then re-parse
                    data = data.slice(remainingBytesToRead)

                    // Emit current complete message
                    const emitBuffer = reader.buffer
                    // Reset state of buffer
                    reader.buffer = null
                    reader.sizeOfMessage = 0
                    reader.bytesRead = 0
                    reader.stubBuffer = null

                    processData(reader, emitBuffer)
                }
            } else {
                // Stub buffer is kept in case we don't get enough bytes to determine the
                // size of the message (< 4 bytes)
                if (reader.stubBuffer != null && reader.stubBuffer.length > 0) {
                    // If we have enough bytes to determine the message size let's do it
                    if (reader.stubBuffer.length + data.length > 4) {
                        // Prepad the data
                        const newData = Buffer.alloc(reader.stubBuffer.length + data.length)
                        reader.stubBuffer.copy(newData, 0)
                        data.copy(newData, reader.stubBuffer.length)
                        // Reassign for parsing
                        data = newData

                        // Reset state of buffer
                        reader.buffer = null
                        reader.sizeOfMessage = 0
                        reader.bytesRead = 0
                        reader.stubBuffer = null
                    } else {
                        // Add the the bytes to the stub buffer
                        const newStubBuffer = Buffer.alloc(reader.stubBuffer.length + data.length)
                        // Copy existing stub buffer
                        reader.stubBuffer.copy(newStubBuffer, 0)
                        // Copy missing part of the data
                        data.copy(newStubBuffer, reader.stubBuffer.length)
                        // Exit parsing loop
                        data = Buffer.alloc(0)
                    }
                } else {
                    if (data.length > 4) {
                        // Retrieve the message size
                        const sizeOfMessage = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24)
                        // If we have a negative sizeOfMessage emit error and return
                        if (sizeOfMessage < 0 || sizeOfMessage > reader.maxBsonMessageSize) {
                            const errorObject = {
                                err: 'socketHandler',
                                trace: '',
                                bin: reader.buffer,
                                parseState: {
                                    sizeOfMessage: sizeOfMessage,
                                    bytesRead: reader.bytesRead,
                                    stubBuffer: reader.stubBuffer
                                }
                            }
                            // We got a parse Error fire it off then keep going
                            emitter.emit('parseError', errorObject, reader)
                            return
                        }

                        // Ensure that the size of message is larger than 0 and less than the max allowed
                        if (
                            sizeOfMessage > 4 &&
                            sizeOfMessage < reader.maxBsonMessageSize &&
                            sizeOfMessage > data.length
                        ) {
                            reader.buffer = Buffer.alloc(sizeOfMessage)
                            // Copy all the data into the buffer
                            data.copy(reader.buffer, 0)
                            // Update bytes read
                            reader.bytesRead = data.length
                            // Update sizeOfMessage
                            reader.sizeOfMessage = sizeOfMessage
                            // Ensure stub buffer is null
                            reader.stubBuffer = null
                            // Exit parsing loop
                            data = Buffer.alloc(0)
                        } else if (
                            sizeOfMessage > 4 &&
                            sizeOfMessage < reader.maxBsonMessageSize &&
                            sizeOfMessage === data.length
                        ) {
                            const emitBuffer = data
                            // Reset state of buffer
                            reader.buffer = null
                            reader.sizeOfMessage = 0
                            reader.bytesRead = 0
                            reader.stubBuffer = null
                            // Exit parsing loop
                            data = Buffer.alloc(0)
                            // Emit the message
                            processData(reader, emitBuffer)
                        } else if (sizeOfMessage <= 4 || sizeOfMessage > reader.maxBsonMessageSize) {
                            const errorObject = {
                                err: 'socketHandler',
                                trace: null,
                                bin: data,
                                parseState: {
                                    sizeOfMessage: sizeOfMessage,
                                    bytesRead: 0,
                                    buffer: null,
                                    stubBuffer: null
                                }
                            }
                            // We got a parse Error fire it off then keep going
                            emitter.emit('parseError', errorObject, reader)

                            // Clear out the state of the parser
                            reader.buffer = null
                            reader.sizeOfMessage = 0
                            reader.bytesRead = 0
                            reader.stubBuffer = null
                            // Exit parsing loop
                            data = Buffer.alloc(0)
                        } else {
                            const emitBuffer = data.slice(0, sizeOfMessage)
                            // Reset state of buffer
                            reader.buffer = null
                            reader.sizeOfMessage = 0
                            reader.bytesRead = 0
                            reader.stubBuffer = null
                            // Copy rest of message
                            data = data.slice(sizeOfMessage)
                            // Emit the message
                            processData(reader, emitBuffer)
                        }
                    } else {
                        // Create a buffer that contains the space for the non-complete message
                        reader.stubBuffer = Buffer.alloc(data.length)
                        // Copy the data to the stub buffer
                        data.copy(reader.stubBuffer, 0)
                        // Exit parsing loop
                        data = Buffer.alloc(0)
                    }
                }
            }
        }
    }
}

const createReader = () => {
    const buffer = null
    const bytesRead = 0
    const stubBuffer = null
    const sizeOfMessage = 0

    return {
        buffer
        , bytesRead
        , stubBuffer
        , sizeOfMessage
    }
}

const connect = (options) => () => new Promise((resolve, reject) => {
    const { emitter, socket, reader, options: { host, port, socketTimeout } } = options
    socket.connect(port, host)
    socket.setTimeout(socketTimeout)
    socket.once('end', resolve)
    socket.once('timeout', resolve)
    socket.once('error', reject)
    socket.once('data', onData(emitter, reader))
    socket.once('close', onClose(resolve))
})

const createConnection = (emitter, { host, port, socketTimeout = 360000, keepAlive = true }) => {
    const socket = new net.Socket()
    const reader = createReader()
    keepAlive && socket.setKeepAlive(true)

    return {
        write: write(socket)
        , connect: connect({
            emitter
            , socket
            , reader
            , options: {
                host
                , port
                , socketTimeout
            }
        })
    }
}

module.exports = createConnection