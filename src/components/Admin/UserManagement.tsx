// src/components/Admin/UserManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import './UserManagement.css';

// Actualiza las interfaces según tu modelo REAL de base de datos
interface User {
  id: number;
  username: string;
  rol: string;
  activo: boolean;
  empresaId?: number;
  empresaNombre?: string;
  fechaCreacion: string;
}

interface CreateUserForm {
  username: string;
  password: string;
  confirmPassword: string;
  rol: string;
  activo: boolean;
  empresaId?: number;
}

interface EditUserForm {
  rol: string;
  activo: boolean;
  empresaId?: number;
}

interface UserManagementProps {
  userRole?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ userRole = 'Usuario' }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para modales y formularios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [empresas, setEmpresas] = useState<any[]>([]); // Para el dropdown de empresas
  
  // Formularios
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    password: '',
    confirmPassword: '',
    rol: 'Usuario',
    activo: true
  });
  
  const [editForm, setEditForm] = useState<EditUserForm>({
    rol: 'Usuario',
    activo: true
  });

  // ✅ CORREGIDO: Usar REACT_APP_API_URL y tu backend real
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://imei-api-p18o.onrender.com';
  const roles = ['Admin', 'Supervisor', 'Usuario'];

  // ✅ Obtener token
  const getToken = () => localStorage.getItem('token');

  // ✅ Verificar permisos - solo Admin puede acceder
  useEffect(() => {
    const checkPermissions = () => {
      if (userRole !== 'Admin') {
        setError('Acceso denegado. Solo administradores pueden acceder a esta sección.');
        return false;
      }
      return true;
    };

    const hasPermission = checkPermissions();
    if (hasPermission) {
      fetchUsers();
      fetchEmpresas();
    }
  }, [userRole]);

  // ✅ Obtener lista de empresas
  const fetchEmpresas = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // ✅ CORREGIDO: Usar URL completa con /api/
      const response = await fetch(`${API_BASE_URL}/api/empresas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmpresas(data);
      }
    } catch (err) {
      console.error('Error fetching empresas:', err);
    }
  };

  // ✅ Obtener lista de usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      // ✅ CORREGIDO: URL completa con /api/
      const response = await fetch(`${API_BASE_URL}/api/Users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 403) {
        setError('No tienes permisos para gestionar usuarios');
        return;
      }

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('No se pudieron cargar los usuarios');
      
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // ✅ Crear nuevo usuario
  const handleCreateUser = async () => {
    try {
      setError(null);
      
      // Validaciones
      if (createForm.password !== createForm.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      
      if (createForm.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      const token = getToken();
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      // ✅ CORREGIDO: URL completa con /api/
      const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: createForm.username,
          password: createForm.password,
          rol: createForm.rol,
          activo: createForm.activo,
          empresaId: createForm.empresaId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || 'Error al crear usuario');
      }

      const result = await response.json();
      
      setSuccess(`Usuario ${createForm.username} creado exitosamente`);
      setShowCreateModal(false);
      
      // Resetear formulario
      setCreateForm({
        username: '',
        password: '',
        confirmPassword: '',
        rol: 'Usuario',
        activo: true
      });
      
      // Recargar lista de usuarios
      fetchUsers();
      
      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Error al crear usuario');
    }
  };

  // ✅ Actualizar usuario
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      setError(null);
      
      const token = getToken();
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      // ✅ CORREGIDO: URL completa con /api/
      const response = await fetch(`${API_BASE_URL}/api/Users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rol: editForm.rol,
          activo: editForm.activo,
          empresaId: editForm.empresaId || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || 'Error al actualizar usuario');
      }

      setSuccess(`Usuario ${selectedUser.username} actualizado exitosamente`);
      setShowEditModal(false);
      fetchUsers();
      
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message || 'Error al actualizar usuario');
    }
  };

  // ✅ Eliminar usuario
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const token = getToken();
      if (!token) {
        setError('No hay sesión activa');
        return;
      }

      // ✅ CORREGIDO: URL completa con /api/
      const response = await fetch(`${API_BASE_URL}/api/Users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || 'Error al eliminar usuario');
      }

      setSuccess(`Usuario ${selectedUser.username} eliminado exitosamente`);
      setShowDeleteModal(false);
      fetchUsers();
      
      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Error al eliminar usuario');
    }
  };

  // ✅ Filtrar usuarios
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.empresaNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // ✅ Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // ✅ Abrir modal de edición
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      rol: user.rol,
      activo: user.activo,
      empresaId: user.empresaId
    });
    setShowEditModal(true);
  };

  // ✅ Abrir modal de eliminación
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // ✅ Mostrar mensaje de acceso denegado
  if (userRole !== 'Admin') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <h2 style={{ color: '#dc2626' }}>Acceso Denegado</h2>
        <p style={{ color: '#64748b', textAlign: 'center', maxWidth: '400px' }}>
          Solo usuarios con rol de Administrador pueden acceder a la gestión de usuarios.
        </p>
      </div>
    );
  }

  // ✅ Mostrar loading
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Header */}
      <div className="user-header">
        <div>
          <h1>Gestión de Usuarios</h1>
          <p>Administra los usuarios del sistema</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <span>➕</span> Nuevo Usuario
        </button>
      </div>

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      {/* Barra de búsqueda y filtros */}
      <div className="search-bar">
        <div className="search-input">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Buscar por usuario, rol o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-badges">
          <span className="badge total">Total: {users.length}</span>
          <span className="badge active">Activos: {users.filter(u => u.activo).length}</span>
          <span className="badge inactive">Inactivos: {users.filter(u => !u.activo).length}</span>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar-small">
                        {user.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="username">{user.username}</div>
                        <div className="user-id">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge role-${user.rol.toLowerCase()}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td>{user.empresaNombre || 'Sin empresa'}</td>
                  <td>
                    <span className={`status-badge ${user.activo ? 'active' : 'inactive'}`}>
                      {user.activo ? '✅ Activo' : '⛔ Inactivo'}
                    </span>
                  </td>
                  <td>{formatDate(user.fechaCreacion)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => openEditModal(user)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => openDeleteModal(user)}
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-data">
                  <div>📭</div>
                  <p>No se encontraron usuarios</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Crear Usuario */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Crear Nuevo Usuario</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre de Usuario *</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                    placeholder="Ej: Orion2"
                  />
                </div>
                
                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirmar Contraseña *</label>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})}
                    placeholder="Repite la contraseña"
                  />
                </div>
                
                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={createForm.rol}
                    onChange={(e) => setCreateForm({...createForm, rol: e.target.value})}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Empresa</label>
                  <select
                    value={createForm.empresaId || ''}
                    onChange={(e) => setCreateForm({...createForm, empresaId: e.target.value ? parseInt(e.target.value) : undefined})}
                  >
                    <option value="">Sin empresa</option>
                    {empresas.map(empresa => (
                      <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Estado Inicial</label>
                  <div className="toggle-switch">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={createForm.activo}
                        onChange={(e) => setCreateForm({...createForm, activo: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                    <span className="toggle-label">
                      {createForm.activo ? 'Usuario Activo' : 'Usuario Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="form-note">
                <span>💡</span>
                <p>El usuario podrá iniciar sesión inmediatamente después de ser creado.</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateUser}
              >
                Crear Usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuario */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Editar Usuario: {selectedUser.username}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Rol *</label>
                  <select
                    value={editForm.rol}
                    onChange={(e) => setEditForm({...editForm, rol: e.target.value})}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Empresa</label>
                  <select
                    value={editForm.empresaId || ''}
                    onChange={(e) => setEditForm({...editForm, empresaId: e.target.value ? parseInt(e.target.value) : undefined})}
                  >
                    <option value="">Sin empresa</option>
                    {empresas.map(empresa => (
                      <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Estado</label>
                  <div className="toggle-switch">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={editForm.activo}
                        onChange={(e) => setEditForm({...editForm, activo: e.target.checked})}
                      />
                      <span className="slider"></span>
                    </label>
                    <span className="toggle-label">
                      {editForm.activo ? 'Usuario Activo' : 'Usuario Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="user-info-summary">
                <p><strong>Usuario:</strong> {selectedUser.username}</p>
                <p><strong>ID:</strong> {selectedUser.id}</p>
                <p><strong>Creado:</strong> {formatDate(selectedUser.fechaCreacion)}</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={handleUpdateUser}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="warning-message">
                <div className="warning-icon">⚠️</div>
                <div>
                  <h3>¿Estás seguro de eliminar este usuario?</h3>
                  <p>Esta acción no se puede deshacer. Se eliminará permanentemente:</p>
                  
                  <div className="user-delete-details">
                    <p><strong>Usuario:</strong> {selectedUser.username}</p>
                    <p><strong>Rol:</strong> {selectedUser.rol}</p>
                    <p><strong>Empresa:</strong> {selectedUser.empresaNombre || 'Sin empresa'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-danger"
                onClick={handleDeleteUser}
              >
                Eliminar Usuario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;