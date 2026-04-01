// resources/js/components/Login/WelcomePanel.jsx
import React from 'react';
import styles from './Login.module.css';

const WelcomePanel = ({ onStart }) => {
    return (
        <div className="d-flex flex-column justify-content-center h-100">
            
            {/* Contenedor del Logo con Sombra */}
            <div className={styles.welcomeIcon}>
                <img 
                    src="/images/logo/LogoTelecom.png"
                    alt="Logo Telecom"
                    className={styles.logoImage}
                />
            </div>

            <h2 className={styles.welcomeTitle}>TeleCom</h2>

            <p className={styles.welcomeText}>
                Accede a la plataforma centralizada para la gestión y auditoría inteligente de grabaciones.
            </p>

            <div className={styles.startWrapper}>
                <button
                    type="button"
                    className={styles.startButton}
                    onClick={onStart}
                >
                    Iniciar Sesión <i className="bi bi-arrow-right"></i>
                </button>
            </div>
        </div>
    );
};

export default WelcomePanel;