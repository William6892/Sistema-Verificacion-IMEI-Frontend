// src/components/Personas/PersonaDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import { dispositivosService } from '../../services/dispositivosService';
import { authService } from '../../services/authService';

interface PersonaDetailProps {
  onBack?: () => void;
  personaId?: number;
}

const getAvatarGradient = (nombre: string) => {
  const code = (nombre || 'P').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'linear-gradient(135deg, #1428A0 0%, #007BFF 100%)', // Samsung Royal Blue
    'linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)', // Lavender to Violet
    'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', // Pink
    'linear-gradient(135deg, #10b981 0%, #34d399 100%)', // Emerald
    'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', // Amber
    'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', // Cyan
    'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', // Blue
    'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', // Purple
  ];
  return gradients[code % gradients.length];
};

const StatusBadge = ({ activo }: { activo: boolean }) => (
  <span className={activo ? 'personas-badge-active' : 'personas-badge-inactive'}>
    {activo ? 'Activo' : 'Inactivo'}
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

  useEffect(() => {
    if (resolvedId) loadData();
  }, [resolvedId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const p = await personasService.getPersona(resolvedId!);
      setPersona(p);
      if (p.empresaId) {
        try {
          setEmpresa(await empresasService.getEmpresa(p.empresaId));
        } catch {
          /* silent */
        }
      }
      try {
        setDispositivos(await dispositivosService.getDispositivosPorPersona(resolvedId!));
      } catch {
        /* silent */
      }
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar persona');
    } finally {
      setLoading(false);
    }
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
      return new Date(dateOnly + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '—';
    }
  };

  if (loading) return (
    <div className="personas-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: '3px solid #f1f5f9', borderTop: '3px solid #1428A0', borderRadius: '50%', animation: 'personasSpin 0.9s linear infinite' }} />
      <span style={{ color: '#64748b', fontWeight: 500 }}>Cargando información...</span>
    </div>
  );

  if (error || !persona) return (
    <div className="personas-wrapper" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div className="personas-error-banner" style={{ display: 'block', maxWidth: '520px', margin: '40px auto', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: '#be123c', fontSize: '20px', fontWeight: 800, margin: '0 0 12px' }}>Error al cargar la persona</h3>
        <p style={{ color: '#475569', marginBottom: '24px', fontSize: '14.5px', fontWeight: 500 }}>{error || 'La persona no existe o fue eliminada de la base de datos.'}</p>
        <button className="personas-btn personas-btn-primary" onClick={goBack}>
          ← Volver a la lista
        </button>
      </div>
    </div>
  );

  const activeDevices = dispositivos.filter(d => d.activo !== false).length;

  return (
    <div className="personas-detail-container">
      
      {/* ── Top nav bar ── */}
      <div className="personas-detail-nav">
        <div className="personas-detail-nav-left">
          <button className="personas-btn personas-btn-secondary" onClick={goBack}>
            ← Volver
          </button>
          <h1>Detalle de Persona</h1>
        </div>
        {isAdmin && (
          <div className="personas-detail-nav-actions">
            <button
              className="personas-btn personas-btn-secondary"
              style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.04)' }}
              onClick={() => navigate(`/personas/editar/${resolvedId}`)}
            >
              ✏️ Editar
            </button>
            <button
              className="personas-btn personas-btn-secondary"
              style={{ borderColor: '#f43f5e', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.04)' }}
              onClick={handleDelete}
            >
              🗑️ Eliminar
            </button>
          </div>
        )}
      </div>

      {/* ── Main Dashboard Card ── */}
      <div className="personas-detail-card">
        
        {/* Cover con Retícula y Gradiente */}
        <div className="personas-detail-cover">
          <div className="personas-detail-cover-grid" />
          <div className="personas-detail-cover-content">
            <div className="personas-detail-cover-avatar" style={{ background: getAvatarGradient(persona.nombre) }}>
              {(persona.nombre?.charAt(0) || 'P').toUpperCase()}
            </div>
            <div className="personas-detail-cover-info">
              <h2 className="personas-detail-cover-name">{persona.nombre || 'Sin nombre'}</h2>
              <div className="personas-detail-cover-meta">
                <span><strong>ID Persona:</strong> #{persona.id}</span>
                <span className="personas-detail-cover-divider">·</span>
                <span><strong>Identificación:</strong> {persona.identificacion || '—'}</span>
                {persona.telefono && (
                  <>
                    <span className="personas-detail-cover-divider">·</span>
                    <span>📞 {persona.telefono}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas Deslizantes */}
        <div className="personas-detail-tabs">
          {(['info', 'dispositivos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`personas-detail-tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'info' ? '📋 Información General' : `📱 Dispositivos Asignados (${dispositivos.length})`}
            </button>
          ))}
        </div>

        {/* Contenido de Pestaña */}
        <div className="personas-detail-body">
          {activeTab === 'info' ? (
            <div className="personas-detail-grid">
              
              {/* Sección: Datos Básicos */}
              <div className="personas-detail-section-card basics">
                <div className="personas-detail-section-header">📄 Información Básica</div>
                <div className="personas-detail-section-body">
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Nombre Completo</span>
                    <span className="personas-detail-info-value">{persona.nombre}</span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Identificación / Cédula</span>
                    <span className="personas-detail-info-value">{persona.identificacion}</span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Teléfono</span>
                    <span className="personas-detail-info-value">{persona.telefono || 'No especificado'}</span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Estado</span>
                    <span className="personas-detail-info-value">
                      <StatusBadge activo={persona.activo !== false} />
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección: Empresa */}
              <div className="personas-detail-section-card company">
                <div className="personas-detail-section-header">🏢 Vínculo Empresarial</div>
                <div className="personas-detail-section-body">
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Empresa Asignada</span>
                    <span className="personas-detail-info-value">{empresa?.nombre || 'Desconocida'}</span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">ID Empresa</span>
                    <span className="personas-detail-info-value">{empresa ? `#${empresa.id}` : '—'}</span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Estado Empresa</span>
                    <span className="personas-detail-info-value">
                      {empresa ? <StatusBadge activo={empresa.activo !== false} /> : '—'}
                    </span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Fecha Vínculo</span>
                    <span className="personas-detail-info-value">
                      {empresa?.fecha_creacion ? formatDate(empresa.fecha_creacion) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sección: Metadatos del Sistema */}
              <div className="personas-detail-section-card system">
                <div className="personas-detail-section-header">⚙️ Auditoría del Sistema</div>
                <div className="personas-detail-section-body">
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Código Único</span>
                    <span className="personas-detail-info-value">#{persona.id}</span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Fecha de Registro</span>
                    <span className="personas-detail-info-value">
                      {persona.fecha_creacion ? formatDate(persona.fecha_creacion) : '—'}
                    </span>
                  </div>
                  <div className="personas-detail-info-row">
                    <span className="personas-detail-info-label">Última Modificación</span>
                    <span className="personas-detail-info-value">
                      {persona.fecha_actualizacion ? formatDate(persona.fecha_actualizacion) : '—'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div>
              <div className="personas-devices-header">
                <h3>📱 Dispositivos Conectados</h3>
                {isAdmin && (
                  <button
                    className="personas-btn personas-btn-primary"
                    onClick={() => navigate(`/dispositivos/asignar?personaId=${resolvedId}`)}
                  >
                    + Asignar Dispositivo
                  </button>
                )}
              </div>

              {dispositivos.length === 0 ? (
                <div className="personas-device-empty-state">
                  <div className="personas-device-empty-state-icon">📱</div>
                  <h4>Sin Dispositivos Asignados</h4>
                  <p>Esta persona no posee ningún dispositivo móvil registrado a su nombre en este momento.</p>
                  {isAdmin && (
                    <button
                      className="personas-btn personas-btn-primary"
                      onClick={() => navigate(`/dispositivos/asignar?personaId=${resolvedId}`)}
                    >
                      + Asignar Primer Dispositivo
                    </button>
                  )}
                </div>
              ) : (
                <div className="personas-devices-grid">
                  {dispositivos.map(dev => {
                    const devActive = dev.activo !== false;
                    return (
                      <div
                        key={dev.id}
                        onClick={() => navigate(`/dispositivos/${dev.id}`)}
                        className={`personas-device-card ${devActive ? 'active' : 'inactive'}`}
                      >
                        <div className="personas-device-card-header">
                          <div className="personas-device-card-icon">📱</div>
                          <div className="personas-device-card-info">
                            <div className="personas-device-card-title">Dispositivo #{dev.id}</div>
                            <div className="personas-device-card-imei">{dev.imei}</div>
                          </div>
                          <span className={`personas-device-card-status ${devActive ? 'active' : 'inactive'}`}>
                            {devActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="personas-device-card-footer">
                          <span>Ver detalles →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Stats ── */}
      <div className="personas-detail-stats-grid">
        <div className="personas-detail-stat-card" style={{ borderLeft: '4.5px solid #007BFF' }}>
          <div className="personas-detail-stat-card-icon" style={{ background: 'rgba(0, 123, 255, 0.07)', color: '#007BFF' }}>📱</div>
          <div>
            <div className="personas-detail-stat-card-value" style={{ color: '#007BFF' }}>{dispositivos.length}</div>
            <div className="personas-detail-stat-card-label">Total Dispositivos</div>
          </div>
        </div>
        <div className="personas-detail-stat-card" style={{ borderLeft: '4.5px solid #10b981' }}>
          <div className="personas-detail-stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.07)', color: '#10b981' }}>✅</div>
          <div>
            <div className="personas-detail-stat-card-value" style={{ color: '#10b981' }}>{activeDevices}</div>
            <div className="personas-detail-stat-card-label">Dispositivos Activos</div>
          </div>
        </div>
        <div className="personas-detail-stat-card" style={{ borderLeft: '4.5px solid #722ed1' }}>
          <div className="personas-detail-stat-card-icon" style={{ background: 'rgba(114, 46, 209, 0.07)', color: '#722ed1' }}>🏢</div>
          <div>
            <div className="personas-detail-stat-card-value" style={{ color: '#722ed1' }}>{empresa ? 1 : 0}</div>
            <div className="personas-detail-stat-card-label">Empresas Asignadas</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PersonaDetail;