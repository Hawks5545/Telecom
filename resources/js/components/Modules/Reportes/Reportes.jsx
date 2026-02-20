import React, { useState, useEffect, useCallback } from 'react';
import styles from './Reportes.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const Reportes = () => {
    
    // --- ESTADOS ---
    const [reportData, setReportData] = useState([]);
    // 'current_db' almacena el total real en base de datos
    const [stats, setStats] = useState({ total: 0, descargadas: 0, zip: 0, current_db: 0 });
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filtros
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        userId: ''
    });

    const [maxDate, setMaxDate] = useState('');

    // --- ALERTA ---
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });
    const showAlert = (type, title, message, onConfirm = null) => setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- 1. CARGA DE DATOS ---
    useEffect(() => {
        setMaxDate(new Date().toISOString().split('T')[0]);

        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch('/api/reports/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setUsersList(await res.json());
            } catch (error) { console.error("Error users", error); }
        };
        fetchUsers();
        fetchReportData();
    }, []);

    const fetchReportData = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams(filters);

        try {
            const response = await fetch(`/api/reports/data?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                setReportData(result.data);
                setStats(result.stats);
                setCurrentPage(1); 
            }
        } catch (error) {
            console.error("Error report", error);
            showAlert('error', 'Error', 'No se pudieron cargar los datos del reporte.');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // --- 2. MANEJADORES ---
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleGenerateClick = () => {
        fetchReportData();
    };

    // --- 3. LÓGICA PDF ---
    const handlePdfClick = () => {
        showAlert(
            'info', 
            'Generar Reporte PDF', 
            'Se generará un PDF con los filtros actuales. ¿Deseas continuar?',
            executePdfDownload 
        );
    };

    const executePdfDownload = async () => {
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams(filters);
        
        showAlert('loading', 'Generando PDF', 'Por favor espera...');

        try {
            const response = await fetch(`/api/reports/pdf?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const link = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = link;
                a.download = `Reporte_Gestion_${new Date().toISOString().slice(0,10)}.pdf`;
                document.body.appendChild(a); a.click(); a.remove();
                showAlert('success', 'Descarga Completada', 'El reporte se ha descargado.');
            } else {
                showAlert('error', 'Error', 'No se pudo generar el PDF.');
            }
        } catch (error) {
            showAlert('error', 'Error', 'Fallo de conexión.');
        }
    };

    // --- 4. PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = reportData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reportData.length / itemsPerPage);

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} onConfirm={alertConfig.onConfirm} />

            <h2 className={`mb-3 ${styles.pageTitle}`}>
                <i className="bi bi-file-earmark-bar-graph me-2"></i> Reportes de Gestión
            </h2>

            {/* --- FILTROS --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros
                </div>

                <div className="card-body p-0">
                    <div className={styles.filterContainer}>
                        <form className="row g-2 align-items-end" onSubmit={(e) => e.preventDefault()}>
                            <div className="col-md-3">
                                <label className={styles.label}>Fecha desde</label>
                                <input type="date" className="form-control form-control-sm" name="dateFrom" value={filters.dateFrom} max={maxDate} onChange={handleFilterChange} />
                            </div>
                            <div className="col-md-3">
                                <label className={styles.label}>Fecha hasta</label>
                                <input type="date" className="form-control form-control-sm" name="dateTo" value={filters.dateTo} max={maxDate} onChange={handleFilterChange} />
                            </div>
                            <div className="col-md-3">
                                <label className={styles.label}>Analista / Agente</label>
                                <select className="form-select form-select-sm" name="userId" value={filters.userId} onChange={handleFilterChange}>
                                    <option value="">Todos</option>
                                    {usersList.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-3">
                                <button type="button" className={`btn ${styles.btnGenerate}`} onClick={handleGenerateClick}>
                                    <i className="bi bi-gear-wide-connected me-2"></i> Generar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- ESTADÍSTICAS (AHORA TODAS SON UNIFORMES) --- */}
            <div className="row g-3 mb-3">
                <div className="col-md-3">
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.total}</div>
                        <div className={styles.statLabel}>Total Indexados (Histórico)</div>
                    </div>
                </div>

                {/* Esta tarjeta ahora usa el estilo CSS por defecto (Verde) */}
                <div className="col-md-3">
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.current_db}</div>
                        <div className={styles.statLabel}>Total en Base de Datos (Actual)</div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.descargadas}</div>
                        <div className={styles.statLabel}>Descargas (Individual)</div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.zip}</div>
                        <div className={styles.statLabel}>ZIPs Generados</div>
                    </div>
                </div>
            </div>

            {/* --- TABLA DETALLE --- */}
            <div className={`card ${styles.cardCustom} mb-0`}>
                <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 className="m-0 fw-bold text-secondary" style={{fontSize: '0.9rem'}}>Detalle Diario por Agente</h6>
                    
                    <button className={`btn btn-sm btn-outline-danger ${styles.btnPdf}`} onClick={handlePdfClick} disabled={reportData.length === 0}>
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> PDF
                    </button>
                </div>

                <div className="card-body p-0">
                    <div className={`table-responsive ${styles.tableWrapper}`}>
                        <table className="table table-hover mb-0 align-middle text-center table-sm">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="text-start ps-4">Fecha</th>
                                    <th className="text-start">Agente</th>
                                    <th>Indexados (Archivos)</th>
                                    <th>Descargas (Uni)</th>
                                    <th>ZIPs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="5" className="py-5">Cargando datos...</td></tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map((row) => (
                                        <tr key={row.id}>
                                            <td className="text-start ps-4 text-muted small">{row.fecha}</td>
                                            <td className="text-start fw-bold text-secondary small">{row.agente}</td>
                                            <td><span className="badge bg-light text-dark border">{row.totalGrabaciones}</span></td>
                                            <td className="text-success fw-bold small">{row.descargadas}</td>
                                            <td className="text-primary small">{row.zipGenerados}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" className="py-5 text-muted">No hay datos para mostrar con estos filtros.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- FOOTER PAGINACIÓN --- */}
                {reportData.length > 0 && (
                    <div className="card-footer bg-white border-0 py-2 d-flex justify-content-between align-items-center">
                        <div className="text-muted small" style={{fontSize: '0.75rem'}}>
                            {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, reportData.length)} de {reportData.length}
                        </div>
                        
                        <nav>
                            <ul className="pagination mb-0 gap-1">
                                <li>
                                    <button className={`btn btn-sm btn-light ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                </li>
                                <li className="d-flex align-items-center px-2 small">Pág {currentPage} de {totalPages}</li>
                                <li>
                                    <button className={`btn btn-sm btn-light ${currentPage === totalPages ? 'disabled' : ''}`} onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reportes;