import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ onLogout, activeModule, onNavigate }) => {

    // 1. LEER DATOS Y PERMISOS DEL USUARIO
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const role = userData.role; 
    
    // Aquí está la magia: Obtenemos el array de permisos que envió el AuthController
    // Si no existe, usamos un array vacío para evitar errores.
    const userPerms = userData.permissions || [];

    const handleNavClick = (viewName, e) => {
        e.preventDefault(); 
        if (onNavigate) {
            onNavigate(viewName); 
        }
    };

    // 2. LÓGICA DE PERMISOS DINÁMICA (RBAC Real) 🧠
    // Esta función verifica si el usuario tiene el permiso específico en su lista.
    const canSee = (permissionName) => {
        // Si el usuario es super-admin (tiene comodín '*') o tiene el permiso exacto
        return userPerms.includes('*') || userPerms.includes(permissionName);
    };

    // Nota: Para el módulo de Usuarios, a veces solo queremos que entre el Admin,
    // o alguien con un permiso explícito de "Gestión de Usuarios".
    const canSeeUsers = () => {
        return role === 'admin' || userPerms.includes('Gestión de Usuarios');
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
                    <div style={{fontSize: '0.7rem', color: '#aaa', marginTop: '5px', textTransform: 'uppercase'}}>
                        {role}
                    </div>
                </div>

                {/* Menú de Módulos */}
                <ul className={styles.navList}>
                    
                    {/* 1. Dashboard */}
                    {canSee('Dashboard') && (
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
                    {canSee('Búsqueda de Grabaciones') && (
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
                    {canSee('Gestor de Carpetas') && (
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
                    {canSee('Indexación') && (
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
                    {canSee('Auditorías') && (
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
                    {canSee('Reportes') && (
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

                    {/* 7. Usuarios y Roles (Lógica especial para Admin) */}
                    {canSeeUsers() && (
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

                    {/* 8. Configuración (Solo Admin) */}
                    {role === 'admin' && (
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