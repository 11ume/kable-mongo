const Query = function (bson, ns, query, options) {
    const self = this
    // Basic options needed to be passed in
    if (ns == null) throw new Error('ns must be specified for query')
    if (query == null) throw new Error('query must be specified for query')

    // Validate that we are not passing 0x00 in the collection name
    if (ns.indexOf('\x00') !== -1) {
        throw new Error('namespace cannot contain a null character')
    }

    // Basic options
    this.bson = bson
    this.ns = ns
    this.query = query

    // Additional options
    this.numberToSkip = options.numberToSkip || 0
    this.numberToReturn = options.numberToReturn || 0
    this.returnFieldSelector = options.returnFieldSelector || null
    this.requestId = Query.getRequestId()

    // special case for pre-3.2 find commands, delete ASAP
    this.pre32Limit = options.pre32Limit

    // Serialization option
    this.serializeFunctions =
        typeof options.serializeFunctions === 'boolean' ? options.serializeFunctions : false
    this.ignoreUndefined =
        typeof options.ignoreUndefined === 'boolean' ? options.ignoreUndefined : false
    this.maxBsonSize = options.maxBsonSize || 1024 * 1024 * 16
    this.checkKeys = typeof options.checkKeys === 'boolean' ? options.checkKeys : true
    this.batchSize = self.numberToReturn

    // Flags
    this.tailable = false
    this.slaveOk = typeof options.slaveOk === 'boolean' ? options.slaveOk : false
    this.oplogReplay = false
    this.noCursorTimeout = false
    this.awaitData = false
    this.exhaust = false
    this.partial = false
}


// Assign a new request Id
Query.prototype.incRequestId = function () {
    this.requestId = _requestId++
}

// Assign a new request Id
Query.nextRequestId = function () {
    return _requestId + 1
}

// Uses a single allocated buffer for the process, avoiding multiple memory allocations
Query.prototype.toBin = function () {
    var self = this
    var buffers = []
    var projection = null

    // Set up the flags
    var flags = 0
    if (this.tailable) {
        flags |= OPTS_TAILABLE_CURSOR
    }

    if (this.slaveOk) {
        flags |= OPTS_SLAVE
    }

    if (this.oplogReplay) {
        flags |= OPTS_OPLOG_REPLAY
    }

    if (this.noCursorTimeout) {
        flags |= OPTS_NO_CURSOR_TIMEOUT
    }

    if (this.awaitData) {
        flags |= OPTS_AWAIT_DATA
    }

    if (this.exhaust) {
        flags |= OPTS_EXHAUST
    }

    if (this.partial) {
        flags |= OPTS_PARTIAL
    }

    // If batchSize is different to self.numberToReturn
    if (self.batchSize !== self.numberToReturn) self.numberToReturn = self.batchSize

    // Allocate write protocol header buffer
    var header = Buffer.alloc(
        4 * 4 + // Header
        4 + // Flags
        Buffer.byteLength(self.ns) +
        1 + // namespace
        4 + // numberToSkip
        4 // numberToReturn
    )

    // Add header to buffers
    buffers.push(header)

    // Serialize the query
    var query = self.bson.serialize(this.query, {
        checkKeys: this.checkKeys,
        serializeFunctions: this.serializeFunctions,
        ignoreUndefined: this.ignoreUndefined
    })

    // Add query document
    buffers.push(query)

    if (self.returnFieldSelector && Object.keys(self.returnFieldSelector).length > 0) {
        // Serialize the projection document
        projection = self.bson.serialize(this.returnFieldSelector, {
            checkKeys: this.checkKeys,
            serializeFunctions: this.serializeFunctions,
            ignoreUndefined: this.ignoreUndefined
        })
        // Add projection document
        buffers.push(projection)
    }

    // Total message size
    var totalLength = header.length + query.length + (projection ? projection.length : 0)

    // Set up the index
    var index = 4

    // Write total document length
    header[3] = (totalLength >> 24) & 0xff
    header[2] = (totalLength >> 16) & 0xff
    header[1] = (totalLength >> 8) & 0xff
    header[0] = totalLength & 0xff

    // Write header information requestId
    header[index + 3] = (this.requestId >> 24) & 0xff
    header[index + 2] = (this.requestId >> 16) & 0xff
    header[index + 1] = (this.requestId >> 8) & 0xff
    header[index] = this.requestId & 0xff
    index = index + 4

    // Write header information responseTo
    header[index + 3] = (0 >> 24) & 0xff
    header[index + 2] = (0 >> 16) & 0xff
    header[index + 1] = (0 >> 8) & 0xff
    header[index] = 0 & 0xff
    index = index + 4

    // Write header information OP_QUERY
    header[index + 3] = (opcodes.OP_QUERY >> 24) & 0xff
    header[index + 2] = (opcodes.OP_QUERY >> 16) & 0xff
    header[index + 1] = (opcodes.OP_QUERY >> 8) & 0xff
    header[index] = opcodes.OP_QUERY & 0xff
    index = index + 4

    // Write header information flags
    header[index + 3] = (flags >> 24) & 0xff
    header[index + 2] = (flags >> 16) & 0xff
    header[index + 1] = (flags >> 8) & 0xff
    header[index] = flags & 0xff
    index = index + 4

    // Write collection name
    index = index + header.write(this.ns, index, 'utf8') + 1
    header[index - 1] = 0

    // Write header information flags numberToSkip
    header[index + 3] = (this.numberToSkip >> 24) & 0xff
    header[index + 2] = (this.numberToSkip >> 16) & 0xff
    header[index + 1] = (this.numberToSkip >> 8) & 0xff
    header[index] = this.numberToSkip & 0xff
    index = index + 4

    // Write header information flags numberToReturn
    header[index + 3] = (this.numberToReturn >> 24) & 0xff
    header[index + 2] = (this.numberToReturn >> 16) & 0xff
    header[index + 1] = (this.numberToReturn >> 8) & 0xff
    header[index] = this.numberToReturn & 0xff
    index = index + 4

    // Return the buffers
    return buffers
}

Query.getRequestId = function () {
    return ++_requestId
}

module.exports = Query