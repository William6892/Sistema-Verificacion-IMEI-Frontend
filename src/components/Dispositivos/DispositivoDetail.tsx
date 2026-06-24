import React, { useState, useEffect } from 'react';
import { dispositivosService } from '../../services/dispositivosService';
import { 
  Smartphone, User, Building2, Calendar, Clipboard, 
  AlertTriangle, X, Play, Pause, Edit2, Trash2 
} from 'lucide-react';
import './Dispositivos.css';

interface DispositivoDetailProps {
  dispositivo: any;
  onClose: () => void;
  onEdit?: () => void;
  userRole: string;
}

// ─── Small reusables ──────────────────────────────────────────────────────────
const InfoCard = ({ icon, title, badge, children, iconClass }: {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  iconClass: 'device' | 'owner' | 'company' | 'history';
}) => (
  <div className="dispositivos-detail-info-card">
    <div className={`dispositivos-detail-info-card-icon ${iconClass}`}>
      {icon}
    </div>
    <div className="dispositivos-detail-info-card-content">
      <div className="dispositivos-detail-info-card-header">
        <span className="dispositivos-detail-info-card-title">{title}</span>
        {badge}
      </div>
      {children}
    </div>
  </div>
);

const MetaRow = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
  <div className="dispositivos-detail-meta-row">
    <span className="dispositivos-detail-meta-label">{label}</span>
    <span className={`dispositivos-detail-meta-value ${mono ? 'mono' : ''}`}>{value || '—'}</span>
  </div>
);

const StatCard = ({ icon, value, label, colorClass }: { icon: React.ReactNode; value: string | number; label: string; colorClass: 'blue' | 'orange' | 'purple' }) => (
  <div className={`dispositivos-detail-stat-card ${colorClass}`}>
    <div className="dispositivos-detail-stat-icon">{icon}</div>
    <div className={`dispositivos-detail-stat-value ${colorClass}`}>{value}</div>
    <div className="dispositivos-detail-stat-label">{label}</div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const DispositivoDetail: React.FC<DispositivoDetailProps> = ({ dispositivo, onClose, onEdit, userRole }) => {
  const [loading, setLoading]     = useState(false);
  const [dev, setDev]             = useState<any>(dispositivo);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
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

  const handleClose = () => { 
    setIsClosing(true); 
    setTimeout(onClose, 200); 
  };

  const handleToggle = async () => {
    if (!window.confirm(`¿${dev.activo ? 'Desactivar' : 'Activar'} este dispositivo?`)) return;
    try {
      setLoading(true);
      const updated = await dispositivosService.toggleActivo(dev.id, !dev.activo);
      setDev(updated);
    } catch (err: any) { 
      setError(err.response?.data?.mensaje || 'Error al cambiar estado'); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar este dispositivo? Esta acción no se puede deshacer.')) return;
    try {
      setLoading(true);
      await dispositivosService.deleteDispositivo(dev.id);
      handleClose();
    } catch (err: any) { 
      setError(err.response?.data?.mensaje || 'Error al eliminar'); 
    } finally { 
      setLoading(false); 
    }
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
      return new Date(ds).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
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

  return (
    <div
      onClick={handleClose}
      className={`dispositivos-detail-overlay ${isClosing ? 'closing' : ''}`}
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Container */}
      <div
        onClick={e => e.stopPropagation()}
        className={`dispositivos-detail-modal ${isClosing ? 'closing' : ''}`}
      >
        {/* ── Header ── */}
        <div className="dispositivos-detail-header">
          {/* Decorative circles */}
          <div className="dispositivos-detail-header-circle" />
          <div className="dispositivos-detail-header-circle" />

          <div className="dispositivos-detail-header-content">
            <div className="dispositivos-detail-header-left">
              {/* Device avatar */}
              <div className="dispositivos-detail-avatar">
                <Smartphone size={28} />
              </div>
              <div>
                <h3 className="dispositivos-detail-title">
                  Detalles del Dispositivo
                </h3>
                <div className="dispositivos-detail-subtitle">
                  IMEI: {formatIMEI(dev.imei)}
                </div>
              </div>
            </div>

            <div className="dispositivos-detail-header-right">
              {/* Status pill */}
              <span className={`dispositivos-detail-status-pill ${dev.activo ? 'active' : 'inactive'}`}>
                <span className={`dispositivos-detail-status-dot ${dev.activo ? 'active' : 'inactive'}`} />
                {dev.activo ? 'Activo' : 'Inactivo'}
              </span>

              {/* Close Button */}
              <button
                className="dispositivos-detail-close-btn"
                onClick={handleClose}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="dispositivos-detail-body">

          {/* Loading indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <div className="dispositivos-spinner" style={{ width: '32px', height: '32px' }} />
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="dispositivos-error-banner" style={{ margin: '0 0 16px 0' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> {error}
              </span>
              <button onClick={() => setError('')} aria-label="Cerrar error"><X size={18} /></button>
            </div>
          )}

          {/* ── Device info ── */}
          <InfoCard icon={<Smartphone size={24} />} iconClass="device" title="Información del dispositivo">
            <div className="dispositivos-detail-meta-grid">
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
          <InfoCard icon={<User size={24} />} iconClass="owner" title="Propietario">
            <div className="dispositivos-detail-meta-grid">
              <MetaRow label="Nombre"        value={dev.personaNombre} />
              <MetaRow label="ID Persona"    value={dev.personaId ? `#${dev.personaId}` : undefined} mono />
              <MetaRow label="Identificación" value={dev.personaIdentificacion} mono />
              <MetaRow label="Teléfono"      value={dev.personaTelefono} />
              <MetaRow label="Email"         value={dev.personaEmail} />
            </div>
          </InfoCard>

          {/* ── Company ── */}
          <InfoCard icon={<Building2 size={24} />} iconClass="company" title="Empresa">
            <div className="dispositivos-detail-meta-grid">
              <MetaRow label="Nombre"               value={dev.empresaNombre} />
              <MetaRow label="ID Empresa"           value={dev.empresaId ? `#${dev.empresaId}` : undefined} mono />
              <MetaRow label="Dispositivos totales" value={dev.empresaTotalDispositivos} />
              <MetaRow label="Personas registradas" value={dev.empresaTotalPersonas} />
            </div>
          </InfoCard>

          {/* ── Stats ── */}
          <div className="dispositivos-detail-stats-grid">
            <StatCard icon={<Calendar size={24} />} value={`${daysInSystem}d`} label="En el sistema" colorClass="blue" />
            <StatCard icon={<Clipboard size={24} />} value={dev.cantidadCambios || 0} label="Cambios realizados" colorClass="orange" />
            <StatCard icon={<Smartphone size={24} />} value={dev.personaTotalDispositivos || 1} label="Disp. de esta persona" colorClass="purple" />
          </div>

          {/* ── History ── */}
          {dev.historial?.length > 0 && (
            <InfoCard icon={<Clipboard size={24} />} iconClass="history" title="Historial de cambios">
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dev.historial.map((c: any, i: number) => (
                  <div key={i} className="dispositivos-detail-history-item">
                    <div className="dispositivos-detail-history-date">{formatDate(c.fecha)}</div>
                    <div className="dispositivos-detail-history-desc">{c.descripcion}</div>
                    <div className="dispositivos-detail-history-user">Por: {c.usuario}</div>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* ── Note ── */}
          <div className="dispositivos-detail-note">
            <p>
              <strong>IMEI:</strong> Identificador único del dispositivo móvil. Mantenerlo actualizado garantiza la trazabilidad.
            </p>
            <p>
              <strong>Estado:</strong> Los dispositivos inactivos no aparecerán en las verificaciones regulares.
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="dispositivos-detail-footer">
          <button
            className="dispositivos-detail-footer-btn close"
            onClick={handleClose} 
            disabled={loading}
          >
            Cerrar
          </button>

          {isAdmin && (
            <div className="dispositivos-detail-footer-actions">
              {/* Toggle Activo */}
              <button
                className={`dispositivos-detail-footer-btn ${dev.activo ? 'deactivate' : 'activate'}`}
                onClick={handleToggle} 
                disabled={loading}
              >
                {dev.activo ? <Pause size={14} /> : <Play size={14} />}
                {dev.activo ? 'Desactivar' : 'Activar'}
              </button>

              {/* Edit */}
              {onEdit && (
                <button
                  className="dispositivos-detail-footer-btn edit"
                  onClick={onEdit} 
                  disabled={loading}
                >
                  <Edit2 size={14} /> Editar
                </button>
              )}

              {/* Delete */}
              <button
                className="dispositivos-detail-footer-btn delete"
                onClick={handleDelete} 
                disabled={loading}
              >
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Copy button ──────────────────────────────────────────────────────────────
const CopyBtn = ({ text, keyId, copied, onCopy }: { text: string; keyId: string; copied: string | null; onCopy: (t: string, k: string) => void }) => {
  const done = copied === keyId;
  return (
    <button
      onClick={() => onCopy(text, keyId)}
      title="Copiar"
      className={`dispositivos-detail-copy-btn ${done ? 'copied' : ''}`}
    >
      {done ? '✓ Copiado' : <><Clipboard size={12} style={{ marginRight: '4px' }} /> Copiar</>}
    </button>
  );
};

export default DispositivoDetail;