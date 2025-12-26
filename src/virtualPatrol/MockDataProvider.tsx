import React, { createContext, useContext, useMemo } from 'react';
import { useMockData } from './mockData';

export type MockDataApi = ReturnType<typeof useMockData>;

const MockDataContext = createContext<MockDataApi | null>(null);

export function MockDataProvider({ children }: { children: React.ReactNode }) {
    const api = useMockData();
    const value = useMemo(() => api, [api]);

    return <MockDataContext.Provider value={value}>{children}</MockDataContext.Provider>;
}

export function useMockDataCtx(): MockDataApi {
    const ctx = useContext(MockDataContext);
    if (!ctx) {
        throw new Error('useMockDataCtx must be used within <MockDataProvider>');
    }
    return ctx;
}
