// resources/js/components/Common/CustomAlert/CustomAlert.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './CustomAlert.module.css';

const CustomAlert = ({ isOpen, type = 'success', title, message, onClose, onConfirm }) => {
    if (!isOpen) return null;

    const isSuccess = type === 'success';
    const isDelete  = type === 'delete';
    const isLoading = type === 'loading';
    const isInfo    = type === 'info';
    const isError   = type === 'error' || type === 'warning';

    // Ícono según tipo
    const iconClass = isSuccess ? styles.iconSuccess : isLoading ? styles.iconLoading : styles.iconDanger;
    const iconBts   = isSuccess
        ? "bi bi-check-lg"
        : isLoading
            ? "bi bi-arrow-repeat"
            : "bi bi-exclamation-lg";

    return ReactDOM.createPortal(
        <div className={styles.overlay}>
            <div className={styles.alertBox}>
                <div className={`${styles.iconWrapper} ${iconClass}`}>
                    {isLoading
                        ? <span className="spinner-border" style={{width: '1.8rem', height: '1.8rem'}}></span>
                        : <i className={iconBts}></i>
                    }
                </div>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>

                <div className={styles.actions}>
                    {/* LOADING: solo botón cancelar */}
                    {isLoading && (
                        <button className={styles.btnCancel} onClick={onConfirm || onClose}>
                            Cancelar
                        </button>
                    )}

                    {/* SUCCESS: solo botón entendido */}
                    {isSuccess && (
                        <button className={styles.btnSuccess} onClick={onClose}>
                            ¡Entendido!
                        </button>
                    )}

                    {/* ERROR / WARNING: solo botón cerrar */}
                    {isError && (
                        <button className={styles.btnSuccess} onClick={onClose}>
                            Cerrar
                        </button>
                    )}

                    {/* INFO / DELETE: cancelar + confirmar */}
                    {(isInfo || isDelete) && (
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
