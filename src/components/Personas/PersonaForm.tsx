// src/components/Personas/PersonaForm.tsx
import React, { useState, useEffect } from 'react';
import { empresasService } from '../../services/empresasService';
import { personasService } from '../../services/personasService';
import { authService } from '../../services/authService';

interface PersonaFormProps {
  personaToEdit?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PersonaForm: React.FC<PersonaFormProps> = ({ personaToEdit, onSuccess, onCancel }) => {
  const [form, setForm]           = useState({ nombre: '', identificacion: '', telefono: '', empresaId: '' });
  const [empresas, setEmpresas]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [success, setSuccess]     = useState('');

  const isEditing = !!personaToEdit;
  const isAdmin   = authService.isAdmin();

  useEffect(() => {
    loadEmpresas();
    if (personaToEdit) {
      setForm({
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
      const d = await empresasService.getEmpresas();
      setEmpresas(d);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nombre.trim())             e.nombre         = 'El nombre es obligatorio';
    else if (form.nombre.length < 3)     e.nombre         = 'Mínimo 3 caracteres';
    if (!form.identificacion.trim())     e.identificacion = 'La identificación es obligatoria';
    if (form.telefono && !/^[\d\s+-]+$/.test(form.telefono)) e.telefono = 'Teléfono inválido';
    if (!form.empresaId)                 e.empresaId      = 'Selecciona una empresa';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !isAdmin) return;
    try {
      setSubmitting(true);
      const payload = {
        nombre: form.nombre.trim(),
        identificacion: form.identificacion.trim(),
        empresaId: parseInt(form.empresaId),
        ...(form.telefono.trim() && { telefono: form.telefono.trim() })
      };
      if (isEditing) {
        await personasService.updatePersona(personaToEdit.id, payload);
      } else {
        await personasService.createPersona(payload);
        setForm({ nombre: '', identificacion: '', telefono: '', empresaId: '' });
      }
      setSuccess(isEditing ? 'Persona actualizada exitosamente' : 'Persona creada exitosamente');
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1400);
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.mensaje || 'Error al guardar la persona' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  if (loading) return (
    <div className="personas-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '14px' }}>
      <div style={{ width: '38px', height: '38px', border: `3px solid var(--primary-light)`, borderTop: `3px solid var(--primary)`, borderRadius: '50%', animation: 'pulseDot 0.9s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Cargando empresas...</span>
    </div>
  );

  if (!isAdmin) return (
    <div className="personas-wrapper" style={{ padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ background: 'var(--error-light)', border: `1px solid rgba(244, 63, 94, 0.2)`, borderRadius: '16px', padding: '48px 40px', maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚠️</div>
        <h3 style={{ color: 'var(--error)', margin: '0 0 10px', fontSize: '22px', fontWeight: 700 }}>Acceso Denegado</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>Solo los administradores tienen autorización para crear o modificar registros de personas.</p>
        <button className="personas-btn personas-btn-primary" onClick={onCancel}>Volver</button>
      </div>
    </div>
  );

  return (
    <div className="personas-wrapper">
      <div className={`personas-form-card ${isEditing ? 'edit' : 'new'}`}>
        {/* Header */}
        <div className="personas-form-header">
          <div className="personas-form-header-icon">
            {isEditing ? '✏️' : '👤'}
          </div>
          <div className="personas-form-header-title">
            <h2>{isEditing ? 'Editar Persona' : 'Nueva Persona'}</h2>
            <p>{isEditing ? 'Actualiza los datos personales para registrar los cambios en la base de datos' : 'Completa el siguiente formulario para ingresar una persona al sistema'}</p>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div className="personas-success-banner">
            <span className="personas-status-dot" style={{ background: '#10b981' }} />
            <strong>{success}</strong>
          </div>
        )}

        {/* Error */}
        {errors.submit && (
          <div className="personas-error-banner">
            <span>⚠️</span>
            <span>{errors.submit}</span>
            <button className="personas-error-close" onClick={() => setErrors(p => { const n = { ...p }; delete n.submit; return n; })}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="personas-form-grid">
            {/* Nombre - full width */}
            <div className="personas-form-col-full personas-form-group">
              <label className="personas-form-label">
                Nombre Completo <span className="personas-form-required">*</span>
              </label>
              <div className="personas-form-input-wrapper">
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Juan Pérez García"
                  className={`personas-form-input ${errors.nombre ? 'error' : ''}`}
                />
              </div>
              {errors.nombre && <p className="personas-form-input-error">⚠️ {errors.nombre}</p>}
            </div>

            {/* Identificación */}
            <div className="personas-form-group">
              <label className="personas-form-label">
                Identificación / Cédula <span className="personas-form-required">*</span>
              </label>
              <div className="personas-form-input-wrapper">
                <input
                  type="text"
                  name="identificacion"
                  value={form.identificacion}
                  onChange={handleChange}
                  placeholder="Ej: 1234567890"
                  className={`personas-form-input ${errors.identificacion ? 'error' : ''}`}
                />
              </div>
              {errors.identificacion && <p className="personas-form-input-error">⚠️ {errors.identificacion}</p>}
            </div>

            {/* Empresa */}
            <div className="personas-form-group">
              <label className="personas-form-label">
                Empresa Asignada <span className="personas-form-required">*</span>
              </label>
              <select
                name="empresaId"
                value={form.empresaId}
                onChange={handleChange}
                className={`personas-form-input ${errors.empresaId ? 'error' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <option value="">Seleccionar empresa</option>
                {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              {errors.empresaId && <p className="personas-form-input-error">⚠️ {errors.empresaId}</p>}
            </div>

            {/* Teléfono - full width */}
            <div className="personas-form-col-full personas-form-group">
              <label className="personas-form-label">
                Teléfono de Contacto <span className="personas-form-optional">(Opcional)</span>
              </label>
              <div className="personas-form-input-wrapper">
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Ej: +57 300 123 4567"
                  className={`personas-form-input ${errors.telefono ? 'error' : ''}`}
                />
              </div>
              {errors.telefono && <p className="personas-form-input-error">⚠️ {errors.telefono}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="personas-form-footer-actions">
            <button
              type="button"
              onClick={onCancel}
              className="personas-btn personas-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="personas-btn personas-btn-primary"
            >
              {submitting ? (
                <>
                  <span className="personas-btn-spinner" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>{isEditing ? '💾' : '✨'}</span>
                  <span>{isEditing ? 'Actualizar Persona' : 'Registrar Persona'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PersonaForm;