// src/components/Layout/SidebarLayout.tsx - VERSIÓN CON LOGO SAMSUNG
import React, { useState, useEffect, ReactNode } from 'react';
import './SidebarLayout.css';
// Importar el logo (ajusta la ruta según donde tengas la imagen)
import samsungLogo from '../../assets/logo.jpg';

interface SidebarLayoutProps {
  children: ReactNode;
  user: any;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void; 
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  roles: string[];
}

const SidebarLayout: React.FC<SidebarLayoutProps> = ({ 
  children, 
  user,
  currentPage,
  onPageChange,
  onLogout
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // Detectar si es móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Configurar menú según el rol del usuario
  useEffect(() => {
    const userRole = user?.rol || 'Usuario';
    
    const allMenuItems: MenuItem[] = [
      {
        id: 'inicio',
        label: 'Inicio',
        icon: '🏠',
        roles: ['Admin', 'Usuario']
      },
      {
        id: 'empresas',
        label: 'Empresas',
        icon: '🏢',
        roles: ['Admin']
      },
      {
        id: 'personas',
        label: 'Personas',
        icon: '👥',
        roles: ['Admin']
      },
      {
        id: 'dispositivos',
        label: 'Dispositivos',
        icon: '📲',
        roles: ['Admin']
      },
      {
        id: 'verificacion',
        label: 'Verificar IMEI',
        icon: '🔍',
        roles: ['Admin', 'Usuario']
      },
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: '👤',
        roles: ['Admin']
      },
    ];

    const filteredItems = allMenuItems.filter(item => 
      item.roles.includes(userRole)
    );

    setMenuItems(filteredItems);
  }, [user]);

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.clear();
    
    // Si se proporcionó una función de logout personalizada, usarla
    if (onLogout) {
      onLogout();
      return;
    }
    
    // Redirigir a la página de login del frontend
    window.location.href = `${window.location.origin}/#/login`;
  };

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: { [key: string]: string } = {
      'Admin': 'Administrador',
      'Supervisor': 'Supervisor',
      'Usuario': 'Usuario'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      'Admin': 'linear-gradient(135deg, #1497be 0%, #dc2626 100%)',
      'Usuario': 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
    };
    return colors[role] || '#6b7280';
  };

  return (
    <div className="sidebar-layout">
      {/* Overlay para móvil */}
      {isMobile && isSidebarOpen && (
        <div 
          className="sidebar-overlay active"
          onClick={closeSidebar}
        />
      )}

      {/* Botón hamburguesa para móvil */}
      {isMobile && (
        <button 
          className="mobile-menu-toggle"
          onClick={toggleSidebar}
          aria-label="Abrir menú"
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Sidebar con estilo Samsung */}
      <aside 
        className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
        style={{
          background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2b4f 100%)',
        }}
      >
        <div className="sidebar-header">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'white',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img 
                src={samsungLogo} 
                alt="Samsung Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }} 
              />
            </div>
            <h2 style={{ 
              margin: 0, 
              color: 'white', 
              fontSize: '18px',
              fontWeight: '600'
            }}>
              IMEI System
            </h2>
          </div>
          
          {isMobile && (
            <button 
              className="sidebar-close-btn"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
              style={{ color: 'white' }}
            >
              ✕
            </button>
          )}
        </div>

        <div className="user-info" style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          margin: '16px',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="user-avatar" style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #1428A0 0%, #3b82f6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: '600',
            color: 'white'
          }}>
            {user?.nombre?.charAt(0)?.toUpperCase() || 
             user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <h4 style={{ 
              margin: '0 0 4px 0', 
              color: 'white', 
              fontSize: '16px',
              fontWeight: '500'
            }}>
              {user?.nombre || user?.username || 'Usuario'}
            </h4>
            <div className="user-role-badge" style={{
              background: getRoleBadgeColor(user?.rol || 'Usuario'),
              color: 'white',
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              display: 'inline-block'
            }}>
              {getRoleDisplayName(user?.rol || 'Usuario')}
            </div>
          </div>
        </div>

        <nav className="sidebar-menu" style={{ padding: '8px 16px' }}>
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <button
                key={item.id}
                className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handlePageChange(item.id)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  background: currentPage === item.id ? 'rgba(37, 99, 235, 0.15)' : 'none',
                  color: 'white',
                  textAlign: 'left',
                  fontSize: '15px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderLeft: currentPage === item.id ? '4px solid #1428A0' : '4px solid transparent',
                  borderRadius: '8px',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <span className="menu-icon" style={{ fontSize: '20px', minWidth: '24px' }}>
                  {item.icon}
                </span>
                <span className="menu-label" style={{ fontWeight: '500' }}>{item.label}</span>
              </button>
            ))
          ) : (
            <div className="menu-item" style={{
              padding: '14px 16px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              opacity: 0.6
            }}>
              <span className="menu-icon">🔒</span>
              <span className="menu-label">Sin permisos disponibles</span>
            </div>
          )}
        </nav>

        {/* Botón de logout */}
        <div className="sidebar-footer" style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            className="menu-item logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fee2e2',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#fee2e2';
            }}
          >
            <span className="menu-icon" style={{ fontSize: '18px' }}>🚪</span>
            <span className="menu-label">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content" style={{
        marginLeft: isMobile ? 0 : '300px',
        padding: '24px',
        transition: 'margin-left 0.3s ease'
      }}>
        {children}
      </main>

      {/* Estilos adicionales */}
      <style>{`
        .sidebar {
          width: 300px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          transition: transform 0.3s ease;
          z-index: 1000;
          overflow-y: auto;
        }
        
        .mobile-menu-toggle {
          position: fixed;
          top: 16px;
          left: 16px;
          width: 44px;
          height: 44px;
          background: #1428A0;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 24px;
          cursor: pointer;
          z-index: 1001;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(20, 40, 160, 0.3);
        }
        
        .sidebar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        .sidebar-overlay.active {
          opacity: 1;
          visibility: visible;
        }
        
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
          
          .main-content {
            margin-left: 0 !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SidebarLayout;