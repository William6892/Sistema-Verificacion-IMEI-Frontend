// src/components/Empresas/EmpresasList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { empresasService } from '../../services/empresasService';
import EmpresaForm from './EmpresaForm';
import EmpresaDetail from './EmpresaDetail';

interface EmpresasListProps {
  userRole: string;
}

interface Empresa {
  id: number;
  nombre: string;
  fechaCreacion: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const token = {
  blue:      '#1890ff',
  blueDark:  '#096dd9',
  blueLight: '#e6f7ff',
  blueBorder:'#91d5ff',
  green:     '#52c41a',
  greenBg:   '#f6ffed',
  greenBorder:'#b7eb8f',
  red:       '#ff4d4f',
  redBg:     '#fff2f0',
  redBorder: '#ffccc7',
  text:      '#1a1a1a',
  textSub:   '#666',
  textMuted: '#999',
  border:    '#f0f0f0',
  borderMd:  '#e8e8e8',
  bg:        '#fafafa',
  white:     '#ffffff',
  shadow:    '0 6px 20px rgba(0,0,0,0.08)',
  shadowSm:  '0 2px 8px rgba(0,0,0,0.05)',
  radius:    '12px',
  radiusSm:  '8px',
  radiusXs:  '6px',
};

// ─── Static styles ─────────────────────────────────────────────────────────────
const s = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },

  h1: {
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
    background: `linear-gradient(135deg, ${token.blue} 0%, ${token.blueDark} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,

  subtitle: {
    color: token.textSub,
    fontSize: '16px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  badge: {
    background: token.blueLight,
    color: token.blue,
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 600,
    border: `1px solid ${token.blueBorder}`,
  },

  headerActions: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },

  searchBox: (focused: boolean): React.CSSProperties => ({
    position: 'relative',
    background: token.white,
    border: `2px solid ${focused ? token.blue : token.borderMd}`,
    borderRadius: '10px',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s',
    boxShadow: focused ? `0 0 0 3px rgba(24,144,255,0.1)` : 'none',
  }),

  searchInput: {
    border: 'none',
    padding: '12px 0',
    fontSize: '15px',
    minWidth: '250px',
    outline: 'none',
    background: 'transparent',
    color: token.text,
  } as React.CSSProperties,

  clearBtn: {
    background: 'none',
    border: 'none',
    color: token.textMuted,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: 1,
  } as React.CSSProperties,

  btnPrimary: (hovered: boolean): React.CSSProperties => ({
    background: `linear-gradient(135deg, ${token.blue} 0%, ${token.blueDark} 100%)`,
    color: token.white,
    border: 'none',
    padding: '12px 24px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s',
    boxShadow: hovered
      ? '0 6px 16px rgba(24,144,255,0.4)'
      : '0 4px 12px rgba(24,144,255,0.3)',
    transform: hovered ? 'translateY(-2px)' : 'none',
  }),

  errorBox: {
    background: `linear-gradient(135deg, ${token.redBg} 0%, ${token.redBorder} 100%)`,
    border: `1px solid #ffa39e`,
    color: token.red,
    padding: '16px 20px',
    borderRadius: '10px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  tableWrapper: {
    background: token.white,
    borderRadius: token.radius,
    overflow: 'hidden',
    boxShadow: token.shadow,
    border: `1px solid ${token.border}`,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },

  th: {
    background: token.bg,
    padding: '18px 20px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#333',
    borderBottom: `2px solid ${token.border}`,
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },

  td: {
    padding: '20px',
  },

  idBadge: {
    background: '#f0f9ff',
    color: token.blue,
    padding: '6px 12px',
    borderRadius: token.radiusXs,
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-block',
  },

  empresaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  empresaIcon: {
    fontSize: '22px',
    background: token.blueLight,
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  empresaName: {
    fontWeight: 600,
    color: token.text,
    fontSize: '16px',
  },

  fechaContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: token.textSub,
  },

  actionsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },

  btnView: (hov: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: token.radiusSm,
    border: `1px solid ${token.greenBorder}`,
    background: hov ? '#d9f7be' : token.greenBg,
    color: token.green,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s',
    transform: hov ? 'translateY(-1px)' : 'none',
  }),

  btnEdit: (hov: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: token.radiusSm,
    border: `1px solid ${token.blueBorder}`,
    background: hov ? '#bae7ff' : token.blueLight,
    color: token.blue,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s',
    transform: hov ? 'translateY(-1px)' : 'none',
  }),

  btnDelete: (hov: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    borderRadius: token.radiusSm,
    border: `1px solid ${token.redBorder}`,
    background: hov ? token.redBorder : token.redBg,
    color: token.red,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    transition: 'all 0.2s',
    transform: hov ? 'translateY(-1px)' : 'none',
  }),

  emptyState: {
    padding: '60px 20px',
    textAlign: 'center' as const,
  },

  emptyIcon: {
    fontSize: '64px',
    marginBottom: '20px',
    opacity: 0.3,
  },

  tableFooter: {
    padding: '16px 20px',
    borderTop: `1px solid ${token.border}`,
    background: token.bg,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: token.textSub,
    fontSize: '14px',
  },

  spinner: {
    textAlign: 'center' as const,
    padding: '40px',
  },
};

