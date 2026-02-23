import React, { useState, useEffect } from 'react';
import styles from './Configuration.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const Configuration = () => {
    
    // --- ESTADOS ---
    const [activeSection, setActiveSection] = useState('inbox_routes'); 
    
    // Estados para Rutas
    const [locations, setLocations] = useState([]); 
    const [newLocation, setNewLocation] = useState({ path: '', name: '' });
    const [isLoadingPath, setIsLoadingPath] = useState(false);
    const [locationSearch, setLocationSearch] = useState(''); 
    
    // 🌟 NUEVO ESTADO: Para controlar la animación de carga de la tabla
    const [isFetchingLocations, setIsFetchingLocations] = useState(false);

    // Estados para Preferencias Globales
    const [settings, setSettings] = useState({
        download_format: 'mp3',
        hide_broken_links: '1', 
        scan_frequency: '30',
        admin_email: '',
        alert_disk_full: '1',
        alert_service_down: '1'
    });
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // --- CONFIGURACIÓN DE ALERTA ---
    const [alertConfig, setAlertConfig] = useState({ 
        isOpen: false, 
        type: 'info', 
        title: '', 
        message: '', 
        onConfirm: null 
    });

    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    };

    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // Manejador limpio para cambiar de pestaña
    const handleSectionChange = (section) => {
        setActiveSection(section);
        setLocationSearch('');
        setNewLocation({ path: '', name: '' });
        setLocations([]); 
    };

    // --- CARGAR DATOS AL INICIAR ---
    useEffect(() => {
        fetchSettings(); 
        if (activeSection === 'inbox_routes' || activeSection === 'campaign_routes') {
            fetchLocations();
        }
    }, [activeSection]);

    // Efecto para buscar en tiempo real
    useEffect(() => {
        if (activeSection === 'inbox_routes' || activeSection === 'campaign_routes') {
            const timer = setTimeout(() => {
                fetchLocations();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [locationSearch]);

    // 1. Obtener Rutas (Lógica Dinámica y con Animación)
    const fetchLocations = async () => {
        setIsFetchingLocations(true); // Encendemos el Skeleton
        
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams();
        if (locationSearch) params.append('search', locationSearch);

        const endpoint = activeSection === 'inbox_routes' 
            ? `/api/config/storage/inbox?${params.toString()}` 
            : `/api/config/storage/campaigns?${params.toString()}`;

        try {
            const response = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setLocations(await response.json());
            }
        } catch (error) { 
            console.error("Error cargando rutas:", error); 
        } finally {
            setIsFetchingLocations(false); // Apagamos el Skeleton
        }
    };

    // 2. Obtener Ajustes
    const fetchSettings = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('/api/config/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) { console.error("Error cargando ajustes:", error); }
    };

    // --- ACCIONES ---
    const handleAddLocation = async () => {
        if (!newLocation.path) return showAlert('error', 'Campo Requerido', 'Por favor ingresa la ruta del servidor.');
        
        setIsLoadingPath(true);
        const token = localStorage.getItem('auth_token');
        const endpoint = activeSection === 'inbox_routes' ? '/api/config/storage/inbox' : '/api/config/storage/campaigns';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newLocation)
            });
            const data = await response.json();
            if (response.ok) {
                showAlert('success', 'Ruta Agregada', 'La nueva ubicación se ha guardado correctamente.');
                setNewLocation({ path: '', name: '' });
                fetchLocations(); 
            } else {
                showAlert('error', 'Error', data.message || 'No se pudo guardar la ruta.');
            }
        } catch (error) { showAlert('error', 'Error de Conexión', 'No se pudo conectar con el servidor.'); }
        finally { setIsLoadingPath(false); }
    };

    const handleDeleteLocation = (id) => {
        showAlert(
            'warning', 
            'Eliminar Ruta', 
            '¿Estás seguro de que deseas eliminar esta ruta? El sistema dejará de sincronizar archivos de aquí.',
            () => executeDeleteLocation(id)
        );
    };

    const executeDeleteLocation = async (id) => {
        const token = localStorage.getItem('auth_token');
        const endpoint = activeSection === 'inbox_routes' ? `/api/config/storage/inbox/${id}` : `/api/config/storage/campaigns/${id}`;

        try {
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                fetchLocations();
                showAlert('success', 'Eliminado', 'La ruta ha sido removida.');
            } else { 
                showAlert('error', 'Error', 'No se pudo eliminar la ruta.'); 
            }
        } catch (error) { console.error(error); }
        finally { closeAlert(); }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        const token = localStorage.getItem('auth_token');
        try {
            const response = await fetch('/api/config/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(settings)
            });
            if (response.ok) {
                showAlert('success', 'Configuración Guardada', 'Las preferencias se han actualizado correctamente.');
            } else {
                showAlert('error', 'Error', 'No se pudieron guardar los ajustes.');
            }
        } catch (error) { showAlert('error', 'Error', 'Fallo de conexión.'); }
        finally { setIsSavingSettings(false); }
    };

    // --- RENDERIZADO DE SECCIONES ---
    const renderLocationsConfig = () => {
        const isInbox = activeSection === 'inbox_routes';
        const title = isInbox ? 'Bandejas de Entrada (Importaciones)' : 'Carpetas Madre (Campañas)';
        const inputPlaceholderName = isInbox ? 'Ej: Importaciones Diarias' : 'Ej: Campaña Retención 2026';

        return (
            <div className={styles.sectionContainer}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className={styles.sectionSubtitle}>{title}</h4>
                </div>
                
                {/* Formulario */}
                <div className="card p-4 mb-4 border-0 shadow-sm bg-light">
                    <h6 className="fw-bold text-dark mb-3"><i className="bi bi-folder-plus me-2"></i>Agregar Nueva Ubicación</h6>
                    <div className="row g-2 align-items-end">
                        <div className="col-md-4">
                            <label className="small fw-bold text-secondary">Nombre (Alias)</label>
                            <input type="text" className="form-control" placeholder={inputPlaceholderName}
                                value={newLocation.name} onChange={(e) => setNewLocation({...newLocation, name: e.target.value})} />
                        </div>
                        <div className="col-md-6">
                            <label className="small fw-bold text-secondary">Ruta Absoluta</label>
                            <input type="text" className="form-control" placeholder="Ej: /mnt/datos/ o Z:/"
                                value={newLocation.path} onChange={(e) => setNewLocation({...newLocation, path: e.target.value})} />
                        </div>
                        <div className="col-md-2">
                            <button className={styles.btnAdd} onClick={handleAddLocation} disabled={isLoadingPath}>
                                {isLoadingPath ? '...' : 'Agregar'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla con Buscador */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white py-3">
                        <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
                            <span className="input-group-text bg-light border-end-0"><i className="bi bi-search text-muted"></i></span>
                            <input 
                                type="text" 
                                className="form-control border-start-0 ps-0" 
                                placeholder="Buscar por nombre, ruta o fecha..." 
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0 align-middle">
                                <thead className={styles.tableHeader}>
                                    <tr>
                                        <th className="ps-4 py-3">Nombre</th>
                                        <th>Ruta</th>
                                        <th>Fecha Creación</th>
                                        <th>Estado</th>
                                        <th className="text-end pe-4">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* 🌟 LÓGICA DE SKELETON UI IMPLEMENTADA AQUÍ */}
                                    {isFetchingLocations ? (
                                        Array.from({ length: 3 }).map((_, idx) => (
                                            <tr key={idx} className="placeholder-glow">
                                                <td className="ps-4 py-3"><span className="placeholder col-8 rounded"></span></td>
                                                <td><span className="placeholder col-10 rounded"></span></td>
                                                <td><span className="placeholder col-6 rounded"></span></td>
                                                <td><span className="placeholder col-4 rounded"></span></td>
                                                <td className="text-end pe-4"><span className="placeholder col-3 rounded bg-secondary"></span></td>
                                            </tr>
                                        ))
                                    ) : locations.length === 0 ? (
                                        <tr><td colSpan="5" className="text-center py-5 text-muted"><i className="bi bi-folder-x fs-4 d-block mb-2 text-secondary opacity-50"></i>No se encontraron rutas configuradas.</td></tr>
                                    ) : (
                                        locations.map(loc => (
                                            <tr key={loc.id}>
                                                <td className="ps-4 fw-bold">{loc.name}</td>
                                                <td className="text-muted small font-monospace">{loc.path}</td>
                                                <td className="small text-secondary">{new Date(loc.created_at).toLocaleString()}</td>
                                                <td><span className={`badge ${loc.is_active ? 'bg-success' : 'bg-secondary'}`}>{loc.is_active ? 'Activo' : 'Inactivo'}</span></td>
                                                <td className="text-end pe-4">
                                                    <button className="btn btn-sm btn-outline-danger border-0" onClick={() => handleDeleteLocation(loc.id)}><i className="bi bi-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderStorageConfig = () => (
        <div className={styles.sectionContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Preferencias de Almacenamiento</h4>
                <button className={styles.btnSave} onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
            
            <div className="card p-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3">Configuración de Descargas</h6>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label small fw-bold text-secondary">Formato de Descarga</label>
                        <select className="form-select" value={settings.download_format || 'mp3'} 
                            onChange={(e) => setSettings({...settings, download_format: e.target.value})}>
                            <option value="original">Original (Sin conversión)</option>
                            <option value="mp3">MP3 (Optimizado / Ligero)</option>
                            <option value="wav">WAV (Alta Calidad)</option>
                        </select>
                        <div className="form-text">Define en qué formato se descargarán los audios individuales.</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSyncConfig = () => (
        <div className={styles.sectionContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Integridad de Datos</h4>
                <button className={styles.btnSave} onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
            <div className="alert alert-info border-0 shadow-sm d-flex align-items-center">
                <i className="bi bi-info-circle-fill fs-4 me-3 text-info"></i>
                <div>
                    <strong>Sincronización Automática:</strong> El sistema verificará periódicamente que los archivos físicos existan.
                </div>
            </div>
            <div className="card p-4 border-0 shadow-sm bg-light mt-3">
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

    const renderNotificationsConfig = () => (
        <div className={styles.sectionContainer}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className={styles.sectionSubtitle}>Configuración de Alertas</h4>
                <button className={styles.btnSave} onClick={handleSaveSettings} disabled={isSavingSettings}>
                    {isSavingSettings ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
            
            <div className="card p-4 mb-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3"><i className="bi bi-envelope-at me-2"></i>Destinatarios</h6>
                <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">Correo del Administrador</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white text-muted"><i className="bi bi-person-badge"></i></span>
                        <input type="email" className="form-control" placeholder="admin.ti@empresa.com" 
                            value={settings.admin_email || ''}
                            onChange={(e) => setSettings({...settings, admin_email: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="card p-4 border-0 shadow-sm bg-light">
                <h6 className="fw-bold text-dark mb-3">Activar Notificaciones</h6>
                <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="diskAlert" 
                        checked={settings.alert_disk_full === '1'}
                        onChange={(e) => setSettings({...settings, alert_disk_full: e.target.checked ? '1' : '0'})}
                    />
                    <label className="form-check-label" htmlFor="diskAlert">Almacenamiento Crítico (Disco lleno +90%)</label>
                </div>
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" id="serviceAlert" 
                        checked={settings.alert_service_down === '1'}
                        onChange={(e) => setSettings({...settings, alert_service_down: e.target.checked ? '1' : '0'})}
                    />
                    <label className="form-check-label" htmlFor="serviceAlert">Servicio de Búsqueda Detenido</label>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'inbox_routes': 
            case 'campaign_routes': 
                return renderLocationsConfig();
            case 'storage': return renderStorageConfig();
            case 'sync': return renderSyncConfig();
            case 'notifications': return renderNotificationsConfig();
            default: return null;
        }
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            <CustomAlert 
                isOpen={alertConfig.isOpen} 
                type={alertConfig.type} 
                title={alertConfig.title} 
                message={alertConfig.message} 
                onClose={closeAlert} 
                onConfirm={alertConfig.onConfirm} 
            />
            
            <h2 className={styles.pageTitle}><i className="bi bi-gear-wide-connected me-2"></i> Configuración</h2>
            <div className={styles.layoutWrapper}>
                <aside className={styles.sidebar}>
                    <nav className={styles.nav}>
                        <button className={`${styles.navItem} ${activeSection === 'inbox_routes' ? styles.navActive : ''}`} onClick={() => handleSectionChange('inbox_routes')}>
                            <i className="bi bi-inbox me-2"></i> Bandejas de Entrada
                        </button>
                        <button className={`${styles.navItem} ${activeSection === 'campaign_routes' ? styles.navActive : ''}`} onClick={() => handleSectionChange('campaign_routes')}>
                            <i className="bi bi-folder-symlink me-2"></i> Campañas Comerciales
                        </button>

                        <button className={`${styles.navItem} ${activeSection === 'storage' ? styles.navActive : ''}`} onClick={() => handleSectionChange('storage')}>
                            <i className="bi bi-hdd-rack me-2"></i> Almacenamiento
                        </button>
                        <button className={`${styles.navItem} ${activeSection === 'sync' ? styles.navActive : ''}`} onClick={() => handleSectionChange('sync')}>
                            <i className="bi bi-arrow-repeat me-2"></i> Sincronización
                        </button>
                        <button className={`${styles.navItem} ${activeSection === 'notifications' ? styles.navActive : ''}`} onClick={() => handleSectionChange('notifications')}>
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