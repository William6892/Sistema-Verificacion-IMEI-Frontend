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

const tk = {
  blue: '#1890ff', blueDark: '#096dd9', blueLight: '#e6f7ff', blueBorder: '#91d5ff',
  green: '#52c41a', greenBg: '#f6ffed', greenBorder: '#b7eb8f',
  orange: '#fa8c16', orangeDark: '#d46b08',
  red: '#ff4d4f', redBg: '#fff2f0', redBorder: '#ffccc7',
  text: '#1a1a1a', textSub: '#666', textMuted: '#999',
  border: '#f0f0f0', borderMd: '#e8e8e8', bg: '#fafafa', white: '#ffffff',
};

const PersonaForm: React.FC<PersonaFormProps> = ({ personaToEdit, onSuccess, onCancel }) => {
  const [form, setForm]           = useState({ nombre: '', identificacion: '', telefono: '', empresaId: '' });
  const [empresas, setEmpresas]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [success, setSuccess]     = useState('');
  const [focused, setFocused]     = useState<string | null>(null);

  const isEditing = !!personaToEdit;
  const isAdmin   = authService.isAdmin();

  useEffect(() => {
    loadEmpresas();
    if (personaToEdit) {
      setForm({ nombre: personaToEdit.nombre || '', identificacion: personaToEdit.identificacion || '', telefono: personaToEdit.telefono || '', empresaId: personaToEdit.empresaId?.toString() || '' });
    }
  }, [personaToEdit]);

  const loadEmpresas = async () => {
    try { setLoading(true); const d = await empresasService.getEmpresas(); setEmpresas(d); }
    catch { /* silent */ } finally { setLoading(false); }
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
      const payload = { nombre: form.nombre.trim(), identificacion: form.identificacion.trim(), empresaId: parseInt(form.empresaId), ...(form.telefono.trim() && { telefono: form.telefono.trim() }) };
      if (isEditing) await personasService.updatePersona(personaToEdit.id, payload);
      else { await personasService.createPersona(payload); setForm({ nombre: '', identificacion: '', telefono: '', empresaId: '' }); }
      setSuccess(isEditing ? 'Persona actualizada exitosamente' : 'Persona creada exitosamente');
      setTimeout(() => { if (onSuccess) onSuccess(); }, 1400);
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.mensaje || 'Error al guardar la persona' });
    } finally { setSubmitting(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%', padding: '12px 14px', boxSizing: 'border-box',
    border: `2px solid ${errors[field] ? tk.red : focused === field ? tk.blue : tk.borderMd}`,
    borderRadius: '9px', fontSize: '15px', background: errors[field] ? '#fffafa' : tk.white,
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focused === field ? (errors[field] ? '0 0 0 3px rgba(255,77,79,0.1)' : '0 0 0 3px rgba(24,144,255,0.1)') : 'none',
    color: tk.text,
  });

  const labelStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: tk.text };
  const errStyle: React.CSSProperties   = { color: tk.red, fontSize: '12px', marginTop: '6px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', gap: '14px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: '38px', height: '38px', border: `3px solid ${tk.blueLight}`, borderTop: `3px solid ${tk.blue}`, borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
      <span style={{ color: tk.textSub }}>Cargando empresas...</span>
    </div>
  );

  if (!isAdmin) return (
    <div style={{ background: tk.white, borderRadius: '16px', padding: '48px 40px', textAlign: 'center', maxWidth: '480px', margin: '0 auto', border: `1px solid ${tk.borderMd}`, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
      <div style={{ width: '72px', height: '72px', background: tk.redBg, border: `1px solid ${tk.redBorder}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>⚠️</div>
      <h3 style={{ color: tk.red, margin: '0 0 10px', fontSize: '22px' }}>Acceso Denegado</h3>
      <p style={{ color: tk.textSub, marginBottom: '24px' }}>Solo los administradores pueden crear o editar personas.</p>
      <button onClick={onCancel} style={{ padding: '11px 24px', background: `linear-gradient(135deg, ${tk.blue}, ${tk.blueDark})`, color: tk.white, border: 'none', borderRadius: '9px', cursor: 'pointer', fontWeight: 700 }}>Volver</button>
    </div>
  );

  return (
    <div style={{ background: tk.white, borderRadius: '16px', padding: '32px', boxShadow: '0 10px 32px rgba(0,0,0,0.08)', border: `1px solid ${tk.border}`, maxWidth: '760px', margin: '0 auto', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '26px', paddingBottom: '20px', borderBottom: `1px solid ${tk.border}` }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: isEditing ? `linear-gradient(135deg, ${tk.orange}, ${tk.orangeDark})` : `linear-gradient(135deg, ${tk.green}, #389e0d)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
          {isEditing ? '✏️' : '👤'}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: tk.text }}>{isEditing ? 'Editar Persona' : 'Nueva Persona'}</h2>
          <p style={{ margin: '3px 0 0', color: tk.textSub, fontSize: '14px' }}>{isEditing ? 'Actualiza la información de la persona' : 'Registra una nueva persona en el sistema'}</p>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div style={{ background: tk.greenBg, border: `1px solid ${tk.greenBorder}`, color: '#237804', padding: '13px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 500 }}>
          ✅ {success}
        </div>
      )}

      {/* Error */}
      {errors.submit && (
        <div style={{ background: tk.redBg, border: `1px solid ${tk.redBorder}`, color: tk.red, padding: '13px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
          ⚠️ {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Nombre - full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nombre Completo <span style={{ color: tk.red }}>*</span></label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Juan Pérez García" style={inputStyle('nombre')} onFocus={() => setFocused('nombre')} onBlur={() => setFocused(null)} />
            {errors.nombre && <p style={errStyle}>⚠️ {errors.nombre}</p>}
          </div>

          {/* Identificación */}
          <div>
            <label style={labelStyle}>Identificación <span style={{ color: tk.red }}>*</span></label>
            <input type="text" name="identificacion" value={form.identificacion} onChange={handleChange} placeholder="Ej: 1234567890" style={inputStyle('identificacion')} onFocus={() => setFocused('identificacion')} onBlur={() => setFocused(null)} />
            {errors.identificacion && <p style={errStyle}>⚠️ {errors.identificacion}</p>}
          </div>

          {/* Empresa */}
          <div>
            <label style={labelStyle}>Empresa <span style={{ color: tk.red }}>*</span></label>
            <select name="empresaId" value={form.empresaId} onChange={handleChange} style={inputStyle('empresaId')} onFocus={() => setFocused('empresaId')} onBlur={() => setFocused(null)}>
              <option value="">Seleccionar empresa</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            {errors.empresaId && <p style={errStyle}>⚠️ {errors.empresaId}</p>}
          </div>

          {/* Teléfono - full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Teléfono <span style={{ color: tk.textMuted, fontSize: '12px', fontWeight: 400 }}>(opcional)</span></label>
            <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: +57 300 123 4567" style={inputStyle('telefono')} onFocus={() => setFocused('telefono')} onBlur={() => setFocused(null)} />
            {errors.telefono && <p style={errStyle}>⚠️ {errors.telefono}</p>}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: `1px solid ${tk.border}`, flexWrap: 'wrap' }}>
          <button type="button" onClick={onCancel} style={{ padding: '11px 22px', background: tk.bg, color: tk.textSub, border: `2px solid ${tk.borderMd}`, borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = tk.blue; e.currentTarget.style.color = tk.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tk.borderMd; e.currentTarget.style.color = tk.textSub; }}>
            Cancelar
          </button>
          <button type="submit" disabled={submitting} style={{ padding: '11px 28px', background: submitting ? '#bae7ff' : `linear-gradient(135deg, ${tk.blue}, ${tk.blueDark})`, color: tk.white, border: 'none', borderRadius: '9px', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: submitting ? 'none' : '0 4px 12px rgba(24,144,255,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            {submitting ? (
              <><span style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Guardando...</>
            ) : (
              <><span>{isEditing ? '💾' : '✨'}</span>{isEditing ? 'Actualizar Persona' : 'Crear Persona'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonaForm;