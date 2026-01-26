// resources/js/components/Common/CustomAlert/CustomAlert.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './CustomAlert.module.css';

const CustomAlert = ({ isOpen, type = 'success', title, message, onClose, onConfirm }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const isDelete = type === 'delete';

    // Determinar icono y clase de contenedor
    const iconClass = isSuccess ? styles.iconSuccess : styles.iconDanger;
    const iconBts = isSuccess ? "bi bi-check-lg" : "bi bi-exclamation-lg";

    return ReactDOM.createPortal(
        <div className={styles.overlay}>
            <div className={styles.alertBox}>
                
                <div className={`${styles.iconWrapper} ${iconClass}`}>
                    <i className={iconBts}></i>
                </div>

                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>

                <div className={styles.actions}>
                    {isSuccess ? (
                        <button className={styles.btnSuccess} onClick={onClose}>
                            ¡Entendido!
                        </button>
                    ) : (
                        <>
                            <button className={styles.btnCancel} onClick={onClose}>
                                Cancelar
                            </button>
                            <button 
                                className={styles.btnConfirm} 
                                onClick={() => { onConfirm?.(); onClose(); }}
                            >
                                {isDelete ? 'Sí, eliminar' : 'Confirmar'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CustomAlert;