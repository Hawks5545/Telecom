import React, { useState } from 'react';
import styles from './UsersRoles.module.css';

// Importamos los sub-componentes
import UserManager from './Usuarios/UserManager';
import RoleManager from './Roles/RoleManager';

const UsersRoles = () => {
    const [activeTab, setActiveTab] = useState('users');

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            
            <h2 className={`mb-4 ${styles.pageTitle}`}>
                <i className="bi bi-people-fill me-2"></i>
                Gestión de Usuarios y Roles
            </h2>

            {/* --- PESTAÑAS DE NAVEGACIÓN --- */}
            <div className={styles.tabContainer}>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'users' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <i className="bi bi-person me-2"></i> Usuarios
                </button>
                <button 
                    className={`${styles.tabButton} ${activeTab === 'roles' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('roles')}
                >
                    <i className="bi bi-shield-lock me-2"></i> Roles y Permisos
                </button>
            </div>

            {/* --- RENDERIZADO CONDICIONAL --- */}
            <div className={`card ${styles.cardCustom}`}>
                {activeTab === 'users' ? <UserManager /> : <RoleManager />}
            </div>
        </div>
    );
};

export default UsersRoles;