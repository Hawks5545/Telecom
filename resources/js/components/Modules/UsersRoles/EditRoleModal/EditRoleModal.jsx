import React, { useEffect, useState } from 'react';
import styles from './EditRoleModal.module.css'; // Asegúrate de crear este CSS o usar el anterior

const EditRoleModal = ({ isOpen, onClose, role }) => {
    if (!isOpen || !role) return null;

    const isProtectedAdmin = role.nombre === 'Administrador';

    const [roleData, setRoleData] = useState({ desc: '', permisos: [] });

    useEffect(() => {
        if (role) {
            setRoleData({ desc: role.desc, permisos: role.permisos });
        }
    }, [role]);

    const handleSave = () => {
        alert("Permisos del rol actualizados.");
        onClose();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h5 className={styles.modalTitle}>
                        <i className="bi bi-shield-check me-2"></i>Editar Rol
                    </h5>
                    <button className={styles.btnClose} onClick={onClose}><i className="bi bi-x-lg"></i></button>
                </div>

                <div className={styles.modalBody}>
                    <form className="row g-3">
                        <div className="col-12">
                            <label className={styles.label}>Nombre del Rol</label>
                            {/* NOMBRE SIEMPRE BLOQUEADO EN EDICIÓN */}
                            <input type="text" className={`form-control ${styles.readOnlyInput}`} value={role.nombre} disabled />
                        </div>
                        
                        <div className="col-12">
                            <label className={styles.label}>Descripción</label>
                            <textarea className="form-control" rows="2" 
                                defaultValue={roleData.desc} 
                                disabled={isProtectedAdmin} // Bloqueado si es admin
                            ></textarea>
                        </div>
                        
                        <div className="col-12">
                            <label className={styles.label}>Permisos Asignados</label>
                            
                            {isProtectedAdmin ? (
                                <div className={styles.adminLocked}>
                                    <i className="bi bi-info-circle-fill fs-4"></i>
                                    <div>
                                        <strong>Rol Protegido.</strong><br/>
                                        El rol de Administrador tiene acceso total por defecto y no puede ser modificado.
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.permissionsGrid}>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="ep1" defaultChecked={roleData.permisos.includes('Buscar Grabaciones')} />
                                        <label className="form-check-label small" htmlFor="ep1">Buscar Grabaciones</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="ep3" defaultChecked={roleData.permisos.includes('Descargar ZIP')} />
                                        <label className="form-check-label small" htmlFor="ep3">Descargar ZIP</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="ep4" defaultChecked={roleData.permisos.includes('Ver Reportes')} />
                                        <label className="form-check-label small" htmlFor="ep4">Ver Reportes</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="ep5" defaultChecked={roleData.permisos.includes('Auditoría')} />
                                        <label className="form-check-label small" htmlFor="ep5">Auditoría</label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" id="ep6" defaultChecked={roleData.permisos.includes('Gestión de Usuarios')} />
                                        <label className="form-check-label small" htmlFor="ep6">Gestión de Usuarios</label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                    {!isProtectedAdmin && (
                        <button className={styles.btnSave} onClick={handleSave}>Guardar Cambios</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditRoleModal;