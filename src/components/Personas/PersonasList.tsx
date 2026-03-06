// src/components/Personas/PersonasList.tsx
import React, { useState, useEffect } from 'react';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import PersonaForm from './PersonaForm';
import PersonaDetail from './PersonaDetail';
import { authService } from '../../services/authService';

interface PersonasListProps { userRole: string; }

// ─── Tokens ───────────────────────────────────────────────────────────────────
const tk = {
  blue: '#1890ff', blueDark: '#096dd9', blueLight: '#e6f7ff', blueBorder: '#91d5ff',
  green: '#52c41a', greenBg: '#f6ffed', greenBorder: '#b7eb8f',
  red: '#ff4d4f', redBg: '#fff2f0', redBorder: '#ffccc7',
  orange: '#fa8c16', orangeBg: '#fff7e6',
  text: '#1a1a1a', textSub: '#666', textMuted: '#999',
  border: '#f0f0f0', borderMd: '#e8e8e8', bg: '#fafafa', white: '#ffffff',
  shadow: '0 6px 20px rgba(0,0,0,0.08)',
};

const HovBtn = ({ base, hover, onClick, children, disabled = false }: {
  base: React.CSSProperties; hover: React.CSSProperties;
  onClick?: () => void; children: React.ReactNode; disabled?: boolean;
}) => {
  const [h, setH] = useState(false);
  return (
    <button disabled={disabled} onClick={onClick}
      onMouseEnter={() => !disabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...base, ...(h && !disabled ? hover : {}), ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}>
      {children}
    </button>
  );
};

const PersonasList: React.FC<PersonasListProps> = ({ userRole }) => {
  const [personas, setPersonas]         = useState<any[]>([]);
  const [empresas, setEmpresas]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<number | 'all'>('all');
  const [showForm, setShowForm]         = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hovRow, setHovRow]             = useState<number | null>(null);
  const [primaryHov, setPrimaryHov]     = useState(false);

  const isAdmin = authService.isAdmin();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, eData] = await Promise.all([personasService.getPersonas(), empresasService.getEmpresas()]);
      const fixed = pData.map((p: any) => {
        const emp = eData.find((e: any) => e.nombre?.toLowerCase() === p.empresaNombre?.toLowerCase());
        return { ...p, empresaId: emp?.id || p.empresaId || null, empresaNombre: p.empresaNombre || 'Sin empresa' };
      });
      setPersonas(fixed); setEmpresas(eData);
    } catch (err: any) { setError(err.response?.data?.mensaje || 'Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const filtered = personas.filter(p => {
    const matchSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || p.identificacion?.includes(searchTerm);
    const matchEmpresa = empresaFilter === 'all' || Number(p.empresaId) === empresaFilter;
    return matchSearch && matchEmpresa;
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta persona?')) return;
    try { await personasService.deletePersona(id); loadData(); }
    catch { alert('Error al eliminar la persona'); }
  };

  const handleFormSuccess = () => { setShowForm(false); setEditingPersona(null); loadData(); };

  // ── Loading ──
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '44px', height: '44px', border: `3px solid ${tk.blueLight}`, borderTop: `3px solid ${tk.blue}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <span style={{ color: tk.textSub }}>Cargando personas...</span>
    </div>
  );

  // ── Detail view ──
  if (selectedPersona) return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PersonaDetail personaId={selectedPersona.id} onBack={() => setSelectedPersona(null)} />
    </div>
  );

  // ── Form view ──
  if (showForm) return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PersonaForm personaToEdit={editingPersona} onSuccess={handleFormSuccess} onCancel={() => { setShowForm(false); setEditingPersona(null); }} />
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <HovBtn
          base={{ padding: '10px 22px', background: tk.white, color: tk.textSub, border: `2px solid ${tk.borderMd}`, borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          hover={{ borderColor: tk.blue, color: tk.blue, background: tk.blueLight }}
          onClick={() => setShowForm(false)}
        >← Volver a la lista</HovBtn>
      </div>
    </div>
  );

  const actionBase: React.CSSProperties = { padding: '7px 13px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s', whiteSpace: 'nowrap' };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div style={{ background: tk.white, borderRadius: '16px', padding: '24px 28px', marginBottom: '20px', boxShadow: tk.shadow, border: `1px solid ${tk.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '50px', height: '50px', background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(24,144,255,0.3)', flexShrink: 0 }}>👥</div>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Gestión de Personas
              </h1>
              <p style={{ color: tk.textSub, fontSize: '14px', margin: '4px 0 0' }}>Administra y visualiza todas las personas registradas</p>
            </div>
          </div>

          {isAdmin && (
            <HovBtn
              base={{ background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`, color: tk.white, border: 'none', padding: '11px 22px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(24,144,255,0.3)', transition: 'all 0.2s' }}
              hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(24,144,255,0.4)' }}
              onClick={() => { setEditingPersona(null); setShowForm(true); }}
            >
              <span style={{ fontSize: '18px', fontWeight: 900 }}>+</span> Nueva Persona
            </HovBtn>
          )}
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[{ label: 'Total', value: personas.length }, { label: 'Mostrando', value: filtered.length }].map(s => (
            <div key={s.label} style={{ background: tk.blueLight, border: `1px solid ${tk.blueBorder}`, borderRadius: '10px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: `linear-gradient(135deg, ${tk.blue}, ${tk.blueDark})`, color: tk.white, borderRadius: '7px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>{s.value}</div>
              <div>
                <div style={{ fontSize: '11px', color: tk.blue, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: tk.text }}>{s.value} persona{s.value !== 1 ? 's' : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background: tk.redBg, border: `1px solid ${tk.redBorder}`, color: tk.red, padding: '13px 18px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
          <span>⚠️</span><span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: tk.red, fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ background: tk.white, borderRadius: '14px', padding: '18px 22px', marginBottom: '20px', boxShadow: tk.shadow, border: `1px solid ${tk.border}`, display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', background: tk.white, border: `2px solid ${searchFocused ? tk.blue : tk.borderMd}`, borderRadius: '10px', padding: '0 14px', boxShadow: searchFocused ? `0 0 0 3px rgba(24,144,255,0.1)` : 'none', transition: 'all 0.2s' }}>
          <span style={{ color: tk.textMuted, marginRight: '8px' }}>🔍</span>
          <input
            type="text" placeholder="Buscar por nombre o identificación..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
            style={{ flex: 1, border: 'none', padding: '12px 0', fontSize: '14px', outline: 'none', background: 'transparent', color: tk.text }}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: tk.textMuted, fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>}
        </div>

        {/* Company select */}
        <select
          value={empresaFilter}
          onChange={e => setEmpresaFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          style={{ padding: '12px 16px', border: `2px solid ${tk.borderMd}`, borderRadius: '10px', fontSize: '14px', background: tk.white, color: tk.text, outline: 'none', cursor: 'pointer', minWidth: '220px' }}
        >
          <option value="all">🏢 Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {/* ── Table card ── */}
      <div style={{ background: tk.white, borderRadius: '16px', overflow: 'hidden', boxShadow: tk.shadow, border: `1px solid ${tk.border}` }}>
        {filtered.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
                <thead>
                  <tr style={{ background: tk.bg }}>
                    {['Persona', 'Identificación', 'Empresa', 'Contacto', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 700, color: '#444', borderBottom: `2px solid ${tk.border}`, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(persona => {
                    const hov = hovRow === persona.id;
                    return (
                      <tr key={persona.id}
                        onMouseEnter={() => setHovRow(persona.id)}
                        onMouseLeave={() => setHovRow(null)}
                        style={{ borderBottom: `1px solid ${tk.border}`, background: hov ? tk.blueLight : tk.white, transition: 'all 0.15s', animation: 'fadeUp 0.3s ease' }}
                      >
                        {/* Persona */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: `linear-gradient(135deg, ${tk.blueBorder}, ${tk.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tk.white, fontWeight: 700, fontSize: '17px', flexShrink: 0, transition: 'transform 0.2s', transform: hov ? 'scale(1.08) rotate(4deg)' : 'none' }}>
                              {(persona.nombre?.charAt(0) || 'P').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: tk.text, fontSize: '15px' }}>{persona.nombre || 'Sin nombre'}</div>
                              <div style={{ fontSize: '12px', color: tk.textMuted }}>ID: {persona.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Identificación */}
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{ background: tk.blueLight, color: tk.blue, border: `1px solid ${tk.blueBorder}`, padding: '5px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}>
                            {persona.identificacion || 'N/A'}
                          </span>
                        </td>

                        {/* Empresa */}
                        <td style={{ padding: '16px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: tk.green, boxShadow: `0 0 5px ${tk.green}`, flexShrink: 0 }} />
                            <span style={{ fontWeight: 500, color: tk.text, fontSize: '14px' }}>{persona.empresaNombre}</span>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td style={{ padding: '16px 18px' }}>
                          <span style={{ fontSize: '14px', color: tk.textSub, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📞 {persona.telefono || 'No especificado'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                            <HovBtn base={{ ...actionBase, background: tk.blueLight, color: tk.blue, border: `1px solid ${tk.blueBorder}` }} hover={{ background: '#bae7ff', transform: 'translateY(-1px)' }} onClick={() => setSelectedPersona(persona)}>
                              👁️ Ver
                            </HovBtn>
                            {isAdmin && (
                              <HovBtn base={{ ...actionBase, background: tk.greenBg, color: tk.green, border: `1px solid ${tk.greenBorder}` }} hover={{ background: '#d9f7be', transform: 'translateY(-1px)' }} onClick={() => { setEditingPersona(persona); setShowForm(true); }}>
                                ✏️ Editar
                              </HovBtn>
                            )}
                            {isAdmin && (
                              <HovBtn base={{ ...actionBase, background: tk.redBg, color: tk.red, border: `1px solid ${tk.redBorder}` }} hover={{ background: tk.redBorder, transform: 'translateY(-1px)' }} onClick={() => handleDelete(persona.id)}>
                                🗑️ Eliminar
                              </HovBtn>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 22px', borderTop: `1px solid ${tk.border}`, background: tk.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: tk.textSub }}>
                Total: <strong style={{ color: tk.text }}>{personas.length}</strong> personas registradas
              </span>
              <HovBtn
                base={{ padding: '8px 18px', background: tk.blueLight, color: tk.blue, border: `1px solid ${tk.blueBorder}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                hover={{ background: '#bae7ff', transform: 'translateY(-1px)' }}
                onClick={loadData}
              >🔄 Actualizar</HovBtn>
            </div>
          </>
        ) : (
          /* Empty state */
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '54px', opacity: 0.25, marginBottom: '16px' }}>👤</div>
            <h3 style={{ color: tk.text, fontSize: '20px', fontWeight: 700, margin: '0 0 10px' }}>No se encontraron personas</h3>
            <p style={{ color: tk.textSub, marginBottom: '24px' }}>
              {searchTerm || empresaFilter !== 'all' ? 'Intenta con otros filtros' : 'No hay personas registradas aún'}
            </p>
            {isAdmin && !searchTerm && empresaFilter === 'all' && (
              <HovBtn
                base={{ background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`, color: tk.white, border: 'none', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(24,144,255,0.3)', transition: 'all 0.2s' }}
                hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(24,144,255,0.4)' }}
                onClick={() => { setEditingPersona(null); setShowForm(true); }}
              >+ Registrar primera persona</HovBtn>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonasList;