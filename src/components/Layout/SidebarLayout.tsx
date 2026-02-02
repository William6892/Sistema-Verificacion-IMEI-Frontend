// src/components/Layout/SidebarLayout.tsx - VERSIÓN CON PROPS
import React, { useState, useEffect, ReactNode } from 'react';
import './SidebarLayout.css';

interface SidebarLayoutProps {
  children: ReactNode;
  user: any;
  currentPage: string; // Añadir esta prop
  onPageChange: (page: string) => void; // Añadir esta prop
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
  currentPage, // Recibir la prop
  onPageChange // Recibir la prop
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

    if (window.innerWidth > 768) {
      setIsSidebarOpen(false);
    }

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
        roles: ['Admin', 'Supervisor', 'Usuario']
      },
      {
        id: 'empresas',
        label: 'Empresas',
        icon: '🏢',
        roles: ['Admin', 'Supervisor']
      },
      {
        id: 'personas',
        label: 'Personas',
        icon: '👥',
        roles: ['Admin', 'Supervisor']
      },
      {
        id: 'dispositivos',
        label: 'Dispositivos',
        icon: '📲',
        roles: ['Admin', 'Supervisor']
      },
      {
        id: 'verificacion',
        label: 'Verificar IMEI',
        icon: '🔍',
        roles: ['Admin', 'Supervisor', 'Usuario']
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
    localStorage.clear();
    window.location.href = '/login';
  };

  const handlePageChange = (page: string) => {
    onPageChange(page); // Llamar a la función padre
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
      'Admin': 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      'Supervisor': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
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
            <p className="user-email">{user?.email || ''}</p>
          </div>
        </div>

        <div className="sidebar-divider"></div>

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
            <div className="no-permissions">
              <span className="menu-icon">🔒</span>
              <span className="menu-label">Sin permisos disponibles</span>
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="menu-item logout-btn"
            onClick={handleLogout}
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