// ─── Hover-aware button components ────────────────────────────────────────────
const HoverBtn = ({
  styleOn,
  onClick,
  title,
  children,
}: {
  styleOn: (hov: boolean) => React.CSSProperties;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      style={styleOn(hov)}
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </button>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const EmpresasList: React.FC<EmpresasListProps> = ({ userRole }) => {
  const [empresas, setEmpresas]           = useState<Empresa[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [showForm, setShowForm]           = useState(false);
  const [selectedEmpresa, setSelected]    = useState<Empresa | null>(null);
  const [editingEmpresa, setEditing]      = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [btnHov, setBtnHov]               = useState(false);
  const [hovRow, setHovRow]               = useState<number | null>(null);

  const debugToken = () => {
    const raw = localStorage.getItem('token');
    if (!raw) return null;
    try {
      const parts = raw.split('.');
      if (parts.length !== 3) { console.error('❌ Token JWT malformado'); return null; }
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (e) {
      console.error('❌ Error decodificando token:', e);
      return null;
    }
  };

  useEffect(() => { debugToken(); loadEmpresas(); }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresasService.getEmpresas();
      setEmpresas(data);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (nombre: string) => {
    try {
      const raw = localStorage.getItem('token');
      if (raw) {
        const payload = JSON.parse(atob(raw.split('.')[1]));
        if (Date.now() >= payload.exp * 1000) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
      }
      if (userRole !== 'Admin') {
        alert('No tienes permisos para crear empresas. Se requiere rol "Admin".');
        return;
      }
      await empresasService.createEmpresa(nombre);
      setShowForm(false);
      loadEmpresas();
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('Acceso denegado. Verifica que tu usuario tenga rol "Admin".');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (err.response?.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.mensaje || 'Error al crear empresa');
      }
    }
  };

  const handleUpdate = async (id: number, nombre: string) => {
    try {
      await empresasService.updateEmpresa(id, nombre);
      setEditing(null);
      loadEmpresas();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar empresa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta empresa?')) return;
    try {
      await empresasService.deleteEmpresa(id);
      loadEmpresas();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al eliminar empresa');
    }
  };

  const formatDate = (ds: string) => {
    try {
      return new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return 'Fecha inválida'; }
  };

  const filtered = empresas.filter(e =>
    e.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Loading ──
  if (loading) return (
    <div style={s.spinner}>
      <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: '40px', height: '40px',
        border: '3px solid #f3f3f3', borderTop: `3px solid ${token.blue}`,
        borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px',
      }} />
      <p style={{ color: token.textSub }}>Cargando empresas...</p>
    </div>
  );

  return (
    <div style={s.container}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>🏢 Empresas Registradas</h1>
          <p style={s.subtitle}>
            Gestión de empresas y sus asociados
            <span style={s.badge}>{empresas.length} empresas</span>
          </p>
        </div>

        <div style={s.headerActions}>
          {/* Search */}
          <div style={s.searchBox(searchFocused)}>
            <span style={{ color: token.textMuted, marginRight: '8px' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={s.searchInput}
            />
            {searchTerm && (
              <button style={s.clearBtn} onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>

          {/* New button */}
          {userRole === 'Admin' && (
            <button
              style={s.btnPrimary(btnHov)}
              onMouseEnter={() => setBtnHov(true)}
              onMouseLeave={() => setBtnHov(false)}
              onClick={() => setShowForm(true)}
            >
              <span style={{ fontSize: '18px', fontWeight: 700 }}>+</span>
              Nueva Empresa
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={s.errorBox}>
          <span>⚠️</span>
          {error}
          <button style={{ ...s.clearBtn, marginLeft: 'auto', color: token.red }} onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* ── Form modal ── */}
      {(showForm || editingEmpresa) && (
        <EmpresaForm
          empresa={editingEmpresa}
          onSubmit={editingEmpresa
            ? (nombre: string) => handleUpdate(editingEmpresa.id, nombre)
            : handleCreate}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          title={editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
        />
      )}

      {/* ── Detail modal ── */}
      {selectedEmpresa && (
        <EmpresaDetail
          empresa={selectedEmpresa}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Table ── */}
      <div style={s.tableWrapper}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: '80px' }}>ID</th>
              <th style={s.th}>Nombre</th>
              <th style={{ ...s.th, width: '180px' }}>Fecha Creación</th>
              <th style={{ ...s.th, width: '280px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(empresa => (
              <tr
                key={empresa.id}
                style={{
                  borderBottom: `1px solid ${token.border}`,
                  background: hovRow === empresa.id ? '#f9f9f9' : token.white,
                  transition: 'all 0.2s',
                  boxShadow: hovRow === empresa.id ? token.shadowSm : 'none',
                }}
                onMouseEnter={() => setHovRow(empresa.id)}
                onMouseLeave={() => setHovRow(null)}
              >
                <td style={s.td}>
                  <span style={s.idBadge}>#{empresa.id}</span>
                </td>

                <td style={s.td}>
                  <div style={s.empresaInfo}>
                    <div style={s.empresaIcon}>🏢</div>
                    <span style={s.empresaName}>{empresa.nombre || 'Sin nombre'}</span>
                  </div>
                </td>

                <td style={s.td}>
                  <div style={s.fechaContainer}>
                    <span style={{ opacity: 0.6 }}>📅</span>
                    <span>{formatDate(empresa.fechaCreacion)}</span>
                  </div>
                </td>

                <td style={s.td}>
                  <div style={s.actionsContainer}>
                    <HoverBtn styleOn={s.btnView} onClick={() => setSelected(empresa)} title="Ver detalles">
                      👁️ Ver
                    </HoverBtn>

                    {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
                      <HoverBtn styleOn={s.btnEdit} onClick={() => setEditing(empresa)} title="Editar empresa">
                        ✏️ Editar
                      </HoverBtn>
                    )}

                    {userRole === 'SuperAdmin' && (
                      <HoverBtn styleOn={s.btnDelete} onClick={() => handleDelete(empresa.id)} title="Eliminar empresa">
                        🗑️ Eliminar
                      </HoverBtn>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} style={s.emptyState}>
                  <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                    <div style={s.emptyIcon}>🏢</div>
                    <h3 style={{ color: '#333', marginBottom: '8px' }}>No hay empresas</h3>
                    <p style={{ color: token.textSub, marginBottom: '24px' }}>
                      {searchTerm
                        ? `No se encontraron empresas con "${searchTerm}"`
                        : 'Aún no hay empresas registradas en el sistema.'}
                    </p>
                    {userRole === 'Admin' && !searchTerm && (
                      <button
                        style={s.btnPrimary(false)}
                        onClick={() => setShowForm(true)}
                      >
                        + Crear primera empresa
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filtered.length > 0 && (
          <div style={s.tableFooter}>
            <span>
              Mostrando {filtered.length} de {empresas.length} empresas
              {searchTerm && ` (filtradas por "${searchTerm}")`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresasList;