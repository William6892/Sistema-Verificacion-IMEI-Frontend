// src/App.tsx - Con wrappers y UserManagement
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './components/Home/Dashboard';
import EmpresasList from './components/Empresas/EmpresasList';
import PersonasList from './components/Personas/PersonasList';
import DispositivosList from './components/Dispositivos/DispositivosList';
import VerificacionIMEI from './components/Verificacion/VerificacionIMEI';
import UserManagement from './components/Admin/UserManagement'; // Importar nuevo componente
import './App.css';

// Wrappers que obtienen el userRole del localStorage
const EmpresasListWrapper = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <EmpresasList userRole={user.rol} />;
};

const PersonasListWrapper = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <PersonasList userRole={user.rol} />;
};

const DispositivosListWrapper = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <DispositivosList userRole={user.rol} />;
};

const VerificacionIMEIWrapper = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <VerificacionIMEI userRole={user.rol} />;
};

const UserManagementWrapper = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return <UserManagement userRole={user.rol} />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="empresas" element={<EmpresasListWrapper />} />
          <Route path="personas" element={<PersonasListWrapper />} />
          <Route path="dispositivos" element={<DispositivosListWrapper />} />
          <Route path="verificacion" element={<VerificacionIMEIWrapper />} />
          <Route path="usuarios" element={<UserManagementWrapper />} /> {/* Nueva ruta */}
        </Route>
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;