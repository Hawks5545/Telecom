// resources/js/components/Modules/Auditoria/Auditoria.jsx
import React, { useState } from 'react';
import styles from './Auditoria.module.css';

const Auditoria = () => {
    
    // --- 1. DATOS SIMULADOS ---
    const mockAuditLogs = Array.from({ length: 50 }, (_, i) => {
        const actions = ['Inicio de Sesión', 'Descarga de Audio', 'Eliminar Usuario', 'Modificar Configuración'];
        const users = ['Carlos Admin', 'Juan Perez', 'Maria Soporte', 'Sistema'];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        
        return {
            id: i + 1,
            dateTime: `2026-01-${(i % 30) + 1} ${(10 + i) % 24}:30:15`,
            user: users[i % 4],
            action: randomAction,
            detail: randomAction === 'Descarga de Audio' ? `Archivo rec_20250${i}.wav descargado` : 
                   randomAction === 'Inicio de Sesión' ? 'Acceso exitoso desde IP 192.168.1.50' :
                   randomAction === 'Eliminar Usuario' ? 'Usuario "invitado" eliminado' : 'Cambio en ruta de indexación'
        };
    });

    // --- 2. LÓGICA DE PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = mockAuditLogs.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(mockAuditLogs.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const getBadgeStyle = (actionName) => {
        if (actionName.includes('Inicio')) return styles.badgeLogin;
        if (actionName.includes('Descarga')) return styles.badgeDownload;
        if (actionName.includes('Eliminar')) return styles.badgeDelete;
        return styles.badgeUpdate;
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            
            <h2 className={`mb-4 ${styles.pageTitle}`}>
                <i className="bi bi-shield-check me-2"></i>
                Auditoría del Sistema
            </h2>

            {/* --- SECCIÓN DE FILTROS --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros de Auditoría
                </div>

                <div className="card-body p-4">
                    <form className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className={styles.label}>Fecha desde</label>
                            <input type="date" className="form-control" />
                        </div>

                        <div className="col-md-3">
                            <label className={styles.label}>Fecha hasta</label>
                            <input type="date" className="form-control" />
                        </div>

                        <div className="col-md-3">
                            <label className={styles.label}>Usuario</label>
                            <select className="form-select">
                                <option value="">Todos</option>
                                <option value="admin">Carlos Admin</option>
                                <option value="juan">Juan Perez</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <label className={styles.label}>Acción</label>
                            <select className="form-select">
                                <option value="">Todas</option>
                                <option value="login">Inicio de Sesión</option>
                                <option value="download">Descargas</option>
                            </select>
                        </div>

                        {/* Botones alineados a la derecha */}
                        <div className="col-12 text-end mt-4">
                             <div className="d-inline-flex gap-2">
                                <button type="button" className="btn btn-outline-secondary">
                                    <i className="bi bi-eraser"></i> Limpiar
                                </button>
                                <button type="button" className={`btn ${styles.btnFilter}`}>
                                    <i className="bi bi-search me-1"></i> Buscar Eventos
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- TABLA DE RESULTADOS --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className="card-body p-0">
                    
                    {/* AQUÍ AGREGAMOS LA CLASE styles.tableWrapper PARA EL SCROLL INTERNO */}
                    <div className={`table-responsive ${styles.tableWrapper}`}>
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4 py-3">Fecha y hora</th>
                                    <th className="py-3">Usuario</th>
                                    <th className="py-3">Acción</th>
                                    <th className="py-3">Detalle</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((log) => (
                                    <tr key={log.id}>
                                        <td className="ps-4 text-muted" style={{fontFamily: 'monospace'}}>
                                            {log.dateTime}
                                        </td>
                                        <td className="fw-bold text-secondary">
                                            <i className="bi bi-person-circle me-2"></i>
                                            {log.user}
                                        </td>
                                        <td>
                                            <span className={`badge ${getBadgeStyle(log.action)} p-2 rounded-pill fw-normal`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="text-muted small">{log.detail}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- FOOTER PAGINACIÓN --- */}
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                        Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, mockAuditLogs.length)} de {mockAuditLogs.length} registros
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

export default Auditoria;