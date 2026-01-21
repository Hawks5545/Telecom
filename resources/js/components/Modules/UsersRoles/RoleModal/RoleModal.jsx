// resources/js/components/Modules/UsersRoles/RoleModal.jsx
import React from 'react';
import styles from './RoleModal.module.css';

const RoleModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>Crear Rol</h5>
                    <button className={styles.btnClose} onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <form className="row g-3">
                        <div className="col-12">
                            <label className={styles.label}>Nombre del Rol</label>
                            <input type="text" className="form-control" placeholder="Ej: Supervisor de Calidad" />
                        </div>
                        <div className="col-12">
                            <label className={styles.label}>Descripción</label>
                            <textarea className="form-control" rows="2" placeholder="Breve descripción..."></textarea>
                        </div>
                        
                        <div className="col-12">
                            <label className={styles.label}>Permisos Asignados</label>
                            <div className={styles.permissionsGrid}>
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="p1" />
                                    <label className="form-check-label small" htmlFor="p1">Buscar Grabaciones</label>
                                </div>
                                {/* OPCIÓN 'REPRODUCIR AUDIO' ELIMINADA */}
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="p3" />
                                    <label className="form-check-label small" htmlFor="p3">Descargar ZIP</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="p4" />
                                    <label className="form-check-label small" htmlFor="p4">Ver Reportes</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="p5" />
                                    <label className="form-check-label small" htmlFor="p5">Auditoría</label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="p6" />
                                    <label className="form-check-label small" htmlFor="p6">Gestión de Usuarios</label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnSave} onClick={() => { alert('Rol Guardado'); onClose(); }}>Guardar Rol</button>
                </div>
            </div>
        </div>
    );
};

export default RoleModal;