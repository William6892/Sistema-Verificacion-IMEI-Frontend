// MainLayout.tsx - VERSIÓN CORREGIDA SIMPLE
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SidebarLayout from './SidebarLayout';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ CORRECTO: Cargar user una sola vez
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userStr || !token) {
          localStorage.clear();
          navigate('/login', { replace: true });
          return;
        }
        
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch {
        localStorage.clear();
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [navigate]); // ✅ Solo se ejecuta al montar

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f5f7fa',
        fontSize: '18px',
        color: '#666'
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) {
    return null; // Ya se redirigió al login
  }

  const getCurrentPageFromUrl = () => {
    const path = location.pathname;
    if (path === '/') return 'inicio';
    if (path.includes('empresas')) return 'empresas';
    if (path.includes('personas')) return 'personas';
    if (path.includes('dispositivos')) return 'dispositivos';
    if (path.includes('verificacion')) return 'verificacion';
    if (path.includes('usuarios')) return 'usuarios';
    return 'inicio';
  };

  const handlePageChange = (page: string) => {
    const routes: Record<string, string> = {
      inicio: '/',
      empresas: '/empresas',
      personas: '/personas',
      dispositivos: '/dispositivos',
      verificacion: '/verificacion',
      usuarios: '/usuarios'
    };
    navigate(routes[page] || '/');
  };

  return (
    <SidebarLayout
      user={user}
      currentPage={getCurrentPageFromUrl()}
      onPageChange={handlePageChange}
    >
      <Outlet context={{ userRole: user.rol }} />
    </SidebarLayout>
  );
};

export default MainLayout;