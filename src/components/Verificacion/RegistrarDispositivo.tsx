// src/components/Verificacion/RegistrarDispositivo.tsx - VERSIÓN MEJORADA
import React, { useState, useEffect } from 'react';
import { verificacionService } from '../../services/verificacionService';
import { empresasService } from '../../services/empresasService';
import './Verificacion.css';

interface RegistrarDispositivoProps {
  imei?: string;
  empresas: any[];
  onClose: () => void;
  onSuccess: () => void;
}

const RegistrarDispositivo: React.FC<RegistrarDispositivoProps> = ({
  imei = '',
  empresas,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    IMEI: imei,
    personaId: '',
    personaNombre: '',
    empresaId: '',
    empresaNombre: '',
    identificacion: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [personas, setPersonas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPersonas, setFilteredPersonas] = useState<any[]>([]);
  const [showPersonasList, setShowPersonasList] = useState(false);
  const [creatingNewPersona, setCreatingNewPersona] = useState(false);
  const [newPersonaData, setNewPersonaData] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
    empresaId: ''
  });

  useEffect(() => {
    if (formData.empresaId) {
      loadPersonas(parseInt(formData.empresaId));
    }
  }, [formData.empresaId]);

  useEffect(() => {
    if (searchTerm && personas.length > 0) {
      const filtered = personas.filter(p =>
        p.identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPersonas(filtered);
      setShowPersonasList(filtered.length > 0);
    } else {
      setFilteredPersonas([]);
      setShowPersonasList(false);
    }
  }, [searchTerm, personas]);

  const loadPersonas = async (empresaId: number) => {
    try {
      const data = await verificacionService.getPersonasPorEmpresa(empresaId);
      setPersonas(data);
    } catch (err) {
      console.error('Error cargando personas:', err);
      setError('Error al cargar personas de la empresa');
    }
  };

  const handleSelectPersona = (persona: any) => {
    setFormData({
      ...formData,
      personaId: persona.id.toString(),
      personaNombre: persona.nombre,
      identificacion: persona.identificacion
    });
    setSearchTerm(`${persona.nombre} (${persona.identificacion})`);
    setShowPersonasList(false);
  };

  const handleCreatePersona = async () => {
    if (!newPersonaData.nombre || !newPersonaData.identificacion || !newPersonaData.empresaId) {
      setError('Nombre, identificación y empresa son requeridos');
      return;
    }

    setLoading(true);
    try {
      // Aquí necesitarías un endpoint para crear persona
      // Por ahora, simulemos la creación
      const nuevaPersona = {
        id: Date.now(), // Temporal
        nombre: newPersonaData.nombre,
        identificacion: newPersonaData.identificacion,
        telefono: newPersonaData.telefono,
        empresaId: parseInt(newPersonaData.empresaId)
      };
      
      // Agregar a la lista local
      setPersonas([...personas, nuevaPersona]);
      
      // Seleccionar automáticamente
      handleSelectPersona(nuevaPersona);
      setCreatingNewPersona(false);
      setNewPersonaData({ nombre: '', identificacion: '', telefono: '', empresaId: '' });
      
      alert('Persona creada exitosamente (simulación)');
    } catch (err) {
      setError('Error al crear persona');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.IMEI.trim()) {
      setError('El IMEI es requerido');
      return;
    }

    if (!formData.personaId) {
      setError('Debes seleccionar una persona');
      return;
    }

    if (formData.IMEI.length < 10 || formData.IMEI.length > 20 || !/^\d+$/.test(formData.IMEI)) {
      setError('IMEI inválido. Debe contener solo números (10-20 dígitos)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verificacionService.registrarDispositivo({
        IMEI: formData.IMEI,
        personaId: parseInt(formData.personaId)
      });
      
      alert('✅ IMEI registrado exitosamente');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al registrar dispositivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>📱 Registrar Nuevo IMEI</h3>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="form-error">
              <span className="error-icon">⚠️</span> {error}
            </div>
          )}

          {/* Campo IMEI */}
          <div className="form-group">
            <label>Número IMEI *</label>
            <input
              type="text"
              value={formData.IMEI}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData({...formData, IMEI: value});
              }}
              placeholder="358879090123456"
              maxLength={20}
              required
              className="form-input"
            />
            <div className="form-hint">10-20 dígitos (solo números)</div>
          </div>

          {/* Seleccionar empresa */}
          <div className="form-group">
            <label>Empresa *</label>
            <select
              value={formData.empresaId}
              onChange={(e) => {
                const empresaId = e.target.value;
                setFormData({
                  ...formData, 
                  empresaId: empresaId,
                  empresaNombre: empresas.find(emp => emp.id === parseInt(empresaId))?.nombre || '',
                  personaId: '',
                  personaNombre: '',
                  identificacion: ''
                });
                setSearchTerm('');
              }}
              required
              className="form-select"
            >
              <option value="">-- Seleccionar empresa --</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Buscar/Seleccionar persona */}
          {formData.empresaId && !creatingNewPersona && (
            <div className="form-group">
              <label>Seleccionar Persona *</label>
              
              <div className="search-container">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!formData.personaId && e.target.value) {
                      setShowPersonasList(true);
                    }
                  }}
                  placeholder="Buscar por nombre o identificación..."
                  className="form-input"
                  onFocus={() => {
                    if (searchTerm && personas.length > 0) {
                      setShowPersonasList(true);
                    }
                  }}
                />
              </div>

              {showPersonasList && (
                <div className="personas-list-modal">
                  <div className="list-header">
                    <span>Personas encontradas:</span>
                    <button 
                      type="button" 
                      onClick={() => setShowPersonasList(false)}
                      className="btn-close-list"
                    >
                      ×
                    </button>
                  </div>
                  <div className="personas-scroll">
                    {filteredPersonas.length > 0 ? (
                      filteredPersonas.map(persona => (
                        <div 
                          key={persona.id}
                          className={`persona-item ${formData.personaId === persona.id.toString() ? 'selected' : ''}`}
                          onClick={() => handleSelectPersona(persona)}
                        >
                          <div className="persona-avatar">👤</div>
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
                          {formData.personaId === persona.id.toString() && (
                            <div className="selected-check">✓</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-results">
                        No se encontraron personas con ese criterio.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.personaId ? (
                <div className="selected-persona-display">
                  <div className="selected-header">
                    <span>Persona seleccionada:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          personaId: '',
                          personaNombre: '',
                          identificacion: ''
                        });
                        setSearchTerm('');
                      }}
                      className="btn-change"
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
              ) : (
                <div className="create-persona-option">
                  <div className="divider">o</div>
                  <button
                    type="button"
                    onClick={() => setCreatingNewPersona(true)}
                    className="btn-create-persona"
                  >
                    + Crear nueva persona
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Formulario para crear nueva persona */}
          {creatingNewPersona && (
            <div className="create-persona-form">
              <div className="form-header">
                <h4>Crear Nueva Persona</h4>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingNewPersona(false);
                    setNewPersonaData({ nombre: '', identificacion: '', telefono: '', empresaId: '' });
                  }}
                  className="btn-back"
                >
                  ← Volver
                </button>
              </div>

              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  value={newPersonaData.nombre}
                  onChange={(e) => setNewPersonaData({...newPersonaData, nombre: e.target.value})}
                  placeholder="Ej: Juan Pérez"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Identificación *</label>
                <input
                  type="text"
                  value={newPersonaData.identificacion}
                  onChange={(e) => setNewPersonaData({...newPersonaData, identificacion: e.target.value})}
                  placeholder="Ej: 1234567890"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={newPersonaData.telefono}
                  onChange={(e) => setNewPersonaData({...newPersonaData, telefono: e.target.value})}
                  placeholder="Ej: 3001234567"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Empresa *</label>
                <select
                  value={newPersonaData.empresaId}
                  onChange={(e) => setNewPersonaData({...newPersonaData, empresaId: e.target.value})}
                  className="form-select"
                  required
                >
                  <option value="">-- Seleccionar empresa --</option>
                  {empresas.map(empresa => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreatePersona}
                disabled={loading || !newPersonaData.nombre || !newPersonaData.identificacion || !newPersonaData.empresaId}
                className="btn-create"
              >
                {loading ? 'Creando...' : 'Crear Persona'}
              </button>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-cancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.IMEI || !formData.personaId || creatingNewPersona}
              className={`btn-submit ${loading ? 'loading' : ''}`}
            >
              {loading ? 'Registrando...' : '📝 Registrar IMEI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistrarDispositivo;