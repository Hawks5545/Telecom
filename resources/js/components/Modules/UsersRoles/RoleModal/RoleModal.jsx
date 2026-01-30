import React, { useState } from 'react';
import styles from './RoleModal.module.css';

const RoleModal = ({ isOpen, onClose, onSuccess }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        display_name: '',
        description: ''
    });

    // Estado para los permisos basados en los módulos del sistema
    const [selectedPerms, setSelectedPerms] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Lista de permisos que coinciden con los módulos de Telecom
    const availablePermissions = [
        "Dashboard",
        "Búsqueda de Grabaciones",
        "Gestor de Carpetas",
        "Indexación",
        "Auditorías",
        "Reportes"
    ];

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

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const token = localStorage.getItem('auth_token');

        const payload = {
            ...formData,
            permisos: selectedPerms 
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/api/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                setFormData({ display_name: '', description: '' });
                setSelectedPerms([]);
                onSuccess(); 
            } else {
                setError(data.message || 'Error al crear el rol');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>Crear Nuevo Rol</h5>
                    <button className={styles.btnClose} onClick={onClose} disabled={isSubmitting}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div className={styles.modalBody}>
                    {error && (
                        <div className="alert alert-danger p-2 small text-center">{error}</div>
                    )}

                    <form className="row g-3" onSubmit={handleSave}>
                        <div className="col-12">
                            <label className={styles.label}>Nombre del Rol</label>
                            <input 
                                type="text" 
                                name="display_name"
                                className="form-control" 
                                placeholder="Ej: Operador Nocturno" 
                                value={formData.display_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="col-12">
                            <label className={styles.label}>Descripción</label>
                            <textarea 
                                name="description"
                                className="form-control" 
                                rows="2" 
                                placeholder="Indique el propósito de este rol..."
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                        
                        <div className="col-12">
                            <label className={styles.label}>Permisos de Módulos (Acceso)</label>
                            <div className={styles.permissionsGrid} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {availablePermissions.map((perm, index) => (
                                    <div className="form-check" key={index}>
                                        <input 
                                            className="form-check-input" 
                                            type="checkbox" 
                                            id={`perm-${index}`}
                                            checked={selectedPerms.includes(perm)}
                                            onChange={() => handleCheckChange(perm)}
                                        />
                                        <label className="form-check-label small" htmlFor={`perm-${index}`}>
                                            {perm}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button className={styles.btnSave} onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? 'Guardando...' : 'Guardar Rol'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleModal;