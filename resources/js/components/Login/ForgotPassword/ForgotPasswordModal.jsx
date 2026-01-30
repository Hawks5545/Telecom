import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './ForgotPassword.module.css';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    
    // Estados nuevos para manejar la respuesta del servidor
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); 
    const [error, setError] = useState(null);    

    if (!isOpen) return null;

    // Función para limpiar estados al cerrar
    const handleClose = () => {
        setEmail('');
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
            // 1. Petición al Backend
            const response = await fetch('http://127.0.0.1:8000/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            // 2. Manejo de respuesta
            if (response.ok) {
                // Éxito: El correo existe y se envió el link
                setMessage(data.message || '¡Enlace enviado! Revisa tu correo.');
                setEmail(''); // Limpiamos el campo para que no envíen doble
            } else {
                // Error: El correo no existe o falló el servidor
                setError(data.message || 'No pudimos encontrar ese correo.');
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
                        <i className={`bi ${message ? 'bi-check-circle-fill text-success' : 'bi-envelope-exclamation'}`}></i>
                    </div>
                    <h3 className={styles.title}>Recuperar Contraseña</h3>
                    <p className={styles.description}>
                        Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu acceso.
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
                            type="email"
                            id="recoveryEmail"
                            className={styles.floatingInput}
                            placeholder=" "
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                            disabled={isLoading} // Bloqueamos si está cargando
                        />
                        <label htmlFor="recoveryEmail" className={styles.floatingLabel}>
                            Correo electrónico
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
                        
                        {/* Ocultamos el botón de enviar si ya fue exitoso para que no reenvíen */}
                        {!message && (
                            <button 
                                type="submit" 
                                className={styles.btnSend}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Enviando...' : (
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