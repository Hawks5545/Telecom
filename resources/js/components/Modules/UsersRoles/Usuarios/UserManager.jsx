// resources/js/components/Modules/UsersRoles/UserManager.jsx
import React, { useState } from 'react';
import styles from './UserManager.module.css';

// Importamos AMBOS modales
import UserModal from '../UserModal/UserModal'; 
import EditUserModal from '../EditUserModal/EditUserModal'; // Asegúrate de la ruta correcta

const UserManager = () => {
    
    // --- ESTADOS DE MODALES ---
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    
    // --- USUARIO SELECCIONADO PARA EDITAR ---
    const [selectedUser, setSelectedUser] = useState(null);

    const generateUsers = () => {
        return Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            nombre: ['Ana', 'Carlos', 'Luis', 'Maria', 'Jorge'][i % 5],
            apellido: ['Perez', 'Gomez', 'Ruiz', 'Diaz', 'Torres'][i % 5],
            rol: i % 10 === 0 ? 'Administrador' : (i % 3 === 0 ? 'Senior/Junior' : 'Analista'),
            docTipo: 'C.C',
            docNum: `${1000 + i}${500 + i}`,
            correo: `usuario${i + 1}@empresa.com`,
            fecha: `2025-01-${(i % 30) + 1}`,
            estado: i % 5 === 0 ? 'Inactivo' : 'Activo'
        }));
    };

    const [users] = useState(generateUsers());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15; 
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(users.length / itemsPerPage);
    const handlePageChange = (page) => setCurrentPage(page);

    // --- FUNCIÓN PARA ABRIR EDITAR ---
    const handleOpenEdit = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleDelete = (nombre) => {
        if(confirm(`¿Estás seguro de eliminar al usuario ${nombre}?`)) {
            alert("Usuario eliminado (Simulación)");
        }
    };

    return (
        <>
            <div className={styles.sectionHeader}>
                <h5 className={styles.sectionTitle}>Listado de Usuarios Registrados</h5>
                
                {/* BOTÓN CREAR -> showCreateModal */}
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
                        {currentItems.map((user) => (
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
                                    {/* BOTÓN EDITAR -> handleOpenEdit */}
                                    <span 
                                        className={`${styles.actionLink} ${styles.editLink}`} 
                                        onClick={() => handleOpenEdit(user)}
                                    >
                                        Editar
                                    </span>
                                    
                                    {user.rol !== 'Administrador' && (
                                        <span 
                                            className={`${styles.actionLink} ${styles.deleteLink}`}
                                            onClick={() => handleDelete(user.nombre)}
                                        >
                                            Eliminar
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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

            {/* --- MODAL DE CREACIÓN --- */}
            <UserModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
            />

            {/* --- MODAL DE EDICIÓN --- */}
            <EditUserModal 
                isOpen={showEditModal} 
                onClose={() => setShowEditModal(false)}
                user={selectedUser} 
            />
        </>
    );
};

export default UserManager;