// resources/js/components/Login/LoginForm.jsx
import React, { useState } from 'react'; // Importamos useState
import styles from './Login.module.css';

const LoginForm = ({ onBack, onLogin }) => {
    // Estado para controlar la visibilidad de la contraseña
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin();
    };

    return (
        <div className="d-flex flex-column h-100 justify-content-center py-4">
            
            <button
                className={`btn ${styles.backButton}`}
                onClick={onBack}
            >
                <i className="bi bi-arrow-left"></i>
                Regresar
            </button>

            <h3 className={styles.loginTitle}>
                Bienvenido de nuevo
            </h3>

            <form onSubmit={handleSubmit}>
                {/* GRUPO 1: Correo */}
                <div className={styles.inputGroup}>
                    <input
                        type="email"
                        id="emailInput"
                        className={`form-control ${styles.floatingInput}`}
                        placeholder=" " 
                        required
                    />
                    <label htmlFor="emailInput" className={styles.floatingLabel}>
                        Correo electrónico
                    </label>
                </div>

                {/* GRUPO 2: Contraseña con Toggle */}
                <div className={styles.inputGroup}>
                    <input
                        // Cambiamos el tipo dinámicamente
                        type={showPassword ? "text" : "password"}
                        id="passwordInput"
                        className={`form-control ${styles.floatingInput}`}
                        placeholder=" " 
                        required
                    />
                    
                    {/* La etiqueta (Label) */}
                    <label htmlFor="passwordInput" className={styles.floatingLabel}>
                        Contraseña
                    </label>

                    {/* Botón del Ojo */}
                    <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1" // Para que no se seleccione al tabular
                    >
                        {showPassword ? (
                            <i className="bi bi-eye-slash"></i>
                        ) : (
                            <i className="bi bi-eye"></i>
                        )}
                    </button>
                </div>

                <div className="text-end mb-4">
                    <button
                        type="button"
                        className={`btn btn-link p-0 ${styles.forgotLink}`}>
                        ¿Olvidaste tu contraseña?
                    </button>
                </div>

                <div className={styles.submitWrapper}>
                    <button
                        type="submit"
                        className={`btn ${styles.submitButton}`}>
                        Entrar <i className="bi bi-box-arrow-in-right ms-2"></i>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;