import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ConfigInfoProvider } from './config/ConfigInfoContext.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <ConfigInfoProvider>
                <App />
            </ConfigInfoProvider>
        </BrowserRouter>
    </StrictMode>,
)
