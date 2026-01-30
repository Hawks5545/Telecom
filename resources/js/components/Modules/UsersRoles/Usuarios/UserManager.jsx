import React, { useState, useEffect } from 'react'; 
import styles from './UserManager.module.css';

// Importamos los modales (Hijos)
import UserModal from '../UserModal/UserModal'; 
import EditUserModal from '../EditUserModal/EditUserModal';

// Importamos la Alerta Personalizada (Common)
import CustomAlert from '../../../Common/CustomAlert/CustomAlert'; 

const UserManager = () => {
    
    // --- ESTADOS DE MODALES ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // --- USUARIO SELECCIONADO PARA EDITAR ---
    const [selectedUser, setSelectedUser] = useState(null);

    // --- ESTADO DE LA ALERTA PERSONALIZADA ---
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: '',
        onConfirm: null
    });

    // --- ESTADOS DE DATOS ---
    const [users, setUsers] = useState([]); // Inicia vacío
    const [isLoading, setIsLoading] = useState(true); // Estado de carga
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    // --- FUNCIÓN PARA TRAER DATOS DE LARAVEL ---
    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('http://127.0.0.1:8000/api/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // TRANSFORMACIÓN DE DATOS CON LÓGICA DE ESTADOS
                const formattedUsers = data.map(u => {
                    const nameParts = u.name.split(' ');
                    const nombre = nameParts[0];
                    const apellido = nameParts.slice(1).join(' ') || '';

                    // --- CAMBIO CLAVE 1: YA NO NECESITAMOS EL DICCIONARIO MANUAL ---
                    // La base de datos ya nos da el nombre bonito en 'display_name'

                    // --- MÁQUINA DE ESTADOS ---
                    let estadoLabel = 'Desconocido';
                    let estadoClass = styles.statusInactive; 

                    if (u.is_active === 0) {
                        estadoLabel = 'Inactivo'; 
                        estadoClass = styles.statusInactive; 
                    } else if (u.email_verified_at === null) {
                        estadoLabel = 'Pendiente'; 
                        estadoClass = styles.statusPending; 
                    } else {
                        estadoLabel = 'Activo'; 
                        estadoClass = styles.statusActive; 
                    }

                    return {
                        id: u.id,
                        nombre: nombre,
                        apellido: apellido,
                        
                        // --- CAMBIO CLAVE 2: LEER DESDE EL OBJETO RELACIONADO ---
                        // Si existe u.role, mostramos su display_name ("Administrador").
                        // Si no tiene rol, mostramos "Sin Rol".
                        rol: u.role ? u.role.display_name : 'Sin Rol',

                        docTipo: 'C.C', // Si tienes este dato en BD, úsalo: u.tipo_documento
                        docNum: u.cedula || 'N/A',
                        correo: u.email,
                        fecha: new Date(u.created_at).toLocaleDateString(),
                        
                        // Estado Lógico y Visual
                        estado: estadoLabel,
                        estadoClass: estadoClass,
                        
                        // --- CAMBIO CLAVE 3: PREPARAR DATOS PARA EDICIÓN ---
                        // El modal de edición espera que 'role' sea un string (ej: 'admin')
                        // no un objeto completo. Lo aplanamos aquí para evitar errores.
                        originalData: {
                            ...u,
                            role: u.role ? u.role.name : '' // Pasamos 'admin', 'junior', etc.
                        } 
                    };
                });

                setUsers(formattedUsers);
            } else {
                console.error("Error al cargar usuarios");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Cargar usuarios al iniciar el componente
    useEffect(() => {
        fetchUsers();
    }, []);

    // --- CÁLCULOS DE PAGINACIÓN ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const handlePageChange = (page) => setCurrentPage(page);

    // --- HELPER: MOSTRAR ALERTAS ---
    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    };

    const closeAlert = () => {
        setAlertConfig({ ...alertConfig, isOpen: false });
    };

    // --- ACCIONES DEL SISTEMA ---

    const handleOpenEdit = (user) => {
        // Pasamos los datos preparados para que el modal funcione bien
        setSelectedUser(user.originalData);
        setShowEditModal(true);
    };

    // 1. ELIMINAR (Confirmación Visual)
    const handleDeleteClick = (user) => {
        showAlert(
            'delete',
            '¿Estás seguro?',
            `Vas a eliminar al usuario ${user.nombre} ${user.apellido}. Esta acción no se puede deshacer.`,
            () => executeDelete(user.id) 
        );
    };

    // --- FUNCIÓN REAL DE ELIMINAR ---
    const executeDelete = async (userId) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                setUsers(users.filter(u => u.id !== userId));
                showAlert('success', '¡Eliminado!', 'El usuario ha sido eliminado correctamente.');
            } else {
                showAlert('error', 'No se pudo eliminar', data.message || 'Ocurrió un error desconocido.');
            }

        } catch (error) {
            console.error(error);
            showAlert('error', 'Error de Conexión', 'No se pudo conectar con el servidor.');
        }
    };

    // 2. CREAR (Éxito al registrar)
    const handleUserCreated = () => {
        setShowCreateModal(false); 
        fetchUsers(); 
        showAlert(
            'success', 
            'Registro Exitoso', 
            'El usuario ha sido creado. Estado: PENDIENTE hasta activar cuenta.'
        );
    };

    // 3. EDITAR (Éxito al guardar cambios)
    const handleUserUpdated = () => {
        setShowEditModal(false); 
        fetchUsers(); 
        showAlert(
            'success', 
            'Cambios Guardados', 
            'La información del usuario ha sido actualizada.'
        );
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
                <h5 className={styles.sectionTitle}>Listado de Usuarios Registrados</h5>
                <button className={`btn ${styles.btnAdd}`} onClick={() => setShowCreateModal(true)}>
                    <i className="bi bi-person-plus-fill me-2"></i> Nuevo Usuario
                </button>
            </div>

            <div className={`table-responsive ${styles.tableWrapper}`}>
                <table className="table table-hover mb-0 align-middle">
                    <thead className={styles.tableHeader}>
                        <tr>
                            <th className="ps-4 py-3">Nombre</th>
                            <th className="py-3">Apellido</th>
                            <th className="py-3">Rol</th>
                            <th className="py-3">Documento</th>
                            <th className="py-3">Correo</th>
                            <th className="py-3">Fecha</th>
                            <th className="py-3">Estado</th>
                            <th className="py-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="8" className="text-center py-5">
                                    <div className="spinner-border text-secondary" role="status">
                                        <span className="visually-hidden">Cargando...</span>
                                    </div>
                                    <p className="mt-2 text-muted">Cargando usuarios...</p>
                                </td>
                            </tr>
                        ) : currentItems.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-5 text-muted">
                                    No hay usuarios registrados en el sistema.
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((user) => (
                                <tr key={user.id}>
                                    <td className="ps-4 fw-bold text-secondary">{user.nombre}</td>
                                    <td>{user.apellido}</td>
                                    <td><span className="badge bg-light text-dark border">{user.rol}</span></td>
                                    <td className="small text-muted">{user.docTipo} {user.docNum}</td>
                                    <td className="small">{user.correo}</td>
                                    <td className="small text-muted">{user.fecha}</td>
                                    <td>
                                        {/* Usamos la clase dinámica (Gris, Verde, Rojo) */}
                                        <span className={user.estadoClass}>
                                            {user.estado}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <span 
                                            className={`${styles.actionLink} ${styles.editLink}`} 
                                            onClick={() => handleOpenEdit(user)}
                                        >
                                            Editar
                                        </span>
                                        
                                        {user.id !== 1 && (
                                            <span 
                                                className={`${styles.actionLink} ${styles.deleteLink}`}
                                                onClick={() => handleDeleteClick(user)}
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

            {/* Footer Paginación */}
            {!isLoading && users.length > 0 && (
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, users.length)} de {users.length}</div>
                    <nav>
                        <ul className="pagination mb-0 gap-1">
                            <li><button className={`${styles.paginationBtn} ${currentPage === 1 ? styles.paginationBtnDisabled : ''}`} onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}><i className="bi bi-chevron-left"></i></button></li>
                            {[...Array(totalPages)].map((_, i) => (
                                <li key={i}><button className={`${styles.paginationBtn} ${currentPage === i + 1 ? styles.paginationBtnActive : ''}`} onClick={() => handlePageChange(i + 1)}>{i + 1}</button></li>
                            ))}
                            <li><button className={`${styles.paginationBtn} ${currentPage === totalPages ? styles.paginationBtnDisabled : ''}`} onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}><i className="bi bi-chevron-right"></i></button></li>
                        </ul>
                    </nav>
                </div>
            )}

            <UserModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleUserCreated} 
            />

            <EditUserModal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)}
                user={selectedUser} 
                onSuccess={handleUserUpdated} 
            />
        </>
    );
};

export default UserManager;