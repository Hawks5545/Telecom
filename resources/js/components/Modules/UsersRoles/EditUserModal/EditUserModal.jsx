import React, { useEffect, useState } from 'react';
import styles from './EditUserModal.module.css';

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
    
    if (!isOpen || !user) return null;
    
    // Protegemos al Super Admin (ID 1)
    const isSuperAdmin = user.id === 1;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        cedula: '',
        role: '',
        is_active: 1
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [roles, setRoles] = useState([]); // Roles dinámicos
    const [error, setError] = useState('');

    // CARGAR DATOS INICIALES (Pre-llenado)
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                cedula: user.cedula || '',
                role: user.role || 'analista', // Texto (ej: 'analista')
                is_active: user.is_active ? 1 : 0
            });
        }
        fetchRoles();
    }, [user]);

    // Obtener roles desde la API
    const fetchRoles = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/roles', {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if(response.ok) setRoles(await response.json());
        } catch(e) { console.error("Error cargando roles:", e); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // VALIDACIÓN: Cédula solo números
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

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/users/${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
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
                        {/* NOMBRE (Editable) */}
                        <div className="col-md-12">
                            <label className={styles.label}>Nombre Completo</label>
                            <input 
                                type="text" 
                                name="name"
                                className="form-control" 
                                value={formData.name} 
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* CÉDULA (Editable + Validación Numérica) */}
                        <div className="col-md-6">
                            <label className={styles.label}>Documento (Solo Números)</label>
                            <input 
                                type="text" 
                                name="cedula"
                                className="form-control" 
                                value={formData.cedula} 
                                onChange={handleChange}
                                placeholder="Ej: 1000123456"
                                required
                            />
                        </div>

                        {/* CORREO (Editable + Aviso de seguridad) */}
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
                                    Al guardar, el estado cambiará a PENDIENTE hasta verificar el nuevo correo.
                                </small>
                            )}
                        </div>

                        <hr className="my-4" />

                        {/* ROL (Select Dinámico) */}
                        <div className="col-md-6">
                            <label className={styles.label}>Rol de Sistema</label>
                            <select 
                                className="form-select" 
                                name="role" 
                                value={formData.role} 
                                onChange={handleChange}
                                disabled={isSuperAdmin} // Protege al Admin Principal
                            >
                                {roles.length > 0 ? roles.map(r => (
                                    <option key={r.id} value={r.name}>{r.display_name}</option>
                                )) : (
                                    <option value={formData.role}>{formData.role}</option>
                                )}
                            </select>
                        </div>

                        {/* ESTADO (Activo/Inactivo) */}
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
                            <small className="text-muted" style={{fontSize: '0.7rem'}}>
                                * Si el usuario está "Pendiente", este campo solo controla el bloqueo manual.
                            </small>
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