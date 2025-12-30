import path from 'path'
import { DataLogger } from '@twinlogic-singapore/common-if-utils'
import { FileManager } from './file-manager.js'
import fs from 'fs-extra'
import { ConfigInfo } from './server-types.js'
import { ReadStream } from 'node:fs'

export namespace Summarizer {
    export type Config = {
        logSize: number
        apiKey: string
        summarizerAPI: string
        pdfAPI: string
    }

    export type DocListItem = {
        buildingNames: string[]
        fileId: string
        fileName: string
    }

    export class Interface {
        dataFiles = new FileManager('json')
        loggers: Record<string, DataLogger> = {}
        dataFolder?: string
        config?: Config
        account?: string

        async initialize(account: string, dataFolder: string, config: Config) {
            this.account = account
            this.config = config
            this.dataFolder = dataFolder
            await this.dataFiles.initialize(path.join(dataFolder, 'dataFiles'))
        }

        getLogger(twin: string) {
            let logger = this.loggers[twin]
            if (!logger) {
                logger = new DataLogger()
                logger.initialize(path.join(this.dataFolder!, 'dataFiles'), this.config!.logSize ?? 10, `${twin}-log.json`)
            }
            return logger
        }

        async getExtendedConfig<T>(modelNames: string[], fileName: string): Promise<Record<string, T>> {
            const output: Record<string, T> = {}
            for (const modelName of modelNames) {
                const filePath = path.join(this.dataFolder!, 'bim-models', modelName, fileName)
                try {
                    const data = await fs.readJson(filePath)
                    output[modelName] = data
                } catch (_) { }
            }
            return output
        }


        async readSettings(): Promise<Omit<ConfigInfo, 'user'>> {
            const dataFilesPath = path.join(this.dataFolder!, 'dataFiles')
            const [anchorImport, routeImport, routeConfig] = await Promise.all([
                fs.readJson(path.join(dataFilesPath, 'anchor-import.json')),
                fs.readJson(path.join(dataFilesPath, 'route-import.json')),
                fs.readJson(path.join(dataFilesPath, 'route-config.json'))
            ])

            let bimConfig
            try {
                bimConfig = await fs.readJson(path.join(this.dataFolder!, 'bim-models', 'bim-config.json'))
            } catch { }

            const info: Omit<ConfigInfo, 'user'> = {
                anchorImport,
                routeImport,
                routeConfig,
                bimConfig
            }

            if (bimConfig) {
                const modelNames = (bimConfig as { bimModels: { name: string }[] }).bimModels.map(a => a.name)
                info.bimSectors = await this.getExtendedConfig<any[]>(modelNames, 'sector-data.json')
                info.bimViewports = await this.getExtendedConfig<any[]>(modelNames, 'viewports.json')
                info.bimDots = await this.getExtendedConfig<any[]>(modelNames, 'dot-layer.json')
            }
            return info
        }

        async ask(buildingName: string, query: string): Promise<any> {
            if (this.config?.summarizerAPI) {
                const url = `${this.config.summarizerAPI}/ask`
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify({
                        query: query,
                        building_id: buildingName
                    })
                })
                const data = await parseJsonResponse(resp, 'askAPI')
                return data
            } else throw new Error('Interface not initialized.')
        }

        async readDocsList(): Promise<DocListItem[]> {
            if (this.config?.summarizerAPI) {
                const url = `${this.config.summarizerAPI}/building-config`
                const resp = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    }
                })
                const data = await parseJsonResponse(resp, 'docsAPI')
                if (Array.isArray(data)) return data as DocListItem[]
                if (data && Array.isArray((data as any)['config-data'])) {
                    return (data as any)['config-data'] as DocListItem[]
                }
                throw new Error('docsAPI returned unexpected payload')
            } else throw new Error('Interface not initialized.')
        }

        async updateDocsList(list: DocListItem | DocListItem[]): Promise<void> {
            if (this.config?.summarizerAPI) {
                const url = `${this.config.summarizerAPI}/building-config`
                const files = Array.isArray(list) ? list : [list]
                const resp = await fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.config.apiKey}`
                    },
                    body: JSON.stringify({ files })
                })
                if (!resp.ok) {
                    console.log(`docsAPI update failed: ${resp.status} ${resp.statusText}`)
                    throw new Error(`docsAPI update failed: ${resp.status} ${resp.statusText}`)
                }
            } else throw new Error('Interface not initialized.')
        }

        // Keep provider doc list aligned with our building definitions by removing unknown building names.
        async docListSync(buildingNames: string[]): Promise<number> {
            if (!this.config?.summarizerAPI) throw new Error('Interface not initialized.')
            const allowed = new Set(buildingNames.filter((b) => typeof b === 'string' && b.trim() !== ''))
            const docs = await this.readDocsList()
            const updates: DocListItem[] = []
            for (const doc of docs) {
                const normalized = Array.from(new Set(doc.buildingNames ?? []))
                const filtered = normalized.filter((name) => allowed.has(name))
                if (filtered.length !== doc.buildingNames.length) {
                    updates.push({ ...doc, buildingNames: filtered })
                }
            }
            for (const update of updates) {
                await this.updateDocsList(update)
            }
            return updates.length
        }

        async fetchPdf(sourceId: string): Promise<Response> {
            if (!this.config?.summarizerAPI) throw new Error('Interface not initialized.')
            const url = new URL(this.config.summarizerAPI)
            url.searchParams.set('pdf_id', sourceId)
            return fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            })
        }

        async listProviderPdfs(): Promise<string[]> {
            if (!this.config?.pdfAPI) throw new Error('Interface not initialized.')
            const url = `${this.config.pdfAPI}/pdf_list`
            const resp = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            })
            const text = await resp.text()
            if (!resp.ok) throw new Error(`pdfAPI list failed: ${resp.status} ${resp.statusText}`)
            try {
                const data = JSON.parse(text)
                if (Array.isArray((data as any).files)) return (data as any).files as string[]
                throw new Error('pdfAPI list payload missing files[]')
            } catch (e) {
                console.error('pdfAPI list parse failed', e)
                throw new Error('pdfAPI list returned non-JSON response')
            }
        }

        async uploadProviderPdfs(body: any): Promise<{ status: number, body: string }> {
            if (!this.config?.pdfAPI) throw new Error('Interface not initialized.')
            const headers: Record<string, string> = {
                'Authorization': `Bearer ${this.config.apiKey}`
            }

            const resp = await fetch(`${this.config.pdfAPI}/upload`, {
                method: 'POST',
                headers,
                body: body as any
            })
            const text = await resp.text()
            if (!resp.ok) throw new Error(`pdfAPI upload failed: ${resp.status} ${resp.statusText}`)
            return { status: resp.status, body: text }
        }

        async deleteProviderPdf(pdfId: string, fileName?: string): Promise<{ status: number, body: string }> {
            if (!this.config?.pdfAPI) throw new Error('Interface not initialized.')
            const resp = await fetch(`${this.config.pdfAPI}/delete`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ pdf_id: pdfId, file_name: fileName })
            })
            const text = await resp.text()
            if (!resp.ok) throw new Error(`pdfAPI delete failed: ${resp.status} ${resp.statusText}`)
            return { status: resp.status, body: text }
        }

        async fetchProviderPdf(fileName: string): Promise<Response> {
            if (!this.config?.pdfAPI) throw new Error('Interface not initialized.')
            const url = new URL(`${this.config.pdfAPI}/download`)
            url.searchParams.set('file_name', fileName)
            return fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            })
        }

        async reindexStatus(): Promise<any> {
            if (!this.config?.summarizerAPI) throw new Error('Interface not initialized.')
            const resp = await fetch(`${this.config.summarizerAPI}/reindex/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            })
            return await parseJsonResponse(resp, 'reindexStatusAPI')
        }

        async reindex(forceIndex: boolean): Promise<any> {
            if (!this.config?.summarizerAPI) throw new Error('Interface not initialized.')
            const resp = await fetch(`${this.config.summarizerAPI}/reindex`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ force_index: !!forceIndex })
            })
            return await parseJsonResponse(resp, 'reindexAPI')
        }

        async readContentFile(fileName: string): Promise<{ stream: ReadStream; size: number; contentType: string; fileName: string }> {
            if (!this.dataFolder) throw new Error('Interface not initialized.')
            const safeName = path.basename(fileName)
            const contentFolder = path.resolve(this.dataFolder, 'content')
            const resolvedPath = path.resolve(contentFolder, safeName)
            if (!resolvedPath.startsWith(contentFolder)) {
                const err = new Error('Invalid file path')
                    ; (err as any).code = 'EINVALIDPATH'
                throw err
            }

            const exists = await fs.pathExists(resolvedPath)
            if (!exists) {
                const err = new Error('File not found')
                    ; (err as any).code = 'ENOENT'
                throw err
            }

            const stat = await fs.stat(resolvedPath)
            const ext = path.extname(resolvedPath).toLowerCase()
            const contentType = (() => {
                if (ext === '.pdf') return 'application/pdf'
                if (ext === '.png') return 'image/png'
                if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
                if (ext === '.mp4') return 'video/mp4'
                return 'application/octet-stream'
            })()

            return {
                stream: fs.createReadStream(resolvedPath),
                size: stat.size,
                contentType,
                fileName: path.basename(resolvedPath)
            }
        }
    }
}

async function parseJsonResponse(resp: Response, label: string) {
    const text = await resp.text()
    if (!resp.ok) {
        throw new Error(`${label} failed: ${resp.status} ${resp.statusText}`)
    }
    if (!text) return {}
    try {
        return JSON.parse(text)
    } catch {
        const preview = text.slice(0, 200).replace(/\s+/g, ' ')
        throw new Error(`${label} returned non-JSON response: ${preview}`)
    }
}
