import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './FolderManager.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const FolderManager = () => {
    
    // --- ESTADOS ---
    const [viewType, setViewType] = useState('virtual'); 
    const [fileSystemData, setFileSystemData] = useState([]); 
    const [currentFolderId, setCurrentFolderId] = useState(0); 
    const [isLoading, setIsLoading] = useState(false);
    
    // Selección y Movimiento
    const [selectedItems, setSelectedItems] = useState([]);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [targetFolderId, setTargetFolderId] = useState('');
    const [allFolders, setAllFolders] = useState([]); 
    const [isMoving, setIsMoving] = useState(false);

    // Paginación
    const [pagination, setPagination] = useState({ currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 });

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [maxDate, setMaxDate] = useState('');

    // Navegación
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 0, name: 'Inicio' }]);

    // Estados Modales (Crear/Editar)
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingFolder, setEditingFolder] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Alertas
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
    const showAlert = (type, title, message, onConfirm = null) => setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // Referencias para optimización (Evitar llamadas dobles)
    const isFirstRender = useRef(true);

    // --- UTILIDAD ---
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    useEffect(() => {
        setMaxDate(new Date().toISOString().split('T')[0]);
    }, []);

    // --- 1. CARGA DE DATOS PRINCIPAL ---
    const fetchItems = useCallback(async (page = 1) => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        
        const params = new URLSearchParams({
            page: page, 
            parentId: currentFolderId,
            search: searchTerm,
            dateFrom: dateFrom,
            dateTo: dateTo,
            viewType: viewType 
        });

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/folder-manager/items?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
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
                    setFileSystemData(data);
                    setPagination({ currentPage: 1, lastPage: 1, total: data.length, from: 1, to: data.length });
                }
                setSelectedItems([]);
            }
        } catch (error) { console.error("Error conexión", error); } 
        finally { setIsLoading(false); }
    }, [currentFolderId, searchTerm, dateFrom, dateTo, viewType]);

    // OPTIMIZACIÓN DEL LAG: Separar efectos
    // 1. Carga INMEDIATA al cambiar de pestaña (viewType) o abrir carpeta (currentFolderId)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return; // Evita doble renderizado inicial en React
        }
        fetchItems(1);
    }, [currentFolderId, viewType]); // <- Sin setTimeout, respuesta instantánea

    // 2. Carga CON RETRASO (Debounce) solo al escribir en el buscador o fechas
    useEffect(() => {
        if (searchTerm === '' && dateFrom === '' && dateTo === '') return; // Si están vacíos, no hacer nada (ya lo hizo el primer useEffect)
        
        const timer = setTimeout(() => { 
            fetchItems(1); 
        }, 600); // 600ms solo para el tipeo
        
        return () => clearTimeout(timer);
    }, [searchTerm, dateFrom, dateTo]);


    // Cargar lista de carpetas para modal
    const fetchAllFolders = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            const res = await fetch('http://127.0.0.1:8000/api/search/folders', { headers: { 'Authorization': `Bearer ${token}` }});
            if (res.ok) setAllFolders(await res.json());
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (showMoveModal && allFolders.length === 0) {
            fetchAllFolders(); // Solo carga si el array está vacío (Evita llamadas de red innecesarias)
        }
    }, [showMoveModal]);

    // --- MÉTODOS DE ACCIÓN (Mantienen tu misma lógica) ---
    const handleSaveFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        setIsSaving(true);
        const token = localStorage.getItem('auth_token');

        const url = editingFolder 
            ? `http://127.0.0.1:8000/api/folder-manager/${editingFolder.id}`
            : 'http://127.0.0.1:8000/api/folder-manager/create';
        
        const method = editingFolder ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName })
            });

            const data = await response.json();

            if (response.ok) {
                setShowCreateModal(false);
                setNewFolderName('');
                setEditingFolder(null);
                showAlert('success', '¡Éxito!', editingFolder ? 'Carpeta actualizada.' : 'Campaña creada.');
                fetchItems(pagination.currentPage);
            } else {
                showAlert('error', 'Error', data.message || 'Ocurrió un error.');
            }
        } catch (error) { showAlert('error', 'Error', 'Intente nuevamente.'); } 
        finally { setIsSaving(false); }
    };

    const handleDeleteFolder = (folder) => {
        showAlert('delete', 'Eliminar Carpeta', `¿Estás seguro de eliminar "${folder.name}"?`, async () => {
            const token = localStorage.getItem('auth_token');
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/folder-manager/${folder.id}`, {
                    method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    showAlert('success', 'Eliminado', 'La carpeta ha sido eliminada.');
                    fetchItems(pagination.currentPage);
                } else {
                    showAlert('error', 'No se pudo eliminar', data.message);
                }
            } catch (e) { showAlert('error', 'Error', 'Fallo de conexión.'); }
        });
    };

    const handleMoveRecordings = async () => {
        if (!targetFolderId) return;
        setIsMoving(true);
        const token = localStorage.getItem('auth_token');
        try {
            const res = await fetch('http://127.0.0.1:8000/api/search/move', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ids: selectedItems, target_folder_id: targetFolderId })
            });
            const data = await res.json();
            if (res.ok) {
                setShowMoveModal(false); 
                setSelectedItems([]); 
                setTargetFolderId('');
                showAlert('success', 'Movimiento Exitoso', data.message);
                fetchItems(pagination.currentPage);
            } else {
                showAlert('error', 'Error', data.message);
            }
        } catch (e) { showAlert('error', 'Error', 'Fallo de conexión'); } 
        finally { setIsMoving(false); }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const fileIds = fileSystemData.filter(i => i.type === 'file').map(i => i.id);
            setSelectedItems(fileIds);
        } else {
            setSelectedItems([]);
        }
    };
    
    const handleCheckbox = (id) => {
        if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id));
        else setSelectedItems([...selectedItems, id]);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) fetchItems(newPage);
    };

    const handleOpenFolder = (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        setSearchTerm(''); 
        setPagination(prev => ({ ...prev, currentPage: 1 })); 
    };

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
        const timestamp = new Date().getTime();
        const url = isFolder 
            ? `http://127.0.0.1:8000/api/folder-manager/download-folder/${item.id}?t=${timestamp}`
            : `http://127.0.0.1:8000/api/folder-manager/download/${item.id}?t=${timestamp}`;

        try {
            showAlert('loading', isFolder ? 'Comprimiendo...' : 'Descargando...', 'Por favor espera...');
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

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className={`container-fluid p-0 ${styles.fadeIn} ${styles.fullHeightContainer}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />

            {/* HEADER */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className={styles.pageTitle}><i className="bi bi-folder-fill me-2"></i> Gestión de Carpetas</h2>
                
                {currentFolderId === 0 && viewType === 'virtual' && (
                    <button className={`btn ${styles.btnPrimaryCustom} shadow-sm`} onClick={() => { setEditingFolder(null); setNewFolderName(''); setShowCreateModal(true); }}>
                        <i className="bi bi-plus-circle-fill me-2"></i> Nueva Campaña
                    </button>
                )}
            </div>

            {/* PESTAÑAS (TABS) CORPORATIVAS */}
            {currentFolderId === 0 && (
                <ul className="nav nav-tabs mb-4 border-bottom">
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${styles.customTab} ${viewType === 'virtual' ? styles.customTabActive : ''}`} 
                            onClick={() => { setViewType('virtual'); setPagination({...pagination, currentPage: 1}); }}
                        >
                            <i className="bi bi-star-fill me-2"></i> Campañas Comerciales
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${styles.customTab} ${viewType === 'physical' ? styles.customTabActive : ''}`} 
                            onClick={() => { setViewType('physical'); setPagination({...pagination, currentPage: 1}); }}
                        >
                            <i className="bi bi-inbox-fill me-2"></i> Bandeja de Entrada (Importaciones)
                        </button>
                    </li>
                </ul>
            )}

            {/* BARRA DE ACCIONES DE SELECCIÓN */}
            {selectedItems.length > 0 && (
                <div className={`d-flex justify-content-between align-items-center p-2 mb-3 shadow-sm ${styles.selectionBar}`}>
                    <span className="fw-bold ms-2"><i className="bi bi-check-square-fill me-2"></i> {selectedItems.length} archivos seleccionados</span>
                    <button className={`btn btn-sm ${styles.btnPrimaryCustom}`} onClick={() => setShowMoveModal(true)}>
                        <i className="bi bi-folder-symlink-fill me-2"></i> Mover a Campaña
                    </button>
                </div>
            )}

            {/* FILTROS */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}><i className="bi bi-funnel me-2"></i> Filtros</div>
                <div className="card-body p-3">
                    <form className="row g-2" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-4">
                            <label className={styles.label}>Buscar (Nombre o Cédula)</label>
                            <input type="text" className="form-control form-control-sm" placeholder="..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Desde</label>
                            <input type="date" className="form-control form-control-sm" value={dateFrom} max={maxDate} onChange={(e) => setDateFrom(e.target.value)} />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Hasta</label>
                            <input type="date" className="form-control form-control-sm" value={dateTo} max={maxDate} onChange={(e) => setDateTo(e.target.value)} />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                             <div className="d-flex w-100 gap-2">
                                <button type="button" className="btn btn-sm btn-outline-secondary flex-fill" onClick={() => { setSearchTerm(''); setDateFrom(''); setDateTo(''); fetchItems(1); }}><i className="bi bi-eraser"></i></button>
                                <button type="button" className={`btn btn-sm flex-fill ${styles.searchBtn}`} onClick={() => fetchItems(1)}><i className="bi bi-arrow-clockwise"></i></button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* BREADCRUMBS */}
            <div className={styles.breadcrumbBar}>
                <span className={`${styles.breadcrumbItem} ${currentFolderId === 0 ? styles.breadcrumbActive : ''}`} onClick={() => { setCurrentFolderId(0); setBreadcrumbs([{id:0, name:'Inicio'}]); }}>Inicio</span>
                {breadcrumbs.slice(1).map((crumb, idx) => (
                    <span key={crumb.id} className={styles.breadcrumbItem}> / {crumb.name}</span>
                ))}
            </div>

            {/* TABLA */}
            <div className={`card ${styles.cardCustom} ${styles.cardTable} flex-grow-1`}>
                <div className={`card-body p-0 ${styles.tableContainer}`}>
                    <div className={styles.tableWrapper}>
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    {currentFolderId !== 0 && (
                                        <th style={{width:'40px'}} className="ps-4">
                                            <input className="form-check-input" type="checkbox" onChange={handleSelectAll} checked={fileSystemData.length > 0 && fileSystemData.every(i => i.type === 'folder' || selectedItems.includes(i.id))} />
                                        </th>
                                    )}
                                    <th className={currentFolderId === 0 ? "ps-4" : ""}>Nombre</th>
                                    <th>Info / Peso</th>
                                    <th>Fecha</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                                ) : fileSystemData.length > 0 ? (
                                    fileSystemData.map((item) => (
                                        <tr key={item.id}>
                                            {currentFolderId !== 0 && (
                                                <td className="ps-4">
                                                    {item.type === 'file' && <input className="form-check-input" type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleCheckbox(item.id)} />}
                                                </td>
                                            )}
                                            <td className={currentFolderId === 0 ? "ps-4" : ""}>
                                                <div className="d-flex align-items-center">
                                                    <div className="me-3">
                                                        {item.type === 'folder' 
                                                            ? <i className={`bi bi-hdd-fill ${styles.folderIcon}`}></i> 
                                                            : <i className={`bi bi-file-earmark-music-fill ${styles.fileIcon}`}></i>
                                                        }
                                                    </div>
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold text-secondary">{item.name}</span>
                                                        {item.path && <small className={styles.itemPath} title={item.path}>{item.path}</small>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex flex-column small">
                                                    {item.type === 'folder' ? (
                                                        <>
                                                            <span className="badge bg-light text-dark border w-auto align-self-start mb-1">{item.items} archivos</span>
                                                            <span className="text-muted">Peso: {formatBytes(item.size_bytes)}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="text-muted">Dur: {item.duration} | Peso: {formatBytes(item.size_bytes)}</span>
                                                            {(item.meta?.cedula || item.meta?.campana) && <span className="text-info" style={{fontSize: '0.75rem', color: '#005461 !important'}}>{item.meta.cedula ? `CC: ${item.meta.cedula} ` : ''}{item.meta.campana ? `| ${item.meta.campana}` : ''}</span>}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="small text-muted">{item.date}</td>
                                            <td className="text-center">
                                                {item.type === 'folder' ? (
                                                    <>
                                                        <button className={`btn btn-sm btn-outline-secondary me-1`} onClick={() => handleOpenFolder(item)} title="Abrir"><i className="bi bi-folder2-open"></i></button>
                                                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setEditingFolder(item); setNewFolderName(item.name); setShowCreateModal(true); }}><i className="bi bi-pencil"></i></button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteFolder(item)}><i className="bi bi-trash"></i></button>
                                                    </>
                                                ) : (
                                                    <button className={`btn btn-sm btn-outline-success`} onClick={() => handleDownload(item)} title="Descargar"><i className="bi bi-download"></i></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="text-center py-5 text-muted">No hay elementos en esta vista.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* FOOTER PAGINACIÓN */}
                {currentFolderId !== 0 && (
                    <div className="card-footer bg-white border-0 py-2 d-flex justify-content-between align-items-center">
                        <div className="text-muted small">Mostrando {pagination.from || 0}-{pagination.to || 0} de {pagination.total}</div>
                        <div>
                            <button className="btn btn-sm btn-light me-1" disabled={pagination.currentPage === 1} onClick={() => handlePageChange(pagination.currentPage - 1)}><i className="bi bi-chevron-left"></i></button>
                            <span className="mx-2 align-self-center small">Página {pagination.currentPage}</span>
                            <button className="btn btn-sm btn-light ms-1" disabled={pagination.currentPage === pagination.lastPage} onClick={() => handlePageChange(pagination.currentPage + 1)}><i className="bi bi-chevron-right"></i></button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CREAR / EDITAR */}
            {showCreateModal && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className={`modal-header ${styles.modalHeaderCustom}`}>
                                <h5 className="modal-title"><i className="bi bi-folder-plus me-2"></i> {editingFolder ? 'Editar Carpeta' : 'Nueva Campaña'}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <form onSubmit={handleSaveFolder}>
                                <div className="modal-body py-4">
                                    <div className="mb-3">
                                        <label className="form-label fw-bold" style={{color: '#005461'}}>Nombre de la Campaña</label>
                                        <input type="text" className="form-control form-control-lg" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus required />
                                    </div>
                                </div>
                                <div className={`modal-footer ${styles.modalFooterCustom}`}>
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                                    <button type="submit" className={`btn ${styles.btnPrimaryCustom}`} disabled={isSaving}>
                                        {isSaving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-save me-2"></i>} Guardar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL MOVER */}
            {showMoveModal && (
                <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className={`modal-header ${styles.modalHeaderCustom}`}>
                                <h5 className="modal-title"><i className="bi bi-folder-symlink-fill me-2"></i> Mover a Campaña</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowMoveModal(false)}></button>
                            </div>
                            <div className="modal-body py-4">
                                <p style={{color: '#546e7a'}}>Selecciona la Campaña destino para los <strong style={{color: '#005461'}}>{selectedItems.length} archivos</strong> seleccionados:</p>
                                
                                {allFolders.length === 0 ? (
                                    <div className="text-center py-3"><span className="spinner-border text-primary"></span><p className="mt-2 text-muted">Cargando campañas...</p></div>
                                ) : (
                                    <select className="form-select form-select-lg border-primary" value={targetFolderId} onChange={(e) => setTargetFolderId(e.target.value)}>
                                        <option value="">-- Selecciona --</option>
                                        {allFolders.filter(f => f.path && f.path.startsWith('VIRTUAL')).map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className={`modal-footer ${styles.modalFooterCustom}`}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowMoveModal(false)}>Cancelar</button>
                                <button type="button" className={`btn ${styles.btnSecondaryCustom}`} onClick={handleMoveRecordings} disabled={isMoving || !targetFolderId || allFolders.length === 0}>
                                    {isMoving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>} Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FolderManager;