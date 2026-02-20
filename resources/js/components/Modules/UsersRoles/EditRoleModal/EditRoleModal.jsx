import React, { useEffect, useState } from 'react';
import styles from './EditRoleModal.module.css';

const EditRoleModal = ({ isOpen, onClose, role, onSuccess }) => { 
    // Si no está abierto o no hay rol, no renderiza nada
    if (!isOpen || !role) return null;

    // 1. CORRECCIÓN: Usamos 'name' (interno) para detectar al admin, no el nombre visible
    const isProtectedAdmin = role.name === 'admin';

    const [formData, setFormData] = useState({
        display_name: '',
        description: ''
    });

    const [selectedPerms, setSelectedPerms] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // LISTA MAESTRA DE PERMISOS (Debe ser idéntica a la de RoleModal)
    const availablePermissions = [
        "Dashboard",
        "Búsqueda de Grabaciones",
        "Gestor de Carpetas",
        "Indexación",
        "Auditorías",
        "Reportes"
    ];

    // 2. CARGAR DATOS: Sincronizamos con lo que viene de Laravel
    useEffect(() => {
        if (role) {
            setFormData({
                display_name: role.display_name || '', 
                description: role.description || ''
            });
            setSelectedPerms(role.permissions || []);
        }
    }, [role]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleCheckChange = (perm) => {
        if (selectedPerms.includes(perm)) {
            setSelectedPerms(selectedPerms.filter(p => p !== perm));
        } else {
            setSelectedPerms([...selectedPerms, perm]);
        }
    };

    // 3. GUARDAR CAMBIOS (Lógica Backend)
    const handleSave = async () => {
        setIsSubmitting(true);
        setError('');

        const token = localStorage.getItem('auth_token');

        try {
            const response = await fetch(`/api/roles/${role.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    display_name: formData.display_name,
                    description: formData.description,
                    permisos: selectedPerms 
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (onSuccess) onSuccess(); 
                onClose(); 
            } else {
                setError(data.message || 'Error al actualizar el rol.');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión con el servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>
                        <i className="bi bi-pencil-square me-2"></i>Editar Rol
                    </h5>
                    <button className={styles.btnClose} onClick={onClose} disabled={isSubmitting}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && <div className="alert alert-danger p-2 small text-center">{error}</div>}

                    <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-12">
                            <label className={styles.label}>Nombre del Rol</label>
                            <input 
                                type="text" 
                                name="display_name"
                                className={`form-control ${isProtectedAdmin ? styles.readOnlyInput : ''}`} 
                                value={formData.display_name} 
                                onChange={handleChange}
                                disabled={isProtectedAdmin} 
                            />
                        </div>
                        
                        <div className="col-12">
                            <label className={styles.label}>Descripción</label>
                            <textarea 
                                name="description"
                                className="form-control" 
                                rows="2" 
                                value={formData.description} 
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        
                        <div className="col-12">
                            <label className={styles.label}>Permisos Asignados</label>
                            
                            {isProtectedAdmin ? (
                                <div className="alert alert-warning d-flex align-items-center mt-2">
                                    <i className="bi bi-lock-fill fs-4 me-3"></i>
                                    <div>
                                        <strong>Rol Protegido.</strong><br/>
                                        El Administrador tiene acceso total por defecto.
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.permissionsGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {availablePermissions.map((perm, index) => (
                                        <div className="form-check" key={index}>
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id={`edit-perm-${index}`}
                                                checked={selectedPerms.includes(perm)}
                                                onChange={() => handleCheckChange(perm)}
                                            />
                                            <label className="form-check-label small" htmlFor={`edit-perm-${index}`}>
                                                {perm}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button 
                        className={styles.btnSave} 
                        onClick={handleSave} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditRoleModal;