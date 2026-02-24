import React, { useState } from 'react';
import styles from './Indexing.module.css';
import CustomAlert from '../../Common/CustomAlert/CustomAlert';

const Indexing = () => {
    
    // --- 1. ESTADOS ---
    const [stats, setStats] = useState({
        detectadas: 0,
        indexadas: 0, 
        peso: '---', 
        ultima: '---'
    });

    // Ruta vacía por defecto
    const [folderPath, setFolderPath] = useState(''); 
    const [isScanning, setIsScanning] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    
    const [logs, setLogs] = useState([
        { type: 'info', msg: 'Sistema listo. Ingrese una ruta y presione Escanear.' }
    ]);

    const [options, setOptions] = useState({
        skipDuplicates: true,
        onlyNew: true,
        associateFolder: true
    });

    // --- 2. ALERTAS ---
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false, type: 'info', title: '', message: '', onConfirm: null
    });

    const showAlert = (type, title, message, onConfirm = null) => {
        setAlertConfig({ isOpen: true, type, title, message, onConfirm });
    };
    const closeAlert = () => setAlertConfig({ ...alertConfig, isOpen: false });

    // --- 3. FUNCIONES DE LOGS ---
    const addLog = (type, msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type, msg, time }]);
    };

    // --- 4. ACCIÓN: ESCANEAR (FASE 1) ---
    const handleScan = async () => {
        if (!folderPath) return showAlert('error', 'Error', 'La ruta no puede estar vacía.');

        setIsScanning(true);
        addLog('info', `Iniciando escaneo en: ${folderPath}...`);
        
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/indexing/scan', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ path: folderPath })
            });

            const data = await response.json();

            if (response.ok) {
                setStats(prev => ({
                    ...prev,
                    peso: `${data.size_mb} MB`, 
                    detectadas: data.files_count
                }));
                addLog('success', `Escaneo exitoso: ${data.files_count} archivos de audio detectados (${data.size_mb} MB).`);
            } else {
                addLog('error', `Error de escaneo: ${data.message}`);
                showAlert('error', 'Carpeta no encontrada', data.message);
            }
        } catch (error) {
            addLog('error', 'Error de conexión con el servidor.');
        } finally {
            setIsScanning(false);
        }
    };

    // --- 5. ACCIÓN: INDEXAR (FASE 2) ---
    const handleIndex = async () => {
        if (stats.peso === '---' || stats.detectadas === 0) {
            return showAlert(
                'warning',
                'Escaneo Requerido', 
                '⚠️ Por favor, realiza un escaneo exitoso antes de iniciar la indexación.'
            );
        }

        setIsIndexing(true);
        addLog('info', '------------------------------------------------');
        addLog('info', '🚀 Iniciando proceso de indexación masiva...');

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch('/api/indexing/run', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    path: folderPath,
                    options: options
                })
            });

            const data = await response.json();

            if (response.ok) {
                const today = new Date().toISOString().slice(0,10);
                setStats(prev => ({ 
                    ...prev, 
                    indexadas: data.total_in_db, 
                    ultima: today 
                }));
                
                addLog('success', `PROCESO FINALIZADO.`);
                
                if (data.indexed > 0) addLog('success', `✅ Nuevos indexados: ${data.indexed}`);
                if (data.skipped > 0) addLog('warning', `⏭️ Omitidos (Duplicados): ${data.skipped}`);
                
                showAlert(
                    data.status_type || 'success', 
                    data.title_msg || 'Proceso Finalizado', 
                    data.message || `Se procesaron ${data.indexed} archivos.`
                );

            } else {
                addLog('error', `Error crítico: ${data.message}`);
                showAlert('error', 'Error del Servidor', data.message);
            }
        } catch (error) {
            addLog('error', 'Error de conexión o timeout (si son muchos archivos).');
            showAlert('error', 'Error de Conexión', 'No se pudo conectar con el servidor.');
        } finally {
            setIsIndexing(false);
        }
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
                <i className="bi bi-database-gear me-2"></i>
                Módulo de Indexación
            </h2>
            
            {/* --- SECCIÓN 1: ESTADÍSTICAS --- */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-activity me-2"></i> Estado del Proceso Actual
                </div>
                <div className="card-body p-3">
                    <div className="row g-3">
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-search ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Detectadas (Scan)</div>
                                <div className={styles.statValue}>{stats.detectadas}</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-database-check ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Total en BD</div>
                                <div className={styles.statValue}>{stats.indexadas}</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-hdd ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Peso Carpeta</div>
                                <div className={styles.statValue}>
                                    {isScanning ? <span className="spinner-border spinner-border-sm text-primary"></span> : stats.peso}
                                </div>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-calendar-check ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Última Indexación</div>
                                <div className={styles.statValue} style={{fontSize: '1.1rem', marginTop: '5px'}}>{stats.ultima}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: CARPETA DEL SERVIDOR (TODO EL ANCHO) --- */}
            <div className={`card ${styles.cardCustom} mb-3`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-folder-symlink me-2"></i> Carpeta del Servidor
                </div>
                <div className="card-body p-3">
                    <label className={styles.label}>Ruta absoluta (Ej: C:\audios o /mnt/grabaciones)</label>
                    <div className="input-group mb-1">
                        <span className="input-group-text bg-light d-none d-sm-flex"><i className="bi bi-terminal"></i></span>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={folderPath}
                            onChange={(e) => setFolderPath(e.target.value)}
                            placeholder="Ingresa la ruta a escanear"
                        />
                        <button 
                            className={`btn ${styles.btnScan}`} 
                            onClick={handleScan}
                            disabled={isScanning || isIndexing}
                        >
                            {isScanning ? 'Escaneando...' : 'Escanear'}
                        </button>
                    </div>
                    <div className="form-text text-muted" style={{fontSize: '0.8rem'}}>
                        Asegúrate de que la ruta tenga permisos de lectura.
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 3 Y 4: OPCIONES Y CONSOLA (LADO A LADO) --- */}
            <div className="row g-3 flex-grow-1 overflow-hidden" style={{ minHeight: 0, paddingBottom: '1rem' }}>
                
                {/* COLUMNA IZQUIERDA: OPCIONES */}
                <div className="col-md-5 d-flex flex-column">
                    <div className={`card ${styles.cardCustom} mb-0 flex-grow-1 d-flex flex-column`}>
                        <div className={styles.cardHeader}>
                            <i className="bi bi-sliders me-2"></i> Opciones de Indexación
                        </div>
                        <div className="card-body p-3 d-flex flex-column justify-content-between">
                            <div className="mb-3">
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="chkDup" checked={options.skipDuplicates} onChange={() => setOptions({...options, skipDuplicates: !options.skipDuplicates})} />
                                    <label className={`form-check-label ${styles.checkboxLabel}`} htmlFor="chkDup">Omitir duplicados (recomendado)</label>
                                </div>
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="chkNew" checked={options.onlyNew} readOnly />
                                    <label className={`form-check-label text-muted ${styles.checkboxLabel}`} htmlFor="chkNew">Indexar solo archivos nuevos</label>
                                </div>
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="chkAssoc" checked={options.associateFolder} readOnly />
                                    <label className={`form-check-label text-muted ${styles.checkboxLabel}`} htmlFor="chkAssoc">Asociar a estructura de sistema</label>
                                </div>
                            </div>

                            <button 
                                className={`btn w-100 mt-auto ${styles.btnIndex}`} 
                                onClick={handleIndex}
                                disabled={isScanning || isIndexing || stats.detectadas === 0}
                            >
                                {isIndexing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Indexando...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-play-circle-fill me-2"></i> Iniciar Indexación
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: LOGS (CONSOLA) */}
                <div className="col-md-7 d-flex flex-column">
                    <div className={`card ${styles.cardCustom} mb-0 flex-grow-1 d-flex flex-column`}>
                        <div className={styles.cardHeader}>
                            <i className="bi bi-journal-code me-2"></i> Consola de Resultados
                        </div>
                        <div className="card-body p-3 d-flex flex-column">
                            {/* Este div actuará con overflow para el scroll interno de los logs */}
                            <div className={styles.consoleContainer}>
                                {logs.length === 0 && <span className="text-muted small">Sin actividad reciente.</span>}
                                {logs.map((log, index) => (
                                    <div key={index} className="mb-1">
                                        <span className="text-muted small me-2" style={{opacity: 0.7}}>
                                            [{log.time}]
                                        </span>
                                        <span className={
                                            log.type === 'success' ? styles.logSuccess : 
                                            log.type === 'warning' ? styles.logWarning : 
                                            log.type === 'error' ? styles.logError : styles.logInfo
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