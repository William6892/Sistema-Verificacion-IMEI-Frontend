// src/components/Personas/PersonasList.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Building2, Copy, Check, 
  Eye, Edit2, Trash2, Phone, RotateCw 
} from 'lucide-react';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import PersonaForm from './PersonaForm';
import PersonaDetail from './PersonaDetail';
import { authService } from '../../services/authService';

const getAvatarGradient = (nombre: string) => {
  const code = (nombre || 'P').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    'linear-gradient(135deg, #1428A0 0%, #007BFF 100%)', // Samsung Royal Blue
    'linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%)', // Lavender to Violet
    'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', // Pink
    'linear-gradient(135deg, #10b981 0%, #34d399 100%)', // Emerald
    'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', // Amber
    'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', // Cyan
    'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)', // Blue
    'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', // Purple
  ];
  return gradients[code % gradients.length];
};

interface PersonasListProps { userRole: string; }

const PersonasList: React.FC<PersonasListProps> = ({ userRole }) => {
  const [personas, setPersonas]         = useState<any[]>([]);
  const [empresas, setEmpresas]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [searchTerm, setSearchTerm]     = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<number | 'all'>('all');
  const [showForm, setShowForm]         = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [copiedId, setCopiedId]         = useState<number | null>(null);

  const isAdmin = authService.isAdmin();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pData, eData] = await Promise.all([personasService.getPersonas(), empresasService.getEmpresas()]);
      const fixed = pData.map((p: any) => {
        const emp = eData.find((e: any) => e.nombre?.toLowerCase() === p.empresaNombre?.toLowerCase());
        return { ...p, empresaId: emp?.id || p.empresaId || null, empresaNombre: p.empresaNombre || 'Sin empresa' };
      });
      setPersonas(fixed); setEmpresas(eData);
    } catch (err: any) { setError(err.response?.data?.mensaje || 'Error al cargar datos'); }
    finally { setLoading(false); }
  };

  const copyToClipboard = (text: string, id: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = personas.filter(p => {
    const matchSearch = p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || p.identificacion?.includes(searchTerm);
    const matchEmpresa = empresaFilter === 'all' || Number(p.empresaId) === empresaFilter;
    return matchSearch && matchEmpresa;
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta persona?')) return;
    try { await personasService.deletePersona(id); loadData(); }
    catch { alert('Error al eliminar la persona'); }
  };

  const handleFormSuccess = () => { setShowForm(false); setEditingPersona(null); loadData(); };

  if (loading) return (
    <div className="personas-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: `3px solid var(--border-light)`, borderTop: `3px solid var(--primary)`, borderRadius: '50%', animation: 'pulseDot 1s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Cargando información...</span>
    </div>
  );

  if (selectedPersona) return (
    <div className="personas-wrapper">
      <PersonaDetail personaId={selectedPersona.id} onBack={() => setSelectedPersona(null)} />
    </div>
  );

  if (showForm) return (
    <div className="personas-wrapper">
      <PersonaForm personaToEdit={editingPersona} onSuccess={handleFormSuccess} onCancel={() => { setShowForm(false); setEditingPersona(null); }} />
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button className="personas-btn personas-btn-secondary" onClick={() => setShowForm(false)}>
          ← Volver a la lista
        </button>
      </div>
    </div>
  );

  return (
    <div className="personas-wrapper">
      {/* ── Header ── */}
      <div className="personas-header-card">
        <div className="personas-header-info">
          <div className="personas-header-icon">
            <Users size={28} />
          </div>
          <div className="personas-header-title">
            <h1>Gestión de Personas</h1>
            <p>Visualiza y administra todos los contactos del sistema</p>
          </div>
        </div>

        {isAdmin && (
          <button className="personas-btn personas-btn-primary" onClick={() => { setEditingPersona(null); setShowForm(true); }}>
            <UserPlus size={18} />
            <span>Registrar Persona</span>
          </button>
        )}
      </div>

      {/* ── Estadísticas ── */}
      <div className="personas-stats-container">
        <div className="personas-stat-pill">
          <div className="personas-stat-value">{personas.length}</div>
          <div>
            <div className="personas-stat-label">Total</div>
            <div className="personas-stat-text">Registrados</div>
          </div>
        </div>
        <div className="personas-stat-pill">
          <div className="personas-stat-value">{filtered.length}</div>
          <div>
            <div className="personas-stat-label">Coincidencias</div>
            <div className="personas-stat-text">Filtradas actualmente</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="personas-error-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="personas-filters-card">
        <div className="personas-search-wrapper">
          <Search size={18} className="personas-search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre o identificación..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="personas-search-input"
          />
        </div>

        <select
          value={empresaFilter}
          onChange={e => setEmpresaFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="personas-filter-select"
        >
          <option value="all">🏢 Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {/* ── Tabla ── */}
      <div className="personas-table-card">
        {filtered.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="personas-table">
                <thead className="personas-table-thead">
                  <tr>
                    <th className="personas-table-th">Persona</th>
                    <th className="personas-table-th">Identificación</th>
                    <th className="personas-table-th">Empresa</th>
                    <th className="personas-table-th">Contacto</th>
                    <th className="personas-table-th" style={{ width: '150px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(persona => {
                    const avatarInit = (persona.nombre?.charAt(0) || 'P').toUpperCase();
                    const isCopied = copiedId === persona.id;

                    return (
                      <tr key={persona.id} className="personas-table-row">
                        
                        {/* Persona Info */}
                        <td className="personas-table-td">
                          <div className="personas-cell-profile">
                            <div className="personas-cell-avatar" style={{ background: getAvatarGradient(persona.nombre) }}>{avatarInit}</div>
                            <div>
                              <div className="personas-cell-name">{persona.nombre || 'Sin nombre'}</div>
                              <div className="personas-cell-sub">ID: #{persona.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* ID Document */}
                        <td className="personas-table-td">
                          <span className="personas-badge-id">
                            {persona.identificacion || 'N/A'}
                            {persona.identificacion && (
                              <button
                                className={`personas-badge-copy-btn ${isCopied ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(persona.identificacion, persona.id)}
                                title={isCopied ? '¡Copiado!' : 'Copiar documento'}
                              >
                                {isCopied ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            )}
                          </span>
                        </td>

                        {/* Empresa */}
                        <td className="personas-table-td">
                          <div className="personas-badge-status">
                            <span className="personas-status-dot" style={{ background: persona.activo !== false ? 'var(--primary)' : 'var(--text-muted)' }} />
                            <span style={{ fontWeight: 600 }}>{persona.empresaNombre}</span>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="personas-table-td">
                          <span className="personas-cell-contact">
                            <Phone size={14} /> {persona.telefono || 'Sin teléfono'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="personas-table-td">
                          <div className="personas-actions-wrapper" style={{ justifyContent: 'center' }}>
                            <button className="personas-action-btn view" onClick={() => setSelectedPersona(persona)} title="Ver detalles">
                              <Eye size={16} />
                            </button>
                            {isAdmin && (
                              <>
                                <button className="personas-action-btn edit" onClick={() => { setEditingPersona(persona); setShowForm(true); }} title="Editar">
                                  <Edit2 size={16} />
                                </button>
                                <button className="personas-action-btn delete" onClick={() => handleDelete(persona.id)} title="Eliminar">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="personas-table-footer">
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Total: <strong>{personas.length}</strong> personas
              </span>
              <button className="personas-btn personas-btn-secondary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={loadData}>
                <RotateCw size={14} /> Actualizar
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <h3>No se encontraron personas</h3>
            <p style={{ maxWidth: '400px', margin: '8px auto 24px' }}>
              {searchTerm || empresaFilter !== 'all' 
                ? 'Prueba modificando tus filtros o borrando el término de búsqueda.' 
                : 'Aún no se han registrado personas en el sistema.'}
            </p>
            {isAdmin && !searchTerm && empresaFilter === 'all' && (
              <button className="personas-btn personas-btn-primary" style={{ margin: '0 auto' }} onClick={() => { setEditingPersona(null); setShowForm(true); }}>
                <UserPlus size={18} /> Registrar primera persona
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonasList;