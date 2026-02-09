// src/components/Layout/SidebarLayout.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, ReactNode } from 'react';
import './SidebarLayout.css';

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
        roles: ['Admin',]
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
    
    //  Usar la URL absoluta del frontend
    const frontendUrl = window.location.origin; 
    
    // Redirigir a la página de login del frontend
    window.location.href = `${frontendUrl}/login`;
    
    
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

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span>📱</span>
            <h2>IMEI System</h2>
          </div>
          
          {isMobile && (
            <button 
              className="sidebar-close-btn"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          )}
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {user?.nombre?.charAt(0)?.toUpperCase() || 
             user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <h4>{user?.nombre || user?.username || 'Usuario'}</h4>
            <div className="user-role-badge" style={{
              background: getRoleBadgeColor(user?.rol || 'Usuario'),
              color: 'white',
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontWeight: '600',
              letterSpacing: '0.3px',
              marginTop: '4px',
              display: 'inline-block'
            }}>
              {getRoleDisplayName(user?.rol || 'Usuario')}
            </div>
          </div>
        </div>

        <nav className="sidebar-menu">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <button
                key={item.id}
                className={`menu-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => handlePageChange(item.id)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-label">{item.label}</span>
              </button>
            ))
          ) : (
            <div className="menu-item">
              <span className="menu-icon">🔒</span>
              <span className="menu-label">Sin permisos disponibles</span>
            </div>
          )}
        </nav>

        {/* Botón de logout */}
        <div className="sidebar-footer">
          <button 
            className="menu-item logout-btn"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              maxWidth: '250px'
            }}
          >
            <span className="menu-icon">🚪</span>
            <span className="menu-label">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;