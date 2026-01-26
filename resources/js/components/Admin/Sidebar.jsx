import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ onLogout, activeModule, onNavigate }) => {

    // 1. LEER EL ROL DEL USUARIO
    // Recuperamos los datos que guardaste en el Login
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const role = userData.role; // 'admin', 'senior', 'junior', 'analista'

    const handleNavClick = (viewName, e) => {
        e.preventDefault(); 
        if (onNavigate) {
            onNavigate(viewName); 
        }
    };

    // 2. LÓGICA DE PERMISOS (El Cerebro de la Seguridad) 🧠
    const canSee = (moduleName) => {
        // Regla 1: El Administrador ve TODO
        if (role === 'admin') return true;

        // Regla 2: Senior y Junior
        // Ven todo MENOS 'users' (Usuarios) y 'audits' (Auditorías)
        if (role === 'senior' || role === 'junior') {
            const forbiddenModules = ['users', 'audits'];
            return !forbiddenModules.includes(moduleName);
        }

        // Regla 3: Analista
        // SOLO ve 'search', 'folders' e 'indexing'
        if (role === 'analista') {
            const allowedModules = ['search', 'folders', 'indexing'];
            return allowedModules.includes(moduleName);
        }

        return false; // Por seguridad, si no tiene rol, no ve nada.
    };

    return (
        <aside className={styles.sidebarWrapper}>
            <div className={styles.sidebarContent}>
                
                {/* Header / Logo */}
                <div className={styles.logoArea}>
                    <div className={styles.logoIcon}>
                        <i className="bi bi-soundwave"></i>
                    </div>
                    <span className={styles.linkText}>TeleCom</span>
                    {/* (Opcional) Mostrar el rol debajo del logo para que sepas quién eres */}
                    <div style={{fontSize: '0.7rem', color: '#aaa', marginTop: '5px', textTransform: 'uppercase'}}>
                        {role}
                    </div>
                </div>

                {/* Menú de Módulos */}
                <ul className={styles.navList}>
                    
                    {/* 1. Dashboard */}
                    {canSee('dashboard') && (
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('dashboard', e)}
                            >
                                <i className={`bi bi-grid-1x2-fill ${styles.icon}`}></i>
                                <span className={styles.linkText}>Dashboard</span>
                            </a>
                        </li>
                    )}

                    {/* 2. Búsqueda de Grabaciones */}
                    {canSee('search') && (
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'search' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('search', e)} 
                            >
                                <i className={`bi bi-music-note-list ${styles.icon}`}></i>
                                <span className={styles.linkText}>Búsqueda Grabaciones</span>
                            </a>
                        </li>
                    )}

                    {/* 3. Gestor de Carpetas */}
                    {canSee('folders') && (
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'folders' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('folders', e)}
                            >
                                <i className={`bi bi-folder-fill ${styles.icon}`}></i>
                                <span className={styles.linkText}>Gestor de Carpetas</span>
                            </a>
                        </li>
                    )}

                    {/* 4. Indexación */}
                    {canSee('indexing') && (
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'indexing' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('indexing', e)}
                            >
                                <i className={`bi bi-database-fill-up ${styles.icon}`}></i>
                                <span className={styles.linkText}>Indexación</span>
                            </a>
                        </li>
                    )}

                    {/* 5. Auditorías */}
                    {canSee('audits') && (
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'audits' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('audits', e)}
                            >
                                <i className={`bi bi-clipboard-check-fill ${styles.icon}`}></i>
                                <span className={styles.linkText}>Auditorías</span>
                            </a>
                        </li>
                    )}

                    {/* 6. Reportes */}
                    {canSee('reports') && (
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'reports' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('reports', e)}
                            >
                                <i className={`bi bi-file-earmark-bar-graph-fill ${styles.icon}`}></i>
                                <span className={styles.linkText}>Reportes</span>
                            </a>
                        </li>
                    )}

                    {/* 7. Usuarios */}
                    {canSee('users') && (
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'users' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('users', e)}
                            >
                                <i className={`bi bi-people-fill ${styles.icon}`}></i>
                                <span className={styles.linkText}>Usuarios y Roles</span>
                            </a>
                        </li>
                    )}

                    {/* 8. Configuración */}
                    {canSee('configuration') && ( // Asumo que configuración es general, si Analista no debe verla, usa 'reports' logic o crea una nueva
                        <li className={styles.navItem}>
                            <a 
                                href="#" 
                                className={`${styles.navLink} ${activeModule === 'configuration' ? styles.active : ''}`}
                                onClick={(e) => handleNavClick('configuration', e)}
                            >
                                <i className={`bi bi-gear-fill ${styles.icon}`}></i>
                                <span className={styles.linkText}>Configuración</span>
                            </a>
                        </li>
                    )}
                </ul>

                {/* Botón Salir */}
                <div className={styles.footer}>
                    <button 
                        className={styles.logoutBtn}
                        onClick={onLogout}
                    >
                        <i className={`bi bi-box-arrow-right ${styles.icon}`}></i>
                        <span className={styles.linkText}>Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;