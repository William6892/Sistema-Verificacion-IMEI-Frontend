import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dispositivosService } from '../../services/dispositivosService';
import { personasService } from '../../services/personasService';
import { 
  Smartphone, Building2, User, Search, Plus, 
  AlertTriangle, X, Eye, Edit2, Play, Pause, 
  CheckCircle2, Trash2 
} from 'lucide-react';
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
  
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState('');
  const [verificando, setVerificando]         = useState(false);
  const [personas, setPersonas]               = useState<any[]>([]);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filteredPersonas, setFilteredPersonas] = useState<any[]>([]);
  const [showPersonasList, setShowPersonasList] = useState(false);
  const [imeiValido, setImeiValido]           = useState<boolean | null>(null);
  const [imeiMensaje, setImeiMensaje]         = useState('');
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [isClosing, setIsClosing]             = useState(false);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const imeiInputRef = useRef<HTMLInputElement>(null);

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

  const handleCancel = () => {
    setIsClosing(true);
    setTimeout(onCancel, 200);
  };

  // Verificar IMEI
  const verificarIMEI = async () => {
    const imei = formData.imei.trim();
    
    if (!imei) {
      setError('Ingresa un IMEI primero');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (imei.length < 10 || imei.length > 20) {
      setError('El IMEI debe tener entre 10 y 20 dígitos');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (!/^\d+$/.test(imei)) {
      setError('El IMEI solo debe contener números');
      if (imeiInputRef.current) imeiInputRef.current.focus();
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
    const identificacion = persona.identificacion || '';
    
    // Mostrar solo los últimos 4 dígitos
    const identificacionOculta = identificacion.length > 4 
        ? '••••' + identificacion.slice(-4)
        : '••••';
    
    setFormData({
        ...formData,
        personaId: persona.id.toString(),
        personaNombre: persona.nombre,
        identificacion: identificacionOculta
    });
    setSearchTerm(`${persona.nombre} (•••${identificacion.slice(-4)})`);
    setShowPersonasList(false);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imei.trim()) {
      setError('El IMEI es requerido');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (formData.imei.length < 10 || formData.imei.length > 20) {
      setError('El IMEI debe tener entre 10 y 20 dígitos');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (!/^\d+$/.test(formData.imei)) {
      setError('El IMEI solo debe contener números');
      if (imeiInputRef.current) imeiInputRef.current.focus();
      return;
    }

    if (!formData.personaId) {
      setError('Debes seleccionar una persona');
      if (searchInputRef.current) searchInputRef.current.focus();
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
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Cerrar lista de personas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPersonasList && modalRef.current) {
        if (!modalRef.current.contains(event.target as Node)) {
          setShowPersonasList(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPersonasList]);

  return (
    <div 
      className={`dispositivos-form-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleCancel}
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className={`dispositivos-form-modal ${isClosing ? 'closing' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="dispositivos-form-loading">
            <div className="dispositivos-form-loading-spinner"></div>
          </div>
        )}

        <div className="dispositivos-form-header">
          <div className="dispositivos-form-header-shimmer"></div>
          <h3 className="dispositivos-form-title">
            <Smartphone size={24} style={{ marginRight: '8px' }} />
            {title}
          </h3>
          <button 
            type="button"
            onClick={handleCancel}
            className="dispositivos-form-close-btn"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dispositivos-form-body">
          {error && (
            <div className="dispositivos-form-error">
              <AlertTriangle size={20} style={{ flexShrink: 0 }} /> 
              <span>{error}</span>
            </div>
          )}

          {/* Campo IMEI */}
          <div className="dispositivos-form-group">
            <label className="dispositivos-form-label">
              <span className="dispositivos-form-label-icon">
                <Smartphone size={16} />
              </span>
              Número IMEI <span className="dispositivos-form-required">*</span>
            </label>
            <div className="dispositivos-form-imei-group">
              <div className="dispositivos-form-imei-input-wrapper">
                <input
                  ref={imeiInputRef}
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
                  className={`dispositivos-form-input ${imeiValido === true ? 'valid' : imeiValido === false ? 'error' : ''} mono`}
                  disabled={loading || !!dispositivo}
                  inputMode="numeric"
                />
              </div>
              {!dispositivo && (
                <button
                  type="button"
                  onClick={verificarIMEI}
                  disabled={verificando || !formData.imei.trim() || formData.imei.length < 10}
                  className="dispositivos-form-btn-verify"
                >
                  {verificando ? 'Verificando...' : 'Verificar IMEI'}
                </button>
              )}
            </div>
            <div className="dispositivos-form-hint">
              10-20 dígitos (solo números)
            </div>
            
            {/* Mensaje de verificación */}
            {imeiMensaje && (
              <div className={`dispositivos-form-verify-msg ${imeiValido ? 'valid' : 'invalid'}`}>
                <span className="dispositivos-form-verify-msg-icon">
                  {imeiValido ? '✅' : '❌'}
                </span>
                <span className="dispositivos-form-verify-msg-text">{imeiMensaje}</span>
              </div>
            )}
          </div>

          {/* Seleccionar empresa (solo Admin) */}
          {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
            <div className="dispositivos-form-group">
              <label className="dispositivos-form-label">
                <span className="dispositivos-form-label-icon">
                  <Building2 size={16} />
                </span>
                Empresa <span className="dispositivos-form-required">*</span>
              </label>
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
                className="dispositivos-form-select"
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
                <div className="dispositivos-form-loading-personas">
                  ⏳ Cargando personas...
                </div>
              )}
            </div>
          )}

          {/* Buscar/Seleccionar persona */}
          {formData.empresaId && (
            <div className="dispositivos-form-group">
              <label className="dispositivos-form-label">
                <span className="dispositivos-form-label-icon">
                  <User size={16} />
                </span>
                Persona (Propietario) <span className="dispositivos-form-required">*</span>
              </label>
              
              {!formData.personaId ? (
                <div className="dispositivos-form-search">
                  <div className="dispositivos-form-search-input-wrapper">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nombre o identificación..."
                      className="dispositivos-form-input"
                      onFocus={() => {
                        if (searchTerm && personas.length > 0) {
                          setShowPersonasList(true);
                        }
                      }}
                      disabled={loading || loadingPersonas}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setShowPersonasList(false);
                        }
                      }}
                    />
                    <span className="dispositivos-form-search-icon">
                      <Search size={18} />
                    </span>
                  </div>

                  {showPersonasList && (
                    <div className="dispositivos-form-persona-list">
                      <div className="dispositivos-form-persona-list-header">
                        <div className="dispositivos-form-persona-list-header-text">
                          Personas encontradas ({filteredPersonas.length})
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowPersonasList(false)}
                          className="dispositivos-form-persona-list-close"
                          disabled={loading}
                          aria-label="Cerrar lista"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="dispositivos-form-persona-list-scroll">
                        {filteredPersonas.length > 0 ? (
                          filteredPersonas.map(persona => (
                            <div 
                              key={persona.id}
                              className="dispositivos-form-persona-item"
                              onClick={() => !loading && handleSelectPersona(persona)}
                            >
                              <div className="dispositivos-form-persona-item-avatar">
                                {persona.nombre?.charAt(0).toUpperCase() || '👤'}
                              </div>
                              <div className="dispositivos-form-persona-item-info">
                                <div className="dispositivos-form-persona-item-name">{persona.nombre}</div>
                                <div className="dispositivos-form-persona-item-details">
                                  <span className="dispositivos-form-persona-item-detail">🆔 ID: {persona.identificacion}</span>
                                  {persona.telefono && (
                                    <span className="dispositivos-form-persona-item-detail">📞 {persona.telefono}</span>
                                  )}
                                  <span className="dispositivos-form-persona-item-detail">
                                    📱 {persona.cantidadDispositivos || 0} dispositivo{persona.cantidadDispositivos !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                className="dispositivos-form-persona-item-select"
                                disabled={loading}
                              >
                                Seleccionar
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="dispositivos-form-persona-no-results">
                            <p style={{ marginBottom: '10px' }}>
                              <strong>No se encontraron personas con "{searchTerm}"</strong>
                            </p>
                            {personas.length === 0 && (
                              <p>
                                ⚠️ Esta empresa no tiene personas registradas. 
                                Primero debes registrar personas en la empresa.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {personas.length === 0 && !loadingPersonas && (
                    <div className="dispositivos-form-no-personas-warning">
                      <p className="dispositivos-form-hint-warning">
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        Esta empresa no tiene personas registradas. 
                        Primero debes registrar personas en la empresa.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="dispositivos-form-selected-persona">
                  <div className="dispositivos-form-selected-persona-header">
                    <div className="dispositivos-form-selected-persona-title">
                      <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                      Persona seleccionada:
                    </div>
                    <button
                      type="button"
                      onClick={clearPersonaSelection}
                      className="dispositivos-form-selected-persona-change"
                      disabled={loading}
                    >
                      Cambiar propietario
                    </button>
                  </div>
                  <div className="dispositivos-form-selected-persona-details">
                    <div className="dispositivos-form-selected-persona-row">
                      <span className="dispositivos-form-selected-persona-label">
                        Nombre:
                      </span>
                      <span className="dispositivos-form-selected-persona-value">{formData.personaNombre}</span>
                    </div>
                    <div className="dispositivos-form-selected-persona-row">
                      <span className="dispositivos-form-selected-persona-label">
                        Identificación:
                      </span>
                      <span className="dispositivos-form-selected-persona-value">{formData.identificacion}</span>
                    </div>
                    <div className="dispositivos-form-selected-persona-row">
                      <span className="dispositivos-form-selected-persona-label">
                        Empresa:
                      </span>
                      <span className="dispositivos-form-selected-persona-value">{formData.empresaNombre}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="dispositivos-form-actions">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="dispositivos-form-btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.imei || !formData.personaId || imeiValido === false}
              className="dispositivos-form-btn-submit"
            >
              {loading ? (
                <>
                  <div className="dispositivos-form-loading-spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTop: '2px solid white' }}></div>
                  Guardando...
                </>
              ) : dispositivo ? (
                'Actualizar Dispositivo'
              ) : (
                'Registrar Dispositivo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispositivoForm;