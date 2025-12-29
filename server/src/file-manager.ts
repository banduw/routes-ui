import fs from 'fs-extra'
import * as path from 'path'

type FileType = 'json' | 'txt'

export class FileManager {
    private folderPath?: string
    private type: FileType

    constructor(type: FileType) {
        this.type = type
    }

    async initialize(folderPath: string) {
        this.folderPath = folderPath
        await fs.ensureDir(folderPath)
    }

    async listFiles(): Promise<string[]> {
        const files = await fs.readdir(this.folderPath!)
        const ext = `.${this.type}`
        return files
            .filter(f => f.endsWith(ext))
            .map(f => path.basename(f, ext))
    }

    async readText(fileName: string): Promise<string> {
        const filePath = path.join(this.folderPath!, `${fileName}.${this.type}`)
        const content = await fs.readFile(filePath, 'utf-8')
        return content
    }

    async readJson<T = any>(fileName: string): Promise<T> {
        const content = await this.readText(fileName)
        return JSON.parse(content) as T
    }

    async updateText(fileName: string, newData: string): Promise<void> {
        const current = await this.readText(fileName)
        const filePath = path.join(this.folderPath!, `${fileName}.${this.type}`)
        await fs.writeFile(filePath, newData, 'utf-8')
    }

    async updateJson(fileName: string, newData: object): Promise<void> {
        const current = await this.readText(fileName)
        await this.updateText(fileName, JSON.stringify(newData, null, 4))
    }

    async createFile(fileName: string): Promise<void> {
        const filePath = path.join(this.folderPath!, `${fileName}.${this.type}`);
        try {
            await fs.access(filePath);
            throw new Error(`File \"${fileName}.${this.type}\" already exists.`)
        } catch {
            // File does not exist, OK to create
        }
        if (this.type == 'txt') await fs.writeFile(filePath, '', 'utf-8')
        else if (this.type == 'json') await fs.writeFile(filePath, JSON.stringify([], null, 4), 'utf-8')
    }

    async deleteFile(fileName: string): Promise<void> {
        const filePath = path.join(this.folderPath!, `${fileName}.${this.type}`)
        await fs.unlink(filePath)
    }
}
