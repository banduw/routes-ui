import Express from "express"
import { AppRequest, errorMessage } from '@twinlogic-singapore/common-if-utils'
import { AccountData, ConfigInfo } from "./server-types.js"
import { Readable } from 'node:stream'

export const apiRouter = Express.Router()

async function getInterfaceWithRole(request: Express.Request, role?: string) {
    const req = request as AppRequest
    if (!role || req.session.user?.serviceRoles.includes(role)) return (req.serviceAccount.dataCache as AccountData).interface
    else throw new Error(`User does not have '${role}' role.`)
}

apiRouter.get('/forge-access-token', async (request, res) => {
    const req = request as AppRequest
    if (req.session.user?.serviceRoles.includes('canView') != true) throw new Error('User does not have canView role.')
    const data = await req.serviceAccount.serviceAuth!.execGenericGET('forge-access-token')
    res.status(200).json(data)
})

apiRouter.get('/config-info', async (request, res) => {
    const req = request as AppRequest
    const serviceUser = req.serviceAccount.makeServiceUser(req.session.user)
    serviceUser.isServiceAdmin = false

    const client = (req.serviceAccount.dataCache as AccountData).interface
    const settings = await client.readSettings()
    const data: ConfigInfo = {
        ...settings,
        user: serviceUser
    }
    res.status(200).json(data)
})

apiRouter.post('/read-settings', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const data = await client.readSettings()
    res.status(200).json(data)
})

apiRouter.post('/read-account-config', async (request, res) => {
    const req = request as AppRequest
    if (req.session.user?.isAdmin !== true && req.session.user?.isServiceAdmin !== true) {
        res.status(403).json({ error: 'Admin access required' })
        return
    }
    const config = await req.serviceAccount.readAccountConfig()
    res.status(200).json(config)
})

apiRouter.post('/save-account-config', async (request, res) => {
    const req = request as AppRequest
    if (req.session.user?.isAdmin !== true && req.session.user?.isServiceAdmin !== true) {
        res.status(403).json({ error: 'Admin access required' })
        return
    }
    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
    await req.serviceAccount.saveAccountConfig(payload)
    res.status(200).json({})
})

// apiRouter.post('/save-settings', async (request, res) => {
//     const client = await getInterfaceWithRole(request, 'canUpdate')
//     const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
//     await client.saveSettings(payload)
//     try {
//         const buildings = Array.isArray((payload as any)?.buildings)
//             ? (payload as any).buildings
//                 .map((b: any) => b?.name)
//                 .filter((n: any) => typeof n === 'string')
//             : []
//         await client.docListSync(buildings)
//     } catch (e) {
//         console.warn('docListSync failed', e)
//     }
//     res.status(200).json({})
// })

apiRouter.get('/get-apikey', async (request, res) => {
    const req = request as AppRequest
    if (req.session.user.isAdmin != true && req.session.user.isServiceAdmin != true) throw new Error('Only available for Admin or Service Admin')
    const apiKey = req.serviceAccount.serviceConfig?.apiUsers[0]?.apiKey
    if (apiKey == null) throw new Error('apiUser not found')

    res.status(200).json({ apiKey: apiKey })
})

// dataFiles

apiRouter.get('/data-files', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const list = await client.dataFiles.listFiles()
    res.status(200).json(list)
})

apiRouter.get('/data-files/:file', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const data = await client.dataFiles.readJson(request.params.file)
    res.status(200).json(data)
})

apiRouter.post('/data-files/:file', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    const data = JSON.parse(request.body)
    await client.dataFiles.updateJson(request.params.file, data)
    res.status(200).json({})
})

apiRouter.post('/data-files/:file/delete', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    await client.dataFiles.deleteFile(request.params.file)
    res.status(200).json({})
})

apiRouter.post('/data-files/:file/create', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    await client.dataFiles.createFile(request.params.file)
    res.status(200).json({})
})

apiRouter.get('/content/:file', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const fileName = typeof request.params.file === 'string' ? request.params.file.trim() : ''
    if (!fileName) {
        res.status(400).json({ error: 'file parameter is required' })
        return
    }

    try {
        const content = await client.readContentFile(fileName)
        res.setHeader('Content-Type', content.contentType)
        res.setHeader('Content-Disposition', `inline; filename="${content.fileName}"`)
        res.setHeader('Cache-Control', 'private, max-age=0')
        if (content.size) res.setHeader('Content-Length', content.size.toString())

        content.stream.on('error', (err) => {
            console.error('Failed to stream content file', err)
            if (!res.headersSent) res.status(500).json({ error: 'Failed to read content file' })
            else res.destroy(err)
        })

        content.stream.pipe(res)
    } catch (e: any) {
        console.error('Failed to serve content file', e)
        if (e?.code === 'ENOENT') res.status(404).json({ error: 'Content file not found' })
        else if (e?.code === 'EINVALIDPATH') res.status(400).json({ error: 'Invalid content file path' })
        else res.status(500).json({ error: e?.message ?? 'Failed to serve content file' })
    }
})

apiRouter.post('/data/:file', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    await client.dataFiles.updateJson(request.params.file, request.body)
    res.status(200).json({})
})

apiRouter.post('/ask', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const resp = await client.ask(request.body.buildingName, request.body.query)
    res.status(200).json(resp)
})

apiRouter.post('/read-docs-list', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const list = await client.readDocsList()
    res.status(200).json(list)
})

apiRouter.post('/update-docs-list', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
    await client.updateDocsList(payload)
    res.status(200).json({})
})

