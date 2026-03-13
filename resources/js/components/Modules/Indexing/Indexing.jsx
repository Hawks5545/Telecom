import React, { useState, useEffect, useRef } from 'react';
import styles from './Indexing.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const Indexing = () => {
    const [stats, setStats] = useState({ detectadas: 0, indexadas: 0, peso: '---', ultima: '---' });
    const [folderPath, setFolderPath] = useState('');
    
    // Estados de control
    const [isScanning, setIsScanning] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    const [progressData, setProgressData] = useState({ percentage: 0, status: 'idle' });

    const [logs, setLogs] = useState([{ type: 'info', msg: 'Sistema listo. Ingrese una ruta y presione Iniciar.' }]);
    const [options, setOptions] = useState({ skipDuplicates: true });

    const consoleContainerRef = useRef(null);
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    };
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    const addLog = (type, msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type, msg, time }]);
    };

    useEffect(() => {
        if (consoleContainerRef.current) {
            consoleContainerRef.current.scrollTop = consoleContainerRef.current.scrollHeight;
        }
    }, [logs, progressData]);

    // --- EL RADAR UNIVERSAL (Escaneo e Indexación) ---
    const pollProgress = async (jobId, isScanType = false) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`/api/indexing/progress?job_id=${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.status === 'processing' || data.status === 'starting' || data.status === 'scanning') {
                if (!isScanType) setProgressData({ percentage: data.percentage, status: 'processing' });
                setTimeout(() => pollProgress(jobId, isScanType), 2000);
            } 
            else if (data.status === 'completed') {
                if (isScanType) {
                    // Finalizó el Escaneo
                    setStats(prev => ({ ...prev, peso: `${data.size_mb} MB`, detectadas: data.files_count }));
                    addLog('success', `Escaneo finalizado: ${data.files_count} archivos (${data.size_mb} MB).`);
                    setIsScanning(false);
                } else {
                    // Finalizó la Indexación
                    setProgressData({ percentage: 100, status: 'completed' });
                    setIsIndexing(false);
                    addLog('success', `✅ PROCESO FINALIZADO AL 100%.`);
                    addLog('info', `Resumen: ${data.nuevos} Nuevos | ${data.omitidos} Omitidos`);

                    if (data.nuevos === 0 && data.omitidos > 0) {
                        showAlert('info', 'Sin grabaciones nuevas', `Todos los audios ya estaban en el sistema.\nSe omitieron ${data.omitidos} duplicados.`);
                    } else {
                        showAlert('success', '¡Proceso Exitoso!', `Se agregaron ${data.nuevos} audios nuevos.`);
                    }
                }
            }
        } catch (error) {
            setTimeout(() => pollProgress(jobId, isScanType), 3000);
        }
    };

    // --- NUEVO MANEJADOR DE ESCANEO ASÍNCRONO ---
    const handleScan = async () => {
        if (!folderPath) return showAlert('error', 'Error', 'La ruta no puede estar vacía.');
        
        setIsScanning(true);
        addLog('info', `Solicitando escaneo de fondo para: ${folderPath}...`);

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/indexing/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ path: folderPath })
            });
            const data = await response.json();
            
            if (response.ok) {
                addLog('info', `Escaneo en marcha. El sistema está contando millones de archivos...`);
                pollProgress(data.job_id, true); // true indica que es tipo escaneo
            } else {
                showAlert('error', 'Error', data.message);
                setIsScanning(false);
            }
        } catch (error) {
            addLog('error', 'Error de red al solicitar escaneo.');
            setIsScanning(false);
        }
    };

    const handleIndex = async () => {
        if (!folderPath) return showAlert('warning', 'Ruta Requerida', 'Ingresa una ruta válida.');

        setIsIndexing(true);
        setProgressData({ percentage: 0, status: 'starting' });
        addLog('info', '🚀 Iniciando motor de indexación asíncrono...');

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/indexing/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ path: folderPath, options })
            });

            const data = await response.json();

            if (response.ok) {
                addLog('info', `Indexación en segundo plano iniciada. Conectando radar...`);
                pollProgress(data.job_id, false);
            } else {
                addLog('error', `Error: ${data.message}`);
                showAlert('error', 'Error', data.message);
                setIsIndexing(false);
            }
        } catch (error) {
            addLog('error', 'Error de conexión.');
            setIsIndexing(false);
        }
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn} ${styles.fullHeightContainer}`}>
            <CustomAlert isOpen={alertConfig.isOpen} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} onClose={closeAlert} />

            <h2 className={`mb-3 ${styles.pageTitle}`}><i className="bi bi-database-gear me-2"></i> Módulo de Indexación</h2>

            {/* SECCIÓN 1: ESTADÍSTICAS */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}><i className="bi bi-activity me-2"></i> Estado del Proceso Actual</div>
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-6 col-md-3"><div className={styles.statCard}><i className={`bi bi-search ${styles.statIcon}`}></i><div className={styles.statTitle}>Detectadas</div><div className={styles.statValue}>{isScanning ? <span className="spinner-border spinner-border-sm"></span> : stats.detectadas}</div></div></div>
                        <div className="col-6 col-md-3"><div className={styles.statCard}><i className={`bi bi-database-check ${styles.statIcon}`}></i><div className={styles.statTitle}>Total en BD</div><div className={styles.statValue}>{stats.indexadas}</div></div></div>
                        <div className="col-6 col-md-3"><div className={styles.statCard}><i className={`bi bi-hdd ${styles.statIcon}`}></i><div className={styles.statTitle}>Peso Carpeta</div><div className={styles.statValue}>{isScanning ? <span className="spinner-border spinner-border-sm text-primary"></span> : stats.peso}</div></div></div>
                        <div className="col-6 col-md-3"><div className={styles.statCard}><i className={`bi bi-calendar-check ${styles.statIcon}`}></i><div className={styles.statTitle}>Última Indexación</div><div className={styles.statValue} style={{fontSize: '1.1rem', marginTop: '5px'}}>{stats.ultima}</div></div></div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CARPETA */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}><i className="bi bi-folder-symlink me-2"></i> Carpeta del Servidor</div>
                <div className="card-body p-3">
                    <div className="input-group mb-1">
                        <input type="text" className="form-control" value={folderPath} onChange={(e) => setFolderPath(e.target.value)} placeholder="Ruta absoluta (Ej: /home/adminpbx/grabaciones)" />
                        <button className={`btn ${styles.btnScan}`} onClick={handleScan} disabled={isScanning || isIndexing}>{isScanning ? 'Contando archivos...' : 'Escanear masivo'}</button>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3 Y 4: OPCIONES Y CONSOLA */}
            <div className="row g-3">
                <div className="col-md-5">
                    <div className={`card ${styles.cardCustom}`}>
                        <div className={styles.cardHeader}><i className="bi bi-sliders me-2"></i> Control de Motor</div>
                        <div className="card-body p-3 d-flex flex-column justify-content-between">
                            <div className="form-check mb-3"><input className="form-check-input" type="checkbox" checked={options.skipDuplicates} onChange={() => setOptions({...options, skipDuplicates: !options.skipDuplicates})} /><label className="form-check-label text-muted">Protección contra duplicados</label></div>

                            {isIndexing && (
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="small text-muted fw-bold">Indexando millones...</span>
                                        <span className="small text-primary fw-bold">{progressData.percentage}%</span>
                                    </div>
                                    <div className="progress" style={{ height: '15px' }}>
                                        <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${progressData.percentage}%` }}></div>
                                    </div>
                                </div>
                            )}

                            <button className={`btn w-100 ${styles.btnIndex}`} onClick={handleIndex} disabled={isScanning || isIndexing || !folderPath}>
                                {isIndexing ? (<><span className="spinner-border spinner-border-sm me-2"></span>En ejecución...</>) : (<><i className="bi bi-play-circle-fill me-2"></i> Iniciar Indexación Masiva</>)}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="col-md-7">
                    <div className={`card ${styles.cardCustom}`}>
                        <div className={styles.cardHeader}><i className="bi bi-journal-code me-2"></i> Consola de Telecom</div>
                        <div className="card-body p-3">
                            <div ref={consoleContainerRef} className={styles.consoleContainer}>
                                {logs.map((log, index) => (
                                    <div key={index} className="mb-1">
                                        <span className="text-muted small me-2">[{log.time}]</span>
                                        <span className={log.type === 'success' ? styles.logSuccess : log.type === 'error' ? styles.logError : styles.logInfo}>{log.msg}</span>
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
