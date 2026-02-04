// src/components/Home/Dashboard.tsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

interface DashboardStats {
  totalEmpresas: number;
  totalPersonas: number;
  totalDispositivos: number;
  dispositivosActivos: number;
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosPorRol: Array<{ rol: string; cantidad: number }>;
}

interface RecentActivity {
  id: number;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

interface UserData {
  id?: number;
  nombre?: string;
  username?: string;
  email?: string;
  rol: string;
  roles?: string[];
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info' | 'loading'} | null>(null);
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const API_STATS_URL = `${API_BASE_URL}/api/Admin/estadisticas`;

  // ✅ Función para mostrar notificaciones
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'loading' = 'info') => {
    setNotification({ message, type });
    
    if (type !== 'loading') {
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    }
  }, []);

  //  Función para ocultar notificación
  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  // ✅ Función para obtener y validar usuario
  const getUserData = useCallback((): UserData | null => {
    try {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        return null;
      }
      
      const parsed = JSON.parse(userData);
      return parsed;
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      return null;
    }
  }, []);

  //  Función para obtener actividad reciente
  const fetchRecentActivity = useCallback(async () => {
    try {
      const mockActivity: RecentActivity[] = [
        {
          id: 1,
          action: 'Usuario registrado',
          user: 'Juan Pérez',
          timestamp: '10:30 AM',
          details: 'Nuevo usuario administrador'
        },
        {
          id: 2,
          action: 'Dispositivo verificado',
          user: 'María García',
          timestamp: '09:15 AM',
          details: 'IMEI 123456789012345 verificado'
        },
        {
          id: 3,
          action: 'Reporte generado',
          user: 'Carlos López',
          timestamp: 'Ayer, 4:20 PM',
          details: 'Reporte mensual de dispositivos'
        },
        {
          id: 4,
          action: 'Empresa creada',
          user: 'Admin Sistema',
          timestamp: 'Ayer, 2:45 PM',
          details: 'Nueva empresa registrada: TechCorp'
        }
      ];
      
      setRecentActivity(mockActivity);
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  }, []);

  //  Función separada para obtener estadísticas
  const fetchStatsData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }
      
      const response = await fetch(API_STATS_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 403) {
        showNotification('No tienes permisos para ver estadísticas', 'error');
        return false;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response error:', errorText);
        setError('No se pudieron cargar las estadísticas del servidor');
        return false;
      }

      const data = await response.json();
      
      setStats({
        totalEmpresas: data.totalEmpresas || 0,
        totalPersonas: data.totalPersonas || 0,
        totalDispositivos: data.totalDispositivos || 0,
        dispositivosActivos: data.dispositivosActivos || 0,
        totalUsuarios: data.totalUsuarios || 0,
        usuariosActivos: data.usuariosActivos || 0,
        usuariosPorRol: data.usuariosPorRol || []
      });

      setError(null);
      return true;
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('No se pudieron cargar las estadísticas del servidor');
      return false;
    }
  }, [API_STATS_URL, showNotification]);

  // ✅ Acciones solo para admin
  const handleQuickAction = useCallback((action: string) => {
    switch(action) {
      case 'verificar':
        navigate('/verificacion');
        break;
      case 'reporte':
        generateReport();
        break;
      default:
        break;
    }
  }, [navigate]);

  const generateReport = useCallback(async () => {
    try {
      showNotification('Generando reporte...', 'loading');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      hideNotification();
      showNotification('Reporte generado exitosamente', 'success');
      
    } catch (err) {
      console.error('Error generating report:', err);
      showNotification('Error al generar reporte', 'error');
    }
  }, [showNotification, hideNotification]);

  // ✅ EFECTO PRINCIPAL - VERIFICAR ACCESO Y CARGAR DATOS
  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      
      try {
        // 1. Verificar autenticación
        const user = getUserData();
        if (!user) {
          navigate('/login');
          return;
        }

        // 2. Verificar si es admin
        if (user.rol !== 'Admin') {
          showNotification('Acceso denegado. Solo administradores', 'error');
          navigate('/'); // Redirigir a inicio en lugar de página especial
          return;
        }

        // 3. Es admin, configurar estado
        setIsAdmin(true);

        // 4. Cargar datos en paralelo
        await Promise.all([
          fetchStatsData(),
          fetchRecentActivity()
        ]);
        
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setError('Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []); // ← Array vacío: solo se ejecuta al montar

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetchStatsData();
  };

  //  Si no es admin, mostrar mensaje
  if (!isAdmin && !loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', color: '#ef4444' }}>🔒</div>
        <h2 style={{ color: '#1e293b', margin: 0 }}>Acceso Restringido</h2>
        <p style={{ color: '#64748b', maxWidth: '400px' }}>
          Esta sección solo está disponible para administradores del sistema.
        </p>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // Mostrar loading mientras carga datos
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas de administración...</p>
      </div>
    );
  }

  // Obtener usuario actual
  const user = getUserData();

  //  Función para renderizar notificación
  const renderNotification = () => {
    if (!notification) return null;

    const bgColor = {
      success: '#10b981',
      error: '#ef4444',
      info: '#3b82f6',
      loading: '#f59e0b'
    }[notification.type];

    const icon = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      loading: '⏳'
    }[notification.type];

    return (
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: bgColor,
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '300px',
        animation: 'slideIn 0.3s ease'
      }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ flex: 1 }}>{notification.message}</span>
        {notification.type !== 'loading' && (
          <button 
            onClick={hideNotification}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        )}
        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  };

  return (
    <>
      {renderNotification()}
      <div className="dashboard-container">
        {/* Header con badge de Admin */}
        <div className="dashboard-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
              <h1 className="dashboard-title">
                ¡Bienvenido, {user?.nombre || user?.username || 'Admin'}!
              </h1>
              <span style={{
                padding: '4px 12px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Admin
              </span>
            </div>
            <p className="dashboard-subtitle">
              Panel de administración del sistema IMEI
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {error && (
              <span style={{ 
                color: '#dc2626', 
                fontSize: '14px',
                padding: '8px 12px',
                background: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                ⚠️ {error}
              </span>
            )}
            <button 
              onClick={handleRefresh}
              className="refresh-button"
            >
              <span>🔄</span>
              Actualizar
            </button>
          </div>
        </div>

        {/* Stats Grid - Usando tu CSS */}
        <div className="stats-grid">
          {/* Card: Empresas */}
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">🏢</div>
              <div className="stat-text">
                <p className="stat-label">Empresas</p>
                <h2 className="stat-value">
                  {stats?.totalEmpresas || 0}
                </h2>
              </div>
            </div>
            <div className="stat-info">
              Solo visible para administradores
            </div>
          </div>

          {/* Card: Personas */}
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">👥</div>
              <div className="stat-text">
                <p className="stat-label">Personas</p>
                <h2 className="stat-value">
                  {stats?.totalPersonas || 0}
                </h2>
              </div>
            </div>
            <div className="stat-info">
              Solo visible para administradores
            </div>
          </div>

          {/* Card: Usuarios */}
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">👤</div>
              <div className="stat-text">
                <p className="stat-label">Usuarios</p>
                <h2 className="stat-value">
                  {stats?.totalUsuarios || 0}
                </h2>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '12px', 
              background: '#faf5ff', 
              borderRadius: '8px',
              fontSize: '14px',
              marginTop: '12px'
            }}>
              <span style={{ color: '#7c3aed' }}>
                {stats?.usuariosActivos || 0} activos
              </span>
              <span style={{ color: '#8b5cf6' }}>
                {((stats?.usuariosActivos || 0) / (stats?.totalUsuarios || 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Card: Dispositivos */}
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">📱</div>
              <div className="stat-text">
                <p className="stat-label">Dispositivos</p>
                <h2 className="stat-value">
                  {stats?.totalDispositivos || 0}
                </h2>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              padding: '12px', 
              background: '#f0f9ff', 
              borderRadius: '8px',
              fontSize: '14px',
              marginTop: '12px'
            }}>
              <span style={{ color: '#0369a1' }}>
                {stats?.dispositivosActivos || 0} activos
              </span>
              <span style={{ color: '#0ea5e9' }}>
                {((stats?.dispositivosActivos || 0) / (stats?.totalDispositivos || 1) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* User Roles Distribution - Solo para Admin */}
        {stats?.usuariosPorRol && stats.usuariosPorRol.length > 0 && (
          <div className="stat-card">
            <h3 style={{ 
              fontSize: '20px', 
              color: '#1e293b', 
              marginBottom: '25px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{
                background: '#dbeafe',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6',
                fontSize: '20px'
              }}>
                📊
              </span>
              Distribución de Usuarios por Rol
            </h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {stats.usuariosPorRol.map((rolData, index) => {
                const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={rolData.rol} style={{
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    flex: '1',
                    minWidth: '200px',
                    border: `2px solid ${color}20`,
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#64748b',
                      marginBottom: '10px',
                      fontWeight: '600'
                    }}>
                      {rolData.rol}
                    </div>
                    <div style={{ 
                      fontSize: '28px', 
                      fontWeight: '700',
                      color: color,
                      marginBottom: '10px'
                    }}>
                      {rolData.cantidad}
                    </div>
                    <div style={{
                      height: '8px',
                      background: '#e2e8f0',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(rolData.cantidad / stats.totalUsuarios) * 100}%`,
                        background: color,
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }}></div>
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#94a3b8',
                      marginTop: '8px',
                      textAlign: 'right'
                    }}>
                      {((rolData.cantidad / stats.totalUsuarios) * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default Dashboard;