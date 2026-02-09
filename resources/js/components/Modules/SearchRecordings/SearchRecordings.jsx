import React, { useState, useEffect, useMemo } from 'react';
import styles from './SearchRecordings.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const SearchRecordings = () => {
    
    // --- ESTADOS ---
    const [allData, setAllData] = useState([]);
    const [folders, setFolders] = useState([]);
    
    // Mantenemos los IDs seleccionados
    const [selectedItems, setSelectedItems] = useState([]);
    // Mantenemos un mapa de los pesos de los items seleccionados { id: bytes }
    const [selectedSizes, setSelectedSizes] = useState({});

    const [isLoading, setIsLoading] = useState(false);
    
    const [pagination, setPagination] = useState({
        currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0
    });

    const [filters, setFilters] = useState({
        cedula: '', telefono: '', dateFrom: '', dateTo: '', folderId: '', campana: ''
    });

    // Estado para la fecha máxima (HOY)
    const [maxDate, setMaxDate] = useState('');

    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
    const showAlert = (type, title, message, onConfirm = null) => setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- UTILIDAD: FORMATEAR BYTES ---
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    // --- CÁLCULO TOTAL SELECCIONADO ---
    const totalSelectedSize = useMemo(() => {
        const totalBytes = Object.values(selectedSizes).reduce((acc, curr) => acc + curr, 0);
        return formatBytes(totalBytes);
    }, [selectedSizes]);

    // --- CARGA ---
    useEffect(() => { 
        fetchFolders(); 
        // Establecer la fecha máxima como HOY
        setMaxDate(new Date().toISOString().split('T')[0]);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchResults(pagination.currentPage), 500);
        return () => clearTimeout(timer);
    }, [filters, pagination.currentPage]);

    // --- API ---
    const fetchFolders = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('http://127.0.0.1:8000/api/search/folders', { headers: { 'Authorization': `Bearer ${token}` }});
            if (res.ok) setFolders(await res.json());
        } catch (error) { console.error(error); }
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

    // --- EVENTOS ---
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPagination({ ...pagination, currentPage: 1 });
    };

    const clearFilters = () => {
        setFilters({ cedula: '', telefono: '', dateFrom: '', dateTo: '', folderId: '', campana: '' });
    };

    // --- LÓGICA DE SELECCIÓN Y SUMA DE PESOS ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // Agregar IDs de la página actual
            const newIds = allData.map(i => i.id);
            const uniqueIds = [...new Set([...selectedItems, ...newIds])];
            setSelectedItems(uniqueIds);

            // Agregar Pesos de la página actual al mapa
            const newSizes = { ...selectedSizes };
            allData.forEach(item => {
                newSizes[item.id] = item.size || 0;
            });
            setSelectedSizes(newSizes);
        } else {
            // Remover IDs de la página actual
            const currentIds = allData.map(i => i.id);
            setSelectedItems(selectedItems.filter(id => !currentIds.includes(id)));

            // Remover Pesos
            const newSizes = { ...selectedSizes };
            currentIds.forEach(id => delete newSizes[id]);
            setSelectedSizes(newSizes);
        }
    };

    const handleCheckboxChange = (id) => {
        if (selectedItems.includes(id)) {
            // Deseleccionar: Quitamos ID y quitamos su peso
            setSelectedItems(selectedItems.filter(i => i !== id));
            const newSizes = { ...selectedSizes };
            delete newSizes[id];
            setSelectedSizes(newSizes);
        } else {
            // Seleccionar: Agregamos ID y buscamos su peso en allData
            const item = allData.find(i => i.id === id);
            if (item) {
                setSelectedItems([...selectedItems, id]);
                setSelectedSizes({ ...selectedSizes, [id]: item.size || 0 });
            }
        }
    };

    // --- DESCARGAS ---
    const handleSingleDownload = async (item) => {
        const token = localStorage.getItem('auth_token');
        try {
            showAlert('loading', 'Descargando...', `Peso: ${formatBytes(item.size)}`);
            
            // --- AQUÍ ESTÁ EL FIX ANTI-CACHÉ ---
            const timestamp = new Date().getTime(); // Genera un número único
            const url = `http://127.0.0.1:8000/api/search/download/${item.id}?t=${timestamp}`;

            const res = await fetch(url, { 
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const urlObj = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = urlObj; a.download = item.filename;
                document.body.appendChild(a); a.click(); a.remove(); 
                window.URL.revokeObjectURL(urlObj); // Buena práctica: limpiar memoria
                closeAlert();
            } else { 
                showAlert('error', 'Error', 'Archivo no encontrado.'); 
            }
        } catch (e) { 
            showAlert('error', 'Error', 'Fallo de conexión.'); 
        }
    };

    const handleMassiveDownload = () => {
        showAlert('info', 'Descarga Masiva', `Se comprimirán ${selectedItems.length} archivos.\n\nPeso Total Estimado: ${totalSelectedSize}.\n\n¿Deseas continuar?`, executeZipDownload);
    };

    const executeZipDownload = async () => {
        const token = localStorage.getItem('auth_token');
        try {
            showAlert('loading', 'Comprimiendo...', `Procesando ${totalSelectedSize}... esto puede tardar.`);
            const res = await fetch('http://127.0.0.1:8000/api/search/download-zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ids: selectedItems })
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `seleccion_${Date.now()}.zip`;
                document.body.appendChild(a); a.click(); a.remove(); 
                window.URL.revokeObjectURL(url);
                
                // Limpiar selección tras descarga exitosa
                setSelectedItems([]);
                setSelectedSizes({});
                
                closeAlert();
            } else { showAlert('error', 'Error', 'No se pudo crear el ZIP o archivos no encontrados.'); }
        } catch (e) { showAlert('error', 'Error', 'Fallo de conexión.'); }
    };

    const isAllSelected = allData.length > 0 && allData.every(item => selectedItems.includes(item.id));

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn} ${styles.fullHeightContainer}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className={styles.pageTitle}><i className="bi bi-music-note-list me-2"></i> Búsqueda de Grabaciones</h2>
                {selectedItems.length > 0 && (
                    <button className={`btn ${styles.btnDownloadMassive}`} onClick={handleMassiveDownload}>
                        <i className="bi bi-cloud-download-fill me-2"></i> 
                        Descargar {selectedItems.length} ({totalSelectedSize})
                    </button>
                )}
            </div>

            {/* FILTROS */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}><i className="bi bi-funnel me-2"></i> Filtros</div>
                <div className="card-body p-3">
                    <form className="row g-2">
                        <div className="col-md-2"><label className={styles.label}>Cédula</label><input className="form-control form-control-sm" name="cedula" value={filters.cedula} onChange={handleFilterChange} placeholder="1098..." /></div>
                        <div className="col-md-2"><label className={styles.label}>Teléfono</label><input className="form-control form-control-sm" name="telefono" value={filters.telefono} onChange={handleFilterChange} placeholder="300..." /></div>
                        <div className="col-md-3"><label className={styles.label}>Campaña</label><input className="form-control form-control-sm" name="campana" value={filters.campana} onChange={handleFilterChange} placeholder="Escribe..." /></div>
                        
                        {/* INPUTS DE FECHA CON MAX DATE APLICADO */}
                        <div className="col-md-2">
                            <label className={styles.label}>Desde</label>
                            <input 
                                type="date" 
                                className="form-control form-control-sm" 
                                name="dateFrom" 
                                value={filters.dateFrom} 
                                max={maxDate} // BLOQUEO FUTURO
                                onChange={handleFilterChange} 
                            />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Hasta</label>
                            <input 
                                type="date" 
                                className="form-control form-control-sm" 
                                name="dateTo" 
                                value={filters.dateTo} 
                                max={maxDate} // BLOQUEO FUTURO
                                onChange={handleFilterChange} 
                            />
                        </div>
                        
                        <div className="col-md-6"><label className={styles.label}>Carpeta</label>
                            <select className="form-select form-select-sm" name="folderId" value={filters.folderId} onChange={handleFilterChange}>
                                <option value="">Todas</option>
                                {folders.map(f => <option key={f.id} value={f.id}>{f.name || f.path}</option>)}
                            </select>
                        </div>

                        <div className="col-md-6 d-flex align-items-end justify-content-end gap-2">
                            <button type="button" className="btn btn-sm btn-outline-secondary flex-fill" onClick={clearFilters}><i className="bi bi-eraser"></i> Limpiar</button>
                            <button type="button" className={`btn btn-sm flex-fill ${styles.btnSearch}`} onClick={() => fetchResults(1)}><i className="bi bi-search"></i> Buscar</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* TABLA */}
            <div className={`card ${styles.cardCustom} ${styles.cardTable} flex-grow-1`}>
                <div className={`card-body p-0 ${styles.tableContainer}`}>
                    <div className={styles.tableWrapper}>
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4" style={{width: '40px'}}><input className={`form-check-input ${styles.checkbox}`} type="checkbox" checked={isAllSelected} onChange={handleSelectAll} /></th>
                                    <th>Cédula</th>
                                    <th>Teléfono</th> 
                                    <th>Nombre Archivo</th>
                                    <th>Peso</th>
                                    <th>Fecha</th>
                                    <th>Campaña</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? <tr><td colSpan="8" className="text-center py-5">Cargando...</td></tr> : 
                                 allData.length > 0 ? allData.map((item) => (
                                    <tr key={item.id}>
                                        <td className="ps-4"><input className={`form-check-input ${styles.checkbox}`} type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => handleCheckboxChange(item.id)} /></td>
                                        <td className="fw-bold text-secondary">{item.cedula || '---'}</td>
                                        <td className="text-primary small">{item.telefono || '---'}</td>
                                        <td className="text-break small" style={{maxWidth:'200px'}}>{item.filename}</td>
                                        <td className="small text-muted fw-bold">{formatBytes(item.size)}</td>
                                        <td className="small">{new Date(item.fecha_grabacion).toLocaleString()}</td>
                                        <td><span className="badge bg-light text-dark border">{item.campana || 'N/A'}</span></td>
                                        <td className="text-center"><button className="btn btn-sm btn-outline-success" onClick={() => handleSingleDownload(item)} title={`Descargar (${formatBytes(item.size)})`}><i className="bi bi-download"></i></button></td>
                                    </tr>
                                )) : <tr><td colSpan="8" className="text-center py-5">No se encontraron resultados.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div className="card-footer bg-white border-0 py-2 d-flex justify-content-end">
                    <button className="btn btn-sm btn-light me-1" disabled={pagination.currentPage === 1} onClick={() => setPagination({...pagination, currentPage: pagination.currentPage - 1})}><i className="bi bi-chevron-left"></i></button>
                    <span className="mx-2 align-self-center small">Página {pagination.currentPage} de {pagination.lastPage}</span>
                    <button className="btn btn-sm btn-light ms-1" disabled={pagination.currentPage === pagination.lastPage} onClick={() => setPagination({...pagination, currentPage: pagination.currentPage + 1})}><i className="bi bi-chevron-right"></i></button>
                </div>
            </div>
        </div>
    );
};

export default SearchRecordings;