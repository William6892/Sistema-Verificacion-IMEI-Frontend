// src/components/Personas/PersonaForm.tsx
import React, { useState, useEffect } from 'react';
import { empresasService } from '../../services/empresasService';
import { personasService } from '../../services/personasService';
import { authService } from '../../services/authService';
import './PersonaForm.css';

interface PersonaFormProps {
  personaToEdit?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PersonaForm: React.FC<PersonaFormProps> = ({ 
  personaToEdit, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
    empresaId: ''
  });

  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const isEditing = !!personaToEdit;
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    loadEmpresas();
    
    if (personaToEdit) {
      setFormData({
        nombre: personaToEdit.nombre || '',
        identificacion: personaToEdit.identificacion || '',
        telefono: personaToEdit.telefono || '',
        empresaId: personaToEdit.empresaId?.toString() || ''
      });
    }
  }, [personaToEdit]);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresasService.getEmpresas();
      setEmpresas(data);
    } catch (error) {
      console.error('Error cargando empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }
    
    if (!formData.identificacion.trim()) {
      newErrors.identificacion = 'La identificación es obligatoria';
    }
    
    if (formData.telefono && !/^[\d\s+-]+$/.test(formData.telefono)) {
      newErrors.telefono = 'Ingrese un teléfono válido';
    }
    
    if (!formData.empresaId) {
      newErrors.empresaId = 'Seleccione una empresa';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (!isAdmin) {
      setErrors({ submit: 'Solo los administradores pueden crear o editar personas' });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const dataToSend = {
        nombre: formData.nombre.trim(),
        identificacion: formData.identificacion.trim(),
        empresaId: parseInt(formData.empresaId),
        ...(formData.telefono.trim() && { telefono: formData.telefono.trim() })
      };
            
      
      if (isEditing) {
        await personasService.updatePersona(personaToEdit.id, dataToSend);
        setSuccessMessage('Persona actualizada exitosamente');
      } else {
        await personasService.createPersona(dataToSend);
        setSuccessMessage('Persona creada exitosamente');
      }
      
      if (!isEditing) {
        setFormData({
          nombre: '',
          identificacion: '',
          telefono: '',
          empresaId: ''
        });
      }
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
      
    } catch (error: any) {
      console.error('Error guardando persona:', error);
      const errorMsg = error.response?.data?.mensaje || 'Error al guardar la persona';
      setErrors({ submit: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  if (loading) {
    return (
      <div className="form-loading">
        <div className="loading-spinner"></div>
        <p>Cargando empresas...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="access-denied">
        <div className="denied-icon">⚠️</div>
        <h3>Acceso Denegado</h3>
        <p>Solo los administradores pueden crear o editar personas.</p>
        <button className="back-btn" onClick={handleCancel}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="persona-form-container">
      {/* Header */}
      <div className="form-header">
        <div className="form-icon-container">
          <div className={`form-icon ${isEditing ? 'edit' : 'create'}`}>
            {isEditing ? '✏️' : '👤'}
          </div>
          <div>
            <h2 className="form-title">
              {isEditing ? 'Editar Persona' : 'Nueva Persona'}
            </h2>
            <p className="form-subtitle">
              {isEditing 
                ? 'Actualiza la información de la persona' 
                : 'Registra una nueva persona en el sistema'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          <span className="success-text">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{errors.submit}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Nombre */}
          <div className="form-field full-width">
            <label className="form-label">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez García"
              className={`form-input ${errors.nombre ? 'error' : ''}`}
            />
            {errors.nombre && (
              <p className="error-text-small">
                ⚠️ {errors.nombre}
              </p>
            )}
          </div>

          {/* Identificación */}
          <div className="form-field">
            <label className="form-label">
              Identificación *
            </label>
            <input
              type="text"
              name="identificacion"
              value={formData.identificacion}
              onChange={handleChange}
              placeholder="Ej: 1234567890"
              className={`form-input ${errors.identificacion ? 'error' : ''}`}
            />
            {errors.identificacion && (
              <p className="error-text-small">
                ⚠️ {errors.identificacion}
              </p>
            )}
          </div>

          {/* Empresa */}
          <div className="form-field">
            <label className="form-label">
              Empresa *
            </label>
            <select
              name="empresaId"
              value={formData.empresaId}
              onChange={handleChange}
              className={`form-select ${errors.empresaId ? 'error' : ''}`}
            >
              <option value="">Seleccionar empresa</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
            {errors.empresaId && (
              <p className="error-text-small">
                ⚠️ {errors.empresaId}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="form-field full-width">
            <label className="form-label">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="Ej: +57 300 123 4567"
              className={`form-input ${errors.telefono ? 'error' : ''}`}
            />
            {errors.telefono && (
              <p className="error-text-small">
                ⚠️ {errors.telefono}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-btn"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            className="submit-btn"
          >
            {submitting ? (
              <>
                <span className="submit-spinner"></span>
                Guardando...
              </>
            ) : (
              <>
                <span className="submit-icon">
                  {isEditing ? '💾' : '✨'}
                </span>
                {isEditing ? 'Actualizar Persona' : 'Crear Persona'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonaForm;