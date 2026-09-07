import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Submit from './pages/Submit'
import RiceDetail from './pages/RiceDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/submit" element={<Submit />} />
      <Route path="/rice/:id" element={<RiceDetail />} />
    </Routes>
  )
}

export default App
