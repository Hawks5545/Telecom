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

    // --- LÓGICA DE VALIDACIÓN EN TIEMPO REAL ---
    const validations = {
        length: password.length >= 12,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const isPasswordValid = Object.values(validations).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setMessage('');

        if (password !== passwordConfirmation) {
            setError('Las contraseñas no coinciden.');
            setIsSubmitting(false);
            return;
        }

        if (!isPasswordValid) {
            setError('La contraseña aún no cumple con todos los requisitos de seguridad.');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/password/reset', {
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
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_role');
                setMessage(data.message || '¡Contraseña restablecida con éxito! Redirigiendo al inicio de sesión...');
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
                    <i className="bi bi-shield-check" style={{ fontSize: '3rem', color: '#14b8a6' }}></i>
                </div>
                <h2 className={styles.title}>Nueva Contraseña</h2>
                <p className={styles.subtitle}>Crea una contraseña segura para tu cuenta.</p>

                {message && (
                    <div className={`${styles.alert} ${styles.alertSuccess} text-center p-2 mb-3`}> 
                        <i className="bi bi-check-circle me-2"></i>{message} 
                    </div>
                )}
                {error && (
                    <div className={`${styles.alert} ${styles.alertError} text-center p-2 mb-3`}> 
                        <i className="bi bi-exclamation-triangle me-2"></i>{error} 
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Correo Electrónico</label>
                        <input 
                            type="email" 
                            className={styles.input} 
                            value={email || ''} 
                            disabled 
                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
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
                            placeholder="Mínimo 12 caracteres"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* --- CHECKLIST VISUAL MEJORADO --- */}
                    <div style={{ fontSize: '0.85rem', marginBottom: '1.5rem', padding: '12px 15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#495057' }}>Tu contraseña debe contener:</p>
                        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
                            <li style={{ color: validations.length ? '#198754' : '#6c757d', display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <i className={`bi ${validations.length ? 'bi-check-circle-fill' : 'bi-circle'} me-2`} style={{ fontSize: '1rem' }}></i> 
                                Mínimo 12 caracteres
                            </li>
                            <li style={{ color: validations.upper ? '#198754' : '#6c757d', display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <i className={`bi ${validations.upper ? 'bi-check-circle-fill' : 'bi-circle'} me-2`} style={{ fontSize: '1rem' }}></i> 
                                Una letra mayúscula
                            </li>
                            <li style={{ color: validations.lower ? '#198754' : '#6c757d', display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <i className={`bi ${validations.lower ? 'bi-check-circle-fill' : 'bi-circle'} me-2`} style={{ fontSize: '1rem' }}></i> 
                                Una letra minúscula
                            </li>
                            <li style={{ color: validations.number ? '#198754' : '#6c757d', display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <i className={`bi ${validations.number ? 'bi-check-circle-fill' : 'bi-circle'} me-2`} style={{ fontSize: '1rem' }}></i> 
                                Un número
                            </li>
                            <li style={{ color: validations.special ? '#198754' : '#6c757d', display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <i className={`bi ${validations.special ? 'bi-check-circle-fill' : 'bi-circle'} me-2`} style={{ fontSize: '1rem' }}></i> 
                                Un símbolo especial (ej. @, #, $, *)
                            </li>
                        </ul>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Confirmar Contraseña</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={passwordConfirmation}
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            required
                            placeholder="Repite la nueva contraseña"
                            disabled={isSubmitting}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.btnSubmit}
                        disabled={isSubmitting || !isPasswordValid || password !== passwordConfirmation}
                        style={{ opacity: (!isPasswordValid || password !== passwordConfirmation) ? 0.6 : 1 }}
                    >
                        {isSubmitting ? 'Guardando...' : 'Restablecer Contraseña'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;