// src/components/Personas/PersonasList.tsx
import React, { useState, useEffect } from 'react';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import PersonaForm from './PersonaForm';
import PersonaDetail from './PersonaDetail';
import './Personas.css';
import { authService } from '../../services/authService';
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
    if (!window.confirm('¿Eliminar esta persona?')) return;
    try { await personasService.deletePersona(id); loadData(); }
    catch { alert('Error al eliminar la persona'); }
  };

  const handleFormSuccess = () => { setShowForm(false); setEditingPersona(null); loadData(); };

  // ── Loading ──
  if (loading) return (
    <div className="personas-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', border: `3px solid var(--primary-light)`, borderTop: `3px solid var(--primary)`, borderRadius: '50%', animation: 'pulseDot 1s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Cargando personas...</span>
    </div>
  );

  // ── Detail view ──
  if (selectedPersona) return (
    <div className="personas-wrapper">
      <PersonaDetail personaId={selectedPersona.id} onBack={() => setSelectedPersona(null)} />
    </div>
  );

  // ── Form view ──
  if (showForm) return (
    <div className="personas-wrapper" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <PersonaForm personaToEdit={editingPersona} onSuccess={handleFormSuccess} onCancel={() => { setShowForm(false); setEditingPersona(null); }} />
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button className="personas-btn personas-btn-secondary" onClick={() => setShowForm(false)}>
          ← Volver a la lista
        </button>
      </div>
    </div>
  );

  return (
    <div className="personas-wrapper personas-container">
      {/* ── Header ── */}
      <div className="personas-header-card">
        <div className="personas-header-info">
          <div className="personas-header-icon">👥</div>
          <div className="personas-header-title">
            <h1>Gestión de Personas</h1>
            <p>Visualiza y administra todas las personas y contactos registrados en el sistema</p>
          </div>
        </div>

        {isAdmin && (
          <button className="personas-btn personas-btn-primary" onClick={() => { setEditingPersona(null); setShowForm(true); }}>
            <span style={{ fontSize: '16px', marginRight: '4px' }}>+</span> Registrar Persona
          </button>
        )}
      </div>

      {/* Stat pills */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <div className="personas-stat-pill">
          <div className="personas-stat-value">{personas.length}</div>
          <div>
            <div className="personas-stat-label">Total</div>
            <div className="personas-stat-text">Registrados</div>
          </div>
        </div>
        <div className="personas-stat-pill">
          <div className="personas-stat-value" style={{ background: 'var(--secondary)' }}>{filtered.length}</div>
          <div>
            <div className="personas-stat-label">Coincidencias</div>
            <div className="personas-stat-text">Filtradas</div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="personas-error-banner">
          <span>⚠️</span>
          <span>{error}</span>
          <button className="personas-error-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="personas-filters-card">
        {/* Search */}
        <div className="personas-search-wrapper">
          <span className="personas-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o identificación..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="personas-search-input"
          />
          {searchTerm && (
            <button className="personas-search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>

        {/* Company select */}
        <select
          value={empresaFilter}
          onChange={e => setEmpresaFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="personas-filter-select"
        >
          <option value="all">🏢 Todas las empresas</option>
          {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {/* ── Table card ── */}
      <div className="personas-table-card">
        {filtered.length > 0 ? (
          <>
            <div className="personas-table-responsive">
              <table className="personas-table">
                <thead className="personas-table-thead">
                  <tr>
                    <th className="personas-table-th">Persona</th>
                    <th className="personas-table-th">Identificación</th>
                    <th className="personas-table-th">Empresa</th>
                    <th className="personas-table-th">Contacto</th>
                    <th className="personas-table-th" style={{ width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(persona => {
                    const avatarInit = (persona.nombre?.charAt(0) || 'P').toUpperCase();
                    const isCopied = copiedId === persona.id;

                    return (
                      <tr key={persona.id} className="personas-table-row">
                        {/* Persona */}
                        <td className="personas-table-td">
                          <div className="personas-cell-profile">
                            <div className="personas-cell-avatar">
                              {avatarInit}
                            </div>
                            <div>
                              <div className="personas-cell-name">{persona.nombre || 'Sin nombre'}</div>
                              <div className="personas-cell-sub">ID del sistema: #{persona.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Identificación */}
                        <td className="personas-table-td">
                          <span className="personas-badge-id">
                            {persona.identificacion || 'N/A'}
                            {persona.identificacion && (
                              <button
                                className={`personas-badge-copy-btn ${isCopied ? 'copied' : ''}`}
                                onClick={() => copyToClipboard(persona.identificacion, persona.id)}
                                title={isCopied ? '¡Copiado!' : 'Copiar documento'}
                              >
                                {isCopied ? '✓' : '📋'}
                              </button>
                            )}
                          </span>
                        </td>

                        {/* Empresa */}
                        <td className="personas-table-td">
                          <div className={`personas-badge-status ${persona.activo !== false ? 'active' : 'inactive'}`}>
                            <span className="personas-status-dot" />
                            <span style={{ fontWeight: 600 }}>{persona.empresaNombre}</span>
                          </div>
                        </td>

                        {/* Contacto */}
                        <td className="personas-table-td">
                          <span className="personas-cell-contact">
                            📞 {persona.telefono || 'Sin teléfono'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="personas-table-td">
                          <div className="personas-actions-wrapper">
                            <button className="personas-action-btn view" onClick={() => setSelectedPersona(persona)} title="Ver detalles completos">
                              👁️ Ver
                            </button>
                            {isAdmin && (
                              <button className="personas-action-btn edit" onClick={() => { setEditingPersona(persona); setShowForm(true); }} title="Editar información">
                                ✏️ Editar
                              </button>
                            )}
                            {isAdmin && (
                              <button className="personas-action-btn delete" onClick={() => handleDelete(persona.id)} title="Eliminar registro">
                                🗑️ Eliminar
                              </button>
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
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Total: <strong>{personas.length}</strong> personas registradas
              </span>
              <button className="personas-btn personas-btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={loadData}>
                🔄 Actualizar lista
              </button>
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="personas-empty-state">
            <div className="personas-empty-icon">👤</div>
            <h3>No se encontraron personas</h3>
            <p>
              {searchTerm || empresaFilter !== 'all' 
                ? 'Prueba modificando tus filtros o borrando el término de búsqueda.' 
                : 'Aún no se han registrado personas en el sistema.'}
            </p>
            {isAdmin && !searchTerm && empresaFilter === 'all' && (
              <button className="personas-btn personas-btn-primary" onClick={() => { setEditingPersona(null); setShowForm(true); }}>
                + Registrar primera persona
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonasList;