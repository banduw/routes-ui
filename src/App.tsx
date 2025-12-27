import { Navigate, Route, Routes } from 'react-router-dom'
import ConfigurationsView from './configuration/ConfigurationsView'
import OperationsView from './OperationsView'

function App() {
    return (
        <Routes>
            <Route path="/" element={<OperationsView />} />
            <Route path="/config" element={<ConfigurationsView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
