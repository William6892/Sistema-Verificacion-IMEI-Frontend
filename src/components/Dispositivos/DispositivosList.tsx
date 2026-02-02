// src/components/Dispositivos/DispositivosList.tsx - VERSIÓN LIMPIA
import React, { useState, useEffect } from 'react';
import { dispositivosService, Dispositivo } from '../../services/dispositivosService';
import DispositivoForm from './DispositivoForm';
import DispositivoDetail from './DispositivoDetail';
import { empresasService } from '../../services/empresasService';
import './Dispositivos.css';

interface DispositivosListProps {
  userRole: string;
  userEmpresaId?: number;
  personaId?: number;
  modo?: 'embedded' | 'full';
  showHeader?: boolean;
  onDispositivoSelect?: (dispositivoId: number) => void;
}

const DispositivosList: React.FC<DispositivosListProps> = ({
  userRole,
  userEmpresaId,
  personaId,
  modo = 'full',
  showHeader = true,
  onDispositivoSelect
}) => {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedDispositivo, setSelectedDispositivo] = useState<Dispositivo | null>(null);
  const [editingDispositivo, setEditingDispositivo] = useState<Dispositivo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    empresaId: userEmpresaId || 0,
    activo: true,
    page: 1,
    limit: 20
  });
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== debouncedSearchTerm) {
        setFilters(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar empresas
  useEffect(() => {
    loadEmpresas();
  }, []);

  // Cargar dispositivos cuando cambian filtros o personaId
  useEffect(() => {
    loadDispositivos();
  }, [filters, personaId, debouncedSearchTerm]);

  const loadEmpresas = async () => {
    if (userRole !== 'Admin' && !userEmpresaId) return;
    
    try {
      const data = await empresasService.getEmpresas();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (err) {
      // Error silencioso para empresas
    }
  };

  const loadDispositivos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: any = { 
        ...filters,
        search: debouncedSearchTerm || undefined
      };
      
      // Si hay personaId, usar endpoint específico
      if (personaId) {
        const dispositivosPersona = await dispositivosService.getDispositivosPorPersona(personaId);
        setDispositivos(Array.isArray(dispositivosPersona) ? dispositivosPersona : []);
        setTotal(Array.isArray(dispositivosPersona) ? dispositivosPersona.length : 0);
        return;
      }
      
      // Para usuarios no Admin, solo de su empresa
      if (userRole !== 'Admin' && userEmpresaId) {
        params.empresaId = userEmpresaId;
      }
      
      const result = await dispositivosService.getDispositivos(params);
      
      // Asegurar que los datos son arrays
      const dispositivosArray = Array.isArray(result.dispositivos) ? result.dispositivos : 
                                Array.isArray(result) ? result : 
                                [];
      
      setDispositivos(dispositivosArray);
      setTotal(result.total || dispositivosArray.length);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.mensaje || 
                       err.message || 
                       'Error al cargar dispositivos';
      setError(errorMsg);
      setDispositivos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await dispositivosService.createDispositivo(data);
      setShowForm(false);
      loadDispositivos();
    } catch (err: any) {
      throw err;
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      await dispositivosService.updateDispositivo(id, data);
      setEditingDispositivo(null);
      loadDispositivos();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este dispositivo?')) return;
    
    try {
      await dispositivosService.deleteDispositivo(id);
      loadDispositivos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al eliminar dispositivo');
    }
  };

  const handleToggleActivo = async (id: number, activo: boolean) => {
    try {
      await dispositivosService.toggleActivo(id, activo);
      loadDispositivos();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cambiar estado');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatIMEI = (imei: string | undefined) => {
    if (!imei) return 'IMEI no disponible';
    
    const cleanImei = imei.toString().trim().replace(/\D/g, '');
    
    if (cleanImei.length <= 15) return cleanImei;
    
    if (cleanImei.length === 15) {
      return `${cleanImei.substring(0, 6)}-${cleanImei.substring(6, 12)}-${cleanImei.substring(12, 15)}`;
    }
    
    const parts = [];
    for (let i = 0; i < cleanImei.length; i += 4) {
      parts.push(cleanImei.substring(i, i + 4));
    }
    return parts.join('-');
  };

  if (loading && dispositivos.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando dispositivos...</p>
      </div>
    );
  }

  return (
    <div className={`dispositivos-container ${modo}`}>
      {/* Header */}
      {showHeader && (
        <div className="dispositivos-header">
          <div>
            <h1>📱 Dispositivos Registrados</h1>
            <p className="subtitle">
              {personaId 
                ? 'Dispositivos asignados a esta persona'
                : 'Gestión de dispositivos móviles'}
              <span className="count-badge">{total} dispositivos</span>
            </p>
          </div>
          
          <div className="header-actions">
            {/* Barra de búsqueda */}
            <form onSubmit={handleSearch} className="search-box">
              <input
                type="text"
                placeholder="🔍 Buscar por IMEI, persona o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </form>
            
            {/* Botones de acción */}
            <div className="action-buttons">
              {(userRole === 'Admin') && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  <span className="btn-icon">+</span>
                  Nuevo Dispositivo
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary"
              >
                {showFilters ? '👁️ Ocultar filtros' : '🔧 Filtros'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Empresa:</label>
            <select
              value={filters.empresaId || 0}
              onChange={(e) => setFilters({...filters, empresaId: parseInt(e.target.value), page: 1})}
              className="filter-select"
              disabled={userRole !== 'Admin' || !!personaId}
            >
              <option value={0}>Todas las empresas</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Estado:</label>
            <select
              value={filters.activo ? 'true' : 'false'}
              onChange={(e) => setFilters({...filters, activo: e.target.value === 'true', page: 1})}
              className="filter-select"
            >
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
              <option value="">Todos</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Mostrar:</label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value), page: 1})}
              className="filter-select"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
          
          <button
            onClick={() => setFilters({
              empresaId: userEmpresaId || 0,
              activo: true,
              page: 1,
              limit: 20
            })}
            className="btn-clear-filters"
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button className="error-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Formularios modales */}
      {(showForm || editingDispositivo) && (
        <DispositivoForm
          dispositivo={editingDispositivo}
          onSubmit={editingDispositivo ? 
            (data) => handleUpdate(editingDispositivo.id, data) : 
            handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingDispositivo(null);
          }}
          title={editingDispositivo ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
          empresas={empresas}
          userRole={userRole}
          userEmpresaId={userEmpresaId}
        />
      )}

      {/* Modal de detalle */}
      {selectedDispositivo && (
        <DispositivoDetail
          dispositivo={selectedDispositivo}
          onClose={() => setSelectedDispositivo(null)}
          onEdit={() => {
            setSelectedDispositivo(null);
            setEditingDispositivo(selectedDispositivo);
          }}
          userRole={userRole}
        />
      )}

      {/* Tabla de dispositivos */}
      <div className="dispositivos-table-container">
        {dispositivos.length > 0 ? (
          <>
            <div className="table-info">
              Mostrando {dispositivos.length} de {total} dispositivos
              {debouncedSearchTerm && ` (buscando: "${debouncedSearchTerm}")`}
            </div>
            
            <table className="dispositivos-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th className="col-imei">IMEI</th>
                  <th className="col-persona">Persona</th>
                  <th className="col-empresa">Empresa</th>
                  <th className="col-fecha">Fecha Registro</th>
                  <th className="col-estado">Estado</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.map((dispositivo) => (
                  <tr 
                    key={dispositivo.id} 
                    className={`dispositivo-row ${!dispositivo.activo ? 'inactive' : ''}`}
                    onClick={() => {
                      if (onDispositivoSelect) {
                        onDispositivoSelect(dispositivo.id);
                      } else {
                        setSelectedDispositivo(dispositivo);
                      }
                    }}
                    style={{ cursor: onDispositivoSelect ? 'pointer' : 'default' }}
                  >
                    <td className="col-id">
                      <span className="id-badge">#{dispositivo.id}</span>
                    </td>
                    <td className="col-imei">
                      <div className="imei-display">
                        <div className="imei-icon">📱</div>
                        <div>
                          <div className="imei-number">
                            {formatIMEI(dispositivo.imei)}
                            {!dispositivo.imei && (
                              <span className="imei-error">(No disponible)</span>
                            )}
                          </div>
                          {dispositivo.imei && (
                            <div className="imei-hint">
                              {dispositivo.imei.toString().replace(/\D/g, '').length} dígitos
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="col-persona">
                      <div className="persona-info">
                        <div className="persona-icon">👤</div>
                        <div>
                          <div className="persona-name">
                            {dispositivo.personaNombre || 'Sin persona asignada'}
                          </div>
                          {dispositivo.personaId && (
                            <div className="persona-id">ID: {dispositivo.personaId}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="col-empresa">
                      <div className="empresa-info">
                        <div className="empresa-icon">🏢</div>
                        <div className="empresa-name">
                          {dispositivo.empresaNombre || 'Sin empresa'}
                        </div>
                      </div>
                    </td>
                    <td className="col-fecha">
                      <div className="fecha-container">
                        <span className="fecha-icon">📅</span>
                        <span>{formatDate(dispositivo.fechaRegistro)}</span>
                      </div>
                    </td>
                    <td className="col-estado">
                      <div className={`estado-badge ${dispositivo.activo ? 'activo' : 'inactivo'}`}>
                        <span className={`estado-dot ${dispositivo.activo ? 'active' : 'inactive'}`}></span>
                        {dispositivo.activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </td>
                    <td className="col-acciones" onClick={(e) => e.stopPropagation()}>
                      <div className="actions-container">
                        <button
                          onClick={() => setSelectedDispositivo(dispositivo)}
                          className="btn-view"
                          title="Ver detalles"
                        >
                          👁️ Ver
                        </button>
                        
                        {(userRole === 'Admin') && (
                          <>
                            <button
                              onClick={() => setEditingDispositivo(dispositivo)}
                              className="btn-edit"
                              title="Editar dispositivo"
                            >
                              ✏️ Edit
                            </button>
                            
                            <button
                              onClick={() => handleToggleActivo(dispositivo.id, !dispositivo.activo)}
                              className={`btn-toggle ${dispositivo.activo ? 'deactivate' : 'activate'}`}
                              title={dispositivo.activo ? 'Desactivar' : 'Activar'}
                            >
                              {dispositivo.activo ? '⏸️ Desact.' : '▶️ Activar'}
                            </button>
                            
                            <button
                              onClick={() => handleDelete(dispositivo.id)}
                              className="btn-delete"
                              title="Eliminar dispositivo"
                            >
                              🗑️ Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Paginación */}
            {total > filters.limit && (
              <div className="pagination">
                <button
                  onClick={() => setFilters({...filters, page: Math.max(1, filters.page - 1)})}
                  disabled={filters.page === 1}
                  className="btn-pagination prev"
                >
                  ← Anterior
                </button>
                
                <div className="page-info">
                  Página {filters.page} de {Math.ceil(total / filters.limit)}
                  <span className="total-info">({total} total)</span>
                </div>
                
                <button
                  onClick={() => setFilters({...filters, page: filters.page + 1})}
                  disabled={filters.page >= Math.ceil(total / filters.limit)}
                  className="btn-pagination next"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">📱</div>
              <h3>No hay dispositivos</h3>
              <p>
                {debouncedSearchTerm 
                  ? `No se encontraron dispositivos con "${debouncedSearchTerm}"`
                  : 'Aún no hay dispositivos registrados en el sistema.'}
              </p>
              {(userRole === 'Admin') && !debouncedSearchTerm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  + Registrar primer dispositivo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispositivosList;