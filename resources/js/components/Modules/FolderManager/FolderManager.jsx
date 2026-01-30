import React, { useState, useEffect, useCallback } from 'react';
import styles from './FolderManager.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const FolderManager = () => {
    
    // --- ESTADOS ---
    const [fileSystemData, setFileSystemData] = useState([]); // Datos que vienen de la BD
    const [currentFolderId, setCurrentFolderId] = useState(0); // 0 = Raíz (Discos)
    const [isLoading, setIsLoading] = useState(false);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    // Navegación (Migas de pan)
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 0, name: 'Inicio' }]);

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

    const closeAlert = () => {
        setAlertConfig({ ...alertConfig, isOpen: false });
    };

    // --- 1. CARGA DE DATOS REALES (CONEXIÓN API) ---
    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        
        // Construimos la URL con los filtros actuales
        const params = new URLSearchParams({
            parentId: currentFolderId,
            search: searchTerm,
            dateFrom: dateFrom,
            dateTo: dateTo
        });

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/folder-manager/items?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                // Si la API devuelve paginación (data.data), usamos eso. Si devuelve array directo, usamos data.
                setFileSystemData(data.data || data); 
            } else {
                console.error("Error al cargar datos del servidor");
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setIsLoading(false);
        }
    }, [currentFolderId, searchTerm, dateFrom, dateTo]);

    // Efecto para recargar cuando cambian los filtros o la carpeta
    useEffect(() => {
        // Usamos un pequeño retraso (debounce) para la búsqueda de texto
        const timer = setTimeout(() => {
            fetchItems();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchItems]);


    // --- 2. ACCIONES DE NAVEGACIÓN ---
    
    const handleOpenFolder = (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        // Limpiamos búsqueda al entrar a una carpeta para ver todo su contenido
        setSearchTerm(''); 
    };

    const handleBreadcrumbClick = (crumb, index) => {
        setCurrentFolderId(crumb.id);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        setSearchTerm('');
    };

    // --- 3. LÓGICA DE DESCARGA REAL ---
    const handleDownload = (item) => {
        if (item.type === 'folder') {
            // A futuro podrías implementar descarga de ZIP aquí
            showAlert('warning', 'Descarga de Carpeta', 'La descarga masiva de carpetas completas aún no está disponible. Por favor ingresa y descarga los archivos individualmente.');
        } else {
            showAlert(
                'info',
                'Descargar Audio',
                `¿Deseas descargar el archivo "${item.name}"?`,
                () => executeDownload(item)
            );
        }
    };

    const executeDownload = async (item) => {
        const token = localStorage.getItem('auth_token');
        try {
            // Hacemos la petición esperando un archivo (BLOB)
            const response = await fetch(`http://127.0.0.1:8000/api/folder-manager/download/${item.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                // Truco del navegador para descargar el archivo recibido
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = item.name; // Usamos el nombre original
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url); // Limpieza de memoria
                
                showAlert('success', 'Descarga Exitosa', 'El archivo se ha guardado en tu equipo.');
            } else {
                showAlert('error', 'Error', 'El archivo físico no se encuentra en la ruta especificada del servidor.');
            }
        } catch (error) {
            showAlert('error', 'Error', 'Fallo en la conexión de descarga.');
        }
    };

    // --- 4. RENDERIZADO ---
    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            
            {/* ALERTA GLOBAL */}
            <CustomAlert 
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm}
            />

            <h2 className={`mb-4 ${styles.pageTitle}`}>
                <i className="bi bi-folder-fill me-2"></i> Gestión de Carpetas
            </h2>

            {/* SECCIÓN DE FILTROS */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros de Grabaciones
                </div>

                <div className="card-body p-4">
                    <form className="row g-3" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-4">
                            <label className={`form-label ${styles.label}`}>Buscar (Cédula, Campaña, Nombre)</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Escribe para buscar..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Fecha Desde</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Fecha Hasta</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                             <div className="d-flex w-100 gap-2">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary flex-fill" 
                                    title="Limpiar Filtros"
                                    onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); }}
                                >
                                    <i className="bi bi-eraser"></i>
                                </button>
                                <button type="button" className={`btn flex-fill ${styles.searchBtn}`} onClick={fetchItems}>
                                    <i className="bi bi-arrow-clockwise"></i>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* BREADCRUMBS (MIGAS DE PAN) */}
            <div className={styles.breadcrumbBar}>
                <i className="bi bi-hdd-network text-secondary fs-5"></i>
                <div className={styles.separator}>|</div>
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="d-flex align-items-center gap-2">
                        <span 
                            className={`${styles.breadcrumbItem} ${index === breadcrumbs.length - 1 ? styles.breadcrumbActive : ''}`}
                            onClick={() => handleBreadcrumbClick(crumb, index)}
                        >
                            {crumb.name}
                        </span>
                        {index < breadcrumbs.length - 1 && <i className={`bi bi-chevron-right ${styles.separator}`}></i>}
                    </div>
                ))}
            </div>

            {/* TABLA DE CONTENIDO */}
            <div className={`card ${styles.cardCustom}`}>
                <div className="card-body p-0">
                    <div className={`table-responsive ${styles.tableWrapper}`}>
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4 py-3">Nombre</th>
                                    <th className="py-3">Info</th>
                                    <th className="py-3">Fecha</th>
                                    <th className="py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Cargando...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : fileSystemData.length > 0 ? (
                                    fileSystemData.map((item) => (
                                        <tr key={item.id}>
                                            <td className="ps-4 fw-bold text-secondary">
                                                {item.type === 'folder' ? (
                                                    <i className={`bi bi-hdd-fill ${styles.folderIcon} text-primary`}></i>
                                                ) : (
                                                    <i className={`bi bi-file-earmark-music-fill ${styles.fileIcon} text-success`}></i>
                                                )}
                                                <span className="ms-2">{item.name}</span>
                                            </td>
                                            <td>
                                                {item.type === 'folder' ? (
                                                    <span className="badge bg-light text-dark border">{item.items} archivos</span>
                                                ) : (
                                                    <div className="d-flex flex-column small">
                                                        <span className="text-muted">Duración: {item.duration}</span>
                                                        {/* Renderizado condicional de metadatos si existen */}
                                                        {(item.meta?.cedula || item.meta?.campana) && (
                                                            <span className="text-info" style={{fontSize: '0.75rem'}}>
                                                                {item.meta.cedula ? `CC: ${item.meta.cedula} ` : ''}
                                                                {item.meta.campana ? `| Camp: ${item.meta.campana}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="small text-muted">{item.date}</td>
                                            <td className="text-center">
                                                {item.type === 'folder' ? (
                                                    <button 
                                                        className={`btn btn-sm btn-outline-secondary ${styles.btnOpen}`} 
                                                        onClick={() => handleOpenFolder(item)}
                                                        title="Abrir Carpeta"
                                                    >
                                                        <i className="bi bi-folder2-open me-1"></i> Abrir
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className={`btn btn-sm btn-outline-success ${styles.btnDownload}`} 
                                                        onClick={() => handleDownload(item)}
                                                        title="Descargar Audio"
                                                    >
                                                        <i className="bi bi-download me-1"></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5 text-muted">
                                            <i className="bi bi-search display-4 d-block mb-3 opacity-25"></i>
                                            {currentFolderId === 0 
                                                ? "No hay rutas configuradas en el sistema." 
                                                : "No se encontraron grabaciones con estos filtros."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer bg-white border-0 py-3 text-end text-muted small">
                    Resultados visibles: {fileSystemData.length}
                </div>
            </div>
        </div>
    );
};

export default FolderManager;