import React, { useState, useEffect } from 'react'; // Agregamos useEffect
import styles from './RoleManager.module.css';

// Importamos Modales
import RoleModal from '../RoleModal/RoleModal'; 
import EditRoleModal from '../EditRoleModal/EditRoleModal';

// Importamos la Alerta Personalizada
import CustomAlert from '../../../Common/CustomAlert/CustomAlert'; 

const RoleManager = () => {
    
    // --- ESTADOS DE MODALES ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // --- ROL SELECCIONADO ---
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- ESTADO DE LA ALERTA ---
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    });

    // --- ESTADO DE DATOS (Ahora vienen de Laravel) ---
    const [roles, setRoles] = useState([]);

    // --- CARGAR ROLES DESDE LA API ---
    const fetchRoles = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/api/roles', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (error) {
            console.error("Error cargando roles:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // --- ALERTAS HELPERS ---
    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    };

    const closeAlert = () => {
        setAlertConfig({ ...alertConfig, isOpen: false });
    };

    // --- ACCIONES DE MODALES ---
    const handleOpenEdit = (role) => {
        setSelectedRole(role);
        setShowEditModal(true);
    };

    // --- ACCIONES LÓGICAS ---

    // 1. ELIMINAR ROL (Backend)
    const handleDeleteClick = (role) => {
        showAlert(
            'delete',
            '¿Eliminar Rol?',
            `Vas a eliminar el rol "${role.display_name}". Los usuarios con este rol podrían perder acceso.`,
            () => executeDelete(role.id)
        );
    };

    const executeDelete = async (roleId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://127.0.0.1:8000/api/roles/${roleId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchRoles(); // Recargar lista
                showAlert('success', 'Rol Eliminado', 'El rol ha sido removido correctamente.');
            }
        } catch (error) {
            showAlert('error', 'Error', 'No se pudo eliminar el rol.');
        }
    };

    // 2. CREAR ROL
    const handleRoleCreated = () => {
        setShowCreateModal(false);
        fetchRoles(); // Recargar de la DB
        showAlert('success', 'Rol Creado', 'El nuevo perfil de permisos está listo para usarse.');
    };

    // 3. EDITAR ROL
    const handleRoleUpdated = () => {
        setShowEditModal(false);
        fetchRoles(); // Recargar de la DB
        showAlert('success', 'Permisos Actualizados', 'La configuración del rol ha sido modificada.');
    };

    return (
        <>
            <CustomAlert 
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm}
            />

            <div className={styles.sectionHeader}>
                <h5 className={styles.sectionTitle}>Roles y Permisos del Sistema</h5>
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
                            <th className="py-3 text-center" style={{width: '15%'}}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="3" className="text-center py-4">Cargando roles...</td></tr>
                        ) : (
                            roles.map((role) => (
                                <tr key={role.id}>
                                    <td className="ps-4 fw-bold text-dark">
                                        <i className="bi bi-shield-fill me-2 text-secondary"></i>
                                        {role.display_name}
                                    </td>
                                    <td className="text-muted small">{role.description || 'Sin descripción'}</td>
                                    <td className="text-center">
                                        <span 
                                            className={`${styles.actionLink} ${styles.editLink}`} 
                                            onClick={() => handleOpenEdit(role)}
                                        >
                                            Editar
                                        </span>
                                        
                                        {/* No permitimos borrar el Admin maestro */}
                                        {role.name !== 'admin' && (
                                            <span 
                                                className={`${styles.actionLink} ${styles.deleteLink}`}
                                                onClick={() => handleDeleteClick(role)}
                                            >
                                                Eliminar
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="card-footer bg-white border-0 py-3 text-end text-muted small">
                Total Roles Configurados: {roles.length}
            </div>

            <RoleModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
                onSuccess={handleRoleCreated} 
            />

            <EditRoleModal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)}
                role={selectedRole}
                onSuccess={handleRoleUpdated} 
            />
        </>
    );
};

export default RoleManager;