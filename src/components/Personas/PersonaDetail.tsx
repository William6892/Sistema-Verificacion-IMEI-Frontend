// src/components/Personas/PersonaDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import { dispositivosService } from '../../services/dispositivosService';
import { authService } from '../../services/authService';
import './PersonaDetail.css';

interface PersonaDetailProps {
  onBack?: () => void;
}

const PersonaDetail: React.FC<PersonaDetailProps> = ({ onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [persona, setPersona] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [dispositivos, setDispositivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'dispositivos'>('info');
  const [showEditModal, setShowEditModal] = useState(false);

  const isAdmin = authService.isAdmin();

  useEffect(() => {
    if (id) {
      loadPersonaData();
    }
  }, [id]);

  const loadPersonaData = async () => {
    try {
      setLoading(true);
      const personaData = await personasService.getPersona(parseInt(id!));
      setPersona(personaData);
      
      // Cargar empresa de la persona
      if (personaData.empresaId) {
        try {
          const empresaData = await empresasService.getEmpresa(personaData.empresaId);
          setEmpresa(empresaData);
        } catch (err) {
          console.error('Error cargando empresa:', err);
        }
      }
      
      // Cargar dispositivos asignados
      try {
        const dispositivosData = await dispositivosService.getDispositivosPorPersona(parseInt(id!));
        setDispositivos(dispositivosData);
      } catch (err) {
        console.error('Error cargando dispositivos:', err);
      }
      
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar datos de la persona');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (isAdmin) {
      // Puedes usar navigate para ir al formulario de edición
      navigate(`/personas/editar/${id}`);
      // O abrir modal de edición
      // setShowEditModal(true);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      alert('Solo los administradores pueden eliminar personas');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de eliminar a "${persona?.nombre}"?\nEsta acción no se puede deshacer.`)) {
      try {
        await personasService.deletePersona(persona.id);
        alert('Persona eliminada correctamente');
        if (onBack) {
          onBack();
        } else {
          navigate('/personas');
        }
      } catch (error: any) {
        const status = error.response?.status;
        if (status === 409) {
          alert('No se puede eliminar porque la persona tiene dispositivos asignados. Primero elimine o reasigne los dispositivos.');
        } else {
          alert('Error al eliminar la persona');
        }
      }
    }
  };

  const handleAssignDispositivo = () => {
    // Navegar a la página de asignación de dispositivos
    navigate(`/dispositivos/asignar?personaId=${id}`);
  };

  const handleDispositivoClick = (dispositivoId: number) => {
    navigate(`/dispositivos/${dispositivoId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (activo: boolean) => {
    return activo ? (
      <span className="status-badge active">Activo</span>
    ) : (
      <span className="status-badge inactive">Inactivo</span>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Cargando información...</h3>
        </div>
      </div>
    );
  }

  if (error || !persona) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Error al cargar la persona</h3>
        <p>{error || 'La persona no existe o no se pudo cargar'}</p>
        <button className="back-btn" onClick={() => onBack ? onBack() : navigate('/personas')}>
          ← Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="persona-detail-container">
      {/* Header con acciones */}
      <div className="detail-header">
        <div className="header-left">
          <button 
            className="back-button"
            onClick={() => onBack ? onBack() : navigate('/personas')}
          >
            ← Volver
          </button>
          <h1 className="detail-title">Detalle de Persona</h1>
        </div>
        
        {isAdmin && (
          <div className="header-actions">
            <button className="action-btn edit-btn" onClick={handleEdit}>
              ✏️ Editar
            </button>
            <button className="action-btn delete-btn" onClick={handleDelete}>
              🗑️ Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Tarjeta principal de información */}
      <div className="main-card">
        <div className="persona-header">
          <div className="avatar-large">
            {persona.nombre?.charAt(0).toUpperCase() || 'P'}
          </div>
          <div className="persona-main-info">
            <h2 className="persona-name">{persona.nombre || 'Sin nombre'}</h2>
            <div className="persona-meta">
              <span className="meta-item">
                <strong>ID:</strong> {persona.id}
              </span>
              <span className="meta-divider">•</span>
              <span className="meta-item">
                <strong>Identificación:</strong> {persona.identificacion || 'N/A'}
              </span>
              {persona.telefono && (
                <>
                  <span className="meta-divider">•</span>
                  <span className="meta-item">
                    <strong>Teléfono:</strong> {persona.telefono}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            📋 Información
          </button>
          <button 
            className={`tab-btn ${activeTab === 'dispositivos' ? 'active' : ''}`}
            onClick={() => setActiveTab('dispositivos')}
          >
            📱 Dispositivos ({dispositivos.length})
          </button>
        </div>

        {/* Contenido de los tabs */}
        <div className="tab-content">
          {activeTab === 'info' ? (
            <div className="info-tab">
              <div className="info-grid">
                {/* Información básica */}
                <div className="info-section">
                  <h3 className="section-title">📄 Información Básica</h3>
                  <div className="info-list">
                    <div className="info-row">
                      <span className="info-label">Nombre completo:</span>
                      <span className="info-value">{persona.nombre || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Identificación:</span>
                      <span className="info-value">{persona.identificacion || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">{persona.telefono || 'No especificado'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Estado:</span>
                      {getStatusBadge(persona.activo !== false)}
                    </div>
                  </div>
                </div>

                {/* Información de empresa */}
                <div className="info-section">
                  <h3 className="section-title">🏢 Empresa</h3>
                  <div className="info-list">
                    <div className="info-row">
                      <span className="info-label">Empresa:</span>
                      <span className="info-value">
                        {empresa?.nombre || 'Desconocida'}
                      </span>
                    </div>
                    {empresa && (
                      <>
                        <div className="info-row">
                          <span className="info-label">ID Empresa:</span>
                          <span className="info-value">{empresa.id}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Estado:</span>
                          {getStatusBadge(empresa.activo !== false)}
                        </div>
                        {empresa.fecha_creacion && (
                          <div className="info-row">
                            <span className="info-label">Fecha creación:</span>
                            <span className="info-value">
                              {formatDate(empresa.fecha_creacion)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Información del sistema */}
                <div className="info-section">
                  <h3 className="section-title">⚙️ Información del Sistema</h3>
                  <div className="info-list">
                    <div className="info-row">
                      <span className="info-label">ID Persona:</span>
                      <span className="info-value">{persona.id}</span>
                    </div>
                    {persona.fecha_creacion && (
                      <div className="info-row">
                        <span className="info-label">Fecha creación:</span>
                        <span className="info-value">
                          {formatDate(persona.fecha_creacion)}
                        </span>
                      </div>
                    )}
                    {persona.fecha_actualizacion && (
                      <div className="info-row">
                        <span className="info-label">Última actualización:</span>
                        <span className="info-value">
                          {formatDate(persona.fecha_actualizacion)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="dispositivos-tab">
              <div className="dispositivos-header">
                <h3 className="section-title">📱 Dispositivos Asignados</h3>
                {isAdmin && (
                  <button 
                    className="assign-btn"
                    onClick={handleAssignDispositivo}
                  >
                    + Asignar dispositivo
                  </button>
                )}
              </div>

              {dispositivos.length === 0 ? (
                <div className="empty-dispositivos">
                  <div className="empty-icon">📱</div>
                  <h4>No hay dispositivos asignados</h4>
                  <p>Esta persona no tiene dispositivos asignados actualmente.</p>
                  {isAdmin && (
                    <button 
                      className="assign-btn outline"
                      onClick={handleAssignDispositivo}
                    >
                      + Asignar primer dispositivo
                    </button>
                  )}
                </div>
              ) : (
                <div className="dispositivos-grid">
                  {dispositivos.map((dispositivo) => (
                    <div 
                      key={dispositivo.id} 
                      className="dispositivo-card"
                      onClick={() => handleDispositivoClick(dispositivo.id)}
                    >
                      <div className="dispositivo-header">
                        <div className="dispositivo-icon">📱</div>
                        <div className="dispositivo-title">
                          <h4>Dispositivo #{dispositivo.id}</h4>
                          <span className="dispositivo-imei">{dispositivo.imei}</span>
                        </div>
                        {getStatusBadge(dispositivo.activo !== false)}
                      </div>
                      
                      <div className="dispositivo-info">
                        <div className="info-row">
                          <span className="info-label">IMEI:</span>
                          <span className="info-value">{dispositivo.imei}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Fecha registro:</span>
                          <span className="info-value">
                            {formatDate(dispositivo.fecha_registro)}
                          </span>
                        </div>
                        {dispositivo.fecha_actualizacion && (
                          <div className="info-row">
                            <span className="info-label">Última actualización:</span>
                            <span className="info-value">
                              {formatDate(dispositivo.fecha_actualizacion)}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="dispositivo-footer">
                        <span className="view-link">Ver detalles →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon">📱</div>
          <div className="stat-info">
            <div className="stat-number">{dispositivos.length}</div>
            <div className="stat-label">Dispositivos asignados</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">
              {dispositivos.filter(d => d.activo !== false).length}
            </div>
            <div className="stat-label">Dispositivos activos</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <div className="stat-number">{empresa ? 1 : 0}</div>
            <div className="stat-label">Empresa asignada</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaDetail;