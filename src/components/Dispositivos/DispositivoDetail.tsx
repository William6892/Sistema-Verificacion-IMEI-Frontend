// src/components/Dispositivos/DispositivoDetail.tsx
import React, { useState, useEffect } from 'react';
import { dispositivosService } from '../../services/dispositivosService';
import './DispositivoDetail.css';

interface DispositivoDetailProps {
  dispositivo: any;
  onClose: () => void;
  onEdit?: () => void;
  userRole: string;
}

const DispositivoDetail: React.FC<DispositivoDetailProps> = ({
  dispositivo,
  onClose,
  onEdit,
  userRole
}) => {
  const [loading, setLoading] = useState(false);
  const [dispositivoDetalle, setDispositivoDetalle] = useState<any>(dispositivo);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDetalleCompleto();
  }, [dispositivo.id]);

  const loadDetalleCompleto = async () => {
    try {
      setLoading(true);
      const detalle = await dispositivosService.getDispositivo(dispositivo.id);
      setDispositivoDetalle(detalle);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar detalles');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatIMEI = (imei: string) => {
    if (!imei) return '';
    if (imei.length <= 15) return imei;
    // Formato común: 35-123456-123456-7
    const parts = [
      imei.substring(0, 2),
      imei.substring(2, 8),
      imei.substring(8, 14),
      imei.substring(14)
    ].filter(part => part.length > 0);
    return parts.join('-');
  };

  const handleToggleActivo = async () => {
    if (!window.confirm(`¿Está seguro de ${dispositivoDetalle.activo ? 'desactivar' : 'activar'} este dispositivo?`)) {
      return;
    }

    try {
      setLoading(true);
      const updated = await dispositivosService.toggleActivo(
        dispositivoDetalle.id, 
        !dispositivoDetalle.activo
      );
      setDispositivoDetalle(updated);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Está seguro de eliminar este dispositivo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);
      await dispositivosService.deleteDispositivo(dispositivoDetalle.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al eliminar dispositivo');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copiado al portapapeles');
    });
  };

  if (loading && !dispositivoDetalle) {
    return (
      <div className="detail-modal-overlay">
        <div className="detail-modal-content">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Cargando detalles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-modal-overlay">
      <div className="detail-modal-content">
        <div className="detail-modal-header">
          <h3>📱 Detalles del Dispositivo</h3>
          <button onClick={onClose} className="detail-modal-close">×</button>
        </div>

        {error && (
          <div className="detail-error">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
            <button className="detail-btn detail-error-close" onClick={() => setError('')}>×</button>
          </div>
        )}

        <div className="detail-content">
          {/* Información principal */}
          <div className="detail-section">
            <div className="detail-section-header">
              <h4>Información del Dispositivo</h4>
              <div className={`detail-estado-badge ${dispositivoDetalle.activo ? 'activo' : 'inactivo'}`}>
                {dispositivoDetalle.activo ? 'Activo' : 'Inactivo'}
              </div>
            </div>
            
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <span className="detail-info-label">ID:</span>
                <span className="detail-info-value">
                  #{dispositivoDetalle.id}
                  <button 
                    onClick={() => copyToClipboard(dispositivoDetalle.id.toString())}
                    className="detail-btn detail-btn-copy"
                    title="Copiar ID"
                  >
                    📋
                  </button>
                </span>
              </div>
              
              <div className="detail-info-item">
                <span className="detail-info-label">IMEI:</span>
                <span className="detail-info-value">
                  <span className="detail-imei-formatted">{formatIMEI(dispositivoDetalle.imei)}</span>
                  <span className="detail-imei-raw">({dispositivoDetalle.imei})</span>
                  <button 
                    onClick={() => copyToClipboard(dispositivoDetalle.imei)}
                    className="detail-btn detail-btn-copy"
                    title="Copiar IMEI"
                  >
                    📋
                  </button>
                </span>
              </div>
              
              <div className="detail-info-item">
                <span className="detail-info-label">Fecha Registro:</span>
                <span className="detail-info-value">{formatDate(dispositivoDetalle.fechaRegistro)}</span>
              </div>
              
              <div className="detail-info-item">
                <span className="detail-info-label">Última Actualización:</span>
                <span className="detail-info-value">
                  {dispositivoDetalle.fechaActualizacion 
                    ? formatDate(dispositivoDetalle.fechaActualizacion)
                    : 'No disponible'}
                </span>
              </div>
            </div>
          </div>

          {/* Información del propietario */}
          <div className="detail-section">
            <div className="detail-section-header">
              <h4>👤 Información del Propietario</h4>
            </div>
            
            <div className="detail-persona-card">
              <div className="detail-persona-avatar">👤</div>
              <div className="detail-persona-info">
                <h5>{dispositivoDetalle.personaNombre || 'Sin nombre'}</h5>
                <div className="detail-persona-metadata">
                  <div className="detail-metadata-item">
                    <span className="detail-metadata-label">ID Persona:</span>
                    <span className="detail-metadata-value">#{dispositivoDetalle.personaId}</span>
                  </div>
                  <div className="detail-metadata-item">
                    <span className="detail-metadata-label">Identificación:</span>
                    <span className="detail-metadata-value">{dispositivoDetalle.personaIdentificacion || 'No disponible'}</span>
                  </div>
                  <div className="detail-metadata-item">
                    <span className="detail-metadata-label">Teléfono:</span>
                    <span className="detail-metadata-value">{dispositivoDetalle.personaTelefono || 'No disponible'}</span>
                  </div>
                  <div className="detail-metadata-item">
                    <span className="detail-metadata-label">Email:</span>
                    <span className="detail-metadata-value">{dispositivoDetalle.personaEmail || 'No disponible'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la empresa */}
          <div className="detail-section">
            <div className="detail-section-header">
              <h4>🏢 Información de la Empresa</h4>
            </div>
            
            <div className="detail-empresa-card">
              <div className="detail-empresa-icon">🏢</div>
              <div className="detail-empresa-info">
                <h5>{dispositivoDetalle.empresaNombre || 'Sin empresa'}</h5>
                <div className="detail-empresa-metadata">
                  <div className="detail-metadata-item">
                    <span className="detail-metadata-label">ID Empresa:</span>
                    <span className="detail-metadata-value">#{dispositivoDetalle.empresaId}</span>
                  </div>
                  <div className="detail-metadata-item">
                    <span className="detail-metadata-label">Dispositivos totales:</span>
                    <span className="detail-metadata-value">{dispositivoDetalle.empresaTotalDispositivos || 'No disponible'}</span>
                  </div>
                  <div className="detail-metadata-item">
                    <span className="detail-metadata-label">Personas registradas:</span>
                    <span className="detail-metadata-value">{dispositivoDetalle.empresaTotalPersonas || 'No disponible'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Historial de cambios */}
          {dispositivoDetalle.historial && dispositivoDetalle.historial.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-header">
                <h4>📋 Historial de Cambios</h4>
              </div>
              
              <div className="detail-historial-list">
                {dispositivoDetalle.historial.map((cambio: any, index: number) => (
                  <div key={index} className="detail-historial-item">
                    <div className="detail-historial-fecha">{formatDate(cambio.fecha)}</div>
                    <div className="detail-historial-descripcion">{cambio.descripcion}</div>
                    <div className="detail-historial-usuario">Por: {cambio.usuario}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="detail-section">
            <div className="detail-section-header">
              <h4>📊 Estadísticas</h4>
            </div>
            
            <div className="detail-stats-grid">
              <div className="detail-stat-card">
                <div className="detail-stat-icon">📅</div>
                <div className="detail-stat-info">
                  <div className="detail-stat-value">
                    {Math.floor((new Date().getTime() - new Date(dispositivoDetalle.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))} días
                  </div>
                  <div className="detail-stat-label">En el sistema</div>
                </div>
              </div>
              
              <div className="detail-stat-card">
                <div className="detail-stat-icon">🔄</div>
                <div className="detail-stat-info">
                  <div className="detail-stat-value">
                    {dispositivoDetalle.cantidadCambios || 0}
                  </div>
                  <div className="detail-stat-label">Cambios realizados</div>
                </div>
              </div>
              
              <div className="detail-stat-card">
                <div className="detail-stat-icon">👥</div>
                <div className="detail-stat-info">
                  <div className="detail-stat-value">
                    {dispositivoDetalle.personaTotalDispositivos || 1}
                  </div>
                  <div className="detail-stat-label">Dispositivos de esta persona</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="detail-actions-container">
          <button
            onClick={onClose}
            className="detail-btn detail-btn-cancel"
            disabled={loading}
          >
            Cerrar
          </button>
          
          {(userRole === 'Admin') && (
            <div className="detail-actions-buttons">
              <button
                onClick={handleToggleActivo}
                disabled={loading}
                className={`detail-btn detail-btn-toggle ${dispositivoDetalle.activo ? 'deactivate' : 'activate'}`}
              >
                {dispositivoDetalle.activo ? '⏸️ Desactivar' : '▶️ Activar'}
              </button>
              
              {onEdit && (
                <button
                  onClick={onEdit}
                  disabled={loading}
                  className="detail-btn detail-btn-edit"
                >
                  ✏️ Editar
                </button>
              )}
              
              {userRole === 'Admin' && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="detail-btn detail-btn-delete"
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notas */}
        <div className="detail-notes-container">
          <p className="detail-note">
            <strong>Nota:</strong> El IMEI es un identificador único para cada dispositivo móvil. 
            Mantener esta información actualizada es crucial para la trazabilidad.
          </p>
          <p className="detail-note">
            <strong>Estado:</strong> Los dispositivos inactivos no aparecerán en las verificaciones regulares.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DispositivoDetail;