// src/components/Empresas/EmpresaForm.tsx
import React, { useState, useEffect, useRef } from 'react';

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
  const [focused, setFocused]   = useState(false);
  const [visible, setVisible]   = useState(false); // for entrance animation
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Trigger entrance animation on mount
    requestAnimationFrame(() => setVisible(true));
    if (empresa) setNombre(empresa.nombre || '');
  }, [empresa]);

  const handleClose = () => {
    setVisible(false);
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

  // ── Colors ──
  const blue      = '#1890ff';
  const blueDark  = '#096dd9';
  const blueAlpha = 'rgba(24,144,255,0.12)';
  const red       = '#ff4d4f';
  const redAlpha  = 'rgba(255,77,79,0.1)';
  const gray100   = '#f5f5f5';
  const gray400   = '#bfbfbf';
  const gray600   = '#666';
  const gray800   = '#1a1a1a';
  const border    = '#e8e8e8';

  const inputBorderColor = error ? red : focused ? blue : border;
  const inputShadow      = error
    ? `0 0 0 3px ${redAlpha}`
    : focused
    ? `0 0 0 3px ${blueAlpha}`
    : 'none';

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97) }
                              to { opacity: 1; transform: translateY(0)     scale(1)    } }
        @keyframes fadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
          animation: visible ? 'fadeIn 0.2s ease' : 'fadeOut 0.2s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Modal card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '460px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            animation: visible ? 'slideUp 0.25s cubic-bezier(0.34,1.2,0.64,1)' : 'fadeOut 0.2s ease',
          }}
        >
          {/* Header strip */}
          <div style={{
            background: `linear-gradient(135deg, ${blue} 0%, ${blueDark} 100%)`,
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '22px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                width: '38px', height: '38px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isEdit ? '✏️' : '🏢'}
              </span>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '17px' }}>{title}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
                  {isEdit ? 'Modifica los datos de la empresa' : 'Completa la información requerida'}
                </div>
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                borderRadius: '8px',
                width: '32px', height: '32px',
                color: 'white',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
                lineHeight: 1,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} style={{ padding: '28px 24px 24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '10px',
                fontWeight: 600,
                fontSize: '14px',
                color: gray800,
              }}>
                <span>Nombre de la empresa</span>
                <span style={{ color: red, fontSize: '16px', lineHeight: 1 }}>*</span>
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={nombre}
                  onChange={e => { setNombre(e.target.value); if (error) setError(''); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Ej: Tecnología S.A."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 16px',
                    border: `2px solid ${inputBorderColor}`,
                    borderRadius: '10px',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: inputShadow,
                    color: gray800,
                    background: error ? '#fffafa' : 'white',
                    boxSizing: 'border-box',
                  }}
                />
                {/* char counter */}
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '12px',
                  color: nombre.length > 0 ? (error ? red : gray400) : gray400,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {nombre.length}
                </span>
              </div>

              {/* Error message */}
              <div style={{
                overflow: 'hidden',
                maxHeight: error ? '40px' : '0',
                transition: 'max-height 0.2s ease',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: red,
                  fontSize: '13px',
                  marginTop: '8px',
                  fontWeight: 500,
                }}>
                  <span>⚠️</span>
                  {error}
                </div>
              </div>
            </div>

            {/* Helper hint */}
            <div style={{
              background: '#f8faff',
              border: '1px solid #d6e8ff',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#4a6fa5',
            }}>
              <span>💡</span>
              <span>El nombre debe ser único y tener al menos 2 caracteres.</span>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '20px',
              borderTop: `1px solid ${border}`,
            }}>
              {/* Cancel */}
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: '11px 22px',
                  background: gray100,
                  color: gray600,
                  border: `1px solid ${border}`,
                  borderRadius: '9px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#ebebeb'; }}
                onMouseLeave={e => { e.currentTarget.style.background = gray100; }}
              >
                Cancelar
              </button>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                style={{
                  padding: '11px 28px',
                  background: canSubmit
                    ? `linear-gradient(135deg, ${blue} 0%, ${blueDark} 100%)`
                    : '#c8e6ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '9px',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 700,
                  transition: 'all 0.2s',
                  boxShadow: canSubmit ? '0 4px 12px rgba(24,144,255,0.35)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transform: canSubmit ? 'none' : 'none',
                }}
                onMouseEnter={e => { if (canSubmit) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: 'inline-block',
                      width: '14px', height: '14px',
                      border: '2px solid rgba(255,255,255,0.4)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    Guardando...
                  </>
                ) : (
                  <>
                    <span>{isEdit ? '💾' : '✨'}</span>
                    {isEdit ? 'Actualizar' : 'Crear empresa'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EmpresaForm;