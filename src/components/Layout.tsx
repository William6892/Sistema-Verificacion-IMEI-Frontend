// src/components/Layout.tsx
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
  user: any;
  onLogout: () => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  currentView,
  setCurrentView 
}) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* Header */}
      <header style={{
        background: 'white',
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <h1 style={{ 
              margin: 0, 
              color: '#1890ff',
              fontSize: '20px',
              fontWeight: '600'
            }}>
              📱 IMEI System
            </h1>
            
            {/* Navegación */}
            <nav style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCurrentView('home')}
                style={{
                  padding: '8px 16px',
                  background: currentView === 'home' ? '#1890ff' : 'transparent',
                  color: currentView === 'home' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: currentView === 'home' ? '600' : '400'
                }}
              >
                🏠 Inicio
              </button>
              
              <button
                onClick={() => setCurrentView('verificar')}
                style={{
                  padding: '8px 16px',
                  background: currentView === 'verificar' ? '#1890ff' : 'transparent',
                  color: currentView === 'verificar' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: currentView === 'verificar' ? '600' : '400'
                }}
              >
                📱 Verificar IMEI
              </button>
              
              <button
                onClick={() => setCurrentView('empresas')}
                style={{
                  padding: '8px 16px',
                  background: currentView === 'empresas' ? '#1890ff' : 'transparent',
                  color: currentView === 'empresas' ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: currentView === 'empresas' ? '600' : '400'
                }}
              >
                🏢 Empresas
              </button>
            </nav>
          </div>
          
          {/* Información del usuario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', color: '#333' }}>
                {user?.nombre || 'Usuario'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Rol: <strong>{user?.rol || 'User'}</strong>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              style={{
                padding: '6px 16px',
                background: '#ff4d4f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;