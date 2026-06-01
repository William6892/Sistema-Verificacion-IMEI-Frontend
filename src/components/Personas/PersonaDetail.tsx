// src/components/Personas/PersonaDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import { dispositivosService } from '../../services/dispositivosService';
import { authService } from '../../services/authService';
import './Personas.css';

interface PersonaDetailProps { onBack?: () => void; personaId?: number; }

const StatusBadge = ({ activo }: { activo: boolean }) => (
  <span className={`personas-badge-status ${activo ? 'active' : 'inactive'}`}>
    <span className="personas-status-dot" />
    <span>{activo ? 'Activo' : 'Inactivo'}</span>
  </span>
);

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
    <div className="personas-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: `3px solid var(--primary-light)`, borderTop: `3px solid var(--primary)`, borderRadius: '50%', animation: 'pulseDot 1s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Cargando información...</span>
    </div>
  );

  if (error || !persona) return (
    <div className="personas-wrapper" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '16px', padding: '60px 40px', maxWidth: '560px', margin: '40px auto', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: 'var(--error)', marginBottom: '10px', fontSize: '22px', fontWeight: 700 }}>Error al cargar la persona</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'La persona no existe o ha sido eliminada del sistema'}</p>
        <button className="personas-btn personas-btn-primary" onClick={goBack}>
          ← Volver
        </button>
      </div>
    </div>
  );

  const activeDevices = dispositivos.filter(d => d.activo !== false).length;
  const avatarInit = (persona.nombre?.charAt(0) || 'P').toUpperCase();

  return (
    <div className="personas-wrapper personas-container">
      {/* ── Top nav bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="personas-btn personas-btn-secondary" onClick={goBack}>
            ← Volver
          </button>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.025em' }}>Detalle de Persona</h1>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="personas-btn personas-btn-secondary" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--success)' }} onClick={() => navigate(`/personas/editar/${resolvedId}`)}>
              ✏️ Editar
            </button>
            <button className="personas-btn personas-btn-secondary" style={{ borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--error)' }} onClick={handleDelete}>
              🗑️ Eliminar
            </button>
          </div>
        )}
      </div>

      {/* ── Main card ── */}
      <div className="personas-detail-card">
        {/* Gradient header */}
        <div className="personas-detail-banner">
          {/* Decorative circles */}
          <div className="personas-detail-banner-circle" style={{ width: '130px', height: '130px', top: '-40px', right: '-40px' }} />
          <div className="personas-detail-banner-circle" style={{ width: '90px', height: '90px', bottom: '-50px', right: '100px' }} />

          <div className="personas-detail-profile-wrapper">
            <div className="personas-detail-avatar">
              {avatarInit}
            </div>
            <div className="personas-detail-info-block">
              <h2 className="personas-detail-name">{persona.nombre || 'Sin nombre'}</h2>
              <div className="personas-detail-meta-list">
                <span className="personas-detail-meta-item"><strong>ID:</strong> #{persona.id}</span>
                <span>·</span>
                <span className="personas-detail-meta-item"><strong>Identificación:</strong> {persona.identificacion || '—'}</span>
                {persona.telefono && (
                  <>
                    <span>·</span>
                    <span className="personas-detail-meta-item">📞 {persona.telefono}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="personas-detail-tabs">
          <button
            onClick={() => setActiveTab('info')}
            className={`personas-detail-tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          >
            📋 Información General
          </button>
          <button
            onClick={() => setActiveTab('dispositivos')}
            className={`personas-detail-tab-btn ${activeTab === 'dispositivos' ? 'active' : ''}`}
          >
            📱 Dispositivos Asignados ({dispositivos.length})
          </button>
        </div>

        {/* Tab content */}
        <div className="personas-detail-content-area">
          {activeTab === 'info' ? (
            <div className="personas-detail-grid">
              {/* Información Básica */}
              <div className="personas-detail-section-box">
                <div className="personas-detail-section-header blue">
                  <span>📄 Información Básica</span>
                </div>
                <div className="personas-detail-section-body">
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Nombre</span>
                    <span className="personas-detail-row-value">{persona.nombre}</span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Identificación</span>
                    <span className="personas-detail-row-value">{persona.identificacion}</span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Teléfono</span>
                    <span className="personas-detail-row-value">{persona.telefono || 'No especificado'}</span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Estado</span>
                    <span className="personas-detail-row-value">
                      <StatusBadge activo={persona.activo !== false} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Empresa */}
              <div className="personas-detail-section-box">
                <div className="personas-detail-section-header purple">
                  <span>🏢 Datos de Empresa</span>
                </div>
                <div className="personas-detail-section-body">
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Empresa</span>
                    <span className="personas-detail-row-value">{empresa?.nombre || 'Desconocida'}</span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">ID Empresa</span>
                    <span className="personas-detail-row-value">{empresa ? `#${empresa.id}` : '—'}</span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Estado</span>
                    <span className="personas-detail-row-value">
                      {empresa ? <StatusBadge activo={empresa.activo !== false} /> : '—'}
                    </span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Fecha creación</span>
                    <span className="personas-detail-row-value">
                      {empresa?.fecha_creacion ? formatDate(empresa.fecha_creacion) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sistema */}
              <div className="personas-detail-section-box">
                <div className="personas-detail-section-header orange">
                  <span>⚙️ Detalles de Registro</span>
                </div>
                <div className="personas-detail-section-body">
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">ID Registro</span>
                    <span className="personas-detail-row-value">#{persona.id}</span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Fecha creación</span>
                    <span className="personas-detail-row-value">
                      {persona.fecha_creacion ? formatDate(persona.fecha_creacion) : '—'}
                    </span>
                  </div>
                  <div className="personas-detail-row-item">
                    <span className="personas-detail-row-label">Última actualización</span>
                    <span className="personas-detail-row-value">
                      {persona.fecha_actualizacion ? formatDate(persona.fecha_actualizacion) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="personas-detail-devices-header">
                <h3>Dispositivos asociados a este perfil</h3>
                {isAdmin && (
                  <button
                    className="personas-btn personas-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13.5px' }}
                    onClick={() => navigate(`/dispositivos/asignar?personaId=${resolvedId}`)}
                  >
                    + Asignar dispositivo
                  </button>
                )}
              </div>

              {dispositivos.length === 0 ? (
                <div className="personas-detail-devices-empty">
                  <div className="personas-detail-devices-empty-icon">📱</div>
                  <h4>Sin dispositivos asignados</h4>
                  <p>Este perfil de persona no tiene ningún dispositivo IMEI asociado actualmente.</p>
                  {isAdmin && (
                    <button
                      className="personas-btn personas-btn-secondary"
                      onClick={() => navigate(`/dispositivos/asignar?personaId=${resolvedId}`)}
                    >
                      Asignar primer dispositivo
                    </button>
                  )}
                </div>
              ) : (
                <div className="personas-detail-devices-grid">
                  {dispositivos.map(dev => (
                    <div
                      key={dev.id}
                      onClick={() => navigate(`/dispositivos/${dev.id}`)}
                      className="personas-detail-device-card"
                    >
                      <div className="personas-detail-device-card-header">
                        <div className="personas-detail-device-icon">📱</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="personas-detail-device-title">Dispositivo #{dev.id}</div>
                          <span className="personas-detail-device-imei">{dev.imei}</span>
                        </div>
                        <span className={`personas-badge-status ${dev.activo !== false ? 'active' : 'inactive'}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                          {dev.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="personas-detail-device-card-footer">
                        <span className="personas-detail-device-link">Ver detalles del IMEI →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats cards at bottom ── */}
      <div className="personas-detail-stats-grid">
        <div className="personas-detail-stat-card">
          <div className="personas-detail-stat-card-icon blue">📱</div>
          <div>
            <div className="personas-detail-stat-card-value">{dispositivos.length}</div>
            <div className="personas-detail-stat-card-label">Dispositivos asignados</div>
          </div>
        </div>

        <div className="personas-detail-stat-card">
          <div className="personas-detail-stat-card-icon green">✅</div>
          <div>
            <div className="personas-detail-stat-card-value">{activeDevices}</div>
            <div className="personas-detail-stat-card-label">Dispositivos activos</div>
          </div>
        </div>

        <div className="personas-detail-stat-card">
          <div className="personas-detail-stat-card-icon purple">🏢</div>
          <div>
            <div className="personas-detail-stat-card-value">{empresa ? 1 : 0}</div>
            <div className="personas-detail-stat-card-label">Empresas vinculadas</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaDetail;