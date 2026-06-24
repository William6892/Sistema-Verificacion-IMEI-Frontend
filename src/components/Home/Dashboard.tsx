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
const ActivityRow = ({ action, user, timestamp, details, index }: { action: string; user: string; timestamp: string; details?: string; index: number }) => {
  const colors = [tk.blue, tk.green, tk.orange, tk.purple, tk.red];
  const color = colors[index % colors.length];
  return (
    <div className="dash-activity-row">
      <div className="dash-activity-icon" style={{ background: `${color}18` }}>
        {index === 0 ? '👤' : index === 1 ? '📱' : index === 2 ? '📊' : '🏢'}
      </div>
      <div className="dash-activity-content">
        <div className="dash-activity-action">{action}</div>
        <div className="dash-activity-detail">{details}</div>
      </div>
      <div className="dash-activity-meta">
        <div className="dash-activity-user">{user}</div>
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

  const fetchRecentActivity = useCallback(async () => {
    setRecentActivity([
      { id: 1, action: 'Usuario registrado',    user: 'Juan Pérez',    timestamp: '10:30 AM', details: 'Nuevo usuario administrador' },
      { id: 2, action: 'Dispositivo verificado', user: 'María García',  timestamp: '09:15 AM', details: 'IMEI 123456789012345 verificado' },
      { id: 3, action: 'Reporte generado',       user: 'Carlos López',  timestamp: 'Ayer, 4:20 PM', details: 'Reporte mensual de dispositivos' },
      { id: 4, action: 'Empresa creada',         user: 'Admin Sistema', timestamp: 'Ayer, 2:45 PM', details: 'Nueva empresa registrada: TechCorp' },
    ]);
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
        usuariosPorRol: data.usuariosPorRol || [] 
      });
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
        await Promise.all([fetchStatsData(), fetchRecentActivity()]);
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
  const roleColors = [tk.blue, tk.green, tk.purple, tk.orange, tk.red];

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

        {/* ── Stats grid ── */}
        <div className="dash-stats-grid">
          <StatCard icon="🏢" label="Empresas"    value={stats?.totalEmpresas || 0}    variant="blue" sub="Solo visible para administradores" />
          <StatCard icon="👥" label="Personas"    value={stats?.totalPersonas || 0}    variant="green" sub="Registradas en el sistema" />
          <StatCard icon="👤" label="Usuarios"    value={stats?.totalUsuarios || 0}    variant="purple" sub={`${stats?.usuariosActivos || 0} activos · ${usuariosPct}% del total`} />
          <StatCard icon="📱" label="Dispositivos" value={stats?.totalDispositivos || 0} variant="orange" sub={`${stats?.dispositivosActivos || 0} activos · ${disposPct}% del total`} />
        </div>

        {/* ── Bottom row: Roles + Activity ── */}
        <div className="dash-bottom-grid">

          {/* Roles distribution */}
          <div className="dash-section-card">
            <div className="dash-section-header">
              <div className="dash-section-title">
                <div className="dash-section-title-bar blue" />
                <h3>Distribución por Rol</h3>
              </div>
            </div>
            {stats?.usuariosPorRol && stats.usuariosPorRol.length > 0 ? (
              <div className="dash-roles-grid">
                {stats.usuariosPorRol.map((r, i) => (
                  <RoleBar key={r.rol} rol={r.rol} cantidad={r.cantidad} total={stats.totalUsuarios} color={roleColors[i % roleColors.length]} />
                ))}
              </div>
            ) : (
              <div className="dash-empty-state">
                <div className="dash-empty-icon">📊</div>
                <span>Sin datos de roles disponibles</span>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="dash-section-card">
            <div className="dash-section-header">
              <div className="dash-section-title">
                <div className="dash-section-title-bar green" />
                <h3>Actividad Reciente</h3>
              </div>
              <span className="dash-section-badge">{recentActivity.length} eventos</span>
            </div>
            <div className="dash-activity-list">
              {recentActivity.map((a, i) => (
                <ActivityRow key={a.id} action={a.action} user={a.user} timestamp={a.timestamp} details={a.details} index={i} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;