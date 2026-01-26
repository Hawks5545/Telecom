import React, { useState, useEffect } from 'react'; // <--- Agregamos useEffect
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
                
                // TRANSFORMACIÓN DE DATOS:
                // Laravel nos da "name" completo y roles en código ("admin").
                // Tu tabla quiere "nombre", "apellido" y roles bonitos ("Administrador").
                const formattedUsers = data.map(u => {
                    // Separar nombre y apellido (Básico)
                    const nameParts = u.name.split(' ');
                    const nombre = nameParts[0];
                    const apellido = nameParts.slice(1).join(' ') || '';

                    // Mapa de Roles para que se vean bonitos
                    const roleDisplay = {
                        'admin': 'Administrador',
                        'senior': 'Senior',
                        'junior': 'Junior',
                        'analista': 'Analista'
                    };

                    return {
                        id: u.id,
                        nombre: nombre,
                        apellido: apellido,
                        rol: roleDisplay[u.role] || u.role, // Si no está en el mapa, muestra el original
                        docTipo: 'C.C', // Dato que no guardamos en DB aún, lo dejamos fijo o lo traes si agregas columna
                        docNum: u.cedula || 'N/A',
                        correo: u.email,
                        fecha: new Date(u.created_at).toLocaleDateString(), // Formato fecha
                        estado: u.is_active ? 'Activo' : 'Inactivo'
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
        setSelectedUser(user);
        setShowEditModal(true);
    };

    // 1. ELIMINAR (Solo visual por ahora, falta backend delete)
    const handleDeleteClick = (user) => {
        showAlert(
            'delete',
            '¿Estás seguro?',
            `Vas a eliminar al usuario ${user.nombre} ${user.apellido}.`,
            () => executeDelete(user.id)
        );
    };

    const executeDelete = (userId) => {
        // Aquí deberías hacer fetch DELETE a la API
        setUsers(users.filter(u => u.id !== userId));
        setTimeout(() => {
            showAlert('success', '¡Eliminado!', 'El usuario ha sido eliminado correctamente.');
        }, 300);
    };

    // 2. CREAR (Éxito al registrar)
    const handleUserCreated = () => {
        setShowCreateModal(false); 
        fetchUsers(); // <--- RECARGAMOS LA LISTA REAL DESDE LA BD
        showAlert(
            'success', 
            'Registro Exitoso', 
            'El nuevo usuario ha sido creado y notificado correctamente.'
        );
    };

    // 3. EDITAR (Éxito al guardar cambios)
    const handleUserUpdated = () => {
        setShowEditModal(false); 
        fetchUsers(); // <--- RECARGAMOS LA LISTA REAL
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
                                        <span className={user.estado === 'Activo' ? styles.statusActive : styles.statusInactive}>
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
                                        
                                        {/* Protegemos que no se pueda borrar a los Admins (opcional) */}
                                        {user.rol !== 'Administrador' && (
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

            {/* --- MODALES --- */}
            
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