#!/usr/bin/env node
const arg = require('arg')
const path = require('path')
const run = require('../main')
const { existsSync } = require('fs')
const { version } = require('../package.json')

const args = arg({
    '--help': Boolean
    , '-h': '--help'
    , '--version': Boolean
    , '--uri': String
    , '-u': '--uri'
    , '--id': String
    , '-i': '--id'
    , '--key': String
    , '-k': '--key'
    , '--verbose': Boolean
    , '-v': '--verbose'
})

if (args['--help']) {
    console.error(`
    kable-mongo - Custom kable node prepared to work whit Mongodb server.
    USAGE
        $ kable --help
        $ kable --version
        $ kable -u <mongo_uri>
    OPTIONS
        --help                      shows this help message
        --version                   displays the current used version
        -v, --verbose               start kable in verbose mode
        -u, --uri <mongo_uri>       specify a URI of connection
        -i, --id <node id>          specify a unique id to indentificate this node
        -k, --key <key>             specify a 32 character key to ensure the communication between all connected nodes
`)
    process.exit(2)
}

if (args['--version']) {
    console.log(version)
    process.exit()
}

if (!args['--uri']) {
    console.error('The arg --uri is required')
    process.exit(1)
}

function getModFileIndex() {
    const main = 'index.js'
    try {
        const packageJson = require(path.resolve(process.cwd(), 'package.json'))
        return packageJson.main || main
    } catch (err) {
        return main
    }
}

async function mod(fileName) {
    let modul
    try {
        // Await to support exporting Promises
        modul = await require(path.resolve(process.cwd(), fileName))
        // Await to support es6 module's default export
        if (modul && typeof modul === 'object') {
            modul = await modul.default
        }
    } catch (err) {
        console.error(`Error when importing ${fileName}: ${err.stack}`)
        process.exit(1)
    }

    if (typeof modul !== 'function') {
        console.error(`The file "${fileName}" does not export a function.`)
        process.exit(1)
    }

    return modul
}

async function start() {
    const k = await run({
        uri: args['--uri']
        , id: args['--id']
        , key: args['--key']
        , verbose: args['--verbose']
    })

    const fileName = getModFileIndex()
    if (existsSync(fileName)) (await mod(fileName))(k)
}

start()
