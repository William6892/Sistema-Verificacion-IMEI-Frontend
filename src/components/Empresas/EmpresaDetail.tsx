// src/components/Empresas/EmpresaDetail.tsx
import React, { useState, useEffect } from 'react';
import { empresasService } from '../../services/empresasService';

interface EmpresaDetailProps {
  empresa: any;
  onClose: () => void;
}

const EmpresaDetail: React.FC<EmpresaDetailProps> = ({ empresa, onClose }) => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#333' }}>🏢 {empresa.nombre}</h3>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              ID: {empresa.id} • Registrada el {formatDate(empresa.fechaCreacion)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '5px',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </div>

        {/* Contenido */}
        <div style={{ 
          padding: '24px', 
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Sección de personas */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: 0, color: '#333' }}>👥 Personas asociadas</h4>
              <span style={{
                background: '#1890ff',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {personas.length} persona{personas.length !== 1 ? 's' : ''}
              </span>
            </div>

            {error && (
              <div style={{
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                color: '#ff4d4f',
                padding: '12px',
                borderRadius: '6px',
                marginBottom: '20px'
              }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                Cargando personas...
              </div>
            ) : personas.length > 0 ? (
              <div style={{
                display: 'grid',
                gap: '12px'
              }}>
                {personas.map((persona) => (
                  <div
                    key={persona.id}
                    style={{
                      background: '#fafafa',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      padding: '16px',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f5f5f5';
                      e.currentTarget.style.borderColor = '#d9d9d9';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#fafafa';
                      e.currentTarget.style.borderColor = '#f0f0f0';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#333', fontSize: '16px' }}>
                          {persona.nombre}
                        </div>
                        <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                          ID: {persona.identificacion}
                        </div>
                      </div>
                      <span style={{
                        background: '#52c41a',
                        color: 'white',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {persona.cantidadDispositivos} dispositivo{persona.cantidadDispositivos !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {(persona.email || persona.telefono) && (
                      <div style={{
                        display: 'flex',
                        gap: '20px',
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px dashed #e8e8e8'
                      }}>
                        {persona.email && (
                          <div style={{ fontSize: '14px' }}>
                            <span style={{ color: '#666', marginRight: '5px' }}>📧</span>
                            {persona.email}
                          </div>
                        )}
                        {persona.telefono && (
                          <div style={{ fontSize: '14px' }}>
                            <span style={{ color: '#666', marginRight: '5px' }}>📱</span>
                            {persona.telefono}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                background: '#fafafa',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                <p style={{ marginBottom: '8px' }}>No hay personas registradas en esta empresa.</p>
                <p style={{ fontSize: '14px', color: '#888' }}>
                  Las personas aparecerán aquí cuando sean creadas y asignadas a esta empresa.
                </p>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #f0f0f0' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Información de la empresa</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px'
            }}>
              <div style={{
                background: '#f0f9ff',
                border: '1px solid #91d5ff',
                borderRadius: '6px',
                padding: '15px'
              }}>
                <div style={{ fontSize: '12px', color: '#1890ff', fontWeight: '500', marginBottom: '5px' }}>
                  Fecha de registro
                </div>
                <div style={{ fontWeight: '600', color: '#333' }}>
                  {formatDate(empresa.fechaCreacion)}
                </div>
              </div>
              
              <div style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: '6px',
                padding: '15px'
              }}>
                <div style={{ fontSize: '12px', color: '#52c41a', fontWeight: '500', marginBottom: '5px' }}>
                  Total de personas
                </div>
                <div style={{ fontWeight: '600', color: '#333', fontSize: '24px' }}>
                  {personas.length}
                </div>
              </div>
              
              <div style={{
                background: '#fff7e6',
                border: '1px solid #ffd591',
                borderRadius: '6px',
                padding: '15px'
              }}>
                <div style={{ fontSize: '12px', color: '#fa8c16', fontWeight: '500', marginBottom: '5px' }}>
                  Dispositivos totales
                </div>
                <div style={{ fontWeight: '600', color: '#333', fontSize: '24px' }}>
                  {personas.reduce((total, persona) => total + persona.cantidadDispositivos, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'flex-end',
          flexShrink: 0
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              background: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '500'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmpresaDetail;