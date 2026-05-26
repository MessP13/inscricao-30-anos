import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InscricaoForm from './inscricao/InscricaoForm'
import AdminPanel from './inscricao/AdminPanel'
import HistoricoForm from './historico/HistoricoForm'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inscricao" replace />} />
        <Route path="/inscricao" element={<InscricaoForm />} />
        <Route path="/historico" element={<HistoricoForm />} />
        <Route path="/historia" element={<Navigate to="/historico" replace />} />
        <Route path="/admin" element={<AdminPanel onBack={() => { window.location.href = '/inscricao' }} />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
