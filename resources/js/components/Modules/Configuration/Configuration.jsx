import React, { useState, useEffect } from 'react';
import styles from './Configuration.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const Configuration = () => {
    
    // --- ESTADOS ---
    const [activeSection, setActiveSection] = useState('storage');
    
    // Estados para Rutas (Storage Locations)
    const [locations, setLocations] = useState([]); 
    const [newLocation, setNewLocation] = useState({ path: '', name: '' });
    const [isLoadingPath, setIsLoadingPath] = useState(false);

    // Estados para Preferencias Globales (Settings)
    // AHORA INCLUYE: Almacenamiento, Sincronización y Alertas
    const [settings, setSettings] = useState({
        // Almacenamiento
        download_format: 'mp3',
        // Sincronización
        hide_broken_links: '1', 
        scan_frequency: '30',
        // Alertas (NUEVO)
        admin_email: '',
        alert_disk_full: '1',    // '1' = Activado
        alert_service_down: '1'  // '1' = Activado
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    // --- CARGAR DATOS AL INICIAR ---
    useEffect(() => {
        fetchSettings(); // Cargar configuración global siempre
        if (activeSection === 'storage') {
            fetchLocations();
        }
    }, [activeSection]);

    // 1. Obtener Rutas
    const fetchLocations = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/config/storage', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setLocations(await response.json());
            }
        } catch (error) { console.error("Error cargando rutas:", error); }
    };

    // 2. Obtener Ajustes Globales (Settings)
    const fetchSettings = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/config/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Actualizamos estado mezclando defaults con datos de BD
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) { console.error("Error cargando ajustes:", error); }
    };

    // --- MANEJADORES DE ACCIONES (RUTAS) ---
    const handleAddLocation = async () => {
        if (!newLocation.path) return showAlert('Campo Requerido', 'Por favor ingresa la ruta del servidor.', 'error');
        setIsLoadingPath(true);
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/config/storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newLocation)
            });
            const data = await response.json();
            if (response.ok) {
                showAlert('Ruta Agregada', 'La nueva ubicación se ha guardado correctamente.');
                setNewLocation({ path: '', name: '' });
                fetchLocations();
            } else {
                showAlert('Error', data.message || 'No se pudo guardar la ruta.', 'error');
            }
        } catch (error) { showAlert('Error de Conexión', 'No se pudo conectar con el servidor.', 'error'); }
        finally { setIsLoadingPath(false); }
    };

    const handleDeleteLocation = async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta ruta? El sistema dejará de indexar archivos de aquí.')) return;
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/config/storage/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchLocations();
                showAlert('Eliminado', 'La ruta ha sido removida.');
            } else { showAlert('Error', 'No se pudo eliminar la ruta.', 'error'); }
        } catch (error) { console.error(error); }
    };

    // --- MANEJADORES DE ACCIONES (PREFERENCIAS GLOBALES - REUTILIZABLE) ---
    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('http://127.0.0.1:8000/api/config/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (response.ok) {
                showAlert('Configuración Guardada', 'Las preferencias se han actualizado correctamente.');
            } else {
                showAlert('Error', 'No se pudieron guardar los ajustes.', 'error');
            }
        } catch (error) { showAlert('Error', 'Fallo de conexión.', 'error'); }
        finally { setIsSavingSettings(false); }
    };

    // --- ALERTAS ---
    const showAlert = (title, message, type = 'success') => {
        setAlertConfig({ isOpen: true, type, title, message });
    };
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- RENDERIZADO: SECCIÓN ALMACENAMIENTO ---
    const renderStorageConfig = () => (
        <div className={styles.sectionContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Gestión de Archivos</h4>
            </div>
            
            {/* 1. FORMULARIO RUTAS */}
            <div className="card p-4 mb-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3"><i className="bi bi-folder-plus me-2"></i>Agregar Nueva Ubicación</h6>
                <div className="row g-2 align-items-end">
                    <div className="col-md-4">
                        <label className="small fw-bold text-secondary">Nombre (Alias)</label>
                        <input type="text" className="form-control" placeholder="Ej: Disco Z - Histórico"
                            value={newLocation.name} onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} />
                    </div>
                    <div className="col-md-6">
                        <label className="small fw-bold text-secondary">Ruta Absoluta</label>
                        <input type="text" className="form-control" placeholder="Ej: /mnt/datos/ o Z:/"
                            value={newLocation.path} onChange={(e) => setNewLocation({...newLocation, path: e.target.value})} />
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-success w-100" onClick={handleAddLocation} disabled={isLoadingPath}>
                            {isLoadingPath ? '...' : 'Agregar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. TABLA RUTAS */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-0">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light">
                            <tr><th className="ps-4 py-3">Nombre</th><th>Ruta</th><th>Estado</th><th className="text-end pe-4">Acciones</th></tr>
                        </thead>
                        <tbody>
                            {locations.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-4 text-muted">No hay rutas configuradas.</td></tr>
                            ) : locations.map(loc => (
                                <tr key={loc.id}>
                                    <td className="ps-4 fw-bold">{loc.name}</td>
                                    <td className="text-muted small font-monospace">{loc.path}</td>
                                    <td><span className={`badge ${loc.is_active ? 'bg-success' : 'bg-secondary'}`}>{loc.is_active ? 'Activo' : 'Inactivo'}</span></td>
                                    <td className="text-end pe-4">
                                        <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteLocation(loc.id)}><i className="bi bi-trash"></i></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. PREFERENCIAS GLOBALES (Descarga) */}
            <div className="card p-4 border-0 shadow-sm bg-light">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark m-0"><i className="bi bi-sliders me-2"></i>Preferencias Globales</h6>
                    <button className="btn btn-sm btn-primary" onClick={handleSaveSettings} disabled={isSavingSettings}>
                        {isSavingSettings ? 'Guardando...' : 'Guardar Preferencias'}
                    </button>
                </div>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label small fw-bold text-secondary">Formato de Descarga</label>
                        <select className="form-select" value={settings.download_format || 'mp3'} 
                            onChange={(e) => setSettings({...settings, download_format: e.target.value})}>
                            <option value="original">Original (Sin conversión)</option>
                            <option value="mp3">MP3 (Optimizado / Ligero)</option>
                            <option value="wav">WAV (Alta Calidad)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- SECCIÓN 2: SINCRONIZACIÓN ---
    const renderSyncConfig = () => (
        <div className={styles.sectionContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Integridad de Datos</h4>
                <button className={styles.btnSave} onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? <>Wait...</> : <><i className="bi bi-check-circle me-2"></i>Guardar Cambios</>}
                </button>
            </div>
            <div className="alert alert-info border-0 shadow-sm d-flex align-items-center">
                <i className="bi bi-info-circle-fill fs-4 me-3 text-info"></i>
                <div>
                    <strong>Sincronización Automática:</strong> El sistema verificará periódicamente que los archivos físicos existan.
                </div>
            </div>
            <div className="card p-4 border-0 shadow-sm bg-light mt-3">
                <h6 className="fw-bold text-dark mb-3">Limpieza de Base de Datos</h6>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <p className="mb-1 fw-bold text-secondary">Ocultar enlaces rotos</p>
                        <p className="small text-muted mb-0">Si un audio es eliminado manualmente del servidor, el sistema dejará de mostrarlo.</p>
                    </div>
                    <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" 
                            checked={settings.hide_broken_links === '1'} 
                            onChange={(e) => setSettings({...settings, hide_broken_links: e.target.checked ? '1' : '0'})} />
                    </div>
                </div>
                <hr className="text-muted opacity-25" />
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                        <p className="mb-1 fw-bold text-secondary">Frecuencia de Escaneo</p>
                        <p className="small text-muted mb-0">Cada cuánto tiempo el sistema busca archivos nuevos.</p>
                    </div>
                    <div style={{ width: '200px' }}>
                        <select className="form-select form-select-sm" value={settings.scan_frequency || '30'}
                            onChange={(e) => setSettings({...settings, scan_frequency: e.target.value})}>
                            <option value="5">Cada 5 Minutos</option>
                            <option value="30">Cada 30 Minutos</option>
                            <option value="60">Cada Hora</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- SECCIÓN 3: ALERTAS (DINÁMICO Y FUNCIONAL) ---
    const renderNotificationsConfig = () => (
        <div className={styles.sectionContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Configuración de Alertas</h4>
                
                <button className={styles.btnSave} onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? (
                        <> <span className="spinner-border spinner-border-sm me-1"></span> Guardando... </>
                    ) : (
                        <> <i className="bi bi-bell-fill me-2"></i>Guardar Configuración </>
                    )}
                </button>
            </div>
            
            <div className="card p-4 mb-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3">
                    <i className="bi bi-envelope-at me-2"></i>Destinatarios
                </h6>
                <p className="small text-muted mb-3">
                    Los correos técnicos del sistema (fallos de disco, errores de servicio) se enviarán aquí.
                </p>
                <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Correo del Administrador</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white text-muted"><i className="bi bi-person-badge"></i></span>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="admin.ti@empresa.com" 
                            value={settings.admin_email || ''}
                            onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="card p-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3">Activar Notificaciones para:</h6>
                
                <div className="form-check form-switch mb-3">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="diskAlert" 
                        checked={settings.alert_disk_full === '1'}
                        onChange={(e) => setSettings({...settings, alert_disk_full: e.target.checked ? '1' : '0'})}
                    />
                    <label className="form-check-label" htmlFor="diskAlert">Almacenamiento Crítico (Disco lleno +90%)</label>
                </div>
                
                <div className="form-check form-switch">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="serviceAlert" 
                        checked={settings.alert_service_down === '1'}
                        onChange={(e) => setSettings({...settings, alert_service_down: e.target.checked ? '1' : '0'})}
                    />
                    <label className="form-check-label" htmlFor="serviceAlert">Servicio de Búsqueda Detenido</label>
                </div>
            </div>
        </div>
    );

    // --- RENDERIZADO PRINCIPAL ---
    const renderContent = () => {
        switch (activeSection) {
            case 'storage': return renderStorageConfig();
            case 'sync': return renderSyncConfig();
            case 'notifications': return renderNotificationsConfig();
            default: return null;
        }
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} />
            <h2 className={styles.pageTitle}><i className="bi bi-gear-wide-connected me-2"></i> Configuración</h2>
            <div className={styles.layoutWrapper}>
                <aside className={styles.sidebar}>
                    <nav className={styles.nav}>
                        <button className={`${styles.navItem} ${activeSection === 'storage' ? styles.navActive : ''}`} onClick={() => setActiveSection('storage')}>
                            <i className="bi bi-hdd-rack me-2"></i> Almacenamiento
                        </button>
                        <button className={`${styles.navItem} ${activeSection === 'sync' ? styles.navActive : ''}`} onClick={() => setActiveSection('sync')}>
                            <i className="bi bi-arrow-repeat me-2"></i> Sincronización
                        </button>
                        <button className={`${styles.navItem} ${activeSection === 'notifications' ? styles.navActive : ''}`} onClick={() => setActiveSection('notifications')}>
                            <i className="bi bi-bell me-2"></i> Alertas
                        </button>
                    </nav>
                </aside>
                <main className={styles.contentCard}>{renderContent()}</main>
            </div>
        </div>
    );
};

export default Configuration;