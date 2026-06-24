// src/components/Empresas/EmpresasList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Search, Plus, Eye, Edit2, Trash2, Calendar } from 'lucide-react';
import { empresasService } from '../../services/empresasService';
import EmpresaForm from './EmpresaForm';
import EmpresaDetail from './EmpresaDetail';
import './EmpresasList.css';

interface EmpresasListProps {
  userRole: string;
}

interface Empresa {
  id: number;
  nombre: string;
  fechaCreacion: string;
}

const getAvatarGradient = (nombre: string) => {
  const code = (nombre || 'E').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
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

// ─── Main component ────────────────────────────────────────────────────────────
const EmpresasList: React.FC<EmpresasListProps> = ({ userRole }) => {
  const [empresas, setEmpresas]        = useState<Empresa[]>([]);
  const [loading, setLoading]          = useState(true);
  const [error, setError]              = useState('');
  const [showForm, setShowForm]        = useState(false);
  const [selectedEmpresa, setSelected] = useState<Empresa | null>(null);
  const [editingEmpresa, setEditing]   = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm]    = useState('');

  const loadEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await empresasService.getEmpresas();
      setEmpresas(data);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmpresas();
  }, [loadEmpresas]);

  const handleCreate = async (nombre: string) => {
    try {
      const raw = localStorage.getItem('token');
      if (raw) {
        const payload = JSON.parse(atob(raw.split('.')[1]));
        if (Date.now() >= payload.exp * 1000) {
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
      }
      if (userRole !== 'Admin') {
        alert('No tienes permisos para crear empresas. Se requiere rol "Admin".');
        return;
      }
      await empresasService.createEmpresa(nombre);
      setShowForm(false);
      loadEmpresas();
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert('Acceso denegado. Verifica que tu usuario tenga rol "Admin".');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else if (err.response?.status === 401) {
        alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.mensaje || 'Error al crear empresa');
      }
    }
  };

  const handleUpdate = async (id: number, nombre: string) => {
    try {
      await empresasService.updateEmpresa(id, nombre);
      setEditing(null);
      loadEmpresas();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al actualizar empresa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta empresa?')) return;
    try {
      await empresasService.deleteEmpresa(id);
      loadEmpresas();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al eliminar empresa');
    }
  };

  const formatDate = (ds: string) => {
    try {
      return new Date(ds).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return 'Fecha inválida'; }
  };

  const filtered = empresas.filter(e =>
    e.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="empresas-loading">
      <div className="empresas-spinner" />
      <span className="empresas-loading-text">Cargando empresas...</span>
    </div>
  );

  return (
    <div className="empresas-wrapper">
      {/* ── Header ── */}
      <div className="empresas-header-card">
        <div className="empresas-header-info">
          <div className="empresas-header-icon">
            <Building2 size={28} />
          </div>
          <div className="empresas-header-title">
            <h1>Empresas Registradas</h1>
            <p>Gestión de empresas y sus asociados</p>
          </div>
        </div>

        {userRole === 'Admin' && (
          <button className="empresas-btn empresas-btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            <span>Nueva Empresa</span>
          </button>
        )}
      </div>

      {/* ── Estadísticas ── */}
      <div className="empresas-stats-container">
        <div className="empresas-stat-pill">
          <div className="empresas-stat-value">{empresas.length}</div>
          <div>
            <div className="empresas-stat-label">Total</div>
            <div className="empresas-stat-text">Empresas registradas</div>
          </div>
        </div>
        <div className="empresas-stat-pill">
          <div className="empresas-stat-value">{filtered.length}</div>
          <div>
            <div className="empresas-stat-label">Coincidencias</div>
            <div className="empresas-stat-text">Filtradas actualmente</div>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="empresas-error-banner">
          <span>⚠️ {error}</span>
          <button className="empresas-clear-btn" style={{ position: 'static', color: 'inherit' }} onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="empresas-filters-card">
        <div className="empresas-search-wrapper">
          <Search size={18} className="empresas-search-icon" />
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="empresas-search-input"
          />
          {searchTerm && (
            <button className="empresas-clear-btn" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>
      </div>

      {/* ── Form modal ── */}
      {(showForm || editingEmpresa) && (
        <EmpresaForm
          empresa={editingEmpresa}
          onSubmit={editingEmpresa
            ? (nombre: string) => handleUpdate(editingEmpresa.id, nombre)
            : handleCreate}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          title={editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
        />
      )}

      {/* ── Detail modal ── */}
      {selectedEmpresa && (
        <EmpresaDetail
          empresa={selectedEmpresa}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ── Table ── */}
      <div className="empresas-table-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="empresas-table">
            <thead className="empresas-table-thead">
              <tr>
                <th className="empresas-table-th" style={{ width: '100px' }}>ID</th>
                <th className="empresas-table-th">Nombre</th>
                <th className="empresas-table-th" style={{ width: '220px' }}>Fecha Creación</th>
                <th className="empresas-table-th" style={{ width: '180px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map(empresa => {
                const avatarInit = (empresa.nombre?.charAt(0) || 'E').toUpperCase();
                return (
                  <tr key={empresa.id} className="empresas-table-row">
                    <td className="empresas-table-td">
                      <span className="empresas-badge-id">#{empresa.id}</span>
                    </td>

                    <td className="empresas-table-td">
                      <div className="empresas-cell-profile">
                        <div className="empresas-cell-avatar" style={{ background: getAvatarGradient(empresa.nombre) }}>
                          {avatarInit}
                        </div>
                        <span className="empresas-cell-name">{empresa.nombre || 'Sin nombre'}</span>
                      </div>
                    </td>

                    <td className="empresas-table-td">
                      <div className="empresas-cell-contact">
                        <Calendar size={14} />
                        <span>{formatDate(empresa.fechaCreacion)}</span>
                      </div>
                    </td>

                    <td className="empresas-table-td" style={{ textAlign: 'center' }}>
                      <div className="empresas-actions-wrapper" style={{ justifyContent: 'center' }}>
                        <button className="empresas-action-btn view" onClick={() => setSelected(empresa)} title="Ver detalles">
                          <Eye size={16} />
                        </button>

                        {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
                          <button className="empresas-action-btn edit" onClick={() => setEditing(empresa)} title="Editar empresa">
                            <Edit2 size={16} />
                          </button>
                        )}

                        {userRole === 'SuperAdmin' && (
                          <button className="empresas-action-btn delete" onClick={() => handleDelete(empresa.id)} title="Eliminar empresa">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="empresas-empty-state">
                    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                      <div className="empresas-empty-icon">🏢</div>
                      <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>No hay empresas</h3>
                      <p style={{ color: '#64748b', marginBottom: '24px' }}>
                        {searchTerm
                          ? `No se encontraron empresas con "${searchTerm}"`
                          : 'Aún no hay empresas registradas en el sistema.'}
                      </p>
                      {userRole === 'Admin' && !searchTerm && (
                        <button
                          className="empresas-btn empresas-btn-primary"
                          onClick={() => setShowForm(true)}
                        >
                          <Plus size={18} />
                          <span>Crear primera empresa</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="empresas-table-footer">
            <span>
              Mostrando {filtered.length} de {empresas.length} empresas
              {searchTerm && ` (filtradas por "${searchTerm}")`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresasList;