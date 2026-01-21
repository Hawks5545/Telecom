// resources/js/components/Modules/SearchRecordings/SearchRecordings.jsx
import React, { useState } from 'react';
import styles from './SearchRecordings.module.css';

const SearchRecordings = () => {
    // --- LÓGICA (Datos y Paginación) ---
    const generateData = () => {
        return Array.from({ length: 50 }, (_, i) => ({
            id: i + 1,
            cedula: `1098${1000 + i}`,
            cliente: `Cliente Prueba ${i + 1}`,
            fecha: `2025-01-${(i % 30) + 1}`,
            hora: `${10 + (i % 12)}:30:00`,
            carpeta: i % 2 === 0 ? '/srv/audio/2025/enero' : '/srv/audio/2025/febrero',
            campana: i % 3 === 0 ? 'Ventas' : (i % 3 === 1 ? 'Soporte' : 'Cobranzas'),
            duracion: `00:0${(i % 9) + 1}:45`,
            filename: `rec_${i}.wav`
        }));
    };

    const [allData] = useState(generateData());
    const [selectedItems, setSelectedItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Mantenemos 15 para un buen balance
    const itemsPerPage = 15;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = allData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(allData.length / itemsPerPage);

    // --- MANEJADORES DE EVENTOS ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allCurrentIds = currentItems.map(item => item.id);
            setSelectedItems([...new Set([...selectedItems, ...allCurrentIds])]);
        } else {
            const currentIds = currentItems.map(item => item.id);
            setSelectedItems(selectedItems.filter(id => !currentIds.includes(id)));
        }
    };

    const handleCheckboxChange = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(itemId => itemId !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const isAllSelected = currentItems.length > 0 && currentItems.every(item => selectedItems.includes(item.id));

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            
            {/* ENCABEZADO */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className={styles.pageTitle}>
                    <i className="bi bi-music-note-list me-2"></i>
                    Búsqueda de Grabaciones
                </h2>
                
                {selectedItems.length > 0 && (
                    <button className={`btn ${styles.btnDownloadMassive}`}>
                        <i className="bi bi-cloud-download-fill me-2"></i>
                        Descargar Seleccionados ({selectedItems.length})
                    </button>
                )}
            </div>

            {/* --- FILTROS --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros de Búsqueda
                </div>
                <div className="card-body p-4">
                    <form className="row g-3">
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Cédula</label>
                            <input type="text" className="form-control" placeholder="Ej: 1098..." />
                        </div>
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Nombre / Cliente</label>
                            <input type="text" className="form-control" placeholder="Buscar por nombre..." />
                        </div>
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Fecha Desde</label>
                            <input type="date" className="form-control" />
                        </div>
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Fecha Hasta</label>
                            <input type="date" className="form-control" />
                        </div>

                        <div className="col-md-4">
                            <label className={`form-label ${styles.label}`}>Carpeta</label>
                            <select className="form-select">
                                <option value="">Todas las carpetas</option>
                                <option value="1">/srv/audio/2025/enero</option>
                                <option value="2">/srv/audio/2025/febrero</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className={`form-label ${styles.label}`}>Campaña</label>
                            <select className="form-select">
                                <option value="">Todas las campañas</option>
                                <option value="ventas">Ventas</option>
                                <option value="soporte">Soporte</option>
                            </select>
                        </div>

                        <div className="col-md-4 d-flex align-items-end">
                            <div className="d-flex w-100 gap-2">
                                <button type="button" className="btn btn-outline-secondary flex-fill">
                                    <i className="bi bi-eraser me-1"></i> Limpiar
                                </button>
                                <button type="button" className={`btn flex-fill ${styles.btnSearch}`}>
                                    <i className="bi bi-search me-1"></i> Buscar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- TABLA --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={`card-body p-0 ${styles.tableContainer}`}>
                    
                    {/* ENVOLTURA PARA EL SCROLL INTERNO */}
                    <div className={`table-responsive ${styles.tableWrapper}`}>
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4 py-3" style={{ width: '50px' }}>
                                        <div className="form-check">
                                            <input 
                                                className={`form-check-input ${styles.checkbox}`} 
                                                type="checkbox" 
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="py-3">Cédula</th>
                                    <th className="py-3">Nombre / Cliente</th>
                                    <th className="py-3">Fecha y Hora</th>
                                    <th className="py-3">Carpeta</th>
                                    <th className="py-3">Campaña</th>
                                    <th className="py-3">Duración</th>
                                    <th className="py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item) => (
                                    <tr key={item.id}>
                                        <td className="ps-4 py-2">
                                            <div className="form-check">
                                                <input 
                                                    className={`form-check-input ${styles.checkbox}`} 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => handleCheckboxChange(item.id)}
                                                />
                                            </div>
                                        </td>
                                        <td className="fw-bold text-secondary py-2">{item.cedula}</td>
                                        <td className="py-2">{item.cliente}</td>
                                        <td className="py-2">
                                            <div className="d-flex flex-column">
                                                <span>{item.fecha}</span>
                                                <small className="text-muted" style={{fontSize: '0.85em'}}>{item.hora}</small>
                                            </div>
                                        </td>
                                        <td className="text-muted small py-2">
                                            <i className="bi bi-folder me-1 text-warning"></i>
                                            {item.carpeta.substring(0, 15)}...
                                        </td>
                                        <td className="py-2"><span className="badge bg-light text-dark border">{item.campana}</span></td>
                                        <td className="py-2">{item.duracion}</td>
                                        <td className="text-center py-2">
                                            <button className="btn btn-sm btn-outline-success" title="Descargar">
                                                <i className="bi bi-download"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- FOOTER PAGINACIÓN --- */}
                <div className="card-footer bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                        Mostrando <strong>{indexOfFirstItem + 1}</strong> a <strong>{Math.min(indexOfLastItem, allData.length)}</strong> de <strong>{allData.length}</strong>
                    </div>
                    
                    <nav>
                        <ul className="pagination mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button className={`page-link ${styles.paginationBtn}`} onClick={() => setCurrentPage(currentPage - 1)}>
                                    <i className="bi bi-chevron-left"></i>
                                </button>
                            </li>
                            
                            {[...Array(totalPages)].map((_, i) => (
                                <li key={i} className="page-item">
                                    <button 
                                        className={`page-link ${styles.paginationBtn} ${currentPage === i + 1 ? styles.paginationBtnActive : ''}`} 
                                        onClick={() => setCurrentPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                </li>
                            ))}

                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button className={`page-link ${styles.paginationBtn}`} onClick={() => setCurrentPage(currentPage + 1)}>
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

export default SearchRecordings;