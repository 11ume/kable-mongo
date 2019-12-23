const craeteError = (message, name = '') => {
    const err = new Error(message)
    err.name = name
    return err
}

module.exports = craeteError