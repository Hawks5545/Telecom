import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './ForgotPassword.module.css';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    // ESTADO: Cambiamos de 'email' a 'loginId'
    const [loginId, setLoginId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); 
    const [error, setError] = useState(null);    

    if (!isOpen) return null;

    const handleClose = () => {
        setLoginId('');
        setMessage(null);
        setError(null);
        setIsLoading(false);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            // 1. Petición al Backend (ahora enviamos 'login_id')
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ login_id: loginId }) // Clave unificada para el backend
            });

            const data = await response.json();

            // 2. Manejo de respuesta (Seguridad Anti-Enumeración)
            if (response.ok) {
                // Éxito: Mostramos el mensaje genérico y seguro que manda Laravel
                setMessage(data.message || 'Si los datos coinciden, hemos enviado un enlace a tu correo.');
                setLoginId(''); 
            } else {
                // Errores de servidor o de validación (ej. rate limit)
                setError(data.message || 'Ocurrió un error procesando la solicitud.');
            }

        } catch (err) {
            console.error(err);
            setError('Error de conexión. Intenta más tarde.');
        } finally {
            setIsLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                
                <header className={styles.modalHeader}>
                    <div className={styles.iconContainer}>
                        <i className={`bi ${message ? 'bi-shield-check text-success' : 'bi-envelope-exclamation'}`}></i>
                    </div>
                    <h3 className={styles.title}>Recuperar Contraseña</h3>
                    <p className={styles.description}>
                        Ingresa tu <strong>correo electrónico</strong> o tu <strong>número de cédula</strong>. Si los datos coinciden con un usuario activo, enviaremos las instrucciones de acceso al correo registrado.
                    </p>
                </header>

                {/* Zona de Mensajes (Feedback) */}
                {message && (
                    <div className="alert alert-success text-center p-2 mb-3" style={{ fontSize: '0.9rem' }}>
                        <i className="bi bi-check-circle me-2"></i>{message}
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger text-center p-2 mb-3" style={{ fontSize: '0.9rem' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>{error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <input
                            type="text" 
                            id="recoveryInput"
                            className={styles.floatingInput}
                            placeholder=" "
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            required
                            autoFocus
                            disabled={isLoading}
                        />
                        <label htmlFor="recoveryInput" className={styles.floatingLabel}>
                            Correo electrónico o Cédula
                        </label>
                    </div>

                    <footer className={styles.footer}>
                        <button 
                            type="button" 
                            className={styles.btnCancel}
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            {message ? 'Cerrar' : 'Cancelar'}
                        </button>
                        
                        {!message && (
                            <button 
                                type="submit" 
                                className={styles.btnSend}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Procesando...' : (
                                    <>Enviar Enlace <i className="bi bi-send-fill ms-2"></i></>
                                )}
                            </button>
                        )}
                    </footer>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ForgotPasswordModal;