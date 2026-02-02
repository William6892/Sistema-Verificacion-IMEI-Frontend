// src/components/Empresas/EmpresaForm.tsx
import React, { useState, useEffect } from 'react';

interface EmpresaFormProps {
  empresa?: any; // Empresa para editar, undefined para crear
  onSubmit: (nombre: string) => void;
  onCancel: () => void;
  title: string;
}

const EmpresaForm: React.FC<EmpresaFormProps> = ({ empresa, onSubmit, onCancel, title }) => {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (empresa) {
      setNombre(empresa.nombre || '');
    }
  }, [empresa]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (nombre.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    setLoading(true);
    try {
      onSubmit(nombre.trim());
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
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
        maxWidth: '500px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, color: '#333' }}>{title}</h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999',
              padding: '5px'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333'
            }}>
              Nombre de la empresa
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError('');
              }}
              placeholder="Ej: Tecnología S.A."
              autoFocus
              style={{
                width: '100%',
                padding: '12px',
                border: error ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                borderRadius: '6px',
                fontSize: '16px',
                transition: 'all 0.3s',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1890ff';
                e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d9d9d9';
                e.target.style.boxShadow = 'none';
              }}
            />
            {error && (
              <div style={{
                color: '#ff4d4f',
                fontSize: '14px',
                marginTop: '6px'
              }}>
                {error}
              </div>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '20px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nombre.trim()}
              style={{
                padding: '10px 24px',
                background: loading ? '#95d475' : '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                opacity: !nombre.trim() ? 0.5 : 1
              }}
            >
              {loading ? (
                <>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Guardando...
                </>
              ) : empresa ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmpresaForm;