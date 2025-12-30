import type { DataRow } from './types'

export const getAllColumns = (dataRows: DataRow[]): string[] => {
    const set = new Set<string>();
    dataRows.forEach(row => Object.keys(row).forEach(key => set.add(key)));
    return Array.from(set);
};

export const toNonEmptyString = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    const s = String(value).trim();
    return s.length ? s : null;
};

export const parseStrictNumber = (value: unknown): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(trimmed)) return null;
        const numeric = Number(trimmed);
        return Number.isFinite(numeric) ? numeric : null;
    }
    return null;
};

export const resolveColorColumns = (dataRows: DataRow[]): string[] => {
    const cols = getAllColumns(dataRows);
    const out: string[] = [];

    cols.forEach((col) => {
        if (col.toLowerCase() === 'id') return;
        let hasNumeric = false;
        for (const row of dataRows) {
            const n = parseStrictNumber((row as Record<string, unknown>)[col]);
            if (n !== null) { hasNumeric = true; break; }
        }
        if (hasNumeric) out.push(col);
    });

    return out.sort((a, b) => a.localeCompare(b));
};
