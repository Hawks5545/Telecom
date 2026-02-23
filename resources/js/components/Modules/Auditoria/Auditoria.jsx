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

    const [maxDate, setMaxDate] = useState('');
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '' });
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- CARGA DE DATOS ---
    useEffect(() => {
        setMaxDate(new Date().toISOString().split('T')[0]);

        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch('/api/audit/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setUsersList(await res.json());
            } catch (error) { console.error("Error cargando usuarios", error); }
        };
        fetchUsers();
    }, []);

    // OPTIMIZACIÓN: Acepta filtros sobreescritos para evitar el lag del estado en el botón "Limpiar"
    const fetchLogs = useCallback(async (page = 1, overrideFilters = null) => {
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        const activeFilters = overrideFilters || filters;
        
        const params = new URLSearchParams({ page, ...activeFilters });

        try {
            const res = await fetch(`/api/audit/logs?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                // Verificación de seguridad por si la API devuelve el objeto vacío paginado
                if (data.data) {
                    setLogs(data.data);
                    setPagination({
                        currentPage: data.current_page,
                        lastPage: data.last_page,
                        total: data.total,
                        from: data.from,
                        to: data.to
                    });
                } else {
                    setLogs([]);
                }
            }
        } catch (error) {
            console.error(error);
            setAlertConfig({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo cargar el historial.' });
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs(1);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // --- MANEJADORES ---
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSearch = () => {
        fetchLogs(1);
    };

    const handleClear = () => {
        const emptyFilters = { dateFrom: '', dateTo: '', userId: '', action: '' };
        setFilters(emptyFilters);
        fetchLogs(1, emptyFilters); // Llamada directa, sin setTimeouts raros
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchLogs(newPage);
        }
    };

    // --- UI HELPERS ---
    const getBadgeStyle = (actionName) => {
        const action = actionName ? actionName.toLowerCase() : '';
        if (action.includes('inicio') || action.includes('login') || action.includes('sesión')) return styles.badgeLogin;
        if (action.includes('descarga')) return styles.badgeDownload;
        if (action.includes('eliminar') || action.includes('borrar')) return styles.badgeDelete;
        if (action.includes('index') || action.includes('carpeta') || action.includes('mover')) return styles.badgeSystem;
        return styles.badgeUpdate; // Ediciones de usuarios, roles, etc.
    };

    // Renderizador Inteligente de Metadata (JSON)
    const renderMetadata = (metaString) => {
        if (!metaString) return null;
        try {
            const meta = typeof metaString === 'string' ? JSON.parse(metaString) : metaString;
            // Si está vacío
            if (!meta || Object.keys(meta).length === 0) return null;
            
            // Ocultamos las estadisticas gigantes del zip
            if (meta.campaigns_breakdown || meta.file_count) return null;

            // Formato visual de "Píldoras" para cambios de usuario/roles
            return (
                <div className={styles.metaContainer}>
                    {Object.entries(meta).map(([key, value]) => {
                        // Evita renderizar arrays completos o campos muy técnicos
                        if (typeof value === 'object') return null;
                        
                        // Traducción amigable de claves comunes
                        const label = key.replace('old_', 'Anterior ').replace('new_', 'Nuevo ').replace('_', ' ');
                        return (
                            <span key={key} className={styles.metaBadge}>
                                <strong className="text-capitalize">{label}:</strong> {String(value)}
                            </span>
                        );
                    })}
                </div>
            );
        } catch (e) { return null; }
    };

    return (
        /* 1. AGREGADA LA CLASE fullHeightContainer PARA BLOQUEAR EL SCROLL GLOBAL */
        <div className={`container-fluid p-0 ${styles.fadeIn} ${styles.fullHeightContainer}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} />
            
            <h2 className={`mb-3 ${styles.pageTitle}`}>
                <i className="bi bi-shield-check me-2"></i> Auditoría del Sistema
            </h2>

            {/* --- FILTROS --- */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros de Auditoría
                </div>

                <div className="card-body p-3">
                    <form className="row g-3 align-items-end" onSubmit={(e) => e.preventDefault()}>
                        <div className="col-md-3">
                            <label className={styles.label}>Fecha desde</label>
                            <input 
                                type="date" className="form-control" name="dateFrom" 
                                value={filters.dateFrom} max={maxDate} onChange={handleFilterChange} 
                            />
                        </div>
                        <div className="col-md-3">
                            <label className={styles.label}>Fecha hasta</label>
                            <input 
                                type="date" className="form-control" name="dateTo" 
                                value={filters.dateTo} max={maxDate} onChange={handleFilterChange} 
                            />
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
                                <optgroup label="Accesos">
                                    <option value="Inicio de Sesión">Inicio de Sesión</option>
                                    <option value="Cierre de Sesión">Cierre de Sesión</option>
                                </optgroup>
                                <optgroup label="Archivos y Carpetas">
                                    <option value="Descarga">Descarga Individual</option>
                                    <option value="Descarga ZIP">Descarga ZIP Masiva</option>
                                    <option value="Descarga ZIP Folder">Descarga ZIP Carpeta</option>
                                    <option value="Indexación">Indexación de Audios</option>
                                    <option value="Mover Grabaciones">Mover Grabaciones</option>
                                    <option value="Crear Carpeta">Crear Carpeta</option>
                                    <option value="Eliminar Carpeta">Eliminar Carpeta</option>
                                    <option value="Renombrar Carpeta">Renombrar Carpeta</option>
                                </optgroup>
                                <optgroup label="Administración">
                                    <option value="Crear Usuario">Crear Usuario</option>
                                    <option value="Actualizar Usuario">Actualizar Usuario</option>
                                    <option value="Eliminar Usuario">Eliminar Usuario</option>
                                    <option value="Cambiar Rol">Asignar/Cambiar Rol</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className="col-12 text-end mt-3">
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
            {/* 2. AGREGADA LA CLASE cardTable PARA ESTIRAR EL CONTENEDOR AL FONDO */}
            <div className={`card ${styles.cardCustom} ${styles.cardTable}`}>
                
                {/* 3. CONTENEDOR FLEX PARA LA TABLA Y PAGINACIÓN */}
                <div className={styles.tableContainer}>
                    
                    {/* 4. WRAPPER CON SCROLL INTERNO Y ABSOLUTO */}
                    <div className={styles.tableWrapper}>
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
                                    <tr><td colSpan="4" className="text-center py-5"><div className="spinner-border text-primary"></div></td></tr>
                                ) : logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="ps-4 text-muted" style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
                                                {new Date(log.created_at).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })}
                                            </td>
                                            <td className="fw-bold" style={{color: '#005461'}}>
                                                <i className="bi bi-person-circle me-2 text-secondary"></i>{log.user ? log.user.name : 'Usuario Eliminado'}
                                            </td>
                                            <td>
                                                <span className={`badge ${getBadgeStyle(log.action)} p-2 rounded-pill fw-normal`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="text-dark small py-3" style={{maxWidth: '350px'}}>
                                                <span className="d-block mb-1">{log.details}</span>
                                                {renderMetadata(log.metadata)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="text-center py-5 text-muted">No se encontraron registros de auditoría.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINACIÓN (Anclada abajo por fuera del tableWrapper) --- */}
                    <div className="card-footer bg-white border-top py-3 px-4 d-flex justify-content-between align-items-center">
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
                                        className={`btn btn-sm btn-light border ${pagination.currentPage === 1 ? 'disabled' : ''}`}
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                    >
                                        <i className="bi bi-chevron-left"></i>
                                    </button>
                                </li>
                                <li className="mx-2 d-flex align-items-center">
                                    <span className="small text-muted">Pág <strong className="text-dark">{pagination.currentPage}</strong> de {pagination.lastPage}</span>
                                </li>
                                <li>
                                    <button 
                                        className={`btn btn-sm btn-light border ${pagination.currentPage === pagination.lastPage || pagination.total === 0 ? 'disabled' : ''}`}
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.lastPage || pagination.total === 0}
                                    >
                                        <i className="bi bi-chevron-right"></i>
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Auditoria;