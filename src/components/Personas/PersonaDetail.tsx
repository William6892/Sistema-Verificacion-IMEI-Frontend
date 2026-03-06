// src/components/Personas/PersonaDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import { dispositivosService } from '../../services/dispositivosService';
import { authService } from '../../services/authService';

interface PersonaDetailProps { onBack?: () => void; personaId?: number; }

const tk = {
  blue: '#1890ff', blueDark: '#096dd9', blueLight: '#e6f7ff', blueBorder: '#91d5ff',
  green: '#52c41a', greenBg: '#f6ffed', greenBorder: '#b7eb8f',
  orange: '#fa8c16', orangeBg: '#fff7e6', orangeBorder: '#ffd591',
  red: '#ff4d4f', redBg: '#fff2f0', redBorder: '#ffccc7',
  purple: '#722ed1', purpleBg: '#f9f0ff', purpleBorder: '#d3adf7',
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
      onMouseEnter={() => !disabled && setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...base, ...(h && !disabled ? hover : {}), ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}>
      {children}
    </button>
  );
};

const StatusBadge = ({ activo }: { activo: boolean }) => (
  <span style={{
    padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    ...(activo
      ? { background: tk.greenBg, color: '#237804', border: `1px solid ${tk.greenBorder}` }
      : { background: tk.redBg,   color: '#a8071a', border: `1px solid ${tk.redBorder}` }),
  }}>
    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: activo ? tk.green : tk.red }} />
    {activo ? 'Activo' : 'Inactivo'}
  </span>
);

const StatCard = ({ icon, value, label, color, bg }: { icon: string; value: number; label: string; color: string; bg: string }) => {
  const [h, setH] = useState(false);
  return (
    <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: h ? bg : tk.white, border: `2px solid ${h ? color : tk.borderMd}`, borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: h ? tk.shadow : 'none', transition: 'all 0.2s', transform: h ? 'translateY(-3px)' : 'none' }}>
      <div style={{ width: '52px', height: '52px', background: `linear-gradient(135deg, ${color}, ${color}cc)`, borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '13px', color: tk.textSub, fontWeight: 500, marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
};

const PersonaDetail: React.FC<PersonaDetailProps> = ({ onBack, personaId: personaIdProp }) => {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const resolvedId = personaIdProp ?? (idParam ? parseInt(idParam) : undefined);

  const [persona, setPersona]           = useState<any>(null);
  const [empresa, setEmpresa]           = useState<any>(null);
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState<'info' | 'dispositivos'>('info');
  const [hovCard, setHovCard]           = useState<number | null>(null);

  const isAdmin = authService.isAdmin();
  const goBack  = () => (onBack ? onBack() : navigate('/personas'));

  useEffect(() => { if (resolvedId) loadData(); }, [resolvedId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const p = await personasService.getPersona(resolvedId!);
      setPersona(p);
      if (p.empresaId) { try { setEmpresa(await empresasService.getEmpresa(p.empresaId)); } catch {} }
      try { setDispositivos(await dispositivosService.getDispositivosPorPersona(resolvedId!)); } catch {}
    } catch (err: any) { setError(err.response?.data?.mensaje || 'Error al cargar persona'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!isAdmin || !window.confirm(`¿Eliminar a "${persona?.nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await personasService.deletePersona(persona.id);
      goBack();
    } catch (err: any) {
      const s = err.response?.status;
      alert(s === 409 ? 'No se puede eliminar: tiene dispositivos asignados.' : 'Error al eliminar la persona');
    }
  };

  const formatDate = (ds: string) => {
    if (!ds) return '—';
    try {
      const dateOnly = ds.split('T')[0];
      return new Date(dateOnly + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return '—'; }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '44px', height: '44px', border: `3px solid ${tk.blueLight}`, borderTop: `3px solid ${tk.blue}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <span style={{ color: tk.textSub }}>Cargando información...</span>
    </div>
  );

  if (error || !persona) return (
    <div style={{ background: tk.white, borderRadius: '16px', padding: '60px 40px', textAlign: 'center', maxWidth: '560px', margin: '40px auto', boxShadow: tk.shadow, border: `1px solid ${tk.borderMd}` }}>
      <div style={{ fontSize: '52px', marginBottom: '16px', opacity: 0.7 }}>⚠️</div>
      <h3 style={{ color: tk.red, marginBottom: '10px' }}>Error al cargar la persona</h3>
      <p style={{ color: tk.textSub, marginBottom: '24px' }}>{error || 'La persona no existe'}</p>
      <HovBtn
        base={{ padding: '11px 22px', background: `linear-gradient(135deg, ${tk.blue}, ${tk.blueDark})`, color: tk.white, border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        hover={{ transform: 'translateY(-1px)' }}
        onClick={goBack}
      >← Volver</HovBtn>
    </div>
  );

  const activeDevices = dispositivos.filter(d => d.activo !== false).length;
  const btnBase: React.CSSProperties = { padding: '9px 18px', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Top nav bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <HovBtn base={{ ...btnBase, background: tk.white, color: tk.textSub, border: `2px solid ${tk.borderMd}` }} hover={{ borderColor: tk.blue, color: tk.blue, background: tk.blueLight }} onClick={goBack}>← Volver</HovBtn>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: tk.text }}>Detalle de Persona</h1>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <HovBtn base={{ ...btnBase, background: tk.greenBg, color: tk.green, border: `1px solid ${tk.greenBorder}` }} hover={{ background: '#d9f7be', transform: 'translateY(-1px)' }} onClick={() => navigate(`/personas/editar/${resolvedId}`)}>✏️ Editar</HovBtn>
            <HovBtn base={{ ...btnBase, background: tk.redBg, color: tk.red, border: `1px solid ${tk.redBorder}` }} hover={{ background: tk.redBorder, transform: 'translateY(-1px)' }} onClick={handleDelete}>🗑️ Eliminar</HovBtn>
          </div>
        )}
      </div>

      {/* ── Main card ── */}
      <div style={{ background: tk.white, borderRadius: '16px', boxShadow: tk.shadow, border: `1px solid ${tk.border}`, marginBottom: '20px', overflow: 'hidden' }}>

        {/* Gradient header */}
        <div style={{ background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
          {[{ s: 130, t: -40, r: -40 }, { s: 90, b: -50, r: 100 }].map((c, i) => (
            <div key={i} style={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: c.t, bottom: c.b, right: c.r }} />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative', flexWrap: 'wrap' }}>
            <div style={{ width: '70px', height: '70px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: tk.white, fontSize: '30px', fontWeight: 800, flexShrink: 0 }}>
              {(persona.nombre?.charAt(0) || 'P').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 6px', color: tk.white, fontSize: '22px', fontWeight: 700 }}>{persona.nombre || 'Sin nombre'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                <span><strong style={{ color: 'white' }}>ID:</strong> {persona.id}</span>
                <span>·</span>
                <span><strong style={{ color: 'white' }}>Identificación:</strong> {persona.identificacion || '—'}</span>
                {persona.telefono && <><span>·</span><span>📞 {persona.telefono}</span></>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '14px 20px', background: tk.bg, borderBottom: `1px solid ${tk.border}` }}>
          {(['info', 'dispositivos'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '10px 20px', borderRadius: '9px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '7px',
              ...(activeTab === tab
                ? { background: tk.white, color: tk.blue, boxShadow: tk.shadow }
                : { background: 'transparent', color: tk.textSub }),
            }}>
              {tab === 'info' ? '📋 Información' : `📱 Dispositivos (${dispositivos.length})`}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '24px 28px', animation: 'fadeUp 0.25s ease' }}>
          {activeTab === 'info' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
              {[
                { title: '📄 Información Básica', bg: tk.blueLight, rows: [
                  { label: 'Nombre',         value: persona.nombre },
                  { label: 'Identificación', value: persona.identificacion },
                  { label: 'Teléfono',       value: persona.telefono || 'No especificado' },
                  { label: 'Estado',         value: <StatusBadge activo={persona.activo !== false} /> },
                ]},
                { title: '🏢 Empresa', bg: tk.purpleBg, rows: [
                  { label: 'Empresa',        value: empresa?.nombre || 'Desconocida' },
                  { label: 'ID Empresa',     value: empresa ? `#${empresa.id}` : '—' },
                  { label: 'Estado',         value: empresa ? <StatusBadge activo={empresa.activo !== false} /> : '—' },
                  { label: 'Fecha creación', value: empresa?.fecha_creacion ? formatDate(empresa.fecha_creacion) : '—' },
                ]},
                { title: '⚙️ Sistema', bg: tk.orangeBg, rows: [
                  { label: 'ID Persona',          value: `#${persona.id}` },
                  { label: 'Fecha creación',       value: persona.fecha_creacion ? formatDate(persona.fecha_creacion) : '—' },
                  { label: 'Última actualización', value: persona.fecha_actualizacion ? formatDate(persona.fecha_actualizacion) : '—' },
                ]},
              ].map(section => (
                <div key={section.title} style={{ background: tk.bg, borderRadius: '12px', border: `1px solid ${tk.borderMd}`, overflow: 'hidden' }}>
                  <div style={{ padding: '13px 16px', background: section.bg, borderBottom: `1px solid ${tk.borderMd}` }}>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: tk.text }}>{section.title}</span>
                  </div>
                  <div style={{ padding: '6px 16px' }}>
                    {section.rows.map(r => (
                      <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${tk.border}` }}>
                        <span style={{ fontSize: '12px', color: tk.textMuted, fontWeight: 500 }}>{r.label}</span>
                        <span style={{ fontSize: '13px', color: tk.text, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{r.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: tk.text }}>📱 Dispositivos Asignados</h3>
                {isAdmin && (
                  <HovBtn
                    base={{ ...btnBase, background: `linear-gradient(135deg, ${tk.blue}, ${tk.blueDark})`, color: tk.white, boxShadow: '0 4px 10px rgba(24,144,255,0.3)' }}
                    hover={{ transform: 'translateY(-1px)', boxShadow: '0 6px 14px rgba(24,144,255,0.4)' }}
                    onClick={() => navigate(`/dispositivos/asignar?personaId=${resolvedId}`)}
                  >+ Asignar dispositivo</HovBtn>
                )}
              </div>

              {dispositivos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', background: tk.bg, borderRadius: '12px', border: `2px dashed ${tk.borderMd}` }}>
                  <div style={{ fontSize: '48px', opacity: 0.25, marginBottom: '14px' }}>📱</div>
                  <h4 style={{ color: tk.text, margin: '0 0 8px' }}>Sin dispositivos asignados</h4>
                  <p style={{ color: tk.textSub, marginBottom: '20px', fontSize: '14px' }}>Esta persona no tiene dispositivos asignados actualmente.</p>
                  {isAdmin && (
                    <HovBtn
                      base={{ ...btnBase, background: tk.blueLight, color: tk.blue, border: `1px solid ${tk.blueBorder}` }}
                      hover={{ background: '#bae7ff' }}
                      onClick={() => navigate(`/dispositivos/asignar?personaId=${resolvedId}`)}
                    >+ Asignar primer dispositivo</HovBtn>
                  )}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {dispositivos.map(dev => (
                    <div key={dev.id}
                      onMouseEnter={() => setHovCard(dev.id)}
                      onMouseLeave={() => setHovCard(null)}
                      onClick={() => navigate(`/dispositivos/${dev.id}`)}
                      style={{ background: hovCard === dev.id ? tk.blueLight : tk.white, border: `1px solid ${hovCard === dev.id ? tk.blueBorder : tk.borderMd}`, borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s', transform: hovCard === dev.id ? 'translateY(-3px)' : 'none', boxShadow: hovCard === dev.id ? tk.shadow : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ width: '42px', height: '42px', background: tk.blueLight, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>📱</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: tk.text, fontSize: '14px' }}>Dispositivo #{dev.id}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: tk.textMuted, background: tk.bg, padding: '2px 7px', borderRadius: '4px', display: 'inline-block', marginTop: '3px' }}>{dev.imei}</div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', ...(dev.activo !== false ? { background: tk.greenBg, color: '#237804', border: `1px solid ${tk.greenBorder}` } : { background: tk.redBg, color: '#a8071a', border: `1px solid ${tk.redBorder}` }) }}>
                          {dev.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div style={{ paddingTop: '12px', borderTop: `1px solid ${tk.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ color: tk.blue, fontSize: '13px', fontWeight: 600 }}>Ver detalles →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
        <StatCard icon="📱" value={dispositivos.length} label="Dispositivos asignados" color={tk.blue}   bg={tk.blueLight} />
        <StatCard icon="✅" value={activeDevices}        label="Dispositivos activos"   color={tk.green}  bg={tk.greenBg}   />
        <StatCard icon="🏢" value={empresa ? 1 : 0}     label="Empresa asignada"        color={tk.purple} bg={tk.purpleBg}  />
      </div>
    </div>
  );
};

export default PersonaDetail;