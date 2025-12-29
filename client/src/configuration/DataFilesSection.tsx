import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { errorMessage } from '../utils/common'

type DataFilesSectionProps = {
    request: (path: string, init?: RequestInit) => Promise<Response>
    canEdit: boolean
}

const DataFilesSection: React.FC<DataFilesSectionProps> = ({ request, canEdit }) => {
    const [dataFiles, setDataFiles] = useState<string[]>([])
    const [selectedDataFile, setSelectedDataFile] = useState<string | null>(null)
    const [dataFileContent, setDataFileContent] = useState<string>('')
    const [originalDataFileContent, setOriginalDataFileContent] = useState<string>('')
    const [dataFileStatus, setDataFileStatus] = useState<string | null>(null)
    const [dataFileError, setDataFileError] = useState<string | null>(null)
    const [isLoadingDataFileList, setIsLoadingDataFileList] = useState(false)
    const [isLoadingDataFile, setIsLoadingDataFile] = useState(false)
    const [isSavingDataFile, setIsSavingDataFile] = useState(false)

    const loadDataFileList = useCallback(async (): Promise<void> => {
        setIsLoadingDataFileList(true)
        setDataFileError(null)
        setDataFileStatus(null)
        try {
            const response = await request('data-files')
            const files = await response.json() as string[]
            setDataFiles(files)
            if (files.length > 0 && !selectedDataFile) {
                setSelectedDataFile(files[0])
            } else if (selectedDataFile && !files.includes(selectedDataFile)) {
                setSelectedDataFile(files[0] ?? null)
            }
        } catch (err) {
            setDataFileError(errorMessage(err))
        } finally {
            setIsLoadingDataFileList(false)
        }
    }, [request, selectedDataFile])

    const loadDataFile = useCallback(async (fileName: string): Promise<void> => {
        setIsLoadingDataFile(true)
        setDataFileError(null)
        setDataFileStatus(null)
        try {
            const response = await request(`data-files/${encodeURIComponent(fileName)}`)
            const data = await response.json()
            const pretty = JSON.stringify(data, null, 2)
            setDataFileContent(pretty)
            setOriginalDataFileContent(pretty)
        } catch (err) {
            setDataFileError(errorMessage(err))
            setDataFileContent('')
            setOriginalDataFileContent('')
        } finally {
            setIsLoadingDataFile(false)
        }
    }, [request])

    const handleDataFileReload = useCallback(async () => {
        await loadDataFileList()
        if (selectedDataFile) {
            await loadDataFile(selectedDataFile)
        }
    }, [loadDataFileList, loadDataFile, selectedDataFile])

    const handleDataFileSave = useCallback(async () => {
        if (!selectedDataFile || !canEdit) return;
        setIsSavingDataFile(true)
        setDataFileError(null)
        setDataFileStatus(null)
        try {
            const parsed = JSON.parse(dataFileContent)
            const payload = JSON.stringify(parsed, null, 2)
            await request(`data-files/${encodeURIComponent(selectedDataFile)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: payload
            })
            setOriginalDataFileContent(payload)
            setDataFileContent(payload)
            setDataFileStatus('Saved.')
        } catch (err) {
            setDataFileError(errorMessage(err))
        } finally {
            setIsSavingDataFile(false)
        }
    }, [canEdit, dataFileContent, request, selectedDataFile])

    const isDataFileDirty = useMemo(
        () => dataFileContent !== originalDataFileContent,
        [dataFileContent, originalDataFileContent]
    )

    useEffect(() => {
        void loadDataFileList()
    }, [loadDataFileList])

    useEffect(() => {
        if (selectedDataFile) {
            void loadDataFile(selectedDataFile)
        }
    }, [selectedDataFile, loadDataFile])

    return (
        <div className="flex-1 grid" style={{ gridTemplateColumns: '280px minmax(0, 1fr)' }}>
            <div className="border-r flex flex-col" style={{ borderColor: '#444444' }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#444444' }}>
                    <div>
                        <div className="text-sm" style={{ color: '#e5e5e5', fontWeight: 600 }}>Files</div>
                        <div className="text-xs" style={{ color: '#9ca3af', marginTop: '2px' }}>
                            {dataFiles.length} available
                        </div>
                    </div>
                    <button
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: '#3f3f3f', color: '#e5e5e5' }}
                        onClick={() => void loadDataFileList()}
                        disabled={isLoadingDataFileList}
                    >
                        {isLoadingDataFileList ? 'Loading...' : 'Refresh'}
                    </button>
                </div>
                <div className="flex-1 overflow-auto">
                    {dataFiles.length === 0 && !isLoadingDataFileList ? (
                        <div className="p-4 text-xs" style={{ color: '#9ca3af' }}>
                            No data files found.
                        </div>
                    ) : (
                        dataFiles.map((file) => (
                            <button
                                key={file}
                                className="w-full text-left px-4 py-2 border-b"
                                style={{
                                    borderColor: '#3a3a3a',
                                    color: selectedDataFile === file ? '#e5e5e5' : '#c1c1c1',
                                    backgroundColor: selectedDataFile === file ? '#333333' : 'transparent'
                                }}
                                onClick={() => setSelectedDataFile(file)}
                            >
                                {file}
                            </button>
                        ))
                    )}
                </div>
            </div>
            <div className="flex flex-col min-w-0">
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: '#444444' }}>
                    <div>
                        <div className="text-sm" style={{ color: '#e5e5e5', fontWeight: 600 }}>
                            {selectedDataFile ? selectedDataFile : 'Select a file'}
                        </div>
                        <div className="text-xs" style={{ color: '#9ca3af', marginTop: '2px' }}>
                            {canEdit ? (isDataFileDirty ? 'Unsaved changes' : 'All changes saved') : 'Read-only access'}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="text-xs px-3 py-1 rounded"
                            style={{ backgroundColor: '#3f3f3f', color: '#e5e5e5' }}
                            onClick={() => void handleDataFileReload()}
                            disabled={isLoadingDataFile}
                        >
                            {isLoadingDataFile ? 'Loading...' : 'Reload'}
                        </button>
                        <button
                            className="text-xs px-3 py-1 rounded"
                            style={{
                                backgroundColor: isDataFileDirty && canEdit ? '#2563eb' : '#3f3f3f',
                                color: '#e5e5e5',
                                opacity: canEdit && isDataFileDirty ? 1 : 0.6
                            }}
                            onClick={() => void handleDataFileSave()}
                            disabled={!isDataFileDirty || isSavingDataFile || !selectedDataFile || !canEdit}
                        >
                            {isSavingDataFile ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                    {dataFileError ? (
                        <div className="mb-4 text-xs" style={{ color: '#f87171' }}>{dataFileError}</div>
                    ) : null}
                    {dataFileStatus ? (
                        <div className="mb-4 text-xs" style={{ color: '#34d399' }}>{dataFileStatus}</div>
                    ) : null}
                    <textarea
                        className="w-full h-full p-3 text-xs font-mono rounded border"
                        style={{
                            backgroundColor: '#1f1f1f',
                            borderColor: '#444444',
                            color: '#e5e5e5',
                            minHeight: '360px'
                        }}
                        value={dataFileContent}
                        onChange={(event) => setDataFileContent(event.target.value)}
                        placeholder={selectedDataFile ? 'Loading file...' : 'Select a data file to view.'}
                        spellCheck={false}
                        readOnly={!canEdit}
                    />
                </div>
            </div>
        </div>
    )
}

export default DataFilesSection
