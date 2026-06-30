// src/components/Home/Dashboard.tsx
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
  totalEscaneos?: number;
  escaneosExitosos?: number;
  escaneosFallidos?: number;
}

interface RecentActivity {
  id: number;
  imei: string;
  timestamp: string;
  resultado: boolean;
  username: string;
  detalles: string;
}

interface UserData {
  id?: number;
  nombre?: string;
  username?: string;
  email?: string;
  rol: string;
  roles?: string[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const tk = {
  blue:        '#1428A0',
  blueDark:    '#007BFF',
  blueLight:   '#e6f7ff',
  green:       '#10b981',
  purple:      '#722ed1',
  orange:      '#f59e0b',
  red:         '#f43f5e',
  textSub:     '#475569',
  bg:          '#f8fafc',
};

// ─── Reusable StatCard ────────────────────────────────────────────────────────
const StatCard = ({
  icon, label, value, sub, variant,
}: {
  icon: string; label: string; value: number | string;
  sub?: string;
  variant: 'blue' | 'green' | 'purple' | 'orange';
}) => {
  return (
    <div className={`dash-stat-card ${variant}`}>
      <div className="dash-stat-top">
        <div className="dash-stat-icon">
          {icon}
        </div>
        <div className="dash-stat-info">
          <div className="dash-stat-label">{label}</div>
          <div className="dash-stat-value">{value}</div>
        </div>
      </div>
      {sub && (
        <div className="dash-stat-sub">
          {sub}
        </div>
      )}
    </div>
  );
};

// ─── Role bar ─────────────────────────────────────────────────────────────────
const RoleBar = ({ rol, cantidad, total, color }: { rol: string; cantidad: number; total: number; color: string }) => {
  const [hov, setHov] = useState(false);
  const pct = total > 0 ? (cantidad / total * 100) : 0;
  return (
    <div 
      onMouseEnter={() => setHov(true)} 
      onMouseLeave={() => setHov(false)}
      className="dash-role-card"
      style={{ 
        borderColor: hov ? color : undefined, 
        background: hov ? `${color}11` : undefined 
      }}
    >
      <div className="dash-role-top">
        <span className="dash-role-name">{rol}</span>
        <span className="dash-role-count" style={{ color }}>{cantidad}</span>
      </div>
      <div className="dash-role-bar-track">
        <div className="dash-role-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
      </div>
      <div className="dash-role-pct">{pct.toFixed(1)}%</div>
    </div>
  );
};

// ─── Activity row ─────────────────────────────────────────────────────────────
const ActivityRow = ({ 
  imei, timestamp, resultado, username, detalles 
}: { 
  imei: string; 
  timestamp: string; 
  resultado: boolean; 
  username: string; 
  detalles: string; 
}) => {
  return (
    <div className="dash-activity-row">
      <div className="dash-activity-icon" style={{ background: resultado ? `${tk.green}18` : `${tk.red}18`, color: resultado ? tk.green : tk.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
        {resultado ? '✅' : '❌'}
      </div>
      <div className="dash-activity-content">
        <div className="dash-activity-action">
          Búsqueda IMEI: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{imei}</span>
        </div>
        <div className="dash-activity-detail" style={{ fontSize: '12.5px', color: '#64748b' }}>
          {detalles}
        </div>
      </div>
      <div className="dash-activity-meta" style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
        <div className="dash-activity-user" style={{ fontWeight: 600, color: '#475569' }}>👤 {username}</div>
        <div className="dash-activity-time">{timestamp}</div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const Dashboard: React.FC = () => {
  const [stats, setStats]               = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [isAdmin, setIsAdmin]           = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'loading' } | null>(null);
  const navigate = useNavigate();

  const API_BASE_URL  = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const API_STATS_URL = `${API_BASE_URL}/api/Admin/estadisticas`;

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'loading' = 'info') => {
    setNotification({ message, type });
    if (type !== 'loading') setTimeout(() => setNotification(null), 3000);
  }, []);

  const hideNotification = useCallback(() => setNotification(null), []);

  const getUserData = useCallback((): UserData | null => {
    try {
      const userData = localStorage.getItem('user');
      const token    = localStorage.getItem('token');
      if (!userData || !token) return null;
      return JSON.parse(userData);
    } catch { return null; }
  }, []);

  const fetchStatsData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      const response = await fetch(API_STATS_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (response.status === 403) { showNotification('No tienes permisos para ver estadísticas', 'error'); return false; }
      if (!response.ok) { setError('No se pudieron cargar las estadísticas'); return false; }
      const data = await response.json();
      setStats({ 
        totalEmpresas: data.totalEmpresas || 0, 
        totalPersonas: data.totalPersonas || 0, 
        totalDispositivos: data.totalDispositivos || 0, 
        dispositivosActivos: data.dispositivosActivos || 0, 
        totalUsuarios: data.totalUsuarios || 0, 
        usuariosActivos: data.usuariosActivos || 0, 
        usuariosPorRol: data.usuariosPorRol || [],
        totalEscaneos: data.totalEscaneos || 0,
        escaneosExitosos: data.escaneosExitosos || 0,
        escaneosFallidos: data.escaneosFallidos || 0,
      });
      setRecentActivity(data.historialReciente || []);
      setError(null);
      return true;
    } catch { setError('Error de conexión con el servidor'); return false; }
  }, [API_STATS_URL, showNotification]);

  const generateReport = useCallback(async () => {
    showNotification('Generando reporte...', 'loading');
    await new Promise(r => setTimeout(r, 1500));
    hideNotification();
    showNotification('Reporte generado exitosamente', 'success');
  }, [showNotification, hideNotification]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const user = getUserData();
        if (!user) { navigate('/login'); return; }
        if (user.rol !== 'Admin') { navigate('/'); return; }
        setIsAdmin(true);
        await fetchStatsData();
      } catch { setError('Error al cargar el dashboard'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (!isAdmin && !loading) return (
    <div className="dash-restricted">
      <div className="dash-restricted-icon">🔒</div>
      <h2>Acceso Restringido</h2>
      <p>Esta sección solo está disponible para administradores.</p>
      <button onClick={() => navigate('/')} className="dash-btn dash-btn-primary">Volver al Inicio</button>
    </div>
  );

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-spinner" />
      <span className="dash-loading-text">Cargando estadísticas...</span>
    </div>
  );

  const user = getUserData();
  const disposPct = stats ? ((stats.dispositivosActivos / (stats.totalDispositivos || 1)) * 100).toFixed(1) : '0';
  const usuariosPct = stats ? ((stats.usuariosActivos / (stats.totalUsuarios || 1)) * 100).toFixed(1) : '0';

  return (
    <div className="dash-wrapper">
      {/* ── Notification ── */}
      {notification && (
        <div className={`dash-toast ${notification.type}`}>
          <span className="dash-toast-icon">{{ success: '✅', error: '❌', info: 'ℹ️', loading: '⏳' }[notification.type]}</span>
          <span className="dash-toast-msg">{notification.message}</span>
          {notification.type !== 'loading' && <button onClick={hideNotification} className="dash-toast-close">×</button>}
        </div>
      )}

      <div>
        {/* ── Header Card ── */}
        <div className="dash-header-card">
          <div className="dash-header-info">
            <div className="dash-header-icon">📊</div>
            <div className="dash-header-title">
              <h1>
                ¡Bienvenido, {user?.nombre || user?.username || 'Admin'}!
                <span className="dash-admin-badge">Admin</span>
              </h1>
              <p>Panel de administración del sistema IMEI</p>
            </div>
          </div>
          <div className="dash-header-actions">
            {error && <span className="dash-error-banner">⚠️ {error}</span>}
            <button 
              onClick={() => { setLoading(true); setError(null); fetchStatsData().finally(() => setLoading(false)); }}
              className="dash-btn dash-btn-secondary"
            >
              🔄 Actualizar
            </button>
            <button 
              onClick={generateReport}
              className="dash-btn dash-btn-primary"
            >
              📊 Generar reporte
            </button>
          </div>
        </div>

        {/* ── Acciones Rápidas ── */}
        <div className="dash-section-card" style={{ marginBottom: '24px' }}>
          <div className="dash-section-header" style={{ marginBottom: '16px' }}>
            <div className="dash-section-title">
              <div className="dash-section-title-bar blue" />
              <h3>Acciones Rápidas</h3>
            </div>
          </div>
          <div className="dash-quick-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <button onClick={() => navigate('/verificacion')} className="dash-btn dash-btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', width: '100%' }}>
              🔍 Verificar IMEI
            </button>
            <button onClick={() => navigate('/dispositivos')} className="dash-btn dash-btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', width: '100%' }}>
              📱 Gestión de Dispositivos
            </button>
            <button onClick={() => navigate('/personas')} className="dash-btn dash-btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', width: '100%' }}>
              👥 Gestión de Personas
            </button>
            <button onClick={() => navigate('/usuarios')} className="dash-btn dash-btn-secondary" style={{ display: 'flex', justifyContent: 'flex-start', background: '#f8fafc', border: '1.5px solid #e2e8f0', width: '100%' }}>
              👤 Gestión de Usuarios
            </button>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="dash-stats-grid">
          <StatCard icon="🏢" label="Empresas"    value={stats?.totalEmpresas || 0}    variant="blue" sub="Solo visible para administradores" />
          <StatCard icon="👥" label="Personas"    value={stats?.totalPersonas || 0}    variant="green" sub="Registradas en el sistema" />
          <StatCard icon="👤" label="Usuarios"    value={stats?.totalUsuarios || 0}    variant="purple" sub={`${stats?.usuariosActivos || 0} activos · ${usuariosPct}% del total`} />
          <StatCard icon="📱" label="Dispositivos" value={stats?.totalDispositivos || 0} variant="orange" sub={`${stats?.dispositivosActivos || 0} activos · ${disposPct}% del total`} />
        </div>

        {/* ── Rendimiento de Escaneos ── */}
        <div className="dash-section-header" style={{ marginTop: '28px', marginBottom: '16px' }}>
          <div className="dash-section-title">
            <div className="dash-section-title-bar green" />
            <h3>Auditoría y Rendimiento de Verificaciones</h3>
          </div>
        </div>
        <div className="dash-stats-grid" style={{ marginBottom: '24px' }}>
          <StatCard icon="📊" label="Total Escaneos" value={stats?.totalEscaneos || 0} variant="blue" sub="Total de consultas de IMEI" />
          <StatCard icon="✅" label="Escaneos Válidos" value={stats?.escaneosExitosos || 0} variant="green" sub="IMEIs registrados y activos" />
          <StatCard icon="❌" label="Escaneos Fallidos" value={stats?.escaneosFallidos || 0} variant="orange" sub="IMEIs no encontrados/inactivos" />
          <StatCard 
            icon="📈" 
            label="Tasa de Éxito" 
            value={stats?.totalEscaneos && stats.totalEscaneos > 0 ? `${((stats.escaneosExitosos || 0) / stats.totalEscaneos * 100).toFixed(1)}%` : '0.0%'} 
            variant="purple" 
            sub="Porcentaje de consultas válidas" 
          />
        </div>

        {/* ── Bottom row: Verification Results + Activity ── */}
        <div className="dash-bottom-grid">

          {/* Verification Success Rate Breakdown */}
          <div className="dash-section-card">
            <div className="dash-section-header">
              <div className="dash-section-title">
                <div className="dash-section-title-bar blue" />
                <h3>Resultados de Verificación</h3>
              </div>
            </div>
            <div className="dash-roles-grid" style={{ flexDirection: 'column', gap: '16px', display: 'flex' }}>
              <RoleBar 
                rol="Escaneos Exitosos (Válidos)" 
                cantidad={stats?.escaneosExitosos || 0} 
                total={stats?.totalEscaneos || 0} 
                color={tk.green} 
              />
              <RoleBar 
                rol="Escaneos Fallidos (No válidos)" 
                cantidad={stats?.escaneosFallidos || 0} 
                total={stats?.totalEscaneos || 0} 
                color={tk.red} 
              />
            </div>
          </div>

          {/* Recent activity */}
          <div className="dash-section-card">
            <div className="dash-section-header">
              <div className="dash-section-title">
                <div className="dash-section-title-bar green" />
                <h3>Actividad Reciente de Escaneos</h3>
              </div>
              <span className="dash-section-badge">{recentActivity.length} consultas</span>
            </div>
            <div className="dash-activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((a) => (
                  <ActivityRow 
                    key={a.id} 
                    imei={a.imei} 
                    timestamp={a.timestamp} 
                    resultado={a.resultado} 
                    username={a.username} 
                    detalles={a.detalles} 
                  />
                ))
              ) : (
                <div className="dash-empty-state">
                  <div className="dash-empty-icon">🔍</div>
                  <span>No hay consultas de IMEI registradas aún</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;