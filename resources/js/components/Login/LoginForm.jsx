import React, { useState } from 'react';
import styles from './Login.module.css';
import ForgotPasswordModal from './ForgotPassword/ForgotPasswordModal';
import ChangePasswordModal from './ChangePasswordModal';

const LoginForm = ({ onBack, onLogin }) => {
    const [loginId, setLoginId]           = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [error, setError]               = useState(null);
    const [isLoading, setIsLoading]       = useState(false);

    // ← NUEVO: controlar modal de cambio de contraseña
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [authToken, setAuthToken]                   = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            localStorage.clear();

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept':       'application/json'
                },
                body: JSON.stringify({ login_id: loginId, password })
            });

            const data = await response.json();

            if (response.ok) {
                // ← NUEVO: verificar si debe cambiar contraseña
                if (data.must_change_password) {
                    // Guardar token temporalmente para el cambio de contraseña
                    setAuthToken(data.token);
                    localStorage.setItem('auth_token', data.token);
                    if (data.user) {
                        localStorage.setItem('user_data', JSON.stringify(data.user));
                    }
                    setShowChangePassword(true);
                } else {
                    localStorage.setItem('auth_token', data.token);
                    if (data.user) {
                        localStorage.setItem('user_data', JSON.stringify(data.user));
                    }
                    if (onLogin) onLogin();
                }
            } else {
                setError(data.message || 'Credenciales incorrectas');
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            setError('No se pudo conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChanged = () => {
        setShowChangePassword(false);
        if (onLogin) onLogin();
    };

    return (
        <div className={styles.formContainer}>

            <ForgotPasswordModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* ← NUEVO: Modal de cambio de contraseña obligatorio */}
            <ChangePasswordModal
                isOpen={showChangePassword}
                token={authToken}
                onSuccess={handlePasswordChanged}
            />

            <button className={styles.backButton} onClick={onBack}>
                <i className="bi bi-arrow-left me-2"></i> Regresar
            </button>

            <h3 className={styles.loginTitle}>Bienvenido</h3>

            {error && (
                <div className="alert alert-danger text-center p-2 mb-3" style={{fontSize: '0.9rem'}}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        id="loginInput"
                        className={styles.floatingInput}
                        placeholder=" "
                        required
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        disabled={isLoading}
                    />
                    <label htmlFor="loginInput" className={styles.floatingLabel}>
                        Correo electrónico o Cédula
                    </label>
                </div>

                <div className={styles.inputGroup}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="passwordInput"
                        className={styles.floatingInput}
                        placeholder=" "
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                    <label htmlFor="passwordInput" className={styles.floatingLabel}>
                        Contraseña
                    </label>
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                        disabled={isLoading}
                    >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                </div>

                <div className="text-end mb-4">
                    <button
                        type="button"
                        className={styles.forgotLink}
                        onClick={() => setIsModalOpen(true)}
                        disabled={isLoading}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <div className={styles.submitWrapper}>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span><span className="spinner-border spinner-border-sm me-2"></span>Cargando...</span>
                        ) : (
                            <span>Entrar <i className="bi bi-box-arrow-in-right ms-2"></i></span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;