apiRouter.get('/reindex/status', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    try {
        const status = await client.reindexStatus()
        res.status(200).json(status)
    } catch (e: any) {
        console.error('Failed to read reindex status', e)
        res.status(502).json({ error: e?.message ?? 'Failed to read reindex status' })
    }
})

apiRouter.post('/reindex', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    const payload = typeof request.body === 'string' ? JSON.parse(request.body) : request.body
    const forceIndex = !!((payload as any)?.force_index ?? (payload as any)?.forceIndex)
    try {
        const result = await client.reindex(forceIndex)
        res.status(200).json(result)
    } catch (e: any) {
        console.error('Reindex request failed', e)
        res.status(502).json({ error: e?.message ?? 'Reindex request failed' })
    }
})

apiRouter.get('/pdf', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canViewFiles')
    const sourceIdParam = typeof request.query.sourceId === 'string'
        ? request.query.sourceId
        : typeof (request.query as Record<string, unknown>).source_id === 'string'
            ? (request.query as Record<string, string>).source_id
            : ''
    const sourceId = sourceIdParam.trim()
    const fileName = typeof request.query.fileName === 'string' ? request.query.fileName.trim() : ''
    if (!sourceId) {
        res.status(400).json({ error: 'sourceId is required' })
        return
    }

    try {
        const upstream = await client.fetchPdf(sourceId)
        if (!upstream.body) {
            res.status(502).json({ error: 'PDF response did not include a body' })
            return
        }
        if (!upstream.ok) {
            const text = await upstream.text().catch(() => '')
            res.status(upstream.status).send(text || 'Failed to fetch PDF')
            return
        }

        const passthroughHeaders = ['content-type', 'content-length', 'content-disposition']
        for (const header of passthroughHeaders) {
            const value = upstream.headers.get(header)
            if (value) res.setHeader(header, value)
        }
        // Force inline rendering with a filename for better tab view and saves.
        if (fileName) res.setHeader('Content-Disposition', `inline; filename="${fileName}"`)
        else res.setHeader('Content-Disposition', 'inline')
        res.status(upstream.status)
        res.setHeader('Cache-Control', 'private, max-age=0')

        Readable.fromWeb(upstream.body as any).pipe(res)
    } catch (e: any) {
        console.error('Failed to fetch PDF', e)
        res.status(500).json({ error: e?.message ?? 'Failed to fetch PDF' })
    }
})

apiRouter.get('/provider-pdfs', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const files = await client.listProviderPdfs()
    res.status(200).json({ files })
})

apiRouter.post('/provider-pdfs/upload', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    const contentType = request.headers['content-type']
    if (!contentType || !contentType.toLowerCase().startsWith('multipart/form-data')) {
        res.status(400).json({ error: 'multipart/form-data required' })
        return
    }
    const filesField = (request as any).files?.file
    const files = Array.isArray(filesField) ? filesField : filesField ? [filesField] : []
    if (files.length === 0) {
        res.status(400).json({ error: 'No files received' })
        return
    }
    const tooLarge = files.find((f: any) => typeof f?.size === 'number' && f.size > 100 * 1024 * 1024)
    if (tooLarge) {
        res.status(413).json({ error: `${tooLarge.name ?? 'File'} exceeds 100MB limit` })
        return
    }

    const form = new FormData()
    let totalBytes = 0
    for (const file of files) {
        const data: Buffer | undefined = file?.data
        if (!data) continue
        totalBytes += data.length
        const mime = file?.mimetype || 'application/pdf'
        form.append('file', new File([Uint8Array.from(data)], file?.name || 'file.pdf', { type: mime }))
    }
    const result = await client.uploadProviderPdfs(form as any)
    res.status(200).json({ status: result.status, body: result.body })
})

apiRouter.delete('/provider-pdfs/file', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canUpdate')
    const fileName = typeof request.query.file === 'string' ? request.query.file : ''
    if (!fileName.trim()) {
        res.status(400).json({ error: 'file query parameter is required' })
        return
    }
    const docs = await client.readDocsList()
    const match = docs.find((d) => d.fileName === fileName)
    if (!match?.fileId) {
        res.status(404).json({ error: 'No matching pdf_id found for file name' })
        return
    }
    const result = await client.deleteProviderPdf(match.fileId, fileName)
    res.status(200).json({ status: result.status, body: result.body })
})

apiRouter.get('/provider-pdfs/file', async (request, res) => {
    const client = await getInterfaceWithRole(request, 'canView')
    const fileName = typeof request.query.file === 'string' ? request.query.file : ''
    if (!fileName.trim()) {
        res.status(400).json({ error: 'file query parameter is required' })
        return
    }

    try {
        const upstream = await client.fetchProviderPdf(fileName)
        if (!upstream.body) {
            res.status(502).json({ error: 'PDF response did not include a body' })
            return
        }
        if (!upstream.ok) {
            const text = await upstream.text().catch(() => '')
            res.status(upstream.status).send(text || 'Failed to fetch PDF')
            return
        }

        const passthroughHeaders = ['content-type', 'content-length', 'content-disposition']
        for (const header of passthroughHeaders) {
            const value = upstream.headers.get(header)
            if (value) res.setHeader(header, value)
        }
        res.status(upstream.status)
        res.setHeader('Cache-Control', 'private, max-age=0')

        Readable.fromWeb(upstream.body as any).pipe(res)
    } catch (e: any) {
        console.error('Failed to fetch provider PDF', e)
        res.status(500).json({ error: e?.message ?? 'Failed to fetch PDF' })
    }
})
