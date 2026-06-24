// src/components/Empresas/EmpresaDetail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Smartphone, Mail, Phone, Building2 } from 'lucide-react';
import { empresasService } from '../../services/empresasService';
import './Empresas.css';

interface EmpresaDetailProps {
  empresa: any;
  onClose: () => void;
}

const getAvatarGradient = (nombre: string) => {
  const code = (nombre || 'E').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

const EmpresaDetail: React.FC<EmpresaDetailProps> = ({ empresa, onClose }) => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [closing, setClosing]   = useState(false);
  const [hovCard, setHovCard]   = useState<number | null>(null);

  const loadPersonas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await empresasService.getPersonasEmpresa(empresa.id);
      setPersonas(data);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar personas');
    } finally {
      setLoading(false);
    }
  }, [empresa.id]);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const totalDispositivos = personas.reduce((t, p) => t + (p.cantidadDispositivos || 0), 0);
  const avatarInit = (empresa.nombre?.charAt(0) || 'E').toUpperCase();

  return (
    <div
      onClick={handleClose}
      className={`empresas-modal-overlay ${closing ? 'closing' : ''}`}
    >
      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        className={`empresas-modal-container ${closing ? 'closing' : ''}`}
        style={{ maxWidth: '720px' }}
      >
        {/* ── Header ── */}
        <div className="empresas-detail-cover">
          <div className="empresas-detail-cover-content">
            {/* Company avatar */}
            <div 
              className="empresas-detail-cover-avatar"
              style={{ background: getAvatarGradient(empresa.nombre) }}
            >
              {avatarInit}
            </div>
            <div className="empresas-detail-cover-info">
              <h3 className="empresas-detail-cover-name">
                {empresa.nombre}
              </h3>
              <div className="empresas-detail-cover-meta">
                <span>ID #{empresa.id}</span>
                <span>·</span>
                <span>Registrada el {formatDate(empresa.fechaCreacion)}</span>
              </div>
            </div>
            
            {/* Close */}
            <button
              onClick={handleClose}
              className="empresas-modal-close-btn"
              style={{ alignSelf: 'flex-start' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Stat rows ── */}
        <div style={{ display: 'flex', gap: '12px', padding: '20px 36px 0', flexWrap: 'wrap' }}>
          {[
            { icon: <Users size={16} />, label: 'Personas', value: personas.length },
            { icon: <Smartphone size={16} />, label: 'Dispositivos', value: totalDispositivos },
          ].map(stat => (
            <div 
              key={stat.label} 
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: 1,
                minWidth: '120px'
              }}
            >
              <div style={{ color: '#1428A0' }}>{stat.icon}</div>
              <div>
                <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.label}
                </div>
                <div style={{ color: '#0f172a', fontSize: '18px', fontWeight: 800, lineHeight: 1.1 }}>
                  {loading ? '—' : stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="empresas-detail-body" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {/* Section title */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '16px',
          }}>
            <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: '#1428A0' }} /> 
              <span>Personas asociadas</span>
            </div>
            {!loading && personas.length > 0 && (
              <span style={{
                background: 'rgba(20, 40, 160, 0.05)', color: '#1428A0',
                border: '1px solid rgba(20, 40, 160, 0.08)',
                padding: '4px 12px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 700,
              }}>
                {personas.length} {personas.length === 1 ? 'persona' : 'personas'}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="empresas-error-banner">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Loading / Content */}
          {loading ? (
            <div className="empresas-loading" style={{ minHeight: '160px' }}>
              <div className="empresas-spinner" />
            </div>

          ) : personas.length > 0 ? (
            <div style={{ display: 'grid', gap: '10px' }}>
              {personas.map(persona => (
                <div
                  key={persona.id}
                  onMouseEnter={() => setHovCard(persona.id)}
                  onMouseLeave={() => setHovCard(null)}
                  style={{
                    background: hovCard === persona.id ? 'rgba(20, 40, 160, 0.015)' : '#ffffff',
                    border: `1.5px solid ${hovCard === persona.id ? '#1428A0' : '#e2e8f0'}`,
                    borderRadius: '14px',
                    padding: '16px 20px',
                    transition: 'all 0.22s ease',
                    cursor: 'default',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left: avatar + info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px', height: '42px',
                        borderRadius: '12px',
                        background: getAvatarGradient(persona.nombre),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '16px',
                        flexShrink: 0,
                      }}>
                        {(persona.nombre || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>
                          {persona.nombre}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px', fontWeight: 600, fontFamily: 'monospace' }}>
                          ID: {persona.identificacion}
                        </div>
                      </div>
                    </div>

                    {/* Right: device badge */}
                    <div className="empresas-cell-contact" style={{
                      background: persona.cantidadDispositivos > 0 ? 'rgba(16, 185, 129, 0.06)' : '#f8fafc',
                      border: `1.5px solid ${persona.cantidadDispositivos > 0 ? 'rgba(16, 185, 129, 0.2)' : '#e2e8f0'}`,
                      color: persona.cantidadDispositivos > 0 ? '#10b981' : '#64748b',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      flexShrink: 0,
                    }}>
                      <Smartphone size={13} />
                      <span>{persona.cantidadDispositivos} disp.</span>
                    </div>
                  </div>

                  {/* Contact info */}
                  {(persona.email || persona.telefono) && (
                    <div style={{
                      display: 'flex', gap: '20px', flexWrap: 'wrap',
                      marginTop: '12px', paddingTop: '12px',
                      borderTop: '1px dashed #e2e8f0',
                    }}>
                      {persona.email && (
                        <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                          <Mail size={13} />
                          <span>{persona.email}</span>
                        </span>
                      )}
                      {persona.telefono && (
                        <span style={{ fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                          <Phone size={13} />
                          <span>{persona.telefono}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

          ) : (
            /* Empty state */
            <div className="empresas-empty-state" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '16px' }}>
              <div className="empresas-empty-icon">👥</div>
              <h3 style={{ color: '#0f172a', marginBottom: '8px', fontWeight: 700 }}>Sin personas registradas</h3>
              <p style={{ color: '#64748b', maxWidth: '300px', margin: '0 auto', fontSize: '13px' }}>
                Las personas aparecerán aquí cuando sean asignadas a esta empresa.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="empresas-detail-footer">
          <button
            onClick={handleClose}
            className="empresas-modal-btn empresas-modal-btn-submit"
            style={{ padding: '10px 28px' }}
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default EmpresaDetail;