// src/components/Dispositivos/DispositivoDetail.tsx
import React, { useState, useEffect } from 'react';
import { dispositivosService } from '../../services/dispositivosService';

interface DispositivoDetailProps {
  dispositivo: any;
  onClose: () => void;
  onEdit?: () => void;
  userRole: string;
}

// ─── Tokens (same system) ─────────────────────────────────────────────────────
const tk = {
  blue:        '#1890ff',
  blueDark:    '#096dd9',
  blueLight:   '#e6f7ff',
  blueBorder:  '#91d5ff',
  blueAlpha:   'rgba(24,144,255,0.1)',
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
};

// ─── Small reusables ──────────────────────────────────────────────────────────
const HovBtn = ({
  base, hover, onClick, disabled = false, children, title,
}: {
  base: React.CSSProperties;
  hover: React.CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) => {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      onMouseEnter={() => !disabled && setH(true)}
      onMouseLeave={() => setH(false)}
      style={{ ...base, ...(h && !disabled ? hover : {}), ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}
    >
      {children}
    </button>
  );
};

const InfoCard = ({ icon, iconBg, iconColor, title, badge, children }: {
  icon: string; iconBg: string; iconColor: string;
  title: string; badge?: React.ReactNode; children: React.ReactNode;
}) => (
  <div style={{
    background: tk.white, border: `1px solid ${tk.borderMd}`,
    borderRadius: '12px', padding: '18px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start',
  }}>
    <div style={{
      width: '48px', height: '48px', borderRadius: '12px',
      background: iconBg, color: iconColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '22px', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '14px', color: tk.text }}>{title}</span>
        {badge}
      </div>
      {children}
    </div>
  </div>
);

const MetaRow = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
    <span style={{ fontSize: '11px', fontWeight: 600, color: tk.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ fontSize: '14px', fontWeight: 600, color: tk.text, fontFamily: mono ? 'monospace' : undefined, wordBreak: 'break-word' }}>{value || '—'}</span>
  </div>
);

const StatCard = ({ icon, value, label, color, bg }: { icon: string; value: string | number; label: string; color: string; bg: string }) => {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        background: h ? bg : tk.white,
        border: `2px solid ${h ? color : tk.borderMd}`,
        borderRadius: '12px', padding: '18px', textAlign: 'center',
        transition: 'all 0.2s', transform: h ? 'translateY(-3px)' : 'none',
        boxShadow: h ? `0 8px 20px rgba(0,0,0,0.08)` : 'none',
      }}
    >
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: 800, color, lineHeight: 1, marginBottom: '6px' }}>{value}</div>
      <div style={{ fontSize: '12px', color: tk.textSub, fontWeight: 500, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const DispositivoDetail: React.FC<DispositivoDetailProps> = ({ dispositivo, onClose, onEdit, userRole }) => {
  const [loading, setLoading]   = useState(false);
  const [dev, setDev]           = useState<any>(dispositivo);
  const [error, setError]       = useState('');
  const [visible, setVisible]   = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    loadDetail();
  }, [dispositivo.id]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const d = await dispositivosService.getDispositivo(dispositivo.id);
      setDev(d);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar detalles');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { setVisible(false); setTimeout(onClose, 200); };

  const handleToggle = async () => {
    if (!window.confirm(`¿${dev.activo ? 'Desactivar' : 'Activar'} este dispositivo?`)) return;
    try {
      setLoading(true);
      const updated = await dispositivosService.toggleActivo(dev.id, !dev.activo);
      setDev(updated);
    } catch (err: any) { setError(err.response?.data?.mensaje || 'Error al cambiar estado'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este dispositivo? Esta acción no se puede deshacer.')) return;
    try {
      setLoading(true);
      await dispositivosService.deleteDispositivo(dev.id);
      onClose();
    } catch (err: any) { setError(err.response?.data?.mensaje || 'Error al eliminar'); }
    finally { setLoading(false); }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const formatDate = (ds: string) => {
    if (!ds) return '—';
    try {
      return new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  const formatIMEI = (imei: string) => {
    if (!imei) return '—';
    const c = imei.toString().replace(/\D/g, '');
    if (c.length === 15) return `${c.slice(0,6)}-${c.slice(6,12)}-${c.slice(12)}`;
    return c;
  };

  const daysInSystem = dev.fechaRegistro
    ? Math.floor((Date.now() - new Date(dev.fechaRegistro).getTime()) / 86400000)
    : 0;

  const isAdmin = userRole === 'Admin';

  // Shared footer button base
  const footerBtn: React.CSSProperties = {
    padding: '11px 22px', borderRadius: '9px', border: 'none',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: '8px',
    transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeOut { from{opacity:1} to{opacity:0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: visible ? 'fadeIn 0.2s ease' : 'fadeOut 0.2s ease',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: tk.white, borderRadius: '18px',
            width: '100%', maxWidth: '820px', maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: visible ? 'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1)' : 'fadeOut 0.2s ease',
          }}
        >
          {/* ── Header ── */}
          <div style={{
            background: `linear-gradient(135deg, ${tk.blue} 0%, ${tk.blueDark} 100%)`,
            padding: '22px 28px', flexShrink: 0, position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            {[{ s: 130, t: -40, r: -40 }, { s: 90, b: -50, r: 100 }].map((c, i) => (
              <div key={i} style={{ position: 'absolute', width: c.s, height: c.s, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: c.t, bottom: c.b, right: c.r }} />
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Device avatar */}
                <div style={{
                  background: 'rgba(255,255,255,0.18)', borderRadius: '14px',
                  width: '54px', height: '54px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', border: '1px solid rgba(255,255,255,0.25)', flexShrink: 0,
                }}>
                  📱
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: 700 }}>
                    Detalles del Dispositivo
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px', marginTop: '4px', fontFamily: 'monospace' }}>
                    IMEI: {formatIMEI(dev.imei)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {/* Status pill */}
                <span style={{
                  padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: dev.activo ? 'rgba(82,196,26,0.2)' : 'rgba(255,77,79,0.2)',
                  border: `1px solid ${dev.activo ? 'rgba(82,196,26,0.4)' : 'rgba(255,77,79,0.4)'}`,
                  color: 'white',
                }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: dev.activo ? tk.green : tk.red, boxShadow: dev.activo ? `0 0 6px ${tk.green}` : `0 0 6px ${tk.red}` }} />
                  {dev.activo ? 'Activo' : 'Inactivo'}
                </span>

                {/* Close */}
                <HovBtn
                  base={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '9px', width: '34px', height: '34px', color: 'white', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', lineHeight: 1 }}
                  hover={{ background: 'rgba(255,255,255,0.28)' }}
                  onClick={handleClose}
                >×</HovBtn>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Loading overlay */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                <div style={{ width: '32px', height: '32px', border: `3px solid ${tk.blueLight}`, borderTop: `3px solid ${tk.blue}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: tk.redBg, border: `1px solid ${tk.redBorder}`, color: tk.red, padding: '12px 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                <span>⚠️</span> <span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: tk.red, fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>
            )}

            {/* ── Device info ── */}
            <InfoCard icon="📱" iconBg={tk.blueLight} iconColor={tk.blue} title="Información del dispositivo">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <MetaRow label="ID" value={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    #{dev.id}
                    <CopyBtn text={String(dev.id)} keyId="id" copied={copied} onCopy={copyText} />
                  </span>
                } />
                <MetaRow label="IMEI" value={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '15px' }}>{formatIMEI(dev.imei)}</span>
                    <CopyBtn text={dev.imei} keyId="imei" copied={copied} onCopy={copyText} />
                  </span>
                } />
                <MetaRow label="Fecha de registro"   value={formatDate(dev.fechaRegistro)} />
                <MetaRow label="Última actualización" value={dev.fechaActualizacion ? formatDate(dev.fechaActualizacion) : 'No disponible'} />
              </div>
            </InfoCard>

            {/* ── Owner ── */}
            <InfoCard icon="👤" iconBg={tk.greenBg} iconColor={tk.green} title="Propietario">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <MetaRow label="Nombre"        value={dev.personaNombre} />
                <MetaRow label="ID Persona"    value={dev.personaId ? `#${dev.personaId}` : undefined} mono />
                <MetaRow label="Identificación" value={dev.personaIdentificacion} mono />
                <MetaRow label="Teléfono"      value={dev.personaTelefono} />
                <MetaRow label="Email"         value={dev.personaEmail} />
              </div>
            </InfoCard>

            {/* ── Company ── */}
            <InfoCard icon="🏢" iconBg={tk.purpleBg} iconColor={tk.purple} title="Empresa">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <MetaRow label="Nombre"               value={dev.empresaNombre} />
                <MetaRow label="ID Empresa"           value={dev.empresaId ? `#${dev.empresaId}` : undefined} mono />
                <MetaRow label="Dispositivos totales" value={dev.empresaTotalDispositivos} />
                <MetaRow label="Personas registradas" value={dev.empresaTotalPersonas} />
              </div>
            </InfoCard>

            {/* ── Stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              <StatCard icon="📅" value={`${daysInSystem}d`}          label="En el sistema"                color={tk.blue}   bg={tk.blueLight} />
              <StatCard icon="🔄" value={dev.cantidadCambios || 0}    label="Cambios realizados"           color={tk.orange}  bg={tk.orangeBg} />
              <StatCard icon="📱" value={dev.personaTotalDispositivos || 1} label="Disp. de esta persona"  color={tk.purple}  bg={tk.purpleBg} />
            </div>

            {/* ── History ── */}
            {dev.historial?.length > 0 && (
              <InfoCard icon="📋" iconBg={tk.orangeBg} iconColor={tk.orange} title="Historial de cambios">
                <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {dev.historial.map((c: any, i: number) => (
                    <div key={i} style={{ padding: '10px 14px', background: tk.bg, borderRadius: '8px', border: `1px solid ${tk.border}` }}>
                      <div style={{ fontSize: '11px', color: tk.textMuted, marginBottom: '4px' }}>{formatDate(c.fecha)}</div>
                      <div style={{ fontSize: '13px', color: tk.text, marginBottom: '3px' }}>{c.descripcion}</div>
                      <div style={{ fontSize: '11px', color: tk.textSub, fontStyle: 'italic' }}>Por: {c.usuario}</div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {/* ── Note ── */}
            <div style={{ background: tk.orangeBg, border: `1px solid ${tk.orangeBorder}`, borderRadius: '10px', padding: '14px 18px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#7c4700', lineHeight: 1.5 }}>
                <strong style={{ color: tk.orange }}>IMEI:</strong> Identificador único del dispositivo móvil. Mantenerlo actualizado garantiza la trazabilidad.
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#7c4700', lineHeight: 1.5 }}>
                <strong style={{ color: tk.orange }}>Estado:</strong> Los dispositivos inactivos no aparecerán en las verificaciones regulares.
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '16px 24px', borderTop: `1px solid ${tk.border}`,
            background: tk.bg, display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '10px', flexShrink: 0,
          }}>
            <HovBtn
              base={{ ...footerBtn, background: '#f0f0f0', color: tk.textSub, boxShadow: 'none' }}
              hover={{ background: '#e0e0e0', transform: 'translateY(-1px)' }}
              onClick={handleClose} disabled={loading}
            >Cerrar</HovBtn>

            {isAdmin && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Toggle */}
                <HovBtn
                  base={{ ...footerBtn, background: dev.activo ? tk.orangeBg : tk.greenBg, color: dev.activo ? tk.orange : tk.green, border: `1px solid ${dev.activo ? tk.orangeBorder : tk.greenBorder}`, boxShadow: 'none' }}
                  hover={{ transform: 'translateY(-1px)', boxShadow: `0 5px 14px rgba(0,0,0,0.12)` }}
                  onClick={handleToggle} disabled={loading}
                >
                  {dev.activo ? '⏸ Desactivar' : '▶️ Activar'}
                </HovBtn>

                {/* Edit */}
                {onEdit && (
                  <HovBtn
                    base={{ ...footerBtn, background: tk.blueLight, color: tk.blue, border: `1px solid ${tk.blueBorder}`, boxShadow: 'none' }}
                    hover={{ background: '#bae7ff', transform: 'translateY(-1px)', boxShadow: '0 5px 14px rgba(24,144,255,0.25)' }}
                    onClick={onEdit} disabled={loading}
                  >✏️ Editar</HovBtn>
                )}

                {/* Delete */}
                <HovBtn
                  base={{ ...footerBtn, background: tk.redBg, color: tk.red, border: `1px solid ${tk.redBorder}`, boxShadow: 'none' }}
                  hover={{ background: tk.redBorder, transform: 'translateY(-1px)', boxShadow: '0 5px 14px rgba(255,77,79,0.25)' }}
                  onClick={handleDelete} disabled={loading}
                >🗑️ Eliminar</HovBtn>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Copy button ──────────────────────────────────────────────────────────────
const CopyBtn = ({ text, keyId, copied, onCopy }: { text: string; keyId: string; copied: string | null; onCopy: (t: string, k: string) => void }) => {
  const done = copied === keyId;
  return (
    <button
      onClick={() => onCopy(text, keyId)}
      title="Copiar"
      style={{
        background: done ? '#f6ffed' : '#f0f0f0',
        border: `1px solid ${done ? '#b7eb8f' : '#e8e8e8'}`,
        borderRadius: '6px', padding: '3px 8px', fontSize: '11px',
        color: done ? '#52c41a' : '#999', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: '3px',
        transition: 'all 0.2s', fontWeight: 600,
      }}
    >
      {done ? '✓ Copiado' : '📋 Copiar'}
    </button>
  );
};

export default DispositivoDetail;