import React, { useState, useEffect, useCallback } from 'react';
import styles from './FolderManager.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const FolderManager = () => {
    
    // --- ESTADOS ---
    const [fileSystemData, setFileSystemData] = useState([]); 
    const [currentFolderId, setCurrentFolderId] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    
    // Paginación
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0
    });

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    // Navegación
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 0, name: 'Inicio' }]);

    // --- ALERTA ---
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
    const showAlert = (type, title, message, onConfirm = null) => setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- UTILIDAD ---
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    // --- 1. CARGA DE DATOS ---
    const fetchItems = useCallback(async (page = 1) => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        
        const params = new URLSearchParams({
            page: page, 
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
                
                // Si el backend devuelve estructura paginada (data.data existe)
                if (data.data) {
                    setFileSystemData(data.data);
                    setPagination({
                        currentPage: data.current_page,
                        lastPage: data.last_page,
                        total: data.total,
                        from: data.from,
                        to: data.to
                    });
                } else {
                    // Si es una lista plana (ej: lista de carpetas raíz)
                    setFileSystemData(data);
                    setPagination({ currentPage: 1, lastPage: 1, total: data.length, from: 1, to: data.length });
                }
            }
        } catch (error) { console.error("Error conexión", error); } 
        finally { setIsLoading(false); }
    }, [currentFolderId, searchTerm, dateFrom, dateTo]);

    // Efecto de carga inicial y cambios de filtro (resetea a pág 1)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchItems(1); 
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchItems]);

    // Manejador manual de cambio de página
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchItems(newPage);
        }
    };

    // --- 2. ACCIONES ---
    const handleOpenFolder = (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        setSearchTerm(''); 
        setPagination(prev => ({ ...prev, currentPage: 1 })); 
    };

    const handleBreadcrumbClick = (crumb, index) => {
        setCurrentFolderId(crumb.id);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        setSearchTerm('');
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // --- 3. DESCARGAS ---
    const handleDownload = (item) => {
        const isFolder = item.type === 'folder';
        const sizeInfo = item.size_bytes ? formatBytes(item.size_bytes) : 'Desconocido';
        const title = isFolder ? 'Descargar Carpeta ZIP' : 'Descargar Archivo';
        const msg = isFolder 
            ? `Vas a descargar "${item.name}".\n\nPeso total: ${sizeInfo}.\n\nSe creará un ZIP. ¿Deseas continuar?` 
            : `¿Deseas descargar "${item.name}"?\nPeso: ${sizeInfo}`;

        showAlert('info', title, msg, () => executeDownload(item));
    };

    const executeDownload = async (item) => {
        const token = localStorage.getItem('auth_token');
        const isFolder = item.type === 'folder';
        const url = isFolder 
            ? `http://127.0.0.1:8000/api/folder-manager/download-folder/${item.id}`
            : `http://127.0.0.1:8000/api/folder-manager/download/${item.id}`;

        try {
            showAlert('loading', 'Procesando', isFolder ? 'Comprimiendo carpeta...' : 'Iniciando descarga...');
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });

            if (response.ok) {
                const blob = await response.blob();
                const link = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = link;
                a.download = isFolder ? `${item.name}.zip` : item.name; 
                document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(link); 
                closeAlert();
            } else {
                const errorData = await response.json();
                showAlert('error', 'Error', errorData.message || 'No disponible.');
            }
        } catch (error) { showAlert('error', 'Error', 'Fallo de conexión.'); }
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn} ${styles.fullHeightContainer}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />

            <h2 className={`mb-3 ${styles.pageTitle}`}><i className="bi bi-folder-fill me-2"></i> Gestión de Carpetas</h2>

            {/* FILTROS */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}><i className="bi bi-funnel me-2"></i> Filtros</div>
                <div className="card-body p-3">
                    <form className="row g-2" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-4">
                            <label className={styles.label}>Buscar</label>
                            <input type="text" className="form-control form-control-sm" placeholder="..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Desde</label>
                            <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Hasta</label>
                            <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                             <div className="d-flex w-100 gap-2">
                                <button type="button" className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); }}><i className="bi bi-eraser"></i></button>
                                <button type="button" className={`btn btn-sm flex-fill ${styles.searchBtn}`} onClick={() => fetchItems(1)}><i className="bi bi-arrow-clockwise"></i></button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* BREADCRUMBS */}
            <div className={styles.breadcrumbBar}>
                <i className="bi bi-hdd-network text-secondary fs-5"></i><div className={styles.separator}>|</div>
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="d-flex align-items-center gap-2">
                        <span className={`${styles.breadcrumbItem} ${index === breadcrumbs.length - 1 ? styles.breadcrumbActive : ''}`} onClick={() => handleBreadcrumbClick(crumb, index)}>{crumb.name}</span>
                        {index < breadcrumbs.length - 1 && <i className={`bi bi-chevron-right ${styles.separator}`}></i>}
                    </div>
                ))}
            </div>

            {/* TABLA FLEXIBLE */}
            <div className={`card ${styles.cardCustom} ${styles.cardTable} flex-grow-1`}>
                <div className={`card-body p-0 ${styles.tableContainer}`}>
                    <div className={styles.tableWrapper}>
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4 py-3">Nombre</th>
                                    <th className="py-3">Info / Peso</th>
                                    <th className="py-3">Fecha Original</th>
                                    <th className="py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="4" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                                ) : fileSystemData.length > 0 ? (
                                    fileSystemData.map((item) => (
                                        <tr key={item.id}>
                                            <td className="ps-4">
                                                <div className="d-flex align-items-center">
                                                    {/* ICONO */}
                                                    <div className="me-3">
                                                        {item.type === 'folder' 
                                                            ? <i className={`bi bi-hdd-fill ${styles.folderIcon} text-primary`}></i> 
                                                            : <i className={`bi bi-file-earmark-music-fill ${styles.fileIcon} text-success`}></i>
                                                        }
                                                    </div>
                                                    
                                                    {/* NOMBRE Y RUTA */}
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold text-secondary">{item.name}</span>
                                                        {/* AQUI MOSTRAMOS LA RUTA (PATH) */}
                                                        {item.path && (
                                                            <small className={styles.itemPath} title={item.path}>
                                                                {item.path}
                                                            </small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {item.type === 'folder' ? (
                                                    <div className="d-flex flex-column small">
                                                        <span className="badge bg-light text-dark border w-auto align-self-start mb-1">{item.items} archivos</span>
                                                        <span className="text-muted fw-bold">Peso: {formatBytes(item.size_bytes)}</span>
                                                    </div>
                                                ) : (
                                                    <div className="d-flex flex-column small">
                                                        <span className="text-muted">Dur: {item.duration} | Peso: {formatBytes(item.size_bytes)}</span>
                                                        {(item.meta?.cedula || item.meta?.campana) && (
                                                            <span className="text-info" style={{fontSize: '0.75rem'}}>
                                                                {item.meta.cedula ? `CC: ${item.meta.cedula} ` : ''}{item.meta.campana ? `| ${item.meta.campana}` : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="small text-muted">{item.date}</td>
                                            <td className="text-center">
                                                {item.type === 'folder' ? (
                                                    <>
                                                        <button className={`btn btn-sm btn-outline-secondary me-2 ${styles.btnOpen}`} onClick={() => handleOpenFolder(item)} title="Abrir"><i className="bi bi-folder2-open"></i></button>
                                                        <button className={`btn btn-sm btn-outline-primary ${styles.btnDownload}`} onClick={() => handleDownload(item)} title="ZIP"><i className="bi bi-file-zip"></i></button>
                                                    </>
                                                ) : (
                                                    <button className={`btn btn-sm btn-outline-success ${styles.btnDownload}`} onClick={() => handleDownload(item)} title="Descargar"><i className="bi bi-download"></i></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="text-center py-5 text-muted">{currentFolderId === 0 ? "No hay rutas." : "Carpeta vacía."}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* FOOTER CON PAGINACIÓN */}
                <div className="card-footer bg-white border-0 py-2 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                        {pagination.total > 0 ? `Mostrando ${pagination.from || 0}-${pagination.to || 0} de ${pagination.total}` : '0 resultados'}
                    </div>
                    <div>
                        <button className="btn btn-sm btn-light me-1" 
                            disabled={pagination.currentPage === 1} 
                            onClick={() => handlePageChange(pagination.currentPage - 1)}>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                        <span className="mx-2 align-self-center small">Página {pagination.currentPage} de {pagination.lastPage}</span>
                        <button className="btn btn-sm btn-light ms-1" 
                            disabled={pagination.currentPage === pagination.lastPage} 
                            onClick={() => handlePageChange(pagination.currentPage + 1)}>
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FolderManager;