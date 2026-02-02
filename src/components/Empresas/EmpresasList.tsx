// src/components/Empresas/EmpresasList.tsx - VERSIÓN CORREGIDA COMPLETA
import React, { useState, useEffect } from 'react';
import { empresasService } from '../../services/empresasService';
import EmpresaForm from './EmpresaForm';
import EmpresaDetail from './EmpresaDetail';
import './Empresas.css';

interface EmpresasListProps {
  userRole: string;
}

interface Empresa {
  id: number;
  nombre: string;
  fechaCreacion: string;
}

const EmpresasList: React.FC<EmpresasListProps> = ({ userRole }) => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Función para debuggear el token
  const debugToken = () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length !== 3) {
          console.error('❌ Token JWT malformado');
          return null;
        }
        
        const payload = JSON.parse(atob(parts[1]));
        
        // Buscar rol en todas las posibles claims
        let foundRole = false;
        Object.keys(payload).forEach(key => {
          if (key.toLowerCase().includes('role')) {
            foundRole = true;
          }
        });
        
        if (!foundRole) {
          console.log('⚠️ No se encontró claim de rol. Todas las claims:');
          Object.keys(payload).forEach(key => {
            console.log(`   "${key}":`, payload[key]);
          });
        }
        
        return payload;
      } catch (error) {
        console.error('❌ Error decodificando token:', error);
      }
    }
    return null;
  };

  useEffect(() => {
    debugToken(); // Debug al cargar
    loadEmpresas();
  }, []);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      const data = await empresasService.getEmpresas();
      setEmpresas(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.mensaje || 'Error al cargar empresas';
      console.error('❌ Error cargando empresas:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (nombre: string) => {
    try {
      
      // Debuggear token antes de la petición
      const token = localStorage.getItem('token');
      console.log('🔐 Token en localStorage:', token ? `Sí (${token.length} chars)` : 'No');
      
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('👤 Usuario del token:', payload.unique_name || payload.email);
          console.log('📅 Token válido hasta:', new Date(payload.exp * 1000));
          
          // Verificar si el token ha expirado
          if (Date.now() >= payload.exp * 1000) {
            console.error('❌ Token expirado!');
            alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            localStorage.clear();
            window.location.href = '/login';
            return;
          }
        } catch (e) {
          console.error('❌ Token inválido:', e);
        }
      }
      
      // Verificar si el usuario realmente tiene permiso
      if (userRole !== 'Admin') {
        console.warn('⚠️ Usuario no es Admin según props');
        alert('No tienes permisos para crear empresas. Se requiere rol "Admin".');
        return;
      }
      
      console.log('📤 Enviando petición POST...');
      await empresasService.createEmpresa(nombre);
      
      console.log('✅ Empresa creada exitosamente');
      setShowForm(false);
      loadEmpresas();
      
    } catch (err: any) {
      console.error('❌ ERROR COMPLETO:', err);
      
      if (err.response) {
        console.error('📊 Respuesta del servidor:', err.response.data);
        console.error('🔢 Status:', err.response.status);
        
        if (err.response.status === 403) {
          const errorMsg = 'Acceso denegado. Verifica que tu usuario tenga rol "Admin".';
          console.error('🚫', errorMsg);
          alert(errorMsg);
          
          // Forzar logout si hay problema de permisos
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          
        } else if (err.response.status === 401) {
          console.error('🔐 No autorizado - Token inválido o expirado');
          alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          localStorage.clear();
          window.location.href = '/login';
          
        } else {
          setError(err.response?.data?.mensaje || 'Error al crear empresa');
        }
      } else if (err.request) {
        console.error('🌐 Error de red - No se recibió respuesta');
        setError('Error de conexión con el servidor');
      } else {
        console.error('⚠️ Error configurando la petición:', err.message);
        setError('Error al procesar la solicitud');
      }
    }
  };

  const handleUpdate = async (id: number, nombre: string) => {
    try {
      console.log(`✏️ Actualizando empresa ID: ${id}`);
      await empresasService.updateEmpresa(id, nombre);
      setEditingEmpresa(null);
      loadEmpresas();
    } catch (err: any) {
      console.error('Error actualizando empresa:', err);
      setError(err.response?.data?.mensaje || 'Error al actualizar empresa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta empresa?')) return;
    
    try {
      console.log(`🗑️ Eliminando empresa ID: ${id}`);
      await empresasService.deleteEmpresa(id);
      loadEmpresas();
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al eliminar empresa');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #1890ff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p>Cargando empresas...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="empresas-container">
      {/* Header */}
      <div className="empresas-header">
        <div>
          <h1>🏢 Empresas Registradas</h1>
          <p className="subtitle">
            Gestión de empresas y sus asociados
            <span className="count-badge">{empresas.length} empresas</span>
          </p>
        </div>
        
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ×
              </button>
            )}
          </div>
          
          {userRole === 'Admin' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <span className="btn-icon">+</span>
              Nueva Empresa
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="error-close" onClick={() => setError('')}>×</button>
        </div>
      )}

      {(showForm || editingEmpresa) && (
        <EmpresaForm
          empresa={editingEmpresa}
          onSubmit={editingEmpresa ? 
            (nombre: string) => handleUpdate(editingEmpresa.id, nombre) : 
            handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingEmpresa(null);
          }}
          title={editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}
        />
      )}

      {selectedEmpresa && (
        <EmpresaDetail
          empresa={selectedEmpresa}
          onClose={() => setSelectedEmpresa(null)}
        />
      )}

      <div className="empresas-table-container">
        <table className="empresas-table">
          <thead>
            <tr>
              <th className="col-id">ID</th>
              <th className="col-nombre">Nombre</th>
              <th className="col-fecha">Fecha Creación</th>
              <th className="col-acciones">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmpresas.length > 0 ? (
              filteredEmpresas.map((empresa) => (
                <tr key={empresa.id} className="empresa-row">
                  <td className="col-id">
                    <span className="id-badge">#{empresa.id}</span>
                  </td>
                  <td className="col-nombre">
                    <div className="empresa-info">
                      <div className="empresa-icon">🏢</div>
                      <div>
                        <div className="empresa-name">{empresa.nombre || 'Sin nombre'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="col-fecha">
                    <div className="fecha-container">
                      <span className="fecha-icon">📅</span>
                      <span>{formatDate(empresa.fechaCreacion)}</span>
                    </div>
                  </td>
                  <td className="col-acciones">
                    <div className="actions-container">
                      <button
                        onClick={() => setSelectedEmpresa(empresa)}
                        className="btn-view"
                        title="Ver detalles"
                      >
                        👁️ Ver
                      </button>
                      
                      {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
                        <button
                          onClick={() => setEditingEmpresa(empresa)}
                          className="btn-edit"
                          title="Editar empresa"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      
                      {userRole === 'SuperAdmin' && (
                        <button
                          onClick={() => handleDelete(empresa.id)}
                          className="btn-delete"
                          title="Eliminar empresa"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="empty-state">
                  <div className="empty-content">
                    <div className="empty-icon">🏢</div>
                    <h3>No hay empresas</h3>
                    <p>
                      {searchTerm 
                        ? `No se encontraron empresas con "${searchTerm}"`
                        : 'Aún no hay empresas registradas en el sistema.'}
                    </p>
                    {userRole === 'Admin' && !searchTerm && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary"
                      >
                        + Crear primera empresa
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {filteredEmpresas.length > 0 && (
          <div className="table-footer">
            <div className="stats">
              Mostrando {filteredEmpresas.length} de {empresas.length} empresas
              {searchTerm && ` (filtradas por "${searchTerm}")`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmpresasList;