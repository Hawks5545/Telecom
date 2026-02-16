import React, { useEffect, useState } from 'react';
import styles from './EditUserModal.module.css';

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
    
    if (!isOpen || !user) return null;
    
    const isSuperAdmin = user.id === 1;

    // --- ESTADO AHORA SEPARADO ---
    const [formData, setFormData] = useState({
        nombre: '',    
        apellido: '',   
        email: '',
        cedula: '',
        role: '',
        is_active: 1
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState([]); 
    const [error, setError] = useState('');

    // --- FUNCIÓN HELPER PARA SEPARAR NOMBRES ---
    const splitName = (fullName) => {
        if (!fullName) return { nombre: '', apellido: '' };
        const parts = fullName.trim().split(/\s+/); 

        if (parts.length >= 4) {
            return {
                nombre: parts.slice(0, 2).join(' '),
                apellido: parts.slice(2).join(' ')
            };
        } else if (parts.length === 3) {
            return {
                nombre: parts[0],
                apellido: parts.slice(1).join(' ')
            };
        } else {
            return {
                nombre: parts[0],
                apellido: parts.slice(1).join(' ') || ''
            };
        }
    };

    // --- CARGAR DATOS AL ABRIR ---
    useEffect(() => {
        if (user) {
            // 1. Aplicamos la lógica de separación
            const { nombre, apellido } = splitName(user.name);

            setFormData({
                nombre: nombre,
                apellido: apellido,
                email: user.email || '',
                cedula: user.cedula || '',
                role: user.role || 'analista', 
                is_active: user.is_active ? 1 : 0
            });
        }
        fetchRoles();
    }, [user]);

    const fetchRoles = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('/api/roles', {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if(response.ok) setRoles(await response.json());
        } catch(e) { console.error("Error cargando roles:", e); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'cedula') {
            const numericValue = value.replace(/[^0-9]/g, '');
            setFormData({ ...formData, [name]: numericValue });
            return;
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        setError('');
        const token = localStorage.getItem('auth_token');

        // --- UNIR NOMBRE Y APELLIDO PARA ENVIAR AL BACKEND ---
        const fullNameCombined = `${formData.nombre} ${formData.apellido}`.trim();

        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: fullNameCombined, 
                    email: formData.email,
                    cedula: formData.cedula,
                    role: formData.role,
                    is_active: parseInt(formData.is_active) 
                })
            });

            const data = await response.json();

            if (response.ok) {
                if (onSuccess) onSuccess(); 
            } else {
                setError(data.message || 'Error al actualizar usuario.');
            }
        } catch (err) {
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
                        <i className="bi bi-pencil-square me-2"></i>Editar Usuario
                    </h5>
                    <button className={styles.btnClose} onClick={onClose} disabled={isSubmitting}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div className={styles.modalBody}>
                    {error && <div className="alert alert-danger p-2 small text-center">{error}</div>}

                    <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
                        
                        {/* --- AHORA SON DOS CAMPOS SEPARADOS --- */}
                        <div className="col-md-6">
                            <label className={styles.label}>Nombres</label>
                            <input 
                                type="text" 
                                name="nombre"
                                className="form-control" 
                                value={formData.nombre} 
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className={styles.label}>Apellidos</label>
                            <input 
                                type="text" 
                                name="apellido"
                                className="form-control" 
                                value={formData.apellido} 
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* CÉDULA */}
                        <div className="col-md-6">
                            <label className={styles.label}>Documento (Solo Números)</label>
                            <input 
                                type="text" 
                                name="cedula"
                                className="form-control" 
                                value={formData.cedula} 
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* CORREO */}
                        <div className="col-md-6">
                            <label className={styles.label}>Correo Electrónico</label>
                            <input 
                                type="email" 
                                name="email"
                                className="form-control" 
                                value={formData.email} 
                                onChange={handleChange}
                                required
                            />
                            {formData.email !== user.email && (
                                <small className="text-warning d-block mt-1" style={{fontSize: '0.75rem'}}>
                                    <i className="bi bi-exclamation-triangle me-1"></i>
                                    Al guardar, el estado cambiará a PENDIENTE.
                                </small>
                            )}
                        </div>

                        <hr className="my-4" />

                        {/* ROL */}
                        <div className="col-md-6">
                            <label className={styles.label}>Rol de Sistema</label>
                            <select 
                                className="form-select" 
                                name="role" 
                                value={formData.role} 
                                onChange={handleChange}
                                disabled={isSuperAdmin} 
                            >
                                {roles.length > 0 ? roles.map(r => (
                                    <option key={r.id} value={r.name}>{r.display_name}</option>
                                )) : (
                                    <option value={formData.role}>{formData.role}</option>
                                )}
                            </select>
                        </div>

                        {/* ESTADO */}
                        <div className="col-md-6">
                            <label className={styles.label}>Estado de Acceso</label>
                            {isSuperAdmin ? (
                                <div className="input-group">
                                    <input type="text" className="form-control" value="Activo (Protegido)" disabled />
                                    <span className="input-group-text"><i className="bi bi-shield-lock-fill"></i></span>
                                </div>
                            ) : (
                                <select 
                                    className="form-select" 
                                    name="is_active" 
                                    value={formData.is_active} 
                                    onChange={handleChange}
                                >
                                    <option value={1}>Habilitado (Activo)</option>
                                    <option value={0} className="text-danger fw-bold">Bloqueado (Inactivo)</option>
                                </select>
                            )}
                        </div>
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>Cancelar</button>
                    <button className={styles.btnSave} onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal;