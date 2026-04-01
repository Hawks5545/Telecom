import React, { useState, useEffect, useRef } from 'react';
import styles from './Indexing.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

// ← CLAVES de sessionStorage para persistir estado
const SK_JOB   = 'indexing_job';
const SK_LOGS  = 'indexing_logs';
const SK_STATS = 'indexing_stats';
const SK_PATH  = 'indexing_path';

const Indexing = () => {

    // ← Restaurar estado guardado si existe
    const savedJob   = JSON.parse(sessionStorage.getItem(SK_JOB)   || 'null');
    const savedStats = JSON.parse(sessionStorage.getItem(SK_STATS) || 'null');
    const savedLogs  = JSON.parse(sessionStorage.getItem(SK_LOGS)  || 'null');
    const savedPath  = sessionStorage.getItem(SK_PATH) || '';

    const [stats, setStats] = useState(savedStats || {
        detectadas: 0, indexadas: 0, peso: '---', ultima: '---'
    });

    const [folderPath, setFolderPath]     = useState(savedPath);
    const [isScanning, setIsScanning]     = useState(savedJob?.type === 'scan');
    const [isIndexing, setIsIndexing]     = useState(savedJob?.type === 'index');
    const [progressData, setProgressData] = useState({
        percentage: savedJob?.percentage || 0,
        status:     savedJob ? 'processing' : 'idle'
    });
    const [logs, setLogs]     = useState(savedLogs || [{
        type: 'info', msg: 'Sistema listo. Ingrese una ruta y presione Iniciar.'
    }]);
    const [options, setOptions] = useState({ skipDuplicates: true });

    const consoleContainerRef = useRef(null);
    const pollRetries         = useRef(0);
    const scanStartTime       = useRef(savedJob?.startTime || null);
    const MAX_RETRIES         = 5;

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false, type: 'info', title: '', message: '', onConfirm: null
    });

    const showAlert  = (type, title, message, onConfirm = null) =>
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    const closeAlert = () =>
        setAlertConfig(prev => ({ ...prev, isOpen: false }));

    const addLog = (type, msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => {
            const newLogs = [...prev, { type, msg, time }];
            sessionStorage.setItem(SK_LOGS, JSON.stringify(newLogs));
            return newLogs;
        });
    };

    // ← Persistir stats
    useEffect(() => {
        sessionStorage.setItem(SK_STATS, JSON.stringify(stats));
    }, [stats]);

    // ← Persistir ruta
    useEffect(() => {
        sessionStorage.setItem(SK_PATH, folderPath);
    }, [folderPath]);

    useEffect(() => {
        if (consoleContainerRef.current) {
            consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
        }
    }, [logs, progressData]);

    // ← Retomar job activo al montar
    useEffect(() => {
        if (savedJob?.jobId) {
            addLog('info', `🔄 Retomando proceso en curso (Job: ${savedJob.jobId})...`);
            scanStartTime.current = savedJob.startTime || Date.now();
            pollProgress(savedJob.jobId, savedJob.type === 'scan');
        }
    }, []);

    // --- GUARDAR / LIMPIAR JOB ---
    const saveJob = (jobId, type, percentage = 0) => {
        sessionStorage.setItem(SK_JOB, JSON.stringify({
            jobId,
            type,
            percentage,
            startTime: scanStartTime.current
        }));
    };

    const clearJob = () => {
        sessionStorage.removeItem(SK_JOB);
    };

    // --- CANCELAR PROCESO ---
    const handleCancel = (jobId) => {
        showAlert('delete', '¿Cancelar proceso?',
            'Se detendrá el proceso en el servidor. ¿Estás seguro?',
            async () => {
                try {
                    const token    = sessionStorage.getItem('auth_token');
                    const response = await fetch('/api/indexing/cancel', {
                        method:  'POST',
                        headers: {
                            'Content-Type':  'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ job_id: jobId })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        clearJob();
                        sessionStorage.removeItem(SK_LOGS);
                        setIsScanning(false);
                        setIsIndexing(false);
                        setProgressData({ percentage: 0, status: 'idle' });
                        setLogs([{ type: 'info', msg: 'Sistema listo. Ingrese una ruta y presione Iniciar.' }]);
                        showAlert('info', 'Proceso Cancelado', data.message);
                    } else {
                        showAlert('error', 'Error', data.message || 'No se pudo cancelar.');
                    }
                } catch (error) {
                    showAlert('error', 'Error', 'Fallo de conexión al cancelar.');
                }
            }
        );
    };

    // --- RADAR DE PROGRESO ---
    const pollProgress = async (jobId, isScanType = false) => {
        try {
            const token    = sessionStorage.getItem('auth_token');
            const response = await fetch(`/api/indexing/progress?job_id=${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            pollRetries.current = 0;

            if (data.status === 'processing' || data.status === 'starting' || data.status === 'scanning') {
                if (!isScanType) {
                    setProgressData({ percentage: data.percentage, status: 'processing' });
                    saveJob(jobId, 'index', data.percentage);
                    if (data.procesados && data.total) {
                        addLog('info', `Procesados: ${data.procesados.toLocaleString()} / ${data.total.toLocaleString()} archivos (${data.percentage}%)`);
                    }
                }

                const elapsed = Date.now() - scanStartTime.current;
                const delay   = elapsed < 30000 ? 2000 : elapsed < 120000 ? 5000 : 10000;
                setTimeout(() => pollProgress(jobId, isScanType), delay);
            }
            else if (data.status === 'completed') {
                clearJob();
                if (isScanType) {
                    setStats(prev => ({
                        ...prev,
                        peso:       `${data.size_mb} MB`,
                        detectadas: data.files_count
                    }));
                    addLog('success', `✅ Escaneo finalizado: ${data.files_count?.toLocaleString()} archivos — ${data.size_mb} MB`);
                    setIsScanning(false);
                } else {
                    setProgressData({ percentage: 100, status: 'completed' });
                    setStats(prev => ({ ...prev, ultima: new Date().toLocaleString() }));
                    setIsIndexing(false);
                    addLog('success', `✅ PROCESO FINALIZADO AL 100%.`);
                    addLog('info', `Resumen: ${data.nuevos} Nuevos | ${data.omitidos} Omitidos`);

                    if (data.nuevos === 0 && data.omitidos > 0) {
                        showAlert('info', 'Sin grabaciones nuevas',
                            `Todos los audios ya estaban en el sistema.\nSe omitieron ${data.omitidos} duplicados.`);
                    } else {
                        showAlert('success', '¡Proceso Exitoso!',
                            `Se agregaron ${data.nuevos} audios nuevos.\nDuplicados omitidos: ${data.omitidos}`);
                    }
                }
            }
            else if (data.status === 'cancelled') {
                clearJob();
                setIsScanning(false);
                setIsIndexing(false);
                setProgressData({ percentage: 0, status: 'idle' });
                addLog('error', '🛑 Proceso cancelado.');
            }
            else if (data.status === 'error') {
                clearJob();
                addLog('error', `❌ Error en el proceso: ${data.message || 'Error desconocido'}`);
                showAlert('error', 'Error en el proceso',
                    data.message || 'Ocurrió un error inesperado.');
                setIsScanning(false);
                setIsIndexing(false);
            }
            else if (data.status === 'not_found') {
                clearJob();
                addLog('error', '⚠️ Se perdió el rastro del proceso. La caché puede haber expirado.');
                showAlert('error', 'Proceso perdido',
                    'No se encontró el estado del proceso. Intenta iniciar de nuevo.');
                setIsScanning(false);
                setIsIndexing(false);
            }

        } catch (error) {
            pollRetries.current += 1;
            addLog('error', `Error de red al consultar progreso (intento ${pollRetries.current}/${MAX_RETRIES})`);

            if (pollRetries.current < MAX_RETRIES) {
                const delay = 3000 * Math.pow(2, pollRetries.current - 1);
                setTimeout(() => pollProgress(jobId, isScanType), delay);
            } else {
                clearJob();
                addLog('error', '❌ Se perdió la conexión con el servidor.');
                showAlert('error', 'Sin conexión',
                    'No se pudo contactar al servidor. Verifica tu red e intenta de nuevo.');
                setIsScanning(false);
                setIsIndexing(false);
            }
        }
    };

    // --- ESCANEO ---
    const handleScan = async () => {
        if (!folderPath) return showAlert('error', 'Error', 'La ruta no puede estar vacía.');

        setIsScanning(true);
        pollRetries.current   = 0;
        scanStartTime.current = Date.now();
        addLog('info', `🔍 Solicitando escaneo de: ${folderPath}...`);

        try {
            const token    = sessionStorage.getItem('auth_token');
            const response = await fetch('/api/indexing/scan', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body:    JSON.stringify({ path: folderPath })
            });
            const data = await response.json();

            if (response.ok) {
                saveJob(data.job_id, 'scan');
                addLog('info', 'Escaneo en marcha. Contando archivos en segundo plano...');
                pollProgress(data.job_id, true);
            } else {
                addLog('error', `Error: ${data.message}`);
                showAlert('error', 'Error al escanear', data.message);
                setIsScanning(false);
            }
        } catch (error) {
            addLog('error', 'Error de red al solicitar escaneo.');
            setIsScanning(false);
        }
    };

    // --- INDEXACIÓN ---
    const handleIndex = async () => {
        if (!folderPath) return showAlert('warning', 'Ruta Requerida', 'Ingresa una ruta válida.');

        setIsIndexing(true);
        setProgressData({ percentage: 0, status: 'starting' });
        pollRetries.current   = 0;
        scanStartTime.current = Date.now();
        addLog('info', '🚀 Iniciando motor de indexación asíncrono...');

        try {
            const token    = sessionStorage.getItem('auth_token');
            const response = await fetch('/api/indexing/run', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body:    JSON.stringify({ path: folderPath, options })
            });
            const data = await response.json();

            if (response.ok) {
                saveJob(data.job_id, 'index');
                addLog('info', 'Indexación en segundo plano iniciada. Conectando radar...');
                pollProgress(data.job_id, false);
            } else {
                addLog('error', `Error: ${data.message}`);
                showAlert('error', 'Error', data.message);
                setIsIndexing(false);
            }
        } catch (error) {
            addLog('error', 'Error de conexión al iniciar indexación.');
            setIsIndexing(false);
        }
    };

    // Job activo para el botón cancelar
    const currentJob = JSON.parse(sessionStorage.getItem(SK_JOB) || 'null');

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
                <i className="bi bi-database-gear me-2"></i> Módulo de Indexación
            </h2>

            {/* SECCIÓN 1: ESTADÍSTICAS */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-activity me-2"></i> Estado del Proceso Actual
                </div>
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-search ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Detectadas</div>
                                <div className={styles.statValue}>
                                    {isScanning
                                        ? <span className="spinner-border spinner-border-sm"></span>
                                        : stats.detectadas.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-database-check ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Total en BD</div>
                                <div className={styles.statValue}>
                                    {stats.indexadas.toLocaleString?.() ?? stats.indexadas}
                                </div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-hdd ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Peso Carpeta</div>
                                <div className={styles.statValue}>
                                    {isScanning
                                        ? <span className="spinner-border spinner-border-sm text-primary"></span>
                                        : stats.peso}
                                </div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-calendar-check ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Última Indexación</div>
                                <div className={styles.statValue} style={{fontSize: '1.1rem', marginTop: '5px'}}>
                                    {stats.ultima}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CARPETA */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-folder-symlink me-2"></i> Carpeta del Servidor
                </div>
                <div className="card-body p-3">
                    <div className="input-group mb-1">
                        <input
                            type="text"
                            className="form-control"
                            value={folderPath}
                            onChange={(e) => setFolderPath(e.target.value)}
                            placeholder="Ruta absoluta (Ej: /home/adminpbx/grabaciones)"
                            disabled={isScanning || isIndexing}
                        />
                        <button
                            className={`btn ${styles.btnScan}`}
                            onClick={handleScan}
                            disabled={isScanning || isIndexing}
                        >
                            {isScanning ? 'Contando archivos...' : 'Escanear masivo'}
                        </button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3 Y 4: OPCIONES Y CONSOLA */}
            <div className="row g-3">
                <div className="col-md-5">
                    <div className={`card ${styles.cardCustom}`}>
                        <div className={styles.cardHeader}>
                            <i className="bi bi-sliders me-2"></i> Control de Motor
                        </div>
                        <div className="card-body p-3 d-flex flex-column justify-content-between">
                            <div className="form-check mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={options.skipDuplicates}
                                    onChange={() => setOptions({ ...options, skipDuplicates: !options.skipDuplicates })}
                                />
                                <label className="form-check-label text-muted">
                                    Protección contra duplicados
                                </label>
                            </div>

                            {isIndexing && (
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small text-muted fw-bold">Indexando...</span>
                                        <span className="small text-primary fw-bold">{progressData.percentage}%</span>
                                    </div>
                                    <div className="progress" style={{height: '15px'}}>
                                        <div
                                            className="progress-bar progress-bar-striped progress-bar-animated"
                                            style={{width: `${progressData.percentage}%`}}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* ← BOTÓN CANCELAR ESCANEO */}
                            {isScanning && currentJob?.jobId && (
                                <button
                                    className="btn btn-sm btn-outline-danger w-100 mb-2"
                                    onClick={() => handleCancel(currentJob.jobId)}
                                >
                                    <i className="bi bi-stop-circle me-2"></i> Cancelar Escaneo
                                </button>
                            )}

                            {/* ← BOTÓN CANCELAR INDEXACIÓN */}
                            {isIndexing && currentJob?.jobId && (
                                <button
                                    className="btn btn-sm btn-outline-danger w-100 mb-2"
                                    onClick={() => handleCancel(currentJob.jobId)}
                                >
                                    <i className="bi bi-stop-circle me-2"></i> Cancelar Indexación
                                </button>
                            )}

                            <button
                                className={`btn w-100 ${styles.btnIndex}`}
                                onClick={handleIndex}
                                disabled={isScanning || isIndexing || !folderPath}
                            >
                                {isIndexing
                                    ? <><span className="spinner-border spinner-border-sm me-2"></span>En ejecución...</>
                                    : <><i className="bi bi-play-circle-fill me-2"></i> Iniciar Indexación Masiva</>
                                }
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-7">
                    <div className={`card ${styles.cardCustom}`}>
                        <div className={styles.cardHeader}>
                            <i className="bi bi-journal-code me-2"></i> Consola de Telecom
                        </div>
                        <div className="card-body p-3">
                            <div ref={consoleContainerRef} className={styles.consoleContainer}>
                                {logs.map((log, index) => (
                                    <div key={index} className="mb-1">
                                        <span className="text-muted small me-2">[{log.time}]</span>
                                        <span className={
                                            log.type === 'success' ? styles.logSuccess
                                            : log.type === 'error'   ? styles.logError
                                            : styles.logInfo
                                        }>
                                            {log.msg}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Indexing;
