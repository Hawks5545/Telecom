// resources/js/components/Modules/FolderManager/FolderManager.jsx
import React, { useState, useMemo } from 'react';
import styles from './FolderManager.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const FolderManager = () => {
    
    // --- 1. GENERACIÓN DE DATOS MASIVOS ---
    const generateMockData = () => {
        const baseFolders = [
            { id: 1, parentId: 0, name: 'ETB', type: 'folder', items: 52, date: '2025-01-10' },
            { id: 2, parentId: 0, name: 'Claro', type: 'folder', items: 120, date: '2025-01-12' },
            { id: 3, parentId: 0, name: 'Movistar Campañas', type: 'folder', items: 10, date: '2025-01-14' },
            { id: 4, parentId: 0, name: 'Audios_Sueltos_Enero', type: 'folder', items: 5, date: '2025-01-01' },
            
            // Subcarpetas de ETB
            { id: 11, parentId: 1, name: 'ETB_Ventas_2025', type: 'folder', items: 300, date: '2025-01-15' },
            { id: 12, parentId: 1, name: 'ETB_Soporte', type: 'folder', items: 50, date: '2025-01-16' },
        ];

        // Genera 50 archivos para probar como se veria con datos reales
        const extraFiles = Array.from({ length: 50 }, (_, i) => ({
            id: 100 + i,
            parentId: 1, 
            name: `Grabacion_Llamada_Cliente_${i + 100}.wav`,
            type: 'file',
            items: 0,
            date: `2025-01-${(i % 30) + 1}`,
            duration: `00:${10 + (i % 50)}:45`
        }));

        return [...baseFolders, ...extraFiles];
    };

    const [mockFileSystem] = useState(generateMockData());
    const [currentFolderId, setCurrentFolderId] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 0, name: 'Inicio' }]);

    // --- 2. CONFIGURACIÓN DE ALERTA ---
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: null
    });

    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    };

    const closeAlert = () => {
        setAlertConfig({ ...alertConfig, isOpen: false });
    };

    // --- 3. LÓGICA DE DESCARGA ---
    const handleDownload = (item) => {
        if (item.type === 'folder') {
            // CASO 1: CARPETA (Advertencia Masiva)
            showAlert(
                'info',
                'Descarga Masiva Detectada',
                `⚠️ ADVERTENCIA: Estás a punto de descargar la carpeta "${item.name}". Esta acción comprimirá y descargará gran cantidad de subcarpetas y audios. ¿Deseas continuar?`,
                () => executeDownload(item)
            );
        } else {
            // CASO 2: ARCHIVO INDIVIDUAL (Confirmación Simple)
            showAlert(
                'info',
                'Descargar Audio',
                `¿Deseas descargar el archivo de grabación "${item.name}"?`,
                () => executeDownload(item)
            );
        }
    };

    const executeDownload = (item) => {
        // Simulación de proceso de descarga
        console.log(`Descargando ${item.name}...`);
        
        // Simulamos delay y mostramos éxito
        setTimeout(() => {
            showAlert(
                'success',
                'Descarga Iniciada',
                `El elemento "${item.name}" se está descargando en tu equipo.`
            );
        }, 500);
    };

    // --- Lógica de renderizado existente ---
    const currentFiles = useMemo(() => {
        return mockFileSystem.filter(item => {
            const isInCurrentFolder = item.parentId === currentFolderId;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            return isInCurrentFolder && matchesSearch;
        });
    }, [currentFolderId, searchTerm, mockFileSystem]);

    const handleOpenFolder = (folder) => {
        setCurrentFolderId(folder.id);
        setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        setSearchTerm('');
    };

    const handleBreadcrumbClick = (crumb, index) => {
        setCurrentFolderId(crumb.id);
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            
            {/* --- INTEGRACIÓN COMPONENTE DE ALERTA --- */}
            <CustomAlert 
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm}
            />

            <h2 className={`mb-4 ${styles.pageTitle}`}>
                <i className="bi bi-folder-fill me-2"></i>
                Gestión de Carpetas
            </h2>

            {/* --- SECCIÓN DE FILTROS --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-funnel me-2"></i> Filtros de Carpetas
                </div>

                <div className="card-body p-4">
                    <form className="row g-3">
                        <div className="col-md-4">
                            <label className={`form-label ${styles.label}`}>Buscar carpeta / archivo</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="Ej: ETB, Claro..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Fecha Desde</label>
                            <input type="date" className="form-control" />
                        </div>
                        <div className="col-md-3">
                            <label className={`form-label ${styles.label}`}>Fecha Hasta</label>
                            <input type="date" className="form-control" />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                             <div className="d-flex w-100 gap-2">
                                <button type="button" className="btn btn-outline-secondary flex-fill" title="Limpiar">
                                    <i className="bi bi-eraser"></i>
                                </button>
                                <button type="button" className={`btn flex-fill ${styles.searchBtn}`}>
                                    <i className="bi bi-search me-1"></i> Buscar
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* BREADCRUMBS */}
            <div className={styles.breadcrumbBar}>
                <i className="bi bi-hdd-network text-secondary fs-5"></i>
                <div className={styles.separator}>|</div>
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="d-flex align-items-center gap-2">
                        <span 
                            className={`${styles.breadcrumbItem} ${index === breadcrumbs.length - 1 ? styles.breadcrumbActive : ''}`}
                            onClick={() => handleBreadcrumbClick(crumb, index)}
                        >
                            {crumb.name}
                        </span>
                        {index < breadcrumbs.length - 1 && (
                            <i className={`bi bi-chevron-right ${styles.separator}`}></i>
                        )}
                    </div>
                ))}
            </div>

            {/* TABLA DE CONTENIDO */}
            <div className={`card ${styles.cardCustom}`}>
                <div className="card-body p-0">
                    
                    <div className={`table-responsive ${styles.tableWrapper}`}>
                        <table className="table table-hover mb-0 align-middle">
                            <thead className={styles.tableHeader}>
                                <tr>
                                    <th className="ps-4 py-3">Nombre Carpeta / Archivo</th>
                                    <th className="py-3">Contenido</th>
                                    <th className="py-3">Fecha Creación</th>
                                    <th className="py-3">Creado por</th>
                                    <th className="py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentFiles.length > 0 ? (
                                    currentFiles.map((item) => (
                                        <tr key={item.id}>
                                            <td className="ps-4 fw-bold text-secondary">
                                                {item.type === 'folder' ? (
                                                    <i className={`bi bi-folder-fill ${styles.folderIcon}`}></i>
                                                ) : (
                                                    <i className={`bi bi-file-earmark-music-fill ${styles.fileIcon}`}></i>
                                                )}
                                                {item.name}
                                            </td>
                                            <td>
                                                {item.type === 'folder' ? (
                                                    <span className="badge bg-light text-dark border">
                                                        {item.items} elementos
                                                    </span>
                                                ) : (
                                                    <span className="text-muted small">
                                                        {item.duration}
                                                    </span>
                                                )}
                                            </td>
                                            <td>{item.date}</td>
                                            <td className="text-muted small">Admin</td>
                                            <td className="text-center">
                                                {item.type === 'folder' && (
                                                    <button 
                                                        className={`btn btn-sm btn-outline-secondary me-2 ${styles.btnOpen}`}
                                                        onClick={() => handleOpenFolder(item)}
                                                    >
                                                        <i className="bi bi-folder2-open me-1"></i> Abrir
                                                    </button>
                                                )}
                                                <button 
                                                    className={`btn btn-sm btn-outline-success ${styles.btnDownload}`}
                                                    // Conectado a la nueva lógica con Alerta
                                                    onClick={() => handleDownload(item)}
                                                >
                                                    <i className="bi bi-download me-1"></i> Descargar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-5 text-muted">
                                            <i className="bi bi-folder-x display-4 d-block mb-3"></i>
                                            Carpeta vacía o sin resultados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer bg-white border-0 py-3 text-end text-muted small">
                    Total elementos visibles: {currentFiles.length}
                </div>
            </div>
        </div>
    );
};

export default FolderManager;