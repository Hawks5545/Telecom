import React, { useState, useEffect, useCallback } from 'react';
import styles from './Auditoria.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const Auditoria = () => {
    
    // --- ESTADOS ---
    const [logs, setLogs] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Paginación
    const [pagination, setPagination] = useState({
        currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0
    });

    // Filtros
    const [filters, setFilters] = useState({
        dateFrom: '', dateTo: '', userId: '', action: ''
    });

    // Alertas
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '' });
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- CARGA DE DATOS ---
    
    // 1. Cargar lista de usuarios para el select
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch('http://127.0.0.1:8000/api/audit/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setUsersList(await res.json());
            } catch (error) { console.error("Error cargando usuarios", error); }
        };
        fetchUsers();
    }, []);

    // 2. Cargar Logs (Historial)
    const fetchLogs = useCallback(async (page = 1) => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        const params = new URLSearchParams({ page, ...filters });

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/audit/logs?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setLogs(data.data);
                setPagination({
                    currentPage: data.current_page,
                    lastPage: data.last_page,
                    total: data.total,
                    from: data.from,
                    to: data.to
                });
            }
        } catch (error) {
            console.error(error);
            setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo cargar el historial.' });
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // Carga inicial y recarga al cambiar página
    useEffect(() => {
        fetchLogs(1);
    }, []); // Carga inicial solo una vez, los filtros se aplican con el botón "Buscar"

    // --- MANEJADORES ---
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = () => {
        fetchLogs(1);
    };

    const handleClear = () => {
        setFilters({ dateFrom: '', dateTo: '', userId: '', action: '' });
        // Usamos un timeout pequeño para asegurar que el estado se limpie antes de buscar
        setTimeout(() => fetchLogs(1), 50);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchLogs(newPage);
        }
    };

    // Estilos para las etiquetas
    const getBadgeStyle = (actionName) => {
        const action = actionName ? actionName.toLowerCase() : '';
        if (action.includes('inicio') || action.includes('login')) return styles.badgeLogin;
        if (action.includes('descarga')) return styles.badgeDownload;
        if (action.includes('eliminar')) return styles.badgeDelete;
        return styles.badgeUpdate; // Default
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} />
            
            <h2 className={`mb-4 ${styles.pageTitle}`}>
                <i className="bi bi-shield-check me-2"></i> Auditoría del Sistema
            </h2>

            {/* --- FILTROS --- */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros de Auditoría
                </div>

                <div className="card-body p-4">
                    <form className="row g-3 align-items-end" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-3">
                            <label className={styles.label}>Fecha desde</label>
                            <input type="date" className="form-control" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Fecha hasta</label>
                            <input type="date" className="form-control" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Usuario</label>
                            <select className="form-select" name="userId" value={filters.userId} onChange={handleFilterChange}>
                                <option value="">Todos</option>
                                {usersList.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Acción</label>
                            <select className="form-select" name="action" value={filters.action} onChange={handleFilterChange}>
                                <option value="">Todas</option>
                                <option value="Login">Inicio de Sesión</option>
                                <option value="Descarga">Descargas</option>
                                <option value="Eliminar">Eliminaciones</option>
                                <option value="Configuracion">Configuración</option>
                            </select>
                        </div>

                        <div className="col-12 text-end mt-4">
                             <div className="d-inline-flex gap-2">
                                <button type="button" className="btn btn-outline-secondary px-4" onClick={handleClear}>
                                    <i className="bi bi-eraser me-2"></i>Limpiar
                                </button>
                                <button type="button" className={styles.btnFilter} onClick={handleSearch}>
                                    <i className="bi bi-search me-2"></i>Buscar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- TABLA DE RESULTADOS --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className="card-body p-0">
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
                                {isLoading ? (
                                    <tr><td colSpan="4" className="text-center py-5">Cargando historial...</td></tr>
                                ) : logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="ps-4 text-muted" style={{fontFamily: 'monospace'}}>
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="fw-bold text-secondary">
                                                <i className="bi bi-person-circle me-2"></i>{log.user ? log.user.name : 'Usuario Eliminado'}
                                            </td>
                                            <td>
                                                <span className={`badge ${getBadgeStyle(log.action)} p-2 rounded-pill fw-normal`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="text-muted small text-break" style={{maxWidth: '300px'}}>
                                                {log.details}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="text-center py-5 text-muted">No se encontraron registros.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- PAGINACIÓN --- */}
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                        {pagination.total > 0 
                            ? `Mostrando ${pagination.from} a ${pagination.to} de ${pagination.total} registros`
                            : '0 registros'
                        }
                    </div>
                    
                    <nav>
                        <ul className="pagination mb-0 gap-1">
                            <li>
                                <button 
                                    className={`btn btn-sm btn-light ${pagination.currentPage === 1 ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                    disabled={pagination.currentPage === 1}
                                >
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                            </li>
                            <li className="mx-2 d-flex align-items-center">
                                <span className="small">Pág {pagination.currentPage} de {pagination.lastPage}</span>
                            </li>
                            <li>
                                <button 
                                    className={`btn btn-sm btn-light ${pagination.currentPage === pagination.lastPage ? 'disabled' : ''}`}
                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                    disabled={pagination.currentPage === pagination.lastPage}
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