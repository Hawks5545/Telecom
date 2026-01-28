import React, { useState } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom'; 
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
    const { token } = useParams(); 
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const email = searchParams.get('email');

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setMessage('');

        // --- VALIDACIONES DE SEGURIDAD ---
        if (password !== passwordConfirmation) {
            setError('Las contraseñas no coinciden.');
            setIsSubmitting(false);
            return;
        }

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            setIsSubmitting(false);
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError('La contraseña debe incluir al menos una letra mayúscula.');
            setIsSubmitting(false);
            return;
        }

        if (!/[0-9]/.test(password)) {
            setError('La contraseña debe incluir al menos un número.');
            setIsSubmitting(false);
            return;
        }

        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            setError('La contraseña debe incluir al menos un signo o símbolo especial.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/password/reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    token, 
                    email,
                    password,
                    password_confirmation: passwordConfirmation
                })
            });

            const data = await response.json();

            if (response.ok) {
                // --- ACTUALIZACIÓN DE SEGURIDAD CRÍTICA ---
                // 1. Limpiar rastro de sesiones previas (especialmente de Administrador)
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_role');
                
                setMessage(data.message || '¡Contraseña restablecida con éxito! Redirigiendo al inicio de sesión...');
                
                // 2. Redirección forzada al Login (reemplazando el historial)
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 3000);
            } else {
                setError(data.message || 'Error al restablecer la contraseña. El enlace podría haber expirado.');
            }
        } catch (err) {
            setError('Error de conexión con el servidor.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className="text-center mb-2">
                    <i className="bi bi-shield-lock-fill" style={{ fontSize: '3rem', color: '#14b8a6' }}></i>
                </div>
                <h2 className={styles.title}>Nueva Contraseña</h2>
                <p className={styles.subtitle}>Introduce tu nueva contraseña segura para {email}.</p>

                {message && (
                    <div className={`${styles.alert} ${styles.alertSuccess}`}> {message} </div>
                )}
                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}> {error} </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Correo Electrónico</label>
                        <input 
                            type="email" 
                            className={styles.input} 
                            value={email || ''} 
                            disabled 
                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Nueva Contraseña</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Mínimo 8 caracteres"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Confirmar Contraseña</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                            placeholder="Repite la contraseña"
                            disabled={isSubmitting}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.btnSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Guardando...' : 'Restablecer Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;