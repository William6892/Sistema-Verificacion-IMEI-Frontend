// src/components/Layout/MainLayout.tsx
import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const getUserFromStorage = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };
  
  const user = getUserFromStorage();
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const getCurrentPageFromUrl = () => {
    const path = location.pathname;
    if (path === '/') return 'inicio';
    if (path.includes('empresas')) return 'empresas';
    if (path.includes('personas')) return 'personas';
    if (path.includes('dispositivos')) return 'dispositivos';
    if (path.includes('verificacion')) return 'verificacion';
    if (path.includes('usuarios')) return 'usuarios'; // AÑADIR ESTA LÍNEA
    return 'inicio';
  };
  
  const handlePageChange = (page: string) => {
    const routes: Record<string, string> = {
      inicio: '/',
      empresas: '/empresas',
      personas: '/personas',
      dispositivos: '/dispositivos',
      verificacion: '/verificacion',
      usuarios: '/usuarios' // AÑADIR ESTA LÍNEA
    };
    navigate(routes[page] || '/');
  };
  
  if (!user) return <div>Cargando...</div>;
  
  return (
    <SidebarLayout
      user={user}
      currentPage={getCurrentPageFromUrl()}
      onPageChange={handlePageChange}
    >
      {/* Pasar userRole a TODOS los componentes hijos */}
      <Outlet context={{ userRole: user.rol }} />
    </SidebarLayout>
  );
};

export default MainLayout;