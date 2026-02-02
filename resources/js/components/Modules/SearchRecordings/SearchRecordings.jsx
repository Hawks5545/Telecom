import React, { useState, useEffect } from 'react';
import styles from './SearchRecordings.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const SearchRecordings = () => {
    
    // --- ESTADOS ---
    const [allData, setAllData] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Paginación del Backend
    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0
    });

    // Filtros (Incluye Teléfono ahora)
    const [filters, setFilters] = useState({
        cedula: '',
        telefono: '',
        dateFrom: '',
        dateTo: '',
        folderId: '',
        campana: ''
    });

    // --- ALERTA ---
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
    const showAlert = (type, title, message, onConfirm = null) => setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- CARGA INICIAL ---
    useEffect(() => {
        fetchFolders();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchResults(pagination.currentPage), 500);
        return () => clearTimeout(timer);
    }, [filters, pagination.currentPage]);

    // --- API CALLS ---
    const fetchFolders = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('http://127.0.0.1:8000/api/search/folders', { headers: { 'Authorization': `Bearer ${token}` }});
            if (res.ok) setFolders(await res.json());
        } catch (error) { console.error("Error cargando carpetas", error); }
    };

    const fetchResults = async (page = 1) => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams({ page, ...filters });

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/search/results?${params}`, { headers: { 'Authorization': `Bearer ${token}` }});
            if (res.ok) {
                const data = await res.json();
                setAllData(data.data);
                setPagination({
                    currentPage: data.current_page,
                    lastPage: data.last_page,
                    total: data.total,
                    from: data.from,
                    to: data.to
                });
            }
        } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };

    // --- MANEJADORES ---
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPagination({ ...pagination, currentPage: 1 });
    };

    const clearFilters = () => {
        setFilters({ cedula: '', telefono: '', dateFrom: '', dateTo: '', folderId: '', campana: '' });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) setSelectedItems([...new Set([...selectedItems, ...allData.map(i => i.id)])]);
        else setSelectedItems(selectedItems.filter(id => !allData.map(i => i.id).includes(id)));
    };

    const handleCheckboxChange = (id) => {
        if (selectedItems.includes(id)) setSelectedItems(selectedItems.filter(i => i !== id));
        else setSelectedItems([...selectedItems, id]);
    };

    // --- DESCARGAS ---
    const handleSingleDownload = async (item) => {
        const token = localStorage.getItem('auth_token');
        try {
            showAlert('loading', 'Descargando...', 'Preparando archivo...');
            const res = await fetch(`http://127.0.0.1:8000/api/folder-manager/download/${item.id}`, { headers: { 'Authorization': `Bearer ${token}` }});
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = item.filename;
                document.body.appendChild(a); a.click(); a.remove(); closeAlert();
            } else { showAlert('error', 'Error', 'Archivo no encontrado.'); }
        } catch (e) { showAlert('error', 'Error', 'Fallo de conexión.'); }
    };

    const handleMassiveDownload = () => {
        showAlert('info', 'Descarga Masiva', `Se comprimirán ${selectedItems.length} archivos. ¿Continuar?`, executeZipDownload);
    };

    const executeZipDownload = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            showAlert('loading', 'Comprimiendo...', 'Generando ZIP...');
            const res = await fetch('http://127.0.0.1:8000/api/search/download-zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ids: selectedItems })
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `seleccion_${Date.now()}.zip`;
                document.body.appendChild(a); a.click(); a.remove(); setSelectedItems([]); closeAlert();
            } else { showAlert('error', 'Error', 'No se pudo crear el ZIP.'); }
        } catch (e) { showAlert('error', 'Error', 'Fallo de conexión.'); }
    };

    const isAllSelected = allData.length > 0 && allData.every(item => selectedItems.includes(item.id));

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className={styles.pageTitle}><i className="bi bi-music-note-list me-2"></i> Búsqueda de Grabaciones</h2>
                {selectedItems.length > 0 && (
                    <button className={`btn ${styles.btnDownloadMassive}`} onClick={handleMassiveDownload}>
                        <i className="bi bi-cloud-download-fill me-2"></i> Descargar ({selectedItems.length})
                    </button>
                )}
            </div>

            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}><i className="bi bi-funnel me-2"></i> Filtros</div>
                <div className="card-body p-4">
                    <form className="row g-3">
                        <div className="col-md-2"><label className={styles.label}>Cédula</label><input className="form-control" name="cedula" value={filters.cedula} onChange={handleFilterChange} placeholder="1098..." /></div>
                        
                        {/* NUEVO CAMPO TELEFONO */}
                        <div className="col-md-2"><label className={styles.label}>Teléfono</label><input className="form-control" name="telefono" value={filters.telefono} onChange={handleFilterChange} placeholder="300..." /></div>
                        
                        <div className="col-md-3"><label className={styles.label}>Campaña</label><input className="form-control" name="campana" value={filters.campana} onChange={handleFilterChange} placeholder="Escribe..." /></div>
                        <div className="col-md-2"><label className={styles.label}>Desde</label><input type="date" className="form-control" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} /></div>
                        <div className="col-md-3"><label className={styles.label}>Hasta</label><input type="date" className="form-control" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} /></div>
                        
                        <div className="col-md-6"><label className={styles.label}>Carpeta</label>
                            <select className="form-select" name="folderId" value={filters.folderId} onChange={handleFilterChange}>
                                <option value="">Todas</option>
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name || f.path}</option>)}
                            </select>
                        </div>

                        <div className="col-md-6 d-flex align-items-end justify-content-end">
                            <button type="button" className="btn btn-outline-secondary me-2 flex-fill" onClick={clearFilters}><i className="bi bi-eraser"></i> Limpiar</button>
                            <button type="button" className={`btn flex-fill ${styles.btnSearch}`} onClick={() => fetchResults(1)}><i className="bi bi-search"></i> Buscar</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={`card ${styles.cardCustom}`}>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4"><input className={`form-check-input ${styles.checkbox}`} type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                    <th>Cédula</th>
                                    <th>Teléfono</th> {/* NUEVA COLUMNA */}
                                    <th>Nombre Archivo</th>
                                    <th>Fecha</th>
                                    <th>Campaña</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? <tr><td colSpan="7" className="text-center py-5">Cargando...</td></tr> : 
                                 allData.length > 0 ? allData.map((item) => (
                                    <tr key={item.id}>
                                        <td className="ps-4"><input className={`form-check-input ${styles.checkbox}`} type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleCheckboxChange(item.id)} /></td>
                                        <td className="fw-bold text-secondary">{item.cedula || '---'}</td>
                                        
                                        {/* NUEVO DATO EN FILA */}
                                        <td className="text-primary small">{item.telefono || '---'}</td>
                                        
                                        <td className="text-break small" style={{maxWidth:'200px'}}>{item.filename}</td>
                                        <td>{new Date(item.fecha_grabacion).toLocaleString()}</td>
                                        <td><span className="badge bg-light text-dark border">{item.campana || 'N/A'}</span></td>
                                        <td className="text-center"><button className="btn btn-sm btn-outline-success" onClick={() => handleSingleDownload(item)}><i className="bi bi-download"></i></button></td>
                                    </tr>
                                )) : <tr><td colSpan="7" className="text-center py-5">No se encontraron resultados.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-end">
                    <button className="btn btn-sm btn-light me-1" disabled={pagination.currentPage === 1} onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}><i className="bi bi-chevron-left"></i></button>
                    <span className="mx-2 align-self-center small">Página {pagination.currentPage} de {pagination.lastPage}</span>
                    <button className="btn btn-sm btn-light ms-1" disabled={pagination.currentPage === pagination.lastPage} onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}><i className="bi bi-chevron-right"></i></button>
                </div>
            </div>
        </div>
    );
};

export default SearchRecordings;