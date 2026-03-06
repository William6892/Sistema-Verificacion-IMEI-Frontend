// src/components/Home/Dashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

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
  blue:        '#1890ff',
  blueDark:    '#096dd9',
  blueLight:   '#e6f7ff',
  blueBorder:  '#91d5ff',
  green:       '#52c41a',
  greenBg:     '#f6ffed',
  greenBorder: '#b7eb8f',
  orange:      '#fa8c16',
  orangeBg:    '#fff7e6',
  purple:      '#722ed1',
  purpleBg:    '#f9f0ff',
  red:         '#ff4d4f',
  redBg:       '#fff2f0',
  text:        '#1a1a1a',
  textSub:     '#595959',
  textMuted:   '#8c8c8c',
  border:      '#f0f0f0',
  borderMd:    '#d9d9d9',
  bg:          '#f5f6fa',
  white:       '#ffffff',
  shadow:      '0 2px 12px rgba(0,0,0,0.07)',
  shadowMd:    '0 6px 24px rgba(0,0,0,0.10)',
};

// ─── Reusable StatCard ────────────────────────────────────────────────────────
const StatCard = ({
  icon, label, value, sub, subColor, accentColor, accentBg,
}: {
  icon: string; label: string; value: number | string;
  sub?: string; subColor?: string;
  accentColor: string; accentBg: string;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: tk.white,
        borderRadius: '16px',
        padding: '24px 28px',
        border: `1.5px solid ${hov ? accentColor : tk.border}`,
        boxShadow: hov ? `0 8px 28px ${accentColor}22` : tk.shadow,
        transition: 'all 0.22s ease',
        transform: hov ? 'translateY(-4px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* top accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`, borderRadius: '16px 16px 0 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: '52px', height: '52px', background: accentBg, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: tk.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '38px', fontWeight: 800, color: accentColor, lineHeight: 1 }}>{value}</div>
        </div>
      </div>

      {sub && (
        <div style={{ fontSize: '13px', color: subColor || tk.textMuted, background: accentBg, borderRadius: '8px', padding: '8px 12px', fontWeight: 500 }}>
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
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? `${color}11` : tk.bg, borderRadius: '12px', padding: '16px 20px', border: `1.5px solid ${hov ? color : tk.border}`, transition: 'all 0.2s', flex: 1, minWidth: '160px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontWeight: 700, fontSize: '14px', color: tk.text }}>{rol}</span>
        <span style={{ fontSize: '22px', fontWeight: 800, color }}>{cantidad}</span>
      </div>
      <div style={{ height: '7px', background: tk.border, borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: '4px', transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: '12px', color: tk.textMuted, marginTop: '5px' }}>{pct.toFixed(1)}%</div>
    </div>
  );
};

// ─── Activity row ─────────────────────────────────────────────────────────────
const ActivityRow = ({ action, user, timestamp, details, index }: { action: string; user: string; timestamp: string; details?: string; index: number }) => {
  const colors = [tk.blue, tk.green, tk.orange, tk.purple, tk.red];
  const color = colors[index % colors.length];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px 0', borderBottom: `1px solid ${tk.border}` }}>
      <div style={{ width: '38px', height: '38px', background: `${color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', flexShrink: 0 }}>
        {index === 0 ? '👤' : index === 1 ? '📱' : index === 2 ? '📊' : '🏢'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: tk.text }}>{action}</div>
        <div style={{ fontSize: '13px', color: tk.textMuted, marginTop: '2px' }}>{details}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '12px', color: tk.textMuted }}>{user}</div>
        <div style={{ fontSize: '12px', color: tk.textMuted, marginTop: '2px' }}>{timestamp}</div>
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
      setStats({ totalEmpresas: data.totalEmpresas || 0, totalPersonas: data.totalPersonas || 0, totalDispositivos: data.totalDispositivos || 0, dispositivosActivos: data.dispositivosActivos || 0, totalUsuarios: data.totalUsuarios || 0, usuariosActivos: data.usuariosActivos || 0, usuariosPorRol: data.usuariosPorRol || [] });
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px', padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px' }}>🔒</div>
      <h2 style={{ color: tk.text, margin: 0 }}>Acceso Restringido</h2>
      <p style={{ color: tk.textSub, maxWidth: '400px' }}>Esta sección solo está disponible para administradores.</p>
      <button onClick={() => navigate('/')} style={{ background: `linear-gradient(135deg, ${tk.blue}, ${tk.blueDark})`, color: 'white', border: 'none', padding: '12px 24px', borderRadius: '9px', cursor: 'pointer', fontWeight: 700, fontSize: '14px' }}>Volver al Inicio</button>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px', background: tk.bg }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '48px', height: '48px', border: `3px solid ${tk.blueLight}`, borderTop: `3px solid ${tk.blue}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <span style={{ color: tk.textSub, fontSize: '15px' }}>Cargando estadísticas...</span>
    </div>
  );

  const user = getUserData();
  const disposPct = stats ? ((stats.dispositivosActivos / (stats.totalDispositivos || 1)) * 100).toFixed(1) : '0';
  const usuariosPct = stats ? ((stats.usuariosActivos / (stats.totalUsuarios || 1)) * 100).toFixed(1) : '0';
  const roleColors = [tk.blue, tk.green, tk.purple, tk.orange, tk.red];

  return (
    <div style={{ minHeight: '100vh', background: tk.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Notification ── */}
      {notification && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: ({ success: '#10b981', error: '#ef4444', info: tk.blue, loading: tk.orange } as any)[notification.type], color: 'white', padding: '14px 20px', borderRadius: '10px', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px', animation: 'slideIn 0.3s ease' }}>
          <span style={{ fontSize: '18px' }}>{{ success: '✅', error: '❌', info: 'ℹ️', loading: '⏳' }[notification.type]}</span>
          <span style={{ flex: 1, fontSize: '14px', fontWeight: 500 }}>{notification.message}</span>
          {notification.type !== 'loading' && <button onClick={hideNotification} style={{ background: 'none', border: 'none', color: 'white', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>}
        </div>
      )}

      <div style={{ padding: '28px 32px', maxWidth: '100%' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                ¡Bienvenido, {user?.nombre || user?.username || 'Admin'}!
              </h1>
              <span style={{ padding: '4px 12px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', borderRadius: '20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase' }}>Admin</span>
            </div>
            <p style={{ margin: 0, color: tk.textMuted, fontSize: '15px' }}>Panel de administración del sistema IMEI</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {error && <span style={{ color: '#dc2626', fontSize: '13px', padding: '8px 12px', background: '#fef2f2', borderRadius: '7px', border: '1px solid #fecaca' }}>⚠️ {error}</span>}
            <button onClick={() => { setLoading(true); setError(null); fetchStatsData().finally(() => setLoading(false)); }}
              style={{ padding: '10px 18px', background: tk.white, color: tk.blue, border: `1.5px solid ${tk.blueBorder}`, borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: tk.shadow }}
              onMouseEnter={e => { e.currentTarget.style.background = tk.blueLight; }}
              onMouseLeave={e => { e.currentTarget.style.background = tk.white; }}>
              🔄 Actualizar
            </button>
            <button onClick={generateReport}
              style={{ padding: '10px 18px', background: `linear-gradient(135deg, ${tk.blue}, ${tk.blueDark})`, color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(24,144,255,0.3)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
              📊 Generar reporte
            </button>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <StatCard icon="🏢" label="Empresas"    value={stats?.totalEmpresas || 0}    accentColor={tk.blue}   accentBg={tk.blueLight} sub="Solo visible para administradores" />
          <StatCard icon="👥" label="Personas"    value={stats?.totalPersonas || 0}    accentColor={tk.green}  accentBg={tk.greenBg}   sub="Registradas en el sistema" />
          <StatCard icon="👤" label="Usuarios"    value={stats?.totalUsuarios || 0}    accentColor={tk.purple} accentBg={tk.purpleBg}  sub={`${stats?.usuariosActivos || 0} activos · ${usuariosPct}% del total`} subColor={tk.purple} />
          <StatCard icon="📱" label="Dispositivos" value={stats?.totalDispositivos || 0} accentColor={tk.orange} accentBg={tk.orangeBg} sub={`${stats?.dispositivosActivos || 0} activos · ${disposPct}% del total`} subColor={tk.orange} />
        </div>

        {/* ── Bottom row: Roles + Activity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

          {/* Roles distribution */}
          <div style={{ background: tk.white, borderRadius: '16px', padding: '24px 28px', border: `1px solid ${tk.border}`, boxShadow: tk.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '4px', height: '22px', background: `linear-gradient(to bottom, ${tk.blue}, ${tk.blueDark})`, borderRadius: '2px' }} />
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: tk.text }}>Distribución por Rol</h3>
            </div>
            {stats?.usuariosPorRol && stats.usuariosPorRol.length > 0 ? (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {stats.usuariosPorRol.map((r, i) => (
                  <RoleBar key={r.rol} rol={r.rol} cantidad={r.cantidad} total={stats.totalUsuarios} color={roleColors[i % roleColors.length]} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: tk.textMuted, fontSize: '14px' }}>
                <div style={{ fontSize: '36px', opacity: 0.3, marginBottom: '10px' }}>📊</div>
                Sin datos de roles disponibles
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div style={{ background: tk.white, borderRadius: '16px', padding: '24px 28px', border: `1px solid ${tk.border}`, boxShadow: tk.shadow }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '4px', height: '22px', background: `linear-gradient(to bottom, ${tk.green}, #389e0d)`, borderRadius: '2px' }} />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: tk.text }}>Actividad Reciente</h3>
              </div>
              <span style={{ background: tk.blueLight, color: tk.blue, border: `1px solid ${tk.blueBorder}`, padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>{recentActivity.length} eventos</span>
            </div>
            <div>
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