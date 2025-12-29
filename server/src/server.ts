import Express, { RequestHandler } from 'express'
import { apiRouter } from "./data-router.js"
import { AppRequest, InterfaceService, ServiceAccount } from '@twinlogic-singapore/common-if-utils'
import path from 'path'
import fs from 'node:fs/promises'
import dotenv from 'dotenv'
import { AccountData, SummarizerConfig, GlobalConfigEx } from "./server-types.js"
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { Summarizer } from './interface.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

export async function initAccount(serviceAccount: ServiceAccount) {
    const dataCache: AccountData = {
        interface: new Summarizer.Interface()
    }

    const config = serviceAccount.serviceConfig as SummarizerConfig
    // const globalConfig = serviceAccount.globalConfig as GlobalConfigEx
    await dataCache.interface.initialize(serviceAccount.accountId, serviceAccount.dataFolder, config)
    serviceAccount.dataCache = dataCache
}

async function main() {
    const server = new InterfaceService('routes', 'v1', process.env.RELEASE_TAG ?? '', 8034, path.join(__dirname, '../../data'))
    await server.initialize()
    server.onAccountSetup = initAccount
    server.setupRouter()

    server.router.use('/api', (request, res, next) => {
        const req = request as AppRequest
        if (req.path == '/subscribe') next()
        else {
            const results = server.authorizeApi(req)
            if (results == 'authorized') next()
            else res.status(401).json({ error: 'Unauthorized', results: results })
        }
    }, apiRouter)

    // Serve built client assets from the Vite output folder.
    server.router.use('/assets', Express.static(path.join(__dirname, '../../client/dist/assets')))
    server.router.use('/images', Express.static(path.join(__dirname, '../../client/dist/images')))
    server.router.use('/', Express.static(path.join(__dirname, '../../client/dist')))

    // SPA fallback for non-API GET requests. Placing this last avoids path-to-regexp '*' errors.
    server.router.use((req, res, next) => {
        if (req.method !== 'GET') return next()
        if (req.path.startsWith('/api')) return next()
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
    })

    server.setupErrorHandler()
}

main().catch(e => console.error(e.message))
