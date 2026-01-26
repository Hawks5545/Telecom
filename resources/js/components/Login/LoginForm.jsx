import React, { useState } from 'react';
import styles from './Login.module.css';
import ForgotPasswordModal from './ForgotPassword/ForgotPasswordModal';

const LoginForm = ({ onBack, onLogin }) => {
    // Estados para los inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Estados para la interfaz
    const [showPassword, setShowPassword] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState(null); // Para mostrar errores rojos
    const [isLoading, setIsLoading] = useState(false); // Para deshabilitar botón mientras carga

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // 1. Petición al Backend Laravel
            const response = await fetch('http://127.0.0.1:8000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            // 2. Verificar si el login fue exitoso
            if (response.ok) {
                // Guardamos el token en el navegador
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                
                // Avisamos al componente padre que entramos
                onLogin(); 
            } else {
                // Si falló (ej: clave errónea), mostramos el mensaje del backend
                setError(data.message || 'Credenciales incorrectas');
            }

        } catch (error) {
            console.error("Error de conexión:", error);
            setError('No se pudo conectar con el servidor (Backend caído)');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.formContainer}>
            
            <ForgotPasswordModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />

            {/* Navegación Superior */}
            <button className={styles.backButton} onClick={onBack}>
                <i className="bi bi-arrow-left"></i> Regresar
            </button>

            <h3 className={styles.loginTitle}>Bienvenido</h3>

            {/* Mensaje de Error (Si existe) */}
            {error && (
                <div style={{ color: 'red', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Campo: Correo Electrónico */}
                <div className={styles.inputGroup}>
                    <input
                        type="email"
                        id="emailInput"
                        className={styles.floatingInput}
                        placeholder=" " 
                        required
                        value={email} // Conectado al estado
                        onChange={(e) => setEmail(e.target.value)} // Actualiza el estado
                    />
                    <label htmlFor="emailInput" className={styles.floatingLabel}>
                        Correo electrónico
                    </label>
                </div>

                {/* Campo: Contraseña con Toggle */}
                <div className={styles.inputGroup}>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="passwordInput"
                        className={styles.floatingInput}
                        placeholder=" " 
                        required
                        value={password} // Conectado al estado
                        onChange={(e) => setPassword(e.target.value)} // Actualiza el estado
                    />
                    <label htmlFor="passwordInput" className={styles.floatingLabel}>
                        Contraseña
                    </label>

                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                    >
                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                </div>

                {/* Recuperación de Cuenta */}
                <div className="text-end mb-4">
                    <button
                        type="button"
                        className={styles.forgotLink}
                        onClick={() => setIsModalOpen(true)}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                {/* Acción Principal */}
                <div className={styles.submitWrapper}>
                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={isLoading} // Evita doble clic
                    >
                        {isLoading ? 'Cargando...' : (
                            <>Entrar <i className="bi bi-box-arrow-in-right ms-2"></i></>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;