// resources/js/components/Modules/UsersRoles/RoleManager.jsx
import React, { useState } from 'react';
import styles from './RoleManager.module.css';

// Importamos AMBOS modales
import RoleModal from '../RoleModal/RoleModal'; 
import EditRoleModal from '../EditRoleModal/EditRoleModal'; // Asegúrate de la ruta

const RoleManager = () => {
    
    // --- ESTADOS ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // --- ROL SELECCIONADO ---
    const [selectedRole, setSelectedRole] = useState(null);

    const mockRoles = [
        { id: 1, nombre: 'Administrador', desc: 'Control total del sistema', permisos: ['Todo el sistema'] },
        { id: 2, nombre: 'Senior/Junior', desc: 'Supervisión y control de calidad', permisos: ['Buscar Grabaciones', 'Reproducir', 'Descargar ZIP', 'Ver Reportes'] },
        { id: 3, nombre: 'Analistas', desc: 'Operación estándar y descargas', permisos: ['Buscar Grabaciones', 'Reproducir', 'Descargar ZIP'] },
    ];

    // --- ABRIR EDITAR ---
    const handleOpenEdit = (role) => {
        setSelectedRole(role);
        setShowEditModal(true);
    };

    return (
        <>
            <div className={styles.sectionHeader}>
                <h5 className={styles.sectionTitle}>Roles y Permisos del Sistema</h5>
                {/* BOTÓN NUEVO -> showCreateModal */}
                <button className={`btn ${styles.btnAdd}`} onClick={() => setShowCreateModal(true)}>
                    <i className="bi bi-shield-plus me-2"></i> Nuevo Rol
                </button>
            </div>
            
            <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                    <thead className={styles.tableHeader}>
                        <tr>
                            <th className="ps-4 py-3" style={{width: '20%'}}>Nombre del Rol</th>
                            <th className="py-3" style={{width: '25%'}}>Descripción</th>
                            <th className="py-3" style={{width: '40%'}}>Permisos Asignados</th>
                            <th className="py-3 text-center" style={{width: '15%'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockRoles.map((role) => (
                            <tr key={role.id}>
                                <td className="ps-4 fw-bold text-dark">
                                    <i className="bi bi-shield-fill me-2 text-secondary"></i>{role.nombre}
                                </td>
                                <td className="text-muted small">{role.desc}</td>
                                <td>
                                    {role.permisos.map((perm, index) => (
                                        <span key={index} className={styles.permTag}>{perm}</span>
                                    ))}
                                </td>
                                <td className="text-center">
                                    {/* BOTÓN EDITAR -> handleOpenEdit */}
                                    <span 
                                        className={`${styles.actionLink} ${styles.editLink}`} 
                                        onClick={() => handleOpenEdit(role)}
                                    >
                                        Editar
                                    </span>
                                    
                                    {role.nombre !== 'Administrador' && (
                                        <span className={`${styles.actionLink} ${styles.deleteLink}`}>Eliminar</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="card-footer bg-white border-0 py-3 text-end text-muted small">
                Total Roles Configurados: {mockRoles.length}
            </div>

            {/* --- MODAL CREAR --- */}
            <RoleModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
            />

            {/* --- MODAL EDITAR --- */}
            <EditRoleModal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)}
                role={selectedRole}
            />
        </>
    );
};

export default RoleManager;