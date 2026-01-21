// resources/js/components/Modules/Reportes/Reportes.jsx
import React, { useState } from 'react';
import styles from './Reportes.module.css';

const Reportes = () => {
    
    // --- 1. DATOS SIMULADOS ---
    const generateMockData = () => {
        return Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            fecha: `2026-01-${(i % 30) + 1}`,
            agente: ['Carlos Perez', 'Maria Gomez', 'Jorge Torres', 'Ana Ruiz'][i % 4],
            totalGrabaciones: Math.floor(Math.random() * 50) + 10,
            descargadas: Math.floor(Math.random() * 20),
            zipGenerados: Math.floor(Math.random() * 5)
        }));
    };

    const [stats] = useState({ total: 1240, descargadas: 430, zip: 120 });
    const [reportData] = useState(generateMockData());

    // --- 2. LÓGICA DE PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = reportData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reportData.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            
            <h2 className={`mb-3 ${styles.pageTitle}`}> {/* Margen reducido mb-3 */}
                <i className="bi bi-file-earmark-bar-graph me-2"></i>
                Reportes
            </h2>

            {/* --- FILTROS --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros
                </div>

                <div className="card-body p-0"> {/* Quitamos padding del body, lo maneja el container */}
                    <div className={styles.filterContainer}>
                        <form className="row g-2 align-items-end"> {/* g-2 para menos espacio horizontal */}
                            <div className="col-md-3">
                                <label className={styles.label}>Fecha desde</label>
                                <input type="date" className="form-control form-control-sm" /> {/* Input Pequeño */}
                            </div>
                            <div className="col-md-3">
                                <label className={styles.label}>Fecha hasta</label>
                                <input type="date" className="form-control form-control-sm" />
                            </div>
                            <div className="col-md-3">
                                <label className={styles.label}>Analista / Agente</label>
                                <select className="form-select form-select-sm">
                                    <option value="">Todos</option>
                                    <option value="1">Carlos Perez</option>
                                    <option value="2">Maria Gomez</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <button type="button" className={`btn ${styles.btnGenerate}`}>
                                    <i className="bi bi-gear-wide-connected me-2"></i>
                                    Generar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* --- ESTADÍSTICAS (Row Compacto) --- */}
            <div className="row g-3 mb-3"> {/* Margen reducido mb-3 */}
                <div className="col-md-4">
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.total}</div>
                        <div className={styles.statLabel}>Total Grabaciones</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.descargadas}</div>
                        <div className={styles.statLabel}>Descargadas</div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>{stats.zip}</div>
                        <div className={styles.statLabel}>Zip Generados</div>
                    </div>
                </div>
            </div>

            {/* --- TABLA DETALLE --- */}
            <div className={`card ${styles.cardCustom} mb-0`}> {/* mb-0 para que no sobre espacio abajo */}
                <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                    <h6 className="m-0 fw-bold text-secondary" style={{fontSize: '0.9rem'}}>Detalle por Agente</h6>
                    <button className={`btn btn-sm btn-outline-danger ${styles.btnPdf}`}>
                        <i className="bi bi-file-earmark-pdf-fill me-1"></i> PDF
                    </button>
                </div>

                <div className="card-body p-0">
                    <div className={`table-responsive ${styles.tableWrapper}`}>
                        <table className="table table-hover mb-0 align-middle text-center table-sm"> {/* table-sm */}
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="text-start ps-4">Fecha</th>
                                    <th className="text-start">Agente</th>
                                    <th>Grabaciones</th>
                                    <th>Descargadas</th>
                                    <th>ZIPs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((row) => (
                                    <tr key={row.id}>
                                        <td className="text-start ps-4 text-muted small">{row.fecha}</td>
                                        <td className="text-start fw-bold text-secondary small">{row.agente}</td>
                                        <td><span className="badge bg-light text-dark border">{row.totalGrabaciones}</span></td>
                                        <td className="text-success fw-bold small">{row.descargadas}</td>
                                        <td className="text-primary small">{row.zipGenerados}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- FOOTER PAGINACIÓN --- */}
                <div className="card-footer bg-white border-0 py-2 d-flex justify-content-between align-items-center">
                    <div className="text-muted small" style={{fontSize: '0.75rem'}}>
                        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, reportData.length)} de {reportData.length}
                    </div>
                    
                    <nav>
                        <ul className="pagination mb-0 gap-1">
                            <li>
                                <button 
                                    className={`${styles.paginationBtn} ${currentPage === 1 ? styles.paginationBtnDisabled : ''}`}
                                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                            </li>
                            
                            {[...Array(totalPages)].map((_, i) => (
                                <li key={i}>
                                    <button 
                                        className={`${styles.paginationBtn} ${currentPage === i + 1 ? styles.paginationBtnActive : ''}`}
                                        onClick={() => handlePageChange(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                </li>
                            ))}

                            <li>
                                <button 
                                    className={`${styles.paginationBtn} ${currentPage === totalPages ? styles.paginationBtnDisabled : ''}`}
                                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    <i className="bi bi-chevron-right"></i>
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Reportes;