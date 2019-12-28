module.exports = async (file) => {
    let mod
    try {
        mod = await require(`./${file}`) // Await to support exporting Promises

        if (mod && typeof mod === 'object') {
            mod = await mod.default // Await to support es6 module's default export
        }
    } catch (err) {
        console.error(`Error when importing ${file}: ${err.stack}`)
        process.exit(1)
    }

    if (typeof mod !== 'function') {
        console.error(`The file "${file}" does not export a function.`)
        process.exit(1)
    }

    return mod
}