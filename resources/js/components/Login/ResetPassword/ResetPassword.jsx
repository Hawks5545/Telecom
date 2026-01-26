import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styles from './ResetPassword.module.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Capturamos los datos de la URL
    const token = searchParams.get('token');
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
        
        // 1. Coincidencia
        if (password !== passwordConfirmation) {
            setError('Las contraseñas no coinciden.');
            setIsSubmitting(false);
            return;
        }

        // 2. Longitud
        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            setIsSubmitting(false);
            return;
        }

        // 3. Mayúscula (Regex: Al menos una letra de la A a la Z)
        if (!/[A-Z]/.test(password)) {
            setError('La contraseña debe incluir al menos una letra mayúscula.');
            setIsSubmitting(false);
            return;
        }

        // 4. Número (Regex: Al menos un dígito del 0 al 9)
        if (!/[0-9]/.test(password)) {
            setError('La contraseña debe incluir al menos un número.');
            setIsSubmitting(false);
            return;
        }

        // 5. Símbolo (Regex: Caracteres especiales)
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            setError('La contraseña debe incluir al menos un signo o símbolo special (Ej: @, #, $).');
            setIsSubmitting(false);
            return;
        }

        // --- SI PASA TODO, ENVIAMOS AL BACKEND ---

        try {
            const response = await fetch('http://127.0.0.1:8000/api/reset-password', {
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
                setMessage(data.message);
                // Esperamos un poco y redirigimos
                setTimeout(() => navigate('/'), 3000);
            } else {
                // Si Laravel devuelve error (ej: el token venció), lo mostramos
                setError(data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Error al restablecer.'));
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
                <p className={styles.subtitle}>Introduce tu nueva contraseña segura.</p>

                {message && (
                    <div className={`${styles.alert} ${styles.alertSuccess}`}> {message} </div>
                )}
                {error && (
                    <div className={`${styles.alert} ${styles.alertError}`}> {error} </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Campo Oculto para Email (Visualmente) */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Correo Electrónico</label>
                        <input 
                            type="email" 
                            className={styles.input} 
                            value={email || ''} 
                            disabled 
                            style={{ backgroundColor: '#e5e7eb', cursor: 'not-allowed' }}
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