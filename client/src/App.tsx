import { Navigate, Route, Routes } from 'react-router-dom'
import ConfigurationsView from './configuration/ConfigurationsView'
import OperationsView from './operations/OperationsView'

function App() {
    return (
        <Routes>
            <Route path="/" element={<OperationsView />} />
            <Route path="/settings" element={<ConfigurationsView />} />
            <Route path="/config" element={<Navigate to="/settings" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
