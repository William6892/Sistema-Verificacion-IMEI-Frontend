// src/components/Dispositivos/DispositivoForm.tsx - VERSIÓN MEJORADA
import React, { useState, useEffect, useCallback } from 'react';
import { dispositivosService } from '../../services/dispositivosService';
import { personasService } from '../../services/personasService';
import './Dispositivos.css'; 

interface DispositivoFormProps {
  dispositivo?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  title: string;
  empresas: any[];
  userRole: string;
  userEmpresaId?: number;
}

const DispositivoForm: React.FC<DispositivoFormProps> = ({
  dispositivo,
  onSubmit,
  onCancel,
  title,
  empresas,
  userRole,
  userEmpresaId
}) => {
  const [formData, setFormData] = useState({
    imei: '',
    personaId: '',
    personaNombre: '',
    empresaId: userEmpresaId?.toString() || '',
    empresaNombre: '',
    identificacion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificando, setVerificando] = useState(false);
  const [personas, setPersonas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPersonas, setFilteredPersonas] = useState<any[]>([]);
  const [showPersonasList, setShowPersonasList] = useState(false);
  const [imeiValido, setImeiValido] = useState<boolean | null>(null);
  const [imeiMensaje, setImeiMensaje] = useState('');
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    if (dispositivo) {
      setFormData({
        imei: dispositivo.imei || '',
        personaId: dispositivo.personaId?.toString() || '',
        personaNombre: dispositivo.personaNombre || '',
        empresaId: dispositivo.empresaId?.toString() || '',
        empresaNombre: dispositivo.empresaNombre || '',
        identificacion: ''
      });
      
      if (dispositivo.personaId) {
        loadPersonas(dispositivo.empresaId);
      }
    } else if (userEmpresaId) {
      const empresa = empresas.find(e => e.id === userEmpresaId);
      setFormData(prev => ({
        ...prev,
        empresaId: userEmpresaId.toString(),
        empresaNombre: empresa?.nombre || ''
      }));
    }
  }, [dispositivo, userEmpresaId, empresas]);

  // Cargar personas cuando cambia la empresa
  useEffect(() => {
    if (formData.empresaId && !dispositivo) {
      loadPersonas(parseInt(formData.empresaId));
    }
  }, [formData.empresaId]);

  // Filtrar personas cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = personas.filter(p =>
        p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.identificacion?.includes(searchTerm)
      );
      setFilteredPersonas(filtered);
      setShowPersonasList(filtered.length > 0);
    } else {
      setFilteredPersonas([]);
      setShowPersonasList(false);
    }
  }, [searchTerm, personas]);

  // Función para cargar personas con manejo de errores
  const loadPersonas = async (empresaId: number) => {
    if (!empresaId) return;
    
    setLoadingPersonas(true);
    try {
      // Usar el servicio existente de personas
      const data = await personasService.getPersonasPorEmpresa(empresaId);
      setPersonas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error cargando personas:', err);
      setError('Error al cargar personas de la empresa');
      setPersonas([]);
    } finally {
      setLoadingPersonas(false);
    }
  };

  // Verificar IMEI con validación mejorada
  const verificarIMEI = async () => {
    const imei = formData.imei.trim();
    
    if (!imei) {
      setError('Ingresa un IMEI primero');
      return;
    }

    if (imei.length < 10 || imei.length > 20) {
      setError('El IMEI debe tener entre 10 y 20 dígitos');
      return;
    }

    if (!/^\d+$/.test(imei)) {
      setError('El IMEI solo debe contener números');
      return;
    }

    setVerificando(true);
    setImeiValido(null);
    setImeiMensaje('');

    try {
      const resultado = await dispositivosService.verificarIMEI(imei);
      
      if (resultado.existe && resultado.dispositivo) {
        setImeiValido(false);
        const persona = resultado.dispositivo.personaNombre || 'Desconocido';
        setImeiMensaje(`❌ Este IMEI ya está registrado a nombre de: ${persona}`);
        setError('Este IMEI ya está registrado en el sistema');
      } else {
        setImeiValido(true);
        setImeiMensaje('✅ IMEI disponible para registro');
        setError('');
      }
    } catch (err: any) {
      setImeiValido(false);
      setImeiMensaje('❌ Error al verificar IMEI');
      setError(err.response?.data?.mensaje || 'Error al verificar IMEI');
    } finally {
      setVerificando(false);
    }
  };

  // Seleccionar persona
  const handleSelectPersona = (persona: any) => {
    setFormData({
      ...formData,
      personaId: persona.id.toString(),
      personaNombre: persona.nombre,
      identificacion: persona.identificacion || ''
    });
    setSearchTerm(`${persona.nombre} (${persona.identificacion})`);
    setShowPersonasList(false);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.imei.trim()) {
      setError('El IMEI es requerido');
      return;
    }

    if (formData.imei.length < 10 || formData.imei.length > 20) {
      setError('El IMEI debe tener entre 10 y 20 dígitos');
      return;
    }

    if (!/^\d+$/.test(formData.imei)) {
      setError('El IMEI solo debe contener números');
      return;
    }

    if (!formData.personaId) {
      setError('Debes seleccionar una persona');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        imei: formData.imei.trim(),
        personaId: parseInt(formData.personaId)
      };
      await onSubmit(submitData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.mensaje || 
                       err.message || 
                       'Error al guardar dispositivo';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar selección de persona
  const clearPersonaSelection = () => {
    setFormData({
      ...formData,
      personaId: '',
      personaNombre: '',
      identificacion: ''
    });
    setSearchTerm('');
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content dispositivos-form" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onCancel} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="form-error">
              <span className="error-icon">⚠️</span> 
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Campo IMEI */}
          <div className="form-group">
            <label className="form-label">Número IMEI *</label>
            <div className="imei-input-group">
              <input
                type="text"
                value={formData.imei}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setFormData({...formData, imei: value});
                  setImeiValido(null);
                  setImeiMensaje('');
                  if (error) setError('');
                }}
                placeholder="Ej: 358879090123456"
                maxLength={20}
                required
                className="form-input"
                disabled={loading || !!dispositivo}
                inputMode="numeric"
              />
              {!dispositivo && (
                <button
                  type="button"
                  onClick={verificarIMEI}
                  disabled={verificando || !formData.imei.trim() || formData.imei.length < 10}
                  className={`btn-verificar-imei ${verificando ? 'loading' : ''}`}
                >
                  {verificando ? 'Verificando...' : '🔍 Verificar'}
                </button>
              )}
            </div>
            <div className="form-hint">10-20 dígitos (solo números)</div>
            
            {/* Mensaje de verificación */}
            {imeiMensaje && (
              <div className={`verificacion-mensaje ${imeiValido ? 'valido' : 'invalido'}`}>
                <span className="mensaje-icon">
                  {imeiValido ? '✅' : '❌'}
                </span>
                <span className="mensaje-text">{imeiMensaje}</span>
              </div>
            )}
          </div>

          {/* Seleccionar empresa (solo Admin) */}
          {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
            <div className="form-group">
              <label className="form-label">Empresa *</label>
              <select
                value={formData.empresaId}
                onChange={(e) => {
                  const empresaId = e.target.value;
                  const empresa = empresas.find(e => e.id === parseInt(empresaId));
                  setFormData({
                    ...formData,
                    empresaId,
                    empresaNombre: empresa?.nombre || '',
                    personaId: '',
                    personaNombre: '',
                    identificacion: ''
                  });
                  setSearchTerm('');
                  setShowPersonasList(false);
                }}
                required
                className="form-select"
                disabled={loading || !!dispositivo || loadingPersonas}
              >
                <option value="">-- Seleccionar empresa --</option>
                {empresas.map(empresa => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
              {loadingPersonas && (
                <div className="loading-small">Cargando personas...</div>
              )}
            </div>
          )}

          {/* Buscar/Seleccionar persona */}
          {formData.empresaId && (
            <div className="form-group">
              <label className="form-label">Persona (Propietario) *</label>
              
              {!formData.personaId ? (
                <>
                  <div className="search-container">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre o identificación..."
                      className="form-input"
                      onFocus={() => {
                        if (searchTerm && personas.length > 0) {
                          setShowPersonasList(true);
                        }
                      }}
                      disabled={loading || loadingPersonas}
                    />
                  </div>

                  {showPersonasList && (
                    <div className="personas-list-modal">
                      <div className="list-header">
                        <span>Personas encontradas ({filteredPersonas.length})</span>
                        <button 
                          type="button" 
                          onClick={() => setShowPersonasList(false)}
                          className="btn-close-list"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                      <div className="personas-scroll">
                        {filteredPersonas.length > 0 ? (
                          filteredPersonas.map(persona => (
                            <div 
                              key={persona.id}
                              className="persona-item"
                              onClick={() => !loading && handleSelectPersona(persona)}
                            >
                              <div className="persona-avatar">
                                {persona.nombre?.charAt(0) || '👤'}
                              </div>
                              <div className="persona-info">
                                <div className="persona-name">{persona.nombre}</div>
                                <div className="persona-details">
                                  <span className="detail">ID: {persona.identificacion}</span>
                                  {persona.telefono && (
                                    <span className="detail">📞 {persona.telefono}</span>
                                  )}
                                  <span className="detail">
                                    📱 {persona.cantidadDispositivos || 0} dispositivos
                                  </span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                className="btn-select"
                                disabled={loading}
                              >
                                Seleccionar
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="no-results">
                            No se encontraron personas con "{searchTerm}". 
                            {personas.length === 0 && ' Asegúrate de que la empresa tenga personas registradas.'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {personas.length === 0 && !loadingPersonas && (
                    <div className="no-personas">
                      <p className="hint-warning">
                        ⚠️ Esta empresa no tiene personas registradas. 
                        Primero debes registrar personas en la empresa.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="selected-persona-display">
                  <div className="selected-header">
                    <span className="selected-title">Persona seleccionada:</span>
                    <button
                      type="button"
                      onClick={clearPersonaSelection}
                      className="btn-change"
                      disabled={loading}
                    >
                      Cambiar
                    </button>
                  </div>
                  <div className="selected-details">
                    <div className="detail-row">
                      <span className="detail-label">Nombre:</span>
                      <span className="detail-value">{formData.personaNombre}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Identificación:</span>
                      <span className="detail-value">{formData.identificacion}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Empresa:</span>
                      <span className="detail-value">{formData.empresaNombre}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.imei || !formData.personaId || imeiValido === false}
              className={`btn-submit ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Guardando...
                </>
              ) : dispositivo ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispositivoForm;