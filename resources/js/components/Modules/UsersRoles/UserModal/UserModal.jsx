import React from 'react';
import styles from './UserModal.module.css';

const UserModal = ({ isOpen, onClose, isEditing = false }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    {/* Título dinámico por si más adelante implementas la edición */}
                    <h5 className={styles.modalTitle}>
                        {isEditing ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                    </h5>
                    <button className={styles.btnClose} onClick={onClose}>
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <form className="row g-3">
                        <div className="col-md-6">
                            <label className={styles.label}>Nombres</label>
                            <input type="text" className="form-control" placeholder="Ej: Carlos" />
                        </div>
                        <div className="col-md-6">
                            <label className={styles.label}>Apellidos</label>
                            <input type="text" className="form-control" placeholder="Ej: Perez" />
                        </div>
                        
                        <div className="col-md-6">
                            <label className={styles.label}>Tipo Documento</label>
                            <select className="form-select">
                                <option>Cédula de Ciudadanía (C.C)</option>
                                <option>Cédula de Extranjería (C.E)</option>
                                <option>Tarjeta de Identidad (T.I)</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className={styles.label}>Número Documento</label>
                            <input type="number" className="form-control" placeholder="Ej: 1098..." />
                        </div>

                        <div className="col-md-12">
                            <label className={styles.label}>Correo Electrónico</label>
                            <input type="email" className="form-control" placeholder="nombre@empresa.com" />
                        </div>

                        {/* AHORA OCUPA TODO EL ANCHO (col-md-12) AL NO TENER EL ESTADO AL LADO */}
                        <div className="col-md-12">
                            <label className={styles.label}>Rol Asignado</label>
                            <select className="form-select">
                                <option value="Admin">Administrador</option>
                                <option value="Senior">Senior/Junior</option>
                                <option value="Analista">Analista</option>
                            </select>
                        </div>

                        {/* ELIMINADO: Campo Estado.
                           Nota: Si en el futuro implementas la edición, aquí podrías poner una condición:
                           {isEditing && ( ... input select de estado ... )}
                        */}

                    </form>
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={onClose}>Cancelar</button>
                    <button className={styles.btnSave} onClick={() => { alert('Guardado/Correo enviado'); onClose(); }}>
                        {isEditing ? 'Guardar Cambios' : 'Registrar Usuario'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserModal;