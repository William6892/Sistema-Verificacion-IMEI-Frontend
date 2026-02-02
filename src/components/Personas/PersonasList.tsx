// src/components/Personas/PersonasList.tsx
import React, { useState, useEffect } from 'react';
import { personasService } from '../../services/personasService';
import { empresasService } from '../../services/empresasService';
import PersonaForm from './PersonaForm';
import { authService } from '../../services/authService';
import './PersonasList.css';

interface PersonasListProps {
  userRole: string;
}

const PersonasList: React.FC<PersonasListProps> = ({ userRole }) => {
  const [personas, setPersonas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [empresaFilter, setEmpresaFilter] = useState<number | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any>(null);

  const isAdmin = authService.isAdmin();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar ambos en paralelo
      const [personasData, empresasData] = await Promise.all([
        personasService.getPersonas(),  
        empresasService.getEmpresas()
      ]);
      
      // Corregir personas agregando empresaId si falta
      const personasCorregidas = personasData.map(persona => {
        // Buscar empresa por nombre (case insensitive)
        const empresa = empresasData.find(e => 
          e.nombre?.toLowerCase() === persona.empresaNombre?.toLowerCase()
        );
        
        return {
          ...persona,
          empresaId: empresa?.id || persona.empresaId || null,
          empresaNombre: persona.empresaNombre || 'Sin empresa'
        };
      });
      
      setPersonas(personasCorregidas);
      setEmpresas(empresasData);

    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = persona.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         persona.identificacion?.includes(searchTerm) ||
                         false;
    
    const personaEmpresaId = Number(persona.empresaId);
    const matchesEmpresa = empresaFilter === 'all' || 
                          personaEmpresaId === empresaFilter;
    
    return matchesSearch && matchesEmpresa;
  });

  const getEmpresaNombre = (empresaId: number) => {
    const empresa = empresas.find(e => e.id === empresaId);
    return empresa?.nombre || 'Desconocida';
  };

  const handleNuevaPersona = () => {
    setEditingPersona(null);
    setShowForm(true);
  };

  const handleEditPersona = (persona: any) => {
    setEditingPersona(persona);
    setShowForm(true);
  };

  const handleDeletePersona = async (personaId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta persona?')) {
      try {
        await personasService.deletePersona(personaId);
        await loadData();
      } catch (error) {
        alert('Error al eliminar la persona');
      }
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingPersona(null);
    loadData();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingPersona(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3>Cargando personas...</h3>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="form-container">
        <PersonaForm
          personaToEdit={editingPersona}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
        
        <div className="back-button-container">
          <button className="back-button" onClick={() => setShowForm(false)}>
            ← Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="personas-container">
      {/* Header */}
      <div className="section-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">
              <span className="title-icon">👥</span>
              Gestión de Personas
            </h1>
            <p className="page-subtitle">
              Administra y visualiza todas las personas registradas
            </p>
          </div>
          
          {isAdmin && (
            <button className="new-persona-btn" onClick={handleNuevaPersona}>
              <span className="plus-icon">+</span>
              Nueva Persona
            </button>
          )}
        </div>

        {/* Contador */}
        <div className="counter-container">
          <div className="counter-card">
            <div className="counter-number">{personas.length}</div>
            <div className="counter-info">
              <div className="counter-label">Total Personas</div>
              <div className="counter-value">{personas.length} registradas</div>
            </div>
          </div>

          <div className="counter-card">
            <div className="counter-number">{filteredPersonas.length}</div>
            <div className="counter-info">
              <div className="counter-label">Mostrando</div>
              <div className="counter-value">{filteredPersonas.length} filtradas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-container">
        <div className="filters-content">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="🔍 Buscar por nombre o identificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="select-container">
            <select
              value={empresaFilter}
              onChange={(e) => setEmpresaFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
              className="company-select"
            >
              <option value="all">🏢 Todas las empresas</option>
              {empresas.map(empresa => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de personas */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="personas-table">
            <thead>
              <tr className="table-header">
                <th>Persona</th>
                <th>Identificación</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersonas.map((persona) => (
                <tr key={persona.id} className="table-row">
                  <td>
                    <div className="persona-info">
                      <div className="persona-avatar">
                        {persona.nombre?.charAt(0).toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="persona-name">
                          {persona.nombre || 'Sin nombre'}
                        </div>
                        <div className="persona-id">
                          ID: {persona.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="identification-badge">
                      {persona.identificacion || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div className="company-info">
                      <div className="company-status-dot"></div>
                      <span className="company-name">
                        {persona.empresaNombre || getEmpresaNombre(persona.empresaId)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div className="contact-item">
                        <span className="contact-icon">📞</span> 
                        {persona.telefono || 'No especificado'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn view-btn">
                        👁️ Ver
                      </button>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleEditPersona(persona)}
                          className="action-btn edit-btn">
                          ✏️ Editar
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeletePersona(persona.id)}
                          className="action-btn delete-btn">
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPersonas.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h3>No se encontraron personas</h3>
            <p>
              {searchTerm || empresaFilter !== 'all' 
                ? 'Intenta con otros filtros' 
                : 'No hay personas registradas aún'}
            </p>
            
            {isAdmin && (
              <button className="empty-state-btn" onClick={handleNuevaPersona}>
                <span className="plus-icon">+</span>
                Registrar primera persona
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer con botón de actualizar */}
      {filteredPersonas.length > 0 && (
        <div className="table-footer">
          <div className="total-count">
            Total: <strong>{personas.length}</strong> personas registradas
          </div>
          <button className="refresh-btn" onClick={loadData}>
            🔄 Actualizar datos
          </button>
        </div>
      )}
    </div>
  );
};

export default PersonasList;