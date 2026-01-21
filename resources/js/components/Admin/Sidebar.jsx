// resources/js/components/Layout/Sidebar.jsx
import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ onLogout, activeModule, onNavigate }) => {

    const handleNavClick = (viewName, e) => {
        e.preventDefault(); 
        if (onNavigate) {
            onNavigate(viewName); 
        }
    };

    return (
        <aside className={styles.sidebarWrapper}>
            <div className={styles.sidebarContent}>
                
                {/* Header / Logo */}
                <div className={styles.logoArea}>
                    <div className={styles.logoIcon}>
                        <i className="bi bi-soundwave"></i>
                    </div>
                    <span className={styles.linkText}>Telecom</span>
                </div>

                {/* Menú de Módulos */}
                <ul className={styles.navList}>
                    
                    {/* 1. Dashboard */}
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

                    {/* 2. Búsqueda de Grabaciones */}
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

                    {/* 3. Gestor de Carpetas */}
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

                    {/* 4. Indexación */}
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

                    {/* 5. Auditorías */}
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

                    {/* 6. Reportes */}
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

                    {/* 7. Usuarios */}
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

                    {/* 8. Configuración (CORREGIDO: 'configuration' en lugar de 'settings') */}
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