// src/components/Empresas/EmpresaForm.tsx
import React, { useState, useEffect, useRef } from 'react';
import './Empresas.css';

interface EmpresaFormProps {
  empresa?: any;
  onSubmit: (nombre: string) => void;
  onCancel: () => void;
  title: string;
}

const EmpresaForm: React.FC<EmpresaFormProps> = ({ empresa, onSubmit, onCancel, title }) => {
  const [nombre, setNombre]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [closing, setClosing]   = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (empresa) setNombre(empresa.nombre || '');
  }, [empresa]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onCancel, 200); // wait for exit animation
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) { setError('El nombre es requerido'); return; }
    if (nombre.trim().length < 2) { setError('Mínimo 2 caracteres'); return; }
    setLoading(true);
    try {
      onSubmit(nombre.trim());
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
      setLoading(false);
    }
  };

  const isEdit = !!empresa;
  const canSubmit = nombre.trim().length >= 2 && !loading;

  return (
    <div
      onClick={handleClose}
      className={`empresas-modal-overlay ${closing ? 'closing' : ''}`}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`empresas-modal-container ${closing ? 'closing' : ''}`}
      >
        {/* Header strip */}
        <div className="empresas-modal-header">
          <div className="empresas-modal-header-info">
            <span className="empresas-modal-header-icon">
              {isEdit ? '✏️' : '🏢'}
            </span>
            <div className="empresas-modal-header-title">
              <h2>{title}</h2>
              <p>
                {isEdit ? 'Modifica los datos de la empresa' : 'Completa la información requerida'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="empresas-modal-close-btn"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="empresas-form">
          <div className="empresas-form-group">
            <label className="empresas-form-label">
              <span>Nombre de la empresa</span>
              <span className="empresas-form-required">*</span>
            </label>

            <div className="empresas-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={nombre}
                onChange={e => { setNombre(e.target.value); if (error) setError(''); }}
                placeholder="Ej: Tecnología S.A."
                autoFocus
                className={`empresas-form-input ${error ? 'error' : ''}`}
              />
              <span className="empresas-char-counter">
                {nombre.length}
              </span>
            </div>

            {error && (
              <div className="empresas-form-error-msg">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Helper hint */}
          <div className="empresas-form-hint">
            <span>💡</span>
            <span>El nombre debe ser único y tener al menos 2 caracteres.</span>
          </div>

          {/* Actions */}
          <div className="empresas-form-actions">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="empresas-modal-btn empresas-modal-btn-cancel"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="empresas-modal-btn empresas-modal-btn-submit"
            >
              {loading ? (
                <>
                  <span className="empresas-spinner-small" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <span>{isEdit ? '💾' : '✨'}</span>
                  <span>{isEdit ? 'Actualizar' : 'Crear empresa'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpresaForm;