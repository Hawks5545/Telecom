import React, { useState, useRef } from 'react';
import styles from './BulkDownload.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const BulkDownload = () => {
    const [archivo, setArchivo]           = useState(null);
    const [isDragging, setIsDragging]     = useState(false);
    const [isLoading, setIsLoading]       = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [resultados, setResultados]     = useState(null);
    const [vistaActiva, setVistaActiva]   = useState('encontradas'); // 'encontradas' | 'no_encontradas'
    const fileInputRef                    = useRef(null);

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false, type: 'info', title: '', message: '', onConfirm: null
    });

    const showAlert = (type, title, message, onConfirm = null) =>
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    const closeAlert = () =>
        setAlertConfig(prev => ({ ...prev, isOpen: false }));

    const FORMATOS_PERMITIDOS = ['xlsx', 'xls', 'csv', 'txt', 'docx'];

    const validarArchivo = (file) => {
        if (!file) return false;
        const ext = file.name.split('.').pop().toLowerCase();
        if (!FORMATOS_PERMITIDOS.includes(ext)) {
            showAlert('error', 'Formato no permitido',
                `Solo se aceptan archivos: ${FORMATOS_PERMITIDOS.join(', ').toUpperCase()}`);
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            showAlert('error', 'Archivo muy grande', 'El archivo no debe superar 10MB.');
            return false;
        }
        return true;
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && validarArchivo(file)) {
            setArchivo(file);
            setResultados(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && validarArchivo(file)) {
            setArchivo(file);
            setResultados(null);
        }
    };

    const handlePreview = async () => {
        if (!archivo) return showAlert('warning', 'Archivo requerido', 'Por favor selecciona un archivo.');

        setIsLoading(true);
        setResultados(null);

        const formData = new FormData();
        formData.append('file', archivo);

        try {
            const token    = localStorage.getItem('auth_token');
            const response = await fetch('/api/bulk-download/preview', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
                setResultados(data);
                setVistaActiva('encontradas');
            } else {
                showAlert('error', 'Error al procesar', data.message || 'Error desconocido.');
            }
        } catch (error) {
            showAlert('error', 'Error de conexión', 'No se pudo conectar con el servidor.');
        } finally {
            setIsLoading(false);
        }
    };

   const handleDownload = async () => {
    if (!resultados || resultados.encontradas === 0) {
        return showAlert('warning', 'Sin grabaciones', 'No hay grabaciones encontradas para descargar.');
    }

    showAlert('warning', '¿Confirmar descarga?',
        `Se descargarán ${resultados.encontradas.toLocaleString()} grabaciones en un ZIP.\n¿Deseas continuar?`,
        async () => {
            setIsDownloading(true);
            try {
                const token = localStorage.getItem('auth_token');
                const ids   = resultados.lista_encontradas.map(r => r.id);

                // PASO 1: Generar token temporal
                const response = await fetch('/api/bulk-download/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ids })
                });

                if (!response.ok) {
                    const data = await response.json();
                    showAlert('error', 'Error', data.message || 'Error al preparar la descarga.');
                    return;
                }

                const { token: downloadToken } = await response.json();

                // PASO 2: Redirigir al stream — descarga inmediata sin blob()
                window.location.href = `/api/bulk-download/stream/${downloadToken}`;

                showAlert('success', '¡Descarga iniciada!',
                    `Se están descargando ${resultados.encontradas.toLocaleString()} grabaciones.`);

            } catch (error) {
                showAlert('error', 'Error', 'No se pudo iniciar la descarga.');
            } finally {
                setIsDownloading(false);
            }
        }
    );
};    

    const handleReset = () => {
        setArchivo(null);
        setResultados(null);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes <= 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const pow   = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, pow)).toFixed(2) + ' ' + units[pow];
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn} ${styles.fullHeightContainer}`}>
            <CustomAlert
                isOpen={alertConfig.isOpen}
                type={alertConfig.type}
                title={alertConfig.title}
                message={alertConfig.message}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm}
            />

            <h2 className={`mb-3 ${styles.pageTitle}`}>
                <i className="bi bi-cloud-arrow-down me-2"></i> Descarga Masiva por Listado
            </h2>

            {/* SECCIÓN 1: SUBIR ARCHIVO */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-file-earmark-arrow-up me-2"></i> Cargar Archivo de Grabaciones
                </div>
                <div className="card-body p-3">

                    {/* DROP ZONE */}
                    <div
                        className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                    >
                        <i className={`bi bi-file-earmark-spreadsheet ${styles.dropZoneIcon}`}></i>
                        <div className={styles.dropZoneText}>
                            {archivo ? archivo.name : 'Arrastra tu archivo aquí o haz clic para seleccionar'}
                        </div>
                        <div className={styles.dropZoneSubtext}>
                            {archivo
                                ? `${formatBytes(archivo.size)} — Listo para procesar`
                                : 'Formatos aceptados: XLSX, XLS, CSV, TXT, DOCX — Máx. 10MB'
                            }
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv,.txt,.docx"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* BOTONES */}
                    <div className="d-flex gap-2 mt-3 justify-content-end">
                        {archivo && (
                            <button className={styles.btnReset} onClick={handleReset}>
                                <i className="bi bi-x-circle me-2"></i>Limpiar
                            </button>
                        )}
                        <button
                            className={styles.btnUpload}
                            onClick={handlePreview}
                            disabled={!archivo || isLoading}
                        >
                            {isLoading
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</>
                                : <><i className="bi bi-search me-2"></i>Buscar Grabaciones</>
                            }
                        </button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: RESULTADOS */}
            {resultados && (
                <>
                    {/* ESTADÍSTICAS */}
                    <div className={`card ${styles.cardCustom} mb-3`}>
                        <div className={styles.cardHeader}>
                            <i className="bi bi-bar-chart me-2"></i> Resumen del Procesamiento
                        </div>
                        <div className="card-body p-3">
                            <div className="row g-3">
                                <div className="col-6 col-md-3">
                                    <div className={styles.statCard}>
                                        <i className={`bi bi-file-text ${styles.statIcon}`}></i>
                                        <div className={styles.statTitle}>En el Archivo</div>
                                        <div className={styles.statValue}>{resultados.total_archivo.toLocaleString()}</div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className={styles.statCard}>
                                        <i className={`bi bi-check-circle ${styles.statIcon} ${styles.statIconSuccess}`}></i>
                                        <div className={styles.statTitle}>Encontradas</div>
                                        <div className={styles.statValue} style={{color: '#198754'}}>
                                            {resultados.encontradas.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className={styles.statCard}>
                                        <i className={`bi bi-x-circle ${styles.statIcon} ${styles.statIconDanger}`}></i>
                                        <div className={styles.statTitle}>No Encontradas</div>
                                        <div className={styles.statValue} style={{color: '#dc3545'}}>
                                            {resultados.no_encontradas.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-6 col-md-3">
                                    <div className={styles.statCard}>
                                        <i className={`bi bi-percent ${styles.statIcon}`}></i>
                                        <div className={styles.statTitle}>Tasa de Éxito</div>
                                        <div className={styles.statValue}>
                                            {resultados.total_archivo > 0
                                                ? Math.round((resultados.encontradas / resultados.total_archivo) * 100)
                                                : 0}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLAS DE RESULTADOS */}
                    <div className={`card ${styles.cardCustom} mb-3`}>
                        <div className={styles.cardHeader}>
                            <i className="bi bi-list-check me-2"></i> Detalle de Grabaciones
                        </div>
                        <div className="card-body p-3">

                            {/* TABS */}
                            <ul className="nav nav-tabs mb-3">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${vistaActiva === 'encontradas' ? 'active' : ''}`}
                                        onClick={() => setVistaActiva('encontradas')}
                                    >
                                        <i className="bi bi-check-circle-fill text-success me-1"></i>
                                        Encontradas ({resultados.encontradas.toLocaleString()})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${vistaActiva === 'no_encontradas' ? 'active' : ''}`}
                                        onClick={() => setVistaActiva('no_encontradas')}
                                    >
                                        <i className="bi bi-x-circle-fill text-danger me-1"></i>
                                        No Encontradas ({resultados.no_encontradas.toLocaleString()})
                                    </button>
                                </li>
                            </ul>

                            {/* TABLA ENCONTRADAS */}
                            {vistaActiva === 'encontradas' && (
                                <div className={styles.tableWrapper}>
                                    <table className="table table-hover mb-0 align-middle">
                                        <thead className={styles.tableHeader}>
                                            <tr>
                                                <th className="ps-3">Nombre de Grabación</th>
                                                <th>Campaña</th>
                                                <th>Peso</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultados.lista_encontradas.length === 0 ? (
                                                <tr>
                                                    <td colSpan="3" className="text-center py-4 text-muted">
                                                        No se encontraron grabaciones.
                                                    </td>
                                                </tr>
                                            ) : (
                                                resultados.lista_encontradas.map((rec, idx) => (
                                                    <tr key={idx}>
                                                        <td className="ps-3">
                                                            <i className="bi bi-file-earmark-music text-success me-2"></i>
                                                            <span className="font-monospace small">{rec.filename}</span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-light text-dark border">
                                                                {rec.campana}
                                                            </span>
                                                        </td>
                                                        <td className="text-muted small">{formatBytes(rec.size)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TABLA NO ENCONTRADAS */}
                            {vistaActiva === 'no_encontradas' && (
                                <div className={styles.tableWrapper}>
                                    <table className="table table-hover mb-0 align-middle">
                                        <thead className={styles.tableHeader}>
                                            <tr>
                                                <th className="ps-3">Nombre Buscado</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resultados.lista_no_encontradas.length === 0 ? (
                                                <tr>
                                                    <td colSpan="2" className="text-center py-4 text-success">
                                                        <i className="bi bi-check-circle me-2"></i>
                                                        ¡Todas las grabaciones fueron encontradas!
                                                    </td>
                                                </tr>
                                            ) : (
                                                resultados.lista_no_encontradas.map((nombre, idx) => (
                                                    <tr key={idx}>
                                                        <td className="ps-3">
                                                            <i className="bi bi-file-earmark-x text-danger me-2"></i>
                                                            <span className="font-monospace small">{nombre}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${styles.badgeNotFound}`}>
                                                                No encontrada
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* BOTÓN DESCARGA */}
                    {resultados.encontradas > 0 && (
                        <div className="d-flex gap-2 justify-content-end mb-3">
                            <button className={styles.btnReset} onClick={handleReset}>
                                <i className="bi bi-arrow-counterclockwise me-2"></i>Nuevo proceso
                            </button>
                            <button
                                className={styles.btnDownload}
                                onClick={handleDownload}
                                disabled={isDownloading}
                            >
                                {isDownloading
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Preparando ZIP...</>
                                    : <><i className="bi bi-file-zip me-2"></i>Descargar {resultados.encontradas.toLocaleString()} grabaciones</>
                                }
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BulkDownload;
