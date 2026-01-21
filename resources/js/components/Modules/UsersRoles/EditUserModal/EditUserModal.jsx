import React, { useEffect, useState } from 'react';
import styles from './EditUserModal.module.css';

const EditUserModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    // REGLA: Si el usuario actual es Administrador, NO se puede cambiar su estado.
    const isTargetAdmin = user.rol === 'Administrador';

    const [formData, setFormData] = useState({
        rol: '',
        estado: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                rol: user.rol,
                estado: user.estado
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        // Simulación Backend
        console.log("Actualizando usuario:", user.id, formData);
        alert("Usuario actualizado exitosamente.");
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>
                        <i className="bi bi-pencil-square me-2"></i>Editar Usuario
                    </h5>
                    <button className={styles.btnClose} onClick={onClose}><i className="bi bi-x-lg"></i></button>
                </div>
                
                <div className={styles.modalBody}>
                    <form className="row g-3">
                        {/* --- CAMPOS DE SOLO LECTURA --- */}
                        <div className="col-md-6">
                            <label className={styles.label}>Nombres</label>
                            <input type="text" className={`form-control ${styles.readOnlyInput}`} value={user.nombre} disabled />
                        </div>
                        <div className="col-md-6">
                            <label className={styles.label}>Apellidos</label>
                            <input type="text" className={`form-control ${styles.readOnlyInput}`} value={user.apellido} disabled />
                        </div>
                        <div className="col-md-6">
                            <label className={styles.label}>Documento</label>
                            <input type="text" className={`form-control ${styles.readOnlyInput}`} value={`${user.docTipo} ${user.docNum}`} disabled />
                        </div>
                        <div className="col-md-6">
                            <label className={styles.label}>Correo (Requiere re-validación)</label>
                            <input type="email" className={`form-control ${styles.readOnlyInput}`} value={user.correo} disabled />
                        </div>

                        <hr className="my-4" />

                        {/* --- CAMPOS EDITABLES --- */}
                        <div className="col-md-6">
                            <label className={styles.label}>Rol de Sistema</label>
                            <select className="form-select" name="rol" value={formData.rol} onChange={handleChange}>
                                <option value="Administrador">Administrador</option>
                                <option value="Senior/Junior">Senior/Junior</option>
                                <option value="Analista">Analista</option>
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className={styles.label}>Estado de Cuenta</label>
                            {isTargetAdmin ? (
                                <div className="input-group">
                                    <input type="text" className="form-control" value="Activo (Bloqueado por seguridad)" disabled />
                                    <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                                </div>
                            ) : (
                                <select className="form-select" name="estado" value={formData.estado} onChange={handleChange}>
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            )}
                        </div>
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnSave} onClick={handleSave}>Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal;