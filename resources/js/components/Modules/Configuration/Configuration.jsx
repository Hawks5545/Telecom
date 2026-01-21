// resources/js/components/Modules/Configuration/Configuration.jsx
import React, { useState } from 'react';
import styles from './Configuration.module.css';

const Configuration = () => {
    // Estado para la navegación interna
    const [activeSection, setActiveSection] = useState('storage');

    // --- SECCIÓN 1: ALMACENAMIENTO ---
    const renderStorageConfig = () => (
        <div className={styles.mainContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Gestión de Archivos</h4>
                <button className="btn btn-primary btn-sm px-3">
                    <i className="bi bi-save me-2"></i>Guardar Cambios
                </button>
            </div>
            
            <form>
                {/* UBICACIÓN DE LOS ARCHIVOS */}
                <div className="card p-4 mb-4 border-0 shadow-sm bg-light">
                    <h6 className="fw-bold text-dark mb-3">
                        <i className="bi bi-folder2-open me-2"></i>Ubicación de Grabaciones
                    </h6>
                    
                    <div className="mb-3">
                        <label className="form-label small fw-bold text-secondary">Ruta del Servidor (Linux / Windows)</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white text-muted">
                                <i className="bi bi-hdd-network"></i>
                            </span>
                            {/* Dejamos el defaultValue como ejemplo de Linux, pero el admin puede borrarlo */}
                            <input 
                                type="text" 
                                className="form-control" 
                                defaultValue="/mnt/grabaciones/repo_historico/" 
                                placeholder="Ej: /mnt/datos/ o C:\Grabaciones\"
                            />
                        </div>
                        <div className="form-text small text-muted">
                            Ruta absoluta donde el sistema buscará los archivos de audio originales.
                        </div>
                    </div>
                </div>

                {/* PREFERENCIAS DE DESCARGA */}
                <div className="card p-4 border-0 shadow-sm bg-light">
                    <h6 className="fw-bold text-dark mb-3">
                        <i className="bi bi-sliders me-2"></i>Preferencias de Descarga
                    </h6>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-secondary">Formato Predeterminado</label>
                            <select className="form-select" defaultValue="mp3">
                                <option value="original">Original (Sin conversión)</option>
                                <option value="mp3">MP3 (Optimizado / Ligero)</option>
                            </select>
                        </div>
                        <div className="col-md-6 mb-3">
                            <label className="form-label small fw-bold text-secondary">Procesamiento de Audio</label>
                            <div className="form-check form-switch mt-2">
                                <input className="form-check-input" type="checkbox" id="volCheck" defaultChecked />
                                <label className="form-check-label" htmlFor="volCheck">Normalizar Volumen (Recomendado)</label>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );

    // --- SECCIÓN 2: SINCRONIZACIÓN ---
    const renderSyncConfig = () => (
        <div className={styles.mainContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Integridad de Datos</h4>
                <button className="btn btn-primary btn-sm px-3">Guardar</button>
            </div>

            <div className="alert alert-info border-0 shadow-sm d-flex align-items-center">
                <i className="bi bi-info-circle-fill fs-4 me-3 text-info"></i>
                <div>
                    <strong>Sincronización Automática:</strong> El sistema verificará periódicamente que los archivos físicos existan en el servidor antes de mostrarlos en la búsqueda.
                </div>
            </div>

            <div className="card p-4 border-0 shadow-sm bg-light mt-3">
                <h6 className="fw-bold text-dark mb-3">Limpieza de Base de Datos</h6>
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <p className="mb-1 fw-bold text-secondary">Ocultar enlaces rotos</p>
                        <p className="small text-muted mb-0">Si un audio es eliminado manualmente del servidor, el sistema dejará de mostrarlo en los resultados.</p>
                    </div>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" defaultChecked />
                    </div>
                </div>

                <hr className="text-muted opacity-25" />

                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                        <p className="mb-1 fw-bold text-secondary">Frecuencia de Escaneo</p>
                        <p className="small text-muted mb-0">Cada cuánto tiempo el sistema busca archivos nuevos.</p>
                    </div>
                    <div style={{ width: '200px' }}>
                        <select className="form-select form-select-sm">
                            <option value="5">Cada 5 Minutos</option>
                            <option value="30">Cada 30 Minutos</option>
                            <option value="60">Cada Hora</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- SECCIÓN 3: ALERTAS (Simplificada) ---
    const renderNotificationsConfig = () => (
        <div className={styles.mainContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Configuración de Alertas</h4>
                <button className="btn btn-primary btn-sm px-3">Guardar</button>
            </div>

            <div className="card p-4 mb-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3">
                    <i className="bi bi-envelope-at me-2"></i>Destinatarios
                </h6>
                <p className="small text-muted mb-3">
                    Los correos técnicos del sistema (como fallos de disco o errores de servicio) se enviarán a esta dirección.
                </p>
                
                <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Correo del Administrador</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white text-muted">
                            <i className="bi bi-person-badge"></i>
                        </span>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="admin.ti@empresa.com" 
                        />
                    </div>
                </div>
            </div>

            <div className="card p-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3">Activar Notificaciones para:</h6>
                
                <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="diskAlert" defaultChecked />
                    <label className="form-check-label" htmlFor="diskAlert">
                        Almacenamiento Crítico (Disco lleno +90%)
                    </label>
                </div>
                
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="serviceAlert" defaultChecked />
                    <label className="form-check-label" htmlFor="serviceAlert">
                        Servicio de Búsqueda Detenido
                    </label>
                </div>
            </div>
        </div>
    );

    // Renderizador condicional
    const renderContent = () => {
        switch (activeSection) {
            case 'storage': return renderStorageConfig();
            case 'sync': return renderSyncConfig();
            case 'notifications': return renderNotificationsConfig();
            default: return null;
        }
    };

    return (
        <div className={`container-fluid p-0 ${styles.mainContainer}`}>
            {/* Título General */}
            <h2 className={styles.pageTitle}>
                <i className="bi bi-gear-wide-connected me-2"></i> Configuración
            </h2>

            {/* Layout Flex: Sidebar + Contenido */}
            <div className={styles.layoutWrapper}>
                
                <aside className={styles.sidebar}>
                    <nav className={styles.nav}>
                        <button 
                            className={`${styles.navItem} ${activeSection === 'storage' ? styles.navActive : ''}`}
                            onClick={() => setActiveSection('storage')}
                        >
                            <i className="bi bi-hdd-rack me-2"></i> Almacenamiento
                        </button>
                        
                        <button 
                            className={`${styles.navItem} ${activeSection === 'sync' ? styles.navActive : ''}`}
                            onClick={() => setActiveSection('sync')}
                        >
                            <i className="bi bi-arrow-repeat me-2"></i> Sincronización
                        </button>

                        <button 
                            className={`${styles.navItem} ${activeSection === 'notifications' ? styles.navActive : ''}`}
                            onClick={() => setActiveSection('notifications')}
                        >
                            <i className="bi bi-bell me-2"></i> Alertas
                        </button>
                    </nav>
                </aside>

                <main className={styles.contentCard}>
                    {renderContent()}
                </main>

            </div>
        </div>
    );
};

export default Configuration;