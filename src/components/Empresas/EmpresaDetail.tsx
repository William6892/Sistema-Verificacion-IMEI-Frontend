// src/components/Empresas/EmpresaDetail.tsx
import React, { useState, useEffect } from 'react';
import { empresasService } from '../../services/empresasService';

interface EmpresaDetailProps {
  empresa: any;
  onClose: () => void;
}

const EmpresaDetail: React.FC<EmpresaDetailProps> = ({ empresa, onClose }) => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [visible, setVisible]   = useState(false);
  const [hovCard, setHovCard]   = useState<number | null>(null);
  const [hovClose, setHovClose] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    loadPersonas();
  }, [empresa.id]);

  const loadPersonas = async () => {
    try {
      setLoading(true);
      const data = await empresasService.getPersonasEmpresa(empresa.id);
      setPersonas(data);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar personas');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

  const totalDispositivos = personas.reduce((t, p) => t + (p.cantidadDispositivos || 0), 0);

  // ── Tokens ──
  const blue      = '#1890ff';
  const blueDark  = '#096dd9';
  const green     = '#52c41a';
  const orange    = '#fa8c16';
  const border    = '#f0f0f0';
  const textMain  = '#1a1a1a';
  const textSub   = '#666';

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeOut { from{opacity:1} to{opacity:0} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: visible ? 'fadeIn 0.2s ease' : 'fadeOut 0.2s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '760px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: visible ? 'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1)' : 'fadeOut 0.2s ease',
          }}
        >

          {/* ── Header ── */}
          <div style={{
            background: `linear-gradient(135deg, ${blue} 0%, ${blueDark} 100%)`,
            padding: '24px 28px',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', top: '-30px', right: '-30px',
              width: '140px', height: '140px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '50%',
            }} />
            <div style={{
              position: 'absolute', bottom: '-50px', right: '80px',
              width: '100px', height: '100px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '50%',
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Company avatar */}
                <div style={{
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: '14px',
                  width: '56px', height: '56px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  flexShrink: 0,
                }}>
                  🏢
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: 700 }}>
                    {empresa.nombre}
                  </h3>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '4px', display: 'flex', gap: '12px' }}>
                    <span>ID #{empresa.id}</span>
                    <span>·</span>
                    <span>Registrada el {formatDate(empresa.fechaCreacion)}</span>
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                onClick={handleClose}
                onMouseEnter={() => setHovClose(true)}
                onMouseLeave={() => setHovClose(false)}
                style={{
                  background: hovClose ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '9px',
                  width: '34px', height: '34px',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            {/* ── Stat pills ── */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
              {[
                { icon: '👥', label: 'Personas', value: personas.length, color: 'rgba(255,255,255,0.18)' },
                { icon: '📱', label: 'Dispositivos', value: totalDispositivos, color: 'rgba(255,255,255,0.18)' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: stat.color,
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: 'blur(4px)',
                }}>
                  <span style={{ fontSize: '16px' }}>{stat.icon}</span>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {stat.label}
                    </div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, lineHeight: 1.1 }}>
                      {loading ? '—' : stat.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>

            {/* Section title */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 700, fontSize: '15px', color: textMain, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👥</span> Personas asociadas
              </div>
              {!loading && personas.length > 0 && (
                <span style={{
                  background: '#e6f7ff', color: blue,
                  border: '1px solid #91d5ff',
                  padding: '3px 12px', borderRadius: '12px',
                  fontSize: '13px', fontWeight: 600,
                }}>
                  {personas.length} {personas.length === 1 ? 'persona' : 'personas'}
                </span>
              )}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#fff2f0', border: '1px solid #ffccc7',
                color: '#ff4d4f', padding: '12px 16px', borderRadius: '10px',
                marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Loading skeleton */}
            {loading ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    background: '#f5f5f5', borderRadius: '12px',
                    height: '72px', animation: 'pulse 1.4s ease infinite',
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>

            ) : personas.length > 0 ? (
              <div style={{ display: 'grid', gap: '10px' }}>
                {personas.map(persona => (
                  <div
                    key={persona.id}
                    onMouseEnter={() => setHovCard(persona.id)}
                    onMouseLeave={() => setHovCard(null)}
                    style={{
                      background: hovCard === persona.id ? '#f0f7ff' : '#fafafa',
                      border: `1px solid ${hovCard === persona.id ? '#bae0ff' : border}`,
                      borderRadius: '12px',
                      padding: '16px 18px',
                      transition: 'all 0.2s',
                      cursor: 'default',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {/* Left: avatar + info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '42px', height: '42px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${blue} 0%, ${blueDark} 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 700, fontSize: '16px',
                          flexShrink: 0,
                        }}>
                          {(persona.nombre || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: textMain, fontSize: '15px' }}>
                            {persona.nombre}
                          </div>
                          <div style={{ color: textSub, fontSize: '13px', marginTop: '2px' }}>
                            ID: {persona.identificacion}
                          </div>
                        </div>
                      </div>

                      {/* Right: device badge */}
                      <div style={{
                        background: persona.cantidadDispositivos > 0 ? '#f6ffed' : '#fafafa',
                        border: `1px solid ${persona.cantidadDispositivos > 0 ? '#b7eb8f' : '#e8e8e8'}`,
                        color: persona.cantidadDispositivos > 0 ? green : textSub,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '5px',
                        flexShrink: 0,
                      }}>
                        <span>📱</span>
                        {persona.cantidadDispositivos} disp.
                      </div>
                    </div>

                    {/* Contact info */}
                    {(persona.email || persona.telefono) && (
                      <div style={{
                        display: 'flex', gap: '20px', flexWrap: 'wrap',
                        marginTop: '12px', paddingTop: '12px',
                        borderTop: '1px dashed #e8e8e8',
                      }}>
                        {persona.email && (
                          <span style={{ fontSize: '13px', color: textSub, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            📧 {persona.email}
                          </span>
                        )}
                        {persona.telefono && (
                          <span style={{ fontSize: '13px', color: textSub, display: 'flex', alignItems: 'center', gap: '5px' }}>
                            📱 {persona.telefono}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

            ) : (
              /* Empty state */
              <div style={{
                textAlign: 'center', padding: '50px 20px',
                background: '#fafafa', borderRadius: '12px',
                border: `1px dashed ${border}`,
              }}>
                <div style={{ fontSize: '52px', marginBottom: '12px', opacity: 0.35 }}>👤</div>
                <div style={{ fontWeight: 600, color: '#333', marginBottom: '6px' }}>
                  Sin personas registradas
                </div>
                <div style={{ fontSize: '14px', color: '#888', maxWidth: '300px', margin: '0 auto' }}>
                  Las personas aparecerán aquí cuando sean asignadas a esta empresa.
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: '16px 28px',
            borderTop: `1px solid ${border}`,
            background: '#fafafa',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}>
            <button
              onClick={handleClose}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(24,144,255,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(24,144,255,0.3)';
              }}
              style={{
                padding: '10px 28px',
                background: `linear-gradient(135deg, ${blue} 0%, ${blueDark} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '9px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(24,144,255,0.3)',
                transition: 'all 0.2s',
              }}
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default EmpresaDetail;