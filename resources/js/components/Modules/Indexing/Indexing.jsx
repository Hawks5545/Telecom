// resources/js/components/Modules/Indexing.jsx
import React, { useState } from 'react';
import styles from './Indexing.module.css';

const Indexing = () => {
    
    // --- 1. ESTADOS ---
    const [stats, setStats] = useState({
        detectadas: 12450,
        indexadas: 11980,
        peso: '---', // Inicialmente vacío hasta escanear
        ultima: '2026-01-12'
    });

    const [folderPath, setFolderPath] = useState('/var/grabaciones/ventas/');
    const [isScanning, setIsScanning] = useState(false);
    const [isIndexing, setIsIndexing] = useState(false);
    
    // Logs de la consola simulada
    const [logs, setLogs] = useState([
        { type: 'info', msg: 'Sistema listo. Esperando instrucciones...' }
    ]);

    // Opciones (Checkboxes)
    const [options, setOptions] = useState({
        skipDuplicates: true,
        onlyNew: true,
        associateFolder: true
    });

    // --- 2. FUNCIONES DE SIMULACIÓN ---

    // A. Simular Escaneo de Carpeta
    const handleScan = () => {
        setIsScanning(true);
        addLog('info', `Iniciando escaneo en: ${folderPath}...`);

        // Simulamos demora de 1.5 segundos
        setTimeout(() => {
            const randomSize = Math.floor(Math.random() * (500 - 50) + 50); // Random entre 50 y 500
            const randomDetected = Math.floor(Math.random() * 200) + stats.detectadas; 

            setStats(prev => ({
                ...prev,
                peso: `${randomSize} MB`, // <--- AQUÍ ACTUALIZAMOS EL PESO
                detectadas: randomDetected
            }));
            
            addLog('success', `Escaneo completado. Tamaño detectado: ${randomSize} MB.`);
            setIsScanning(false);
        }, 1500);
    };

    // B. Simular Proceso de Indexación
    const handleIndex = () => {
        if (stats.peso === '---') {
            alert("⚠️ Por favor, escanea la carpeta antes de indexar.");
            return;
        }

        setIsIndexing(true);
        setLogs([]); // Limpiar logs anteriores
        addLog('info', 'Iniciando proceso de indexación...');

        // Secuencia de logs temporales para dar efecto de "trabajando"
        setTimeout(() => addLog('info', 'Conectando mediante SFTP...'), 500);
        setTimeout(() => addLog('info', 'Verificando duplicados en base de datos...'), 1500);
        setTimeout(() => addLog('warning', 'Omitiendo 5 archivos existentes (Config: Omitir Duplicados)'), 2500);
        
        // Finalización
        setTimeout(() => {
            const newIndexed = stats.indexadas + 120;
            setStats(prev => ({ ...prev, indexadas: newIndexed, ultima: new Date().toISOString().slice(0,10) }));
            
            addLog('success', 'PROCESO FINALIZADO: 120 grabaciones nuevas indexadas.');
            setIsIndexing(false);
            
            // ALERTA FINAL SOLICITADA
            setTimeout(() => alert("✅ Indexación realizada correctamente."), 100);

        }, 3500);
    };

    // Helper para agregar líneas al log
    const addLog = (type, msg) => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { type, msg, time }]);
    };

    return (
        <div className={`container-fluid p-0 ${styles.fadeIn}`}>
            
            <h2 className={`mb-4 ${styles.pageTitle}`}>
                <i className="bi bi-database-gear me-2"></i>
                Módulo de Indexación
            </h2>

            {/* --- SECCIÓN 1: ESTADO DEL SISTEMA (CARDS) --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-activity me-2"></i> Estado del Sistema
                </div>
                <div className="card-body p-4">
                    <div className="row g-4">
                        {/* Card 1: Detectadas */}
                        <div className="col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-search ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Detectadas</div>
                                <div className={styles.statValue}>{stats.detectadas}</div>
                            </div>
                        </div>
                        {/* Card 2: Indexadas */}
                        <div className="col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-database-check ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Indexadas</div>
                                <div className={styles.statValue}>{stats.indexadas}</div>
                            </div>
                        </div>
                        {/* Card 3: Peso (CAMBIA DINÁMICAMENTE) */}
                        <div className="col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-hdd ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Peso Carpeta</div>
                                <div className={styles.statValue}>
                                    {isScanning ? <span className="spinner-border spinner-border-sm text-primary"></span> : stats.peso}
                                </div>
                            </div>
                        </div>
                        {/* Card 4: Última Fecha */}
                        <div className="col-md-3">
                            <div className={styles.statCard}>
                                <i className={`bi bi-calendar-check ${styles.statIcon}`}></i>
                                <div className={styles.statTitle}>Última Indexación</div>
                                <div className={styles.statValue} style={{fontSize: '1.2rem', marginTop: '5px'}}>{stats.ultima}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 2: CARPETA DEL SERVIDOR --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-folder-symlink me-2"></i> Carpeta del Servidor
                </div>
                <div className="card-body p-4">
                    <label className={styles.label}>Ruta absoluta (Linux)</label>
                    <div className="input-group mb-3">
                        <span className="input-group-text bg-light"><i className="bi bi-terminal"></i></span>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={folderPath}
                            onChange={(e) => setFolderPath(e.target.value)}
                        />
                        <button 
                            className={`btn ${styles.btnScan}`} 
                            onClick={handleScan}
                            disabled={isScanning || isIndexing}
                        >
                            {isScanning ? 'Escaneando...' : 'Escanear Carpeta'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- SECCIÓN 3: OPCIONES Y ACCIÓN --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-sliders me-2"></i> Opciones de Indexación
                </div>
                <div className="card-body p-4">
                    <div className="mb-4">
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" checked={options.skipDuplicates} readOnly />
                            <label className={`form-check-label ${styles.checkboxLabel}`}>Omitir grabaciones duplicadas</label>
                        </div>
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" checked={options.onlyNew} readOnly />
                            <label className={`form-check-label ${styles.checkboxLabel}`}>Indexar solo archivos nuevos</label>
                        </div>
                        <div className="form-check mb-2">
                            <input className="form-check-input" type="checkbox" checked={options.associateFolder} readOnly />
                            <label className={`form-check-label ${styles.checkboxLabel}`}>Asociar a estructura de carpetas del sistema</label>
                        </div>
                    </div>

                    <button 
                        className={`btn ${styles.btnIndex}`} 
                        onClick={handleIndex}
                        disabled={isScanning || isIndexing}
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

            {/* --- SECCIÓN 4: RESULTADO (LOG) --- */}
            <div className={`card ${styles.cardCustom}`}>
                <div className={styles.cardHeader}>
                    <i className="bi bi-journal-code me-2"></i> Resultado / Logs
                </div>
                <div className="card-body p-3">
                    <div className={styles.consoleContainer}>
                        {logs.map((log, index) => (
                            <div key={index} className="mb-1">
                                <span className="text-muted small me-2">[{log.time}]</span>
                                <span className={
                                    log.type === 'success' ? styles.logSuccess : 
                                    log.type === 'warning' ? styles.logWarning : 
                                    log.type === 'error' ? styles.logError : styles.logInfo
                                }>
                                    {log.msg}
                                </span>
                            </div>
                        ))}
                        {logs.length === 0 && <span className="text-muted">Esperando inicio del proceso...</span>}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Indexing;