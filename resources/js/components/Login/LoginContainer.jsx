//resources/js/components/Login/LoginContainer
import React, { useState } from 'react';
import WelcomePanel from './WelcomePanel';
import LoginForm from './LoginForm';
import styles from './Login.module.css';

const LoginContainer = ({ onLogin }) => {
    const [isLoginView, setIsLoginView] = useState(false);

    return (
        <div className={styles.mainWrapper}>
            <div className={styles.containerCard}>
                <div className={`${styles.sliderContent} ${isLoginView ? styles.showForm : ''}`}>
                    
                    <div className={`${styles.panel} ${styles.welcomePanel}`}>
                        <WelcomePanel onStart={() => setIsLoginView(true)} />
                    </div>

                    <div className={styles.panel}>
                        <LoginForm 
                            onBack={() => setIsLoginView(false)} 
                            onLogin={onLogin} 
                        />
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginContainer;