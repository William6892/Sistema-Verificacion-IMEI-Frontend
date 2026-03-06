// src/components/Dispositivos/DispositivosList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { dispositivosService, Dispositivo } from '../../services/dispositivosService';
import DispositivoForm from './DispositivoForm';
import DispositivoDetail from './DispositivoDetail';
import { empresasService } from '../../services/empresasService';

interface DispositivosListProps {
  userRole: string;
  userEmpresaId?: number;
  personaId?: number;
  modo?: 'embedded' | 'full';
  showHeader?: boolean;
  onDispositivoSelect?: (dispositivoId: number) => void;
}

// ─── Design tokens (same system as Empresas) ─────────────────────────────────
const tk = {
  blue:        '#1890ff',
  blueDark:    '#096dd9',
  blueLight:   '#e6f7ff',
  blueBorder:  '#91d5ff',
  blueAlpha:   'rgba(24,144,255,0.08)',
  green:       '#52c41a',
  greenBg:     '#f6ffed',
  greenBorder: '#b7eb8f',
  orange:      '#fa8c16',
  orangeBg:    '#fff7e6',
  orangeBorder:'#ffd591',
  red:         '#ff4d4f',
  redBg:       '#fff2f0',
  redBorder:   '#ffccc7',
  purple:      '#722ed1',
  purpleBg:    '#f9f0ff',
  purpleBorder:'#d3adf7',
  text:        '#1a1a1a',
  textSub:     '#666',
  textMuted:   '#999',
  border:      '#f0f0f0',
  borderMd:    '#e8e8e8',
  bg:          '#fafafa',
  white:       '#ffffff',
  shadow:      '0 6px 20px rgba(0,0,0,0.08)',
  radius:      '12px',
  radiusSm:    '8px',
};

// ─── Reusable hover button ────────────────────────────────────────────────────
const Btn = ({
  base, hoverStyle, onClick, title, children, disabled = false, fullWidth = false,
}: {
  base: React.CSSProperties;
  hoverStyle?: React.CSSProperties;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      title={title}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...base,
        ...(hov && !disabled ? hoverStyle : {}),
        ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        ...(fullWidth ? { width: '100%' } : {}),
      }}
    >
      {children}
    </button>
  );
};

// ─── Shared button bases ──────────────────────────────────────────────────────
const actionBase: React.CSSProperties = {
  padding: '7px 11px', borderRadius: tk.radiusSm, border: 'none',
  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: '4px', transition: 'all 0.2s', whiteSpace: 'nowrap',
};

const btnStyles = {
  view:   { ...actionBase, background: tk.blueLight, color: tk.blue, border: `1px solid ${tk.blueBorder}` },
  edit:   { ...actionBase, background: tk.greenBg,   color: tk.green, border: `1px solid ${tk.greenBorder}` },
  deact:  { ...actionBase, background: tk.orangeBg,  color: tk.orange, border: `1px solid ${tk.orangeBorder}` },
  activ:  { ...actionBase, background: tk.greenBg,   color: tk.green, border: `1px solid ${tk.greenBorder}` },
  del:    { ...actionBase, background: tk.redBg,     color: tk.red,   border: `1px solid ${tk.redBorder}` },
};

const btnHoverStyles = {
  view:  { background: '#bae7ff', transform: 'translateY(-1px)', boxShadow: '0 3px 8px rgba(24,144,255,0.2)' },
  edit:  { background: '#d9f7be', transform: 'translateY(-1px)', boxShadow: '0 3px 8px rgba(82,196,26,0.2)' },
  deact: { background: '#ffe7ba', transform: 'translateY(-1px)', boxShadow: '0 3px 8px rgba(250,140,22,0.2)' },
  activ: { background: '#d9f7be', transform: 'translateY(-1px)', boxShadow: '0 3px 8px rgba(82,196,26,0.2)' },
  del:   { background: '#ffccc7', transform: 'translateY(-1px)', boxShadow: '0 3px 8px rgba(255,77,79,0.2)' },
};

// ─── Cell icon wrapper ────────────────────────────────────────────────────────
const CellIcon = ({ emoji, color, bg }: { emoji: string; color: string; bg: string }) => (
  <div style={{
    fontSize: '18px', color, background: bg,
    width: '38px', height: '38px', borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }}>
    {emoji}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const DispositivosList: React.FC<DispositivosListProps> = ({
  userRole, userEmpresaId, personaId,
  modo = 'full', showHeader = true, onDispositivoSelect,
}) => {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showForm, setShowForm]         = useState(false);
  const [selectedDev, setSelectedDev]   = useState<Dispositivo | null>(null);
  const [editingDev, setEditingDev]     = useState<Dispositivo | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [debouncedSearch, setDebSearch] = useState('');
  const [filters, setFilters]           = useState({ empresaId: userEmpresaId || 0, activo: true, page: 1, limit: 20 });
  const [empresas, setEmpresas]         = useState<any[]>([]);
  const [total, setTotal]               = useState(0);
  const [showFilters, setShowFilters]   = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hovRow, setHovRow]             = useState<number | null>(null);
  const [primaryHov, setPrimaryHov]     = useState(false);
  const [filterHov, setFilterHov]       = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebSearch(searchTerm); setFilters(f => ({ ...f, page: 1 })); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { loadEmpresas(); }, []);
  useEffect(() => { loadDispositivos(); }, [filters, personaId, debouncedSearch]);

  const loadEmpresas = async () => {
    if (userRole !== 'Admin' && !userEmpresaId) return;
    try { const d = await empresasService.getEmpresas(); setEmpresas(Array.isArray(d) ? d : []); } catch {}
  };

  const loadDispositivos = async () => {
    try {
      setLoading(true); setError('');
      if (personaId) {
        const d = await dispositivosService.getDispositivosPorPersona(personaId);
        const arr = Array.isArray(d) ? d : [];
        setDispositivos(arr); setTotal(arr.length); return;
      }
      const params: any = { ...filters, search: debouncedSearch || undefined };
      if (userRole !== 'Admin' && userEmpresaId) params.empresaId = userEmpresaId;
      const result = await dispositivosService.getDispositivos(params);
      const arr = Array.isArray(result.dispositivos) ? result.dispositivos : Array.isArray(result) ? result : [];
      setDispositivos(arr); setTotal(result.total || arr.length);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || err.message || 'Error al cargar dispositivos');
      setDispositivos([]); setTotal(0);
    } finally { setLoading(false); }
  };

  const handleCreate = async (data: any) => { await dispositivosService.createDispositivo(data); setShowForm(false); loadDispositivos(); };
  const handleUpdate = async (id: number, data: any) => { await dispositivosService.updateDispositivo(id, data); setEditingDev(null); loadDispositivos(); };
  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este dispositivo?')) return;
    try { await dispositivosService.deleteDispositivo(id); loadDispositivos(); }
    catch (err: any) { setError(err.response?.data?.mensaje || 'Error al eliminar'); }
  };
  const handleToggle = async (id: number, activo: boolean) => {
    try { await dispositivosService.toggleActivo(id, activo); loadDispositivos(); }
    catch (err: any) { setError(err.response?.data?.mensaje || 'Error al cambiar estado'); }
  };

  const formatDate = (ds: string) => {
    if (!ds) return '—';
    try {
      // Strip time component if present to avoid timezone shifts
      const dateOnly = ds.split('T')[0];
      const d = new Date(dateOnly + 'T00:00:00');
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  const formatIMEI = (imei: string | undefined) => {
    if (!imei) return 'No disponible';
    const c = imei.toString().replace(/\D/g, '');
    if (c.length !== 15) return c;
    return `${c.slice(0,6)}-${c.slice(6,12)}-${c.slice(12)}`;
  };

  const totalPages = Math.ceil(total / filters.limit);
  const isAdmin = userRole === 'Admin';

  // ── Loading ──
  if (loading && dispositivos.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '44px', height: '44px', border: `3px solid ${tk.blueLight}`, borderTop: `3px solid ${tk.blue}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <span style={{ color: tk.textSub, fontSize: '15px' }}>Cargando dispositivos...</span>
    </div>
  );

  const searchBorderColor = searchFocused ? tk.blue : tk.borderMd;

  return (
    <div style={{ padding: modo === 'embedded' ? 0 : '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Header ── */}
      {showHeader && (
        <div style={{
          background: tk.white, borderRadius: '16px', padding: '24px 28px',
          marginBottom: '24px', boxShadow: tk.shadow, border: `1px solid ${tk.border}`,
        }}>
          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h1 style={{
                fontSize: '26px', fontWeight: 800, margin: 0,
                background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                📱 Dispositivos Registrados
              </h1>
              <div style={{ color: tk.textSub, fontSize: '15px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{personaId ? 'Dispositivos asignados a esta persona' : 'Gestión de dispositivos móviles'}</span>
                <span style={{
                  background: tk.blueLight, color: tk.blue,
                  border: `1px solid ${tk.blueBorder}`,
                  padding: '3px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                }}>
                  {total} {total === 1 ? 'dispositivo' : 'dispositivos'}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {isAdmin && (
                <Btn
                  base={{
                    background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`,
                    color: tk.white, border: 'none', padding: '11px 22px',
                    borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    boxShadow: '0 4px 12px rgba(24,144,255,0.3)', transition: 'all 0.2s',
                  }}
                  hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(24,144,255,0.4)' }}
                  onClick={() => setShowForm(true)}
                >
                  <span style={{ fontSize: '18px', fontWeight: 900 }}>+</span> Nuevo Dispositivo
                </Btn>
              )}
              <Btn
                base={{
                  background: tk.white, color: tk.textSub,
                  border: `2px solid ${showFilters ? tk.blue : tk.borderMd}`,
                  padding: '10px 18px', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                  ...(showFilters ? { color: tk.blue, background: tk.blueLight } : {}),
                }}
                hoverStyle={{ borderColor: tk.blue, color: tk.blue, background: tk.blueLight }}
                onClick={() => setShowFilters(f => !f)}
              >
                🔧 {showFilters ? 'Ocultar filtros' : 'Filtros'}
              </Btn>
            </div>
          </div>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: tk.white, border: `2px solid ${searchBorderColor}`,
            borderRadius: '10px', padding: '0 14px',
            boxShadow: searchFocused ? `0 0 0 3px ${tk.blueAlpha}` : 'none',
            transition: 'all 0.2s',
          }}>
            <span style={{ color: tk.textMuted, marginRight: '8px', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar por IMEI, persona o empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1, border: 'none', padding: '13px 0', fontSize: '15px',
                outline: 'none', background: 'transparent', color: tk.text,
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: tk.textMuted, fontSize: '20px', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>
      )}

      {/* ── Filters panel ── */}
      {showFilters && (
        <div style={{
          background: tk.white, borderRadius: '14px', padding: '22px 24px',
          marginBottom: '20px', boxShadow: tk.shadow, border: `1px solid ${tk.border}`,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px',
          animation: 'slideDown 0.2s ease',
        }}>
          {/* Empresa filter */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: tk.text, marginBottom: '8px' }}>🏢 Empresa</label>
            <select
              value={filters.empresaId}
              onChange={e => setFilters(f => ({ ...f, empresaId: +e.target.value, page: 1 }))}
              disabled={!isAdmin || !!personaId}
              style={{ width: '100%', padding: '10px 14px', border: `2px solid ${tk.borderMd}`, borderRadius: '9px', fontSize: '14px', background: tk.white, color: tk.text, outline: 'none', cursor: 'pointer' }}
            >
              <option value={0}>Todas las empresas</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          {/* Estado filter */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: tk.text, marginBottom: '8px' }}>⚡ Estado</label>
            <select
              value={String(filters.activo)}
              onChange={e => setFilters(f => ({ ...f, activo: e.target.value === 'true', page: 1 }))}
              style={{ width: '100%', padding: '10px 14px', border: `2px solid ${tk.borderMd}`, borderRadius: '9px', fontSize: '14px', background: tk.white, color: tk.text, outline: 'none', cursor: 'pointer' }}
            >
              <option value="true">✅ Activos</option>
              <option value="false">⏸ Inactivos</option>
            </select>
          </div>

          {/* Per page filter */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: tk.text, marginBottom: '8px' }}>📊 Por página</label>
            <select
              value={filters.limit}
              onChange={e => setFilters(f => ({ ...f, limit: +e.target.value, page: 1 }))}
              style={{ width: '100%', padding: '10px 14px', border: `2px solid ${tk.borderMd}`, borderRadius: '9px', fontSize: '14px', background: tk.white, color: tk.text, outline: 'none', cursor: 'pointer' }}
            >
              {[10,20,50,100].map(n => <option key={n} value={n}>{n} dispositivos</option>)}
            </select>
          </div>

          {/* Clear */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => setFilters({ empresaId: userEmpresaId || 0, activo: true, page: 1, limit: 20 })}
              style={{ background: 'none', border: 'none', color: tk.blue, fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              🗑️ Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div style={{
          background: `linear-gradient(135deg, ${tk.redBg} 0%, ${tk.redBorder} 100%)`,
          border: `1px solid #ffa39e`, color: tk.red,
          padding: '14px 18px', borderRadius: '10px', marginBottom: '18px',
          display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px',
        }}>
          <span>⚠️</span>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: tk.red, fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Modals ── */}
      {(showForm || editingDev) && (
        <DispositivoForm
          dispositivo={editingDev}
          onSubmit={editingDev ? (d: any) => handleUpdate(editingDev.id, d) : handleCreate}
          onCancel={() => { setShowForm(false); setEditingDev(null); }}
          title={editingDev ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
          empresas={empresas} userRole={userRole} userEmpresaId={userEmpresaId}
        />
      )}
      {selectedDev && (
        <DispositivoDetail
          dispositivo={selectedDev}
          onClose={() => setSelectedDev(null)}
          onEdit={() => { setSelectedDev(null); setEditingDev(selectedDev); }}
          userRole={userRole}
        />
      )}

      {/* ── Table card ── */}
      <div style={{ background: tk.white, borderRadius: '16px', overflow: 'hidden', boxShadow: tk.shadow, border: `1px solid ${tk.border}` }}>

        {dispositivos.length > 0 ? (
          <>
            {/* Table info bar */}
            <div style={{
              padding: '14px 22px', background: tk.bg, borderBottom: `1px solid ${tk.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '13px', color: tk.textSub, fontWeight: 500,
            }}>
              <span>
                Mostrando <strong style={{ color: tk.text }}>{dispositivos.length}</strong> de <strong style={{ color: tk.text }}>{total}</strong> dispositivos
                {debouncedSearch && <span> · buscando "<em>{debouncedSearch}</em>"</span>}
              </span>
              <span style={{ color: tk.blue, fontWeight: 600 }}>Página {filters.page}</span>
            </div>

            {/* Scrollable table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
                <thead>
                  <tr style={{ background: tk.bg }}>
                    {([
                      { label: 'ID',       width: '60px'  },
                      { label: 'IMEI',     width: '200px' },
                      { label: 'Persona',  width: '200px' },
                      { label: 'Empresa',  width: '160px' },
                      { label: 'Fecha',    width: '120px' },
                      { label: 'Estado',   width: '110px' },
                      { label: 'Acciones', width: '240px' },
                    ] as { label: string; width: string }[]).map(({ label, width }) => (
                      <th key={label} style={{
                        padding: '14px 18px', textAlign: 'left', fontWeight: 700,
                        color: '#444', borderBottom: `2px solid ${tk.border}`,
                        fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px',
                        whiteSpace: 'nowrap', width,
                      }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dispositivos.map(dev => {
                    const isHov = hovRow === dev.id;
                    return (
                      <tr
                        key={dev.id}
                        onMouseEnter={() => setHovRow(dev.id)}
                        onMouseLeave={() => setHovRow(null)}
                        onClick={() => onDispositivoSelect ? onDispositivoSelect(dev.id) : setSelectedDev(dev)}
                        style={{
                          borderBottom: `1px solid ${tk.border}`,
                          background: !dev.activo
                            ? isHov ? '#fff5f5' : '#fffafa'
                            : isHov ? tk.blueAlpha : tk.white,
                          transition: 'background 0.15s',
                          cursor: onDispositivoSelect ? 'pointer' : 'default',
                        }}
                      >
                        {/* ID */}
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{
                            background: tk.bg, color: tk.textSub,
                            padding: '5px 10px', borderRadius: '6px',
                            fontSize: '12px', fontWeight: 700, fontFamily: 'monospace',
                          }}>#{dev.id}</span>
                        </td>

                        {/* IMEI */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CellIcon emoji="📱" color={tk.blue} bg={tk.blueLight} />
                            <div>
                              <div style={{ fontFamily: 'monospace', fontWeight: 600, color: tk.text, fontSize: '14px', letterSpacing: '0.3px' }}>
                                {formatIMEI(dev.imei)}
                              </div>
                              {dev.imei && (
                                <div style={{ fontSize: '11px', color: tk.textMuted, marginTop: '2px' }}>
                                  {dev.imei.toString().replace(/\D/g, '').length} dígitos
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Persona */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CellIcon emoji="👤" color={tk.green} bg={tk.greenBg} />
                            <div>
                              <div style={{ fontWeight: 600, color: tk.text, fontSize: '14px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {dev.personaNombre || 'Sin asignar'}
                              </div>
                              {dev.personaId && <div style={{ fontSize: '11px', color: tk.textMuted, fontFamily: 'monospace' }}>ID: {dev.personaId}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Empresa */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CellIcon emoji="🏢" color={tk.purple} bg={tk.purpleBg} />
                            <span style={{ color: tk.text, fontSize: '14px', fontWeight: 500, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {dev.empresaNombre || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Fecha */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CellIcon emoji="📅" color={tk.orange} bg={tk.orangeBg} />
                            <span style={{ color: tk.textSub, fontSize: '13px', fontWeight: 500 }}>{formatDate(dev.fechaRegistro)}</span>
                          </div>
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '7px',
                            padding: '6px 14px', borderRadius: '20px',
                            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                            ...(dev.activo
                              ? { background: tk.greenBg, color: '#237804', border: `1px solid ${tk.greenBorder}` }
                              : { background: tk.redBg,   color: '#a8071a', border: `1px solid ${tk.redBorder}` }),
                          }}>
                            <span style={{
                              width: '8px', height: '8px', borderRadius: '50%',
                              background: dev.activo ? tk.green : tk.red,
                              boxShadow: dev.activo ? `0 0 6px ${tk.green}` : `0 0 6px ${tk.red}`,
                            }} />
                            {dev.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                          {isAdmin ? (
                            <div style={{ display: 'flex', gap: '5px', flexWrap: 'nowrap', minWidth: '220px' }}>
                              <Btn base={btnStyles.view} hoverStyle={btnHoverStyles.view} onClick={() => setSelectedDev(dev)} title="Ver detalles">👁️ Ver</Btn>
                              <Btn base={btnStyles.edit} hoverStyle={btnHoverStyles.edit} onClick={() => setEditingDev(dev)} title="Editar">✏️ Editar</Btn>
                              <Btn
                                base={dev.activo ? btnStyles.deact : btnStyles.activ}
                                hoverStyle={dev.activo ? btnHoverStyles.deact : btnHoverStyles.activ}
                                onClick={() => handleToggle(dev.id, !dev.activo)}
                                title={dev.activo ? 'Desactivar' : 'Activar'}
                              >
                                {dev.activo ? '⏸ Desact.' : '▶️ Activar'}
                              </Btn>
                              <Btn base={btnStyles.del} hoverStyle={btnHoverStyles.del} onClick={() => handleDelete(dev.id)} title="Eliminar">🗑️ Elim.</Btn>
                            </div>
                          ) : (
                            <Btn base={{ ...btnStyles.view, flex: 'none' }} hoverStyle={btnHoverStyles.view} onClick={() => setSelectedDev(dev)}>👁️ Ver detalles</Btn>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div style={{
                padding: '16px 22px', borderTop: `1px solid ${tk.border}`, background: tk.bg,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px',
              }}>
                <span style={{ fontSize: '13px', color: tk.textSub, fontWeight: 500 }}>
                  Página <strong style={{ color: tk.text }}>{filters.page}</strong> de <strong style={{ color: tk.text }}>{totalPages}</strong>
                  <span style={{ marginLeft: '8px', color: tk.textMuted }}>({total} total)</span>
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { label: '← Anterior', page: filters.page - 1, disabled: filters.page === 1 },
                    { label: 'Siguiente →', page: filters.page + 1, disabled: filters.page >= totalPages },
                  ].map(({ label, page, disabled }) => (
                    <Btn
                      key={label}
                      disabled={disabled}
                      base={{
                        padding: '9px 20px', border: `2px solid ${tk.borderMd}`, background: tk.white,
                        borderRadius: '9px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                        color: tk.textSub, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px',
                      }}
                      hoverStyle={{ borderColor: tk.blue, color: tk.blue, background: tk.blueLight }}
                      onClick={() => setFilters(f => ({ ...f, page }))}
                    >
                      {label}
                    </Btn>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Empty state ── */
          <div style={{ padding: '70px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px', opacity: 0.25, marginBottom: '18px' }}>📱</div>
            <h3 style={{ color: tk.text, fontSize: '20px', fontWeight: 700, margin: '0 0 10px' }}>No hay dispositivos</h3>
            <p style={{ color: tk.textSub, marginBottom: '28px', maxWidth: '360px', margin: '0 auto 28px', lineHeight: 1.6 }}>
              {debouncedSearch
                ? `No se encontraron resultados para "${debouncedSearch}"`
                : 'Aún no hay dispositivos registrados en el sistema.'}
            </p>
            {isAdmin && !debouncedSearch && (
              <Btn
                base={{
                  background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`,
                  color: tk.white, border: 'none', padding: '12px 24px',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 4px 12px rgba(24,144,255,0.3)', transition: 'all 0.2s',
                }}
                hoverStyle={{ transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(24,144,255,0.4)' }}
                onClick={() => setShowForm(true)}
              >
                + Registrar primer dispositivo
              </Btn>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DispositivosList